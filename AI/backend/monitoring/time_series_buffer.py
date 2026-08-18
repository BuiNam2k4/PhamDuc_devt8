"""
Time-Series Buffer Module — Bước 5 Pipeline AI

Quản lý hàng đợi chuỗi thời gian (sliding window) cho từng thí sinh
theo track_id. Lưu trữ dữ liệu landmarks, head pose, và objects
qua nhiều frame liên tiếp để phục vụ phân tích hành vi (voting / LSTM).
"""

import time
import numpy as np
from collections import deque, defaultdict


# MediaPipe Pose landmark indices cho các keypoints chính
LANDMARK_INDICES = {
    'nose': 0,
    'left_shoulder': 11,
    'right_shoulder': 12,
    'left_elbow': 13,
    'right_elbow': 14,
    'left_wrist': 15,
    'right_wrist': 16,
    'left_hip': 23,
    'right_hip': 24,
}

# Số features cho mỗi frame khi chuyển thành tensor
# head_pose (3) + key_landmarks (9 * 2 = 18) + objects_flags (2) + face_visible (1) = 24
NUM_FEATURES_PER_FRAME = 24


class PersonTimeSeriesBuffer:
    """
    Buffer chuỗi thời gian cho MỘT thí sinh.
    
    Lưu trữ tối đa `maxlen` frames gần nhất, mỗi frame chứa:
    - head_pose (yaw, pitch, roll)
    - key_landmarks (9 điểm chính normalized [0,1])
    - objects_nearby (danh sách tên vật thể gần người này)
    - face_visible (bool)
    - timestamp (float, seconds)
    """

    def __init__(self, maxlen=30):
        self.maxlen = maxlen
        self.buffer = deque(maxlen=maxlen)
        self.last_update_time = time.time()

    def add_frame(self, frame_data: dict):
        """
        Thêm dữ liệu của một frame vào buffer.

        Args:
            frame_data: dict với các key:
                - timestamp (float): thời điểm frame (seconds)
                - head_pose (dict): {"yaw": float, "pitch": float, "roll": float}
                - key_landmarks (dict): {"nose": (x,y), "left_shoulder": (x,y), ...}
                - objects_nearby (list[str]): ["cell phone", "book", ...]
                - face_visible (bool): khuôn mặt có được phát hiện không
        """
        entry = {
            'timestamp': frame_data.get('timestamp', time.time()),
            'head_pose': frame_data.get('head_pose', {'yaw': 0.0, 'pitch': 0.0, 'roll': 0.0}),
            'key_landmarks': frame_data.get('key_landmarks', {}),
            'objects_nearby': frame_data.get('objects_nearby', []),
            'face_visible': frame_data.get('face_visible', True),
        }
        self.buffer.append(entry)
        self.last_update_time = time.time()

    def get_window(self, n=None):
        """
        Lấy N frames gần nhất từ buffer.
        
        Args:
            n: Số frames cần lấy. None = lấy toàn bộ buffer.
            
        Returns:
            list[dict]: Danh sách frame data, từ cũ nhất đến mới nhất.
        """
        if n is None or n >= len(self.buffer):
            return list(self.buffer)
        return list(self.buffer)[-n:]

    def is_ready(self, min_frames=10):
        """
        Kiểm tra buffer đã đủ dữ liệu tối thiểu để phân tích chưa.
        
        Args:
            min_frames: Số frames tối thiểu cần thiết.
            
        Returns:
            bool: True nếu đủ frames.
        """
        return len(self.buffer) >= min_frames

    def get_length(self):
        """Trả về số frames hiện tại trong buffer."""
        return len(self.buffer)

    def clear(self):
        """Xóa toàn bộ buffer."""
        self.buffer.clear()

    def to_feature_tensor(self):
        """
        Chuyển buffer thành numpy tensor để sẵn sàng cho LSTM.
        
        Returns:
            np.ndarray: shape [seq_len, NUM_FEATURES_PER_FRAME]
                        Mỗi row là 1 frame, mỗi column là 1 feature.
                        
        Feature order (24 features):
            [0-2]   head_pose: yaw, pitch, roll (normalized /180)
            [3-20]  key_landmarks: nose_x, nose_y, l_shoulder_x, l_shoulder_y, ...
                    (9 keypoints × 2 coords = 18 values, already normalized [0,1])
            [21]    has_phone: 1.0 nếu "cell phone" trong objects_nearby, 0.0 otherwise
            [22]    has_book: 1.0 nếu "book" trong objects_nearby, 0.0 otherwise  
            [23]    face_visible: 1.0 hoặc 0.0
        """
        if len(self.buffer) == 0:
            return np.zeros((0, NUM_FEATURES_PER_FRAME), dtype=np.float32)

        frames = []
        landmark_keys = list(LANDMARK_INDICES.keys())

        for entry in self.buffer:
            row = []

            # Head pose (normalized by /180 to keep in [-1, 1])
            hp = entry['head_pose']
            row.append(hp.get('yaw', 0.0) / 180.0)
            row.append(hp.get('pitch', 0.0) / 180.0)
            row.append(hp.get('roll', 0.0) / 180.0)

            # Key landmarks (already normalized [0,1] from MediaPipe)
            kl = entry.get('key_landmarks', {})
            for key in landmark_keys:
                coords = kl.get(key, (0.0, 0.0))
                row.append(coords[0])  # x
                row.append(coords[1])  # y

            # Object flags
            objects = entry.get('objects_nearby', [])
            row.append(1.0 if 'cell phone' in objects else 0.0)
            row.append(1.0 if 'book' in objects else 0.0)

            # Face visible
            row.append(1.0 if entry.get('face_visible', True) else 0.0)

            frames.append(row)

        return np.array(frames, dtype=np.float32)


