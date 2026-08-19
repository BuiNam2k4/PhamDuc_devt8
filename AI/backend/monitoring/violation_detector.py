import time
from collections import defaultdict, deque

from monitoring.time_series_buffer import TimeSeriesManager, LANDMARK_INDICES
from monitoring.behavior_analyzer import BehaviorAnalyzer

class ViolationDetector:
    def __init__(self):
        # Thresholds cho các loại vi phạm
        self.thresholds = {
            'multiple_faces_count': 1,  # Số khuôn mặt tối đa
            'head_yaw_threshold': 25,   # Góc quay trái/phải (degrees)
            'head_pitch_threshold': 20, # Góc cúi/ngửa (degrees)
            'brightness_min': 15,       # Độ sáng tối thiểu (%)
            'brightness_max': 95,       # Độ sáng tối đa (%)
            'face_missing_duration': 3, # Thời gian mất khuôn mặt (seconds)
            'look_away_duration': 2,    # Thời gian nhìn chỗ khác (seconds)
        }
        
        self.violation_states = {
            'face_missing_start': None,
            'look_away_start': None,
            'last_face_count': 0,
            'consecutive_violations': defaultdict(int)
        }
        
        self.recent_violations = deque(maxlen=100)
    
    def check_violations(self, face_count, head_yaw, head_pitch, brightness, objects, timestamp):
        """
        Kiểm tra các vi phạm từ dữ liệu monitoring
        """
        current_time = timestamp / 1000  # Convert to seconds
        violations = []
        
        # 1. Kiểm tra nhiều khuôn mặt
        # violation = self._check_multiple_faces(face_count, current_time)
        # if violation:
        #     violations.append(violation)
        
        # 2. Kiểm tra mất khuôn mặt
        # violation = self._check_face_missing(face_count, current_time)
        # if violation:
        #     violations.append(violation)
        
        # 3. Kiểm tra quay đầu/nhìn chỗ khác
        violation = self._check_head_pose(head_yaw, head_pitch, current_time)
        if violation:
            violations.append(violation)
        
        # 4. Kiểm tra độ sáng camera
        violation = self._check_brightness(brightness, current_time)
        if violation:
            violations.append(violation)
        
        # 5. Kiểm tra objects khả nghi
        object_violations = self._check_suspicious_objects(objects, current_time)
        violations.extend(object_violations)
        
        # Lưu violations vào buffer
        for violation in violations:
            self.recent_violations.append({
                'timestamp': current_time,
                'type': violation['type'],
                'details': violation['details']
            })
        
        return violations
    
    def _check_multiple_faces(self, face_count, current_time):
        if face_count > self.thresholds['multiple_faces_count']:
            return {
                'type': 'multiple_faces',
                'details': {
                    'face_count': face_count,
                    'threshold': self.thresholds['multiple_faces_count']
                }
            }
        return None
    
    def _check_face_missing(self, face_count, current_time):
        if face_count == 0:
            if self.violation_states['face_missing_start'] is None:
                self.violation_states['face_missing_start'] = current_time
            else:
                duration = current_time - self.violation_states['face_missing_start']
                if duration >= self.thresholds['face_missing_duration']:
                    return {
                        'type': 'face_not_detected',
                        'details': {
                            'duration': round(duration, 2),
                            'threshold': self.thresholds['face_missing_duration']
                        }
                    }
        else:
            self.violation_states['face_missing_start'] = None
        
        return None
    
    def _check_head_pose(self, head_yaw, head_pitch, current_time):
        is_looking_away = (
            abs(head_yaw) > self.thresholds['head_yaw_threshold'] or
            abs(head_pitch) > self.thresholds['head_pitch_threshold']
        )
        
        if is_looking_away:
            if self.violation_states['look_away_start'] is None:
                self.violation_states['look_away_start'] = current_time
            else:
                duration = current_time - self.violation_states['look_away_start']
                if duration >= self.thresholds['look_away_duration']:
                    direction = self._get_look_direction(head_yaw, head_pitch)
                    
                    return {
                        'type': 'look_away',
                        'details': {
                            'head_yaw': round(head_yaw, 2),
                            'head_pitch': round(head_pitch, 2),
                            'direction': direction,
                            'duration': round(duration, 2)
                        }
                    }
        else:
            self.violation_states['look_away_start'] = None
        
        return None
    
    def _check_brightness(self, brightness, current_time):
        if brightness < self.thresholds['brightness_min']:
            return {
                'type': 'camera_blocked',
                'details': {
                    'brightness': round(brightness, 2),
                    'reason': 'too_dark',
                    'threshold': self.thresholds['brightness_min']
                }
            }
        elif brightness > self.thresholds['brightness_max']:
            return {
                'type': 'camera_blocked',
                'details': {
                    'brightness': round(brightness, 2),
                    'reason': 'too_bright',
                    'threshold': self.thresholds['brightness_max']
                }
            }
        
        return None
    
    def _check_suspicious_objects(self, objects, current_time):
        violations = []
        
        phones = [obj for obj in objects if obj['class_name'] == 'cell phone']
        extra_persons = [obj for obj in objects if obj['class_name'] == 'person']
        books = [obj for obj in objects if obj['class_name'] == 'book']
        
        if phones:
            violations.append({
                'type': 'phone_detected',
                'details': {
                    'phone_count': len(phones)
                }
            })
        
        # if len(extra_persons) > 1:
        #     violations.append({
        #         'type': 'multiple_faces',
        #         'details': {
        #             'person_count': len(extra_persons),
        #             'detected_by': 'object_detection'
        #         }
        #     })
        
        if books:
            violations.append({
                'type': 'suspicious_object',
                'details': {
                    'object_type': 'book',
                    'count': len(books)
                }
            })
        
        return violations
    
    def _get_look_direction(self, head_yaw, head_pitch):
        yaw_threshold = self.thresholds['head_yaw_threshold']
        pitch_threshold = self.thresholds['head_pitch_threshold']
        
        if abs(head_yaw) > yaw_threshold:
            return "trái" if head_yaw < -yaw_threshold else "phải"
        
        if abs(head_pitch) > pitch_threshold:
            return "xuống" if head_pitch < -pitch_threshold else "lên"
        
        return "chỗ khác"
    
    def reset_states(self):
        self.violation_states = {
            'face_missing_start': None,
            'look_away_start': None,
            'last_face_count': 0,
            'consecutive_violations': defaultdict(int)
        }
        self.recent_violations.clear()


