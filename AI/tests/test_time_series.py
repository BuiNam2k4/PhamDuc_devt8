"""
Unit Tests cho Time-Series Buffer & Behavior Analyzer
Chạy: cd AI && python -m pytest tests/test_time_series.py -v
"""

import sys
import os
import time
import numpy as np

# Thêm đường dẫn backend vào sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from monitoring.time_series_buffer import (
    PersonTimeSeriesBuffer,
    TimeSeriesManager,
    NUM_FEATURES_PER_FRAME,
    LANDMARK_INDICES,
)
from monitoring.behavior_analyzer import BehaviorAnalyzer


# ============================================================
# Helper: Tạo frame_data giả lập
# ============================================================

def make_frame(
    yaw=0.0, pitch=0.0, roll=0.0,
    objects_nearby=None,
    face_visible=True,
    timestamp=None
):
    """Tạo 1 frame_data giả lập cho testing."""
    if objects_nearby is None:
        objects_nearby = []
    if timestamp is None:
        timestamp = time.time()
    
    # Tạo key_landmarks mặc định (tất cả ở giữa)
    key_landmarks = {name: (0.5, 0.5) for name in LANDMARK_INDICES.keys()}
    
    return {
        'timestamp': timestamp,
        'head_pose': {'yaw': yaw, 'pitch': pitch, 'roll': roll},
        'key_landmarks': key_landmarks,
        'objects_nearby': objects_nearby,
        'face_visible': face_visible,
    }


# ============================================================
# TEST: PersonTimeSeriesBuffer
# ============================================================

class TestPersonTimeSeriesBuffer:
    
    def test_add_and_length(self):
        """Buffer đếm đúng số frames."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        assert buf.get_length() == 0
        
        for i in range(10):
            buf.add_frame(make_frame(timestamp=float(i)))
        assert buf.get_length() == 10

    def test_maxlen_enforced(self):
        """Buffer không vượt quá maxlen."""
        buf = PersonTimeSeriesBuffer(maxlen=5)
        for i in range(20):
            buf.add_frame(make_frame(timestamp=float(i)))
        assert buf.get_length() == 5
        
        # Frame đầu tiên trong buffer phải là frame thứ 15 (index 0-based)
        window = buf.get_window()
        assert window[0]['timestamp'] == 15.0

    def test_is_ready(self):
        """is_ready trả True khi đủ min_frames."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        assert buf.is_ready(min_frames=10) == False
        
        for i in range(9):
            buf.add_frame(make_frame())
        assert buf.is_ready(min_frames=10) == False
        
        buf.add_frame(make_frame())
        assert buf.is_ready(min_frames=10) == True

    def test_get_window_subset(self):
        """get_window(n) trả đúng n frames gần nhất."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        for i in range(20):
            buf.add_frame(make_frame(timestamp=float(i)))
        
        window = buf.get_window(n=5)
        assert len(window) == 5
        assert window[0]['timestamp'] == 15.0
        assert window[-1]['timestamp'] == 19.0

    def test_clear(self):
        """clear() xóa hết buffer."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        for i in range(10):
            buf.add_frame(make_frame())
        buf.clear()
        assert buf.get_length() == 0

    def test_to_feature_tensor_shape(self):
        """to_feature_tensor trả đúng shape [seq_len, NUM_FEATURES]."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        for i in range(15):
            buf.add_frame(make_frame(yaw=float(i), pitch=float(i * 2)))
        
        tensor = buf.to_feature_tensor()
        assert isinstance(tensor, np.ndarray)
        assert tensor.shape == (15, NUM_FEATURES_PER_FRAME)
        assert tensor.dtype == np.float32

    def test_to_feature_tensor_empty(self):
        """to_feature_tensor cho buffer rỗng trả shape (0, N)."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        tensor = buf.to_feature_tensor()
        assert tensor.shape == (0, NUM_FEATURES_PER_FRAME)

    def test_to_feature_tensor_values(self):
        """Kiểm tra giá trị tensor có đúng không."""
        buf = PersonTimeSeriesBuffer(maxlen=30)
        buf.add_frame(make_frame(
            yaw=90.0, pitch=45.0, roll=0.0,
            objects_nearby=['cell phone'],
            face_visible=False
        ))
        
        tensor = buf.to_feature_tensor()
        # yaw normalized: 90/180 = 0.5
        assert abs(tensor[0, 0] - 0.5) < 1e-5
        # pitch normalized: 45/180 = 0.25
        assert abs(tensor[0, 1] - 0.25) < 1e-5
        # has_phone = 1.0 (index 21)
        assert tensor[0, 21] == 1.0
        # has_book = 0.0 (index 22)
        assert tensor[0, 22] == 0.0
        # face_visible = 0.0 (index 23)
        assert tensor[0, 23] == 0.0


# ============================================================
# TEST: TimeSeriesManager
# ============================================================

