import time
from collections import defaultdict, deque

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
        self.violation_cooldowns = defaultdict(float)
        self.cooldown_duration = 5.0  # seconds
    
    def check_violations(self, face_count, head_yaw, head_pitch, brightness, objects, timestamp):
        """
        Kiểm tra các vi phạm từ dữ liệu monitoring
        """
        current_time = timestamp / 1000  # Convert to seconds
        violations = []
        
        # 1. Kiểm tra nhiều khuôn mặt
        violation = self._check_multiple_faces(face_count, current_time)
        if violation:
            violations.append(violation)
        
        # 2. Kiểm tra mất khuôn mặt
        violation = self._check_face_missing(face_count, current_time)
        if violation:
            violations.append(violation)
        
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
            if self._is_cooldown_expired('multiple_faces', current_time):
                self.violation_cooldowns['multiple_faces'] = current_time
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
                    if self._is_cooldown_expired('face_missing', current_time):
                        self.violation_cooldowns['face_missing'] = current_time
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
                    if self._is_cooldown_expired('look_away', current_time):
                        self.violation_cooldowns['look_away'] = current_time
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
            if self._is_cooldown_expired('camera_dark', current_time):
                self.violation_cooldowns['camera_dark'] = current_time
                return {
                    'type': 'camera_blocked',
                    'details': {
                        'brightness': round(brightness, 2),
                        'reason': 'too_dark',
                        'threshold': self.thresholds['brightness_min']
                    }
                }
        elif brightness > self.thresholds['brightness_max']:
            if self._is_cooldown_expired('camera_bright', current_time):
                self.violation_cooldowns['camera_bright'] = current_time
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
        
        if phones and self._is_cooldown_expired('phone_detected', current_time):
            self.violation_cooldowns['phone_detected'] = current_time
            violations.append({
                'type': 'phone_detected',
                'details': {
                    'phone_count': len(phones)
                }
            })
        
        if len(extra_persons) > 1 and self._is_cooldown_expired('extra_person', current_time):
            self.violation_cooldowns['extra_person'] = current_time
            violations.append({
                'type': 'multiple_faces',
                'details': {
                    'person_count': len(extra_persons),
                    'detected_by': 'object_detection'
                }
            })
        
        if books and self._is_cooldown_expired('book_detected', current_time):
            self.violation_cooldowns['book_detected'] = current_time
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
    
    def _is_cooldown_expired(self, violation_type, current_time):
        last_time = self.violation_cooldowns.get(violation_type, 0)
        return current_time - last_time >= self.cooldown_duration
    
    def reset_states(self):
        self.violation_states = {
            'face_missing_start': None,
            'look_away_start': None,
            'last_face_count': 0,
            'consecutive_violations': defaultdict(int)
        }
        self.violation_cooldowns.clear()
        self.recent_violations.clear()