class ViolationDetectorV2:
    """
    Phiên bản nâng cấp sử dụng Time-Series Buffer + Voting.
    
    Thay vì kiểm tra từng frame riêng lẻ, phiên bản này lưu dữ liệu
    qua nhiều frame (sliding window) và dùng thuật toán bỏ phiếu (voting)
    để xác nhận vi phạm, giảm triệt để false positive.
    """

    def __init__(self, buffer_size=30, stale_timeout=30.0):
        self.ts_manager = TimeSeriesManager(
            buffer_size=buffer_size,
            stale_timeout=stale_timeout
        )
        self.behavior_analyzer = BehaviorAnalyzer()
        self.recent_violations = deque(maxlen=100)
        
        # Instant check thresholds (cho những thứ không cần time-series)
        self.brightness_min = 15.0
        self.brightness_max = 95.0
        self.multiple_faces_count = 1



    def check_violations(self, tracked_persons, face_count, brightness, objects, timestamp):
        """
        Kiểm tra vi phạm kết hợp Time-Series voting + Instant checks.
        
        Args:
            tracked_persons: list[dict] — Danh sách thí sinh đã có pose_landmarks và head_pose
            face_count: int — Tổng số khuôn mặt phát hiện trong frame
            brightness: float — Độ sáng frame (%)
            objects: list[dict] — Tất cả objects detected bởi YOLO
            timestamp: int — Timestamp (milliseconds)
            
        Returns:
            list[dict]: Danh sách vi phạm, mỗi vi phạm có track_id để biết ai vi phạm.
        """
        current_time = timestamp / 1000.0
        all_violations = []
        active_track_ids = []

        # --- PHASE 1: Cập nhật Time-Series Buffer cho từng thí sinh ---
        for person in tracked_persons:
            track_id = person.get('track_id', -1)
            if track_id == -1:
                continue
            
            active_track_ids.append(track_id)
            
            # Xác định vật thể gần người này (dựa trên bbox overlap)
            nearby_objects = self._find_nearby_objects(person, objects)
            
            # Build frame_data cho buffer
            frame_data = self._build_frame_data(
                person=person,
                nearby_objects=nearby_objects,
                face_visible=(face_count > 0),
                timestamp=current_time
            )
            
            self.ts_manager.update(track_id, frame_data)
        
        # --- PHASE 2: Phân tích hành vi trên Time-Series cho mỗi thí sinh ---
        for track_id in active_track_ids:
            buffer = self.ts_manager.get_buffer(track_id)
            if buffer is None:
                continue
            
            ts_violations = self.behavior_analyzer.analyze(buffer)
            
            for v in ts_violations:
                v['track_id'] = track_id
                all_violations.append(v)

        # --- PHASE 3: Instant checks (không cần time-series) ---
        instant_violations = self._check_instant(face_count, brightness, current_time)
        all_violations.extend(instant_violations)

        # --- PHASE 4: Cleanup stale buffers ---
        self.ts_manager.cleanup(active_track_ids)

        # --- Lưu lịch sử ---
        for v in all_violations:
            self.recent_violations.append({
                'timestamp': current_time,
                'type': v['type'],
                'track_id': v.get('track_id', -1),
                'confidence': v.get('confidence', 1.0),
                'source': v.get('source', 'instant'),
                'details': v.get('details', {})
            })

        return all_violations

    def _build_frame_data(self, person, nearby_objects, face_visible, timestamp):
        """
        Xây dựng frame_data dict từ tracked_person để lưu vào buffer.
        Trích xuất key landmarks từ pose_landmarks (33 điểm) của MediaPipe.
        """
        head_pose = person.get('head_pose', {'yaw': 0.0, 'pitch': 0.0, 'roll': 0.0})
        
        # Trích xuất key landmarks
        key_landmarks = {}
        pose_landmarks = person.get('pose_landmarks', [])
        
        if pose_landmarks:
            for name, idx in LANDMARK_INDICES.items():
                if idx < len(pose_landmarks):
                    lm = pose_landmarks[idx]
                    key_landmarks[name] = (
                        lm.get('x', 0.0),
                        lm.get('y', 0.0)
                    )
                else:
                    key_landmarks[name] = (0.0, 0.0)
        
        # Danh sách tên vật thể gần người này
        objects_nearby = [obj['class_name'] for obj in nearby_objects]
        
        return {
            'timestamp': timestamp,
            'head_pose': head_pose,
            'key_landmarks': key_landmarks,
            'objects_nearby': objects_nearby,
            'face_visible': face_visible,
        }

    def _find_nearby_objects(self, person, all_objects):
        """
        Tìm vật thể (phone, book) gần một thí sinh dựa trên bbox overlap.
        Một vật thể được coi là "gần" nếu tâm của nó nằm trong hoặc gần bbox của person.
        """
        px, py, pw, ph = person['bbox']
        # Mở rộng bbox thêm 100% mỗi chiều để catch objects ở rìa (tay cầm điện thoại/sách)
        margin_x = int(pw * 1.0)
        margin_y = int(ph * 1.0)
        expanded = (
            px - margin_x,
            py - margin_y,
            px + pw + margin_x,
            py + ph + margin_y
        )
        
        nearby = []
        for obj in all_objects:
            if obj['class_name'] == 'person':
                continue  # Bỏ qua person, chỉ quan tâm vật thể
            
            ox, oy = obj['center']
            if expanded[0] <= ox <= expanded[2] and expanded[1] <= oy <= expanded[3]:
                nearby.append(obj)
        
        return nearby

    def _check_instant(self, face_count, brightness, current_time):
        """
        Kiểm tra vi phạm tức thì (không cần lịch sử frames).
        - Nhiều khuôn mặt
        - Brightness bất thường
        """
        violations = []
        
        # if face_count > self.multiple_faces_count:
        #     violations.append({
        #         'type': 'multiple_faces',
        #         'confidence': 1.0,
        #         'threshold': self.multiple_faces_count,
        #         'source': 'instant',
        #         'window_size': 1,
        #         'details': {
        #             'face_count': face_count,
        #             'description': f'Phát hiện {face_count} khuôn mặt (giới hạn: {self.multiple_faces_count})'
        #         }
        #     })
        
        if brightness < self.brightness_min:
            violations.append({
                'type': 'camera_blocked',
                'confidence': 1.0,
                'threshold': self.brightness_min,
                'source': 'instant',
                'window_size': 1,
                'details': {
                    'brightness': round(brightness, 2),
                    'reason': 'too_dark',
                    'description': f'Camera quá tối ({brightness:.1f}%)'
                }
            })
        elif brightness > self.brightness_max:
            violations.append({
                'type': 'camera_blocked',
                'confidence': 1.0,
                'threshold': self.brightness_max,
                'source': 'instant',
                'window_size': 1,
                'details': {
                    'brightness': round(brightness, 2),
                    'reason': 'too_bright',
                    'description': f'Camera quá sáng ({brightness:.1f}%)'
                }
            })
        
        return violations

    def get_buffer_stats(self):
        """Trả về thống kê buffer cho API/UI debug."""
        return self.ts_manager.get_stats()

    def get_config(self):
        """Trả về toàn bộ cấu hình hiện tại."""
        return {
            'buffer_size': self.ts_manager.buffer_size,
            'stale_timeout': self.ts_manager.stale_timeout,
            'brightness_min': self.brightness_min,
            'brightness_max': self.brightness_max,
            'multiple_faces_count': self.multiple_faces_count,
            'behavior_analyzer': self.behavior_analyzer.get_config(),
        }

    def reset(self):
        """Reset toàn bộ trạng thái."""
        self.ts_manager = TimeSeriesManager(
            buffer_size=self.ts_manager.buffer_size,
            stale_timeout=self.ts_manager.stale_timeout
        )
        self.recent_violations.clear()