class TestTimeSeriesManager:
    
    def test_auto_create_buffer(self):
        """update() tự tạo buffer mới cho track_id chưa tồn tại."""
        mgr = TimeSeriesManager(buffer_size=30)
        mgr.update(track_id=1, frame_data=make_frame())
        mgr.update(track_id=2, frame_data=make_frame())
        
        assert len(mgr.get_all_track_ids()) == 2
        assert mgr.get_buffer(1) is not None
        assert mgr.get_buffer(2) is not None

    def test_separate_buffers(self):
        """Mỗi track_id có buffer riêng biệt."""
        mgr = TimeSeriesManager(buffer_size=30)
        
        for i in range(5):
            mgr.update(1, make_frame(yaw=10.0))
        for i in range(3):
            mgr.update(2, make_frame(yaw=-10.0))
        
        assert mgr.get_buffer(1).get_length() == 5
        assert mgr.get_buffer(2).get_length() == 3

    def test_cleanup_stale(self):
        """cleanup() xóa buffer của track_id biến mất quá lâu."""
        mgr = TimeSeriesManager(buffer_size=30, stale_timeout=0.1)
        
        mgr.update(1, make_frame())
        mgr.update(2, make_frame())
        
        # Giả lập thời gian trôi qua
        time.sleep(0.2)
        
        # Track_id 1 vẫn active, track_id 2 không
        mgr.cleanup(active_track_ids=[1])
        
        assert mgr.get_buffer(1) is not None
        assert mgr.get_buffer(2) is None

    def test_cleanup_keeps_recent(self):
        """cleanup() giữ buffer mới update dù track_id không active."""
        mgr = TimeSeriesManager(buffer_size=30, stale_timeout=10.0)
        
        mgr.update(1, make_frame())
        mgr.update(2, make_frame())
        
        # Track_id 2 không active nhưng mới update < 10 giây
        mgr.cleanup(active_track_ids=[1])
        
        # Phải vẫn giữ vì chưa quá stale_timeout
        assert mgr.get_buffer(2) is not None

    def test_get_stats(self):
        """get_stats() trả về thống kê đúng."""
        mgr = TimeSeriesManager(buffer_size=30)
        for i in range(5):
            mgr.update(1, make_frame())
        for i in range(3):
            mgr.update(2, make_frame())
        
        stats = mgr.get_stats()
        assert stats['total_tracked'] == 2
        assert stats['buffers'][1] == 5
        assert stats['buffers'][2] == 3


# ============================================================
# TEST: BehaviorAnalyzer
# ============================================================

class TestBehaviorAnalyzer:
    
    def test_not_ready_returns_empty(self):
        """Buffer chưa đủ frames → không báo gì."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(5):
            buf.add_frame(make_frame(objects_nearby=['cell phone']))
        
        results = analyzer.analyze(buf)
        assert results == []

    def test_phone_usage_detected(self):
        """30 frames toàn phone → phải báo phone_usage."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(objects_nearby=['cell phone']))
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'phone_usage' in types
        
        phone_v = [r for r in results if r['type'] == 'phone_usage'][0]
        assert phone_v['confidence'] == 1.0
        assert phone_v['source'] == 'time_series'

    def test_phone_below_threshold(self):
        """Chỉ 5/30 frames có phone (16%) → không báo (cần 60%)."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(5):
            buf.add_frame(make_frame(objects_nearby=['cell phone']))
        for i in range(25):
            buf.add_frame(make_frame())
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'phone_usage' not in types

    def test_looking_away_detected(self):
        """30 frames toàn quay đầu → phải báo looking_away."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(yaw=40.0))  # Quay phải 40°
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'looking_away' in types
        
        look_v = [r for r in results if r['type'] == 'looking_away'][0]
        assert look_v['details']['dominant_direction'] == 'phải'

    def test_looking_away_not_triggered_by_slight_turn(self):
        """Quay đầu nhẹ (15°) → không báo."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(yaw=15.0))  # Dưới ngưỡng 25°
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'looking_away' not in types

    def test_cheat_sheet_detected(self):
        """30 frames toàn sách → phải báo cheat_sheet."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(objects_nearby=['book']))
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'cheat_sheet' in types

    def test_face_missing_detected(self):
        """30 frames không thấy mặt → phải báo face_missing."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(face_visible=False))
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'face_missing' in types

    def test_normal_behavior_no_violations(self):
        """30 frames bình thường → không báo gì."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(yaw=5.0, pitch=3.0, face_visible=True))
        
        results = analyzer.analyze(buf)
        assert results == []

    def test_angular_velocity(self):
        """Tính angular velocity đúng."""
        analyzer = BehaviorAnalyzer()
        
        # Tạo window giả với yaw thay đổi đều
        window = [
            {'head_pose': {'yaw': 0.0}},
            {'head_pose': {'yaw': 10.0}},
            {'head_pose': {'yaw': 20.0}},
            {'head_pose': {'yaw': 30.0}},
        ]
        
        velocity = analyzer._calc_angular_velocity(window)
        # Mỗi bước thay đổi 10° → trung bình = 10.0
        assert abs(velocity - 10.0) < 1e-5

    def test_mixed_violations(self):
        """Buffer có cả phone + quay đầu → phải báo cả 2."""
        analyzer = BehaviorAnalyzer()
        buf = PersonTimeSeriesBuffer(maxlen=30)
        
        for i in range(30):
            buf.add_frame(make_frame(
                yaw=35.0,
                objects_nearby=['cell phone']
            ))
        
        results = analyzer.analyze(buf)
        types = [r['type'] for r in results]
        assert 'phone_usage' in types
        assert 'looking_away' in types


# ============================================================
# Chạy tests
# ============================================================

if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