class TimeSeriesManager:
    """
    Quản lý Time-Series Buffer cho TẤT CẢ thí sinh.
    
    Mỗi track_id có một PersonTimeSeriesBuffer riêng biệt.
    Tự động tạo buffer mới khi gặp track_id chưa từng thấy,
    và dọn dẹp buffer của thí sinh đã biến mất khỏi khung hình.
    """

    def __init__(self, buffer_size=30, stale_timeout=30.0):
        """
        Args:
            buffer_size: Số frames tối đa lưu trong mỗi buffer.
            stale_timeout: Thời gian (giây) trước khi xóa buffer
                           của track_id không còn xuất hiện.
        """
        self.buffer_size = buffer_size
        self.stale_timeout = stale_timeout
        self.buffers: dict[int, PersonTimeSeriesBuffer] = {}

    def update(self, track_id: int, frame_data: dict):
        """
        Cập nhật buffer cho một thí sinh.
        Tự động tạo buffer mới nếu track_id chưa tồn tại.

        Args:
            track_id: ID tracking ổn định từ ByteTrack.
            frame_data: Dữ liệu frame (xem PersonTimeSeriesBuffer.add_frame).
        """
        if track_id not in self.buffers:
            self.buffers[track_id] = PersonTimeSeriesBuffer(maxlen=self.buffer_size)
        self.buffers[track_id].add_frame(frame_data)

    def get_buffer(self, track_id: int):
        """
        Lấy buffer của một thí sinh.
        
        Returns:
            PersonTimeSeriesBuffer hoặc None nếu track_id chưa tồn tại.
        """
        return self.buffers.get(track_id)

    def cleanup(self, active_track_ids: list[int]):
        """
        Dọn dẹp buffer của các track_id không còn xuất hiện trong khung hình.
        Chỉ xóa khi thí sinh đã biến mất quá stale_timeout giây.

        Args:
            active_track_ids: Danh sách track_id đang hiện diện trong frame hiện tại.
        """
        current_time = time.time()
        stale_ids = []

        for tid, buf in self.buffers.items():
            if tid not in active_track_ids:
                if current_time - buf.last_update_time > self.stale_timeout:
                    stale_ids.append(tid)

        for tid in stale_ids:
            del self.buffers[tid]
            
        if stale_ids:
            print(f"🧹 Cleaned up time-series buffers for track_ids: {stale_ids}")

    def get_all_track_ids(self):
        """Trả về danh sách tất cả track_id đang được theo dõi."""
        return list(self.buffers.keys())

    def get_stats(self):
        """
        Trả về thống kê tổng quan về tất cả buffers.
        
        Returns:
            dict: {"total_tracked": int, "buffers": {track_id: frame_count, ...}}
        """
        return {
            'total_tracked': len(self.buffers),
            'buffers': {
                tid: buf.get_length() for tid, buf in self.buffers.items()
            }
        }
