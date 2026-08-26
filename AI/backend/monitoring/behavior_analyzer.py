"""
Behavior Analyzer Module — Bước 5 Pipeline AI

Phân tích hành vi thí sinh dựa trên voting trên sliding window.
Thay vì đánh giá từng frame riêng lẻ (dễ false positive), module này
nhìn vào chuỗi 30 frames liên tiếp và đếm tỉ lệ % frames vi phạm
để xác nhận hành vi gian lận một cách tin cậy hơn.

Hiện tại: Rule-based voting.
Tương lai: Có thể thay thế bằng LSTM mà không cần sửa buffer.
"""

import os
from monitoring.time_series_buffer import PersonTimeSeriesBuffer
from monitoring.behavior_lstm import BehaviorLSTMClassifier


class BehaviorAnalyzer:
    """
    Phân tích hành vi gian lận trên chuỗi thời gian bằng thuật toán voting.
    
    Với mỗi loại vi phạm, đếm số frames trong sliding window thỏa mãn điều kiện,
    nếu tỉ lệ vượt ngưỡng (threshold) → xác nhận vi phạm.
    """

    def __init__(self):
        # Chế độ hoạt động: True = Offline (giám sát phòng thi), False = Online (webcam cá nhân)
        self.offline_mode = False

        # Chế độ nhận diện: "lstm" hoặc "heuristic"
        self.detection_mode = "heuristic"
        
        # Đường dẫn model và khởi tạo classifier
        model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
        self.model_path = os.getenv("BEHAVIOR_LSTM_PATH", os.path.join(model_dir, "behavior_lstm.pth"))
        self.lstm_classifier = None
        
        if os.path.exists(self.model_path):
            self.lstm_classifier = BehaviorLSTMClassifier(self.model_path)
            if self.lstm_classifier.is_loaded:
                self.detection_mode = "lstm"

        # Ngưỡng voting cho từng loại vi phạm
        # Key: loại vi phạm
        # Value: (threshold_ratio, min_condition_description)
        self.voting_thresholds = {
            'phone_usage': 0.60,     # ≥ 60% frames có phone → vi phạm
            'looking_away': 0.70,    # ≥ 70% frames quay đầu → vi phạm
            'cheat_sheet': 0.50,     # ≥ 50% frames có sách → vi phạm
            'face_missing': 0.80,    # ≥ 80% frames không thấy mặt → vi phạm
            'turning_around': 0.50,  # ≥ 50% frames quay người ra sau (offline) → vi phạm
        }

        # Ngưỡng góc quay đầu (degrees)
        self.head_yaw_threshold = 30.0         # Xoay trái/phải tối đa 30 độ
        self.head_pitch_up_threshold = 25.0     # Ngước lên tối đa 25 độ
        self.head_pitch_down_threshold = 35.0   # Cúi xuống tối đa 35 độ (tránh false positive khi đọc đề)

        # Ngưỡng tốc độ thay đổi góc đáng ngờ (degrees/frame)
        self.angular_velocity_threshold = 15.0

        # Số frames tối thiểu để phân tích
        self.min_frames_required = 10

    def analyze(self, buffer: PersonTimeSeriesBuffer):
        """
        Phân tích hành vi từ time-series buffer của một thí sinh.
        
        Args:
            buffer: PersonTimeSeriesBuffer chứa dữ liệu N frames gần nhất.
            
        Returns:
            list[dict]: Danh sách vi phạm detected.
        """
        if not buffer.is_ready(self.min_frames_required):
            return []

        if self.detection_mode == "lstm" and self.lstm_classifier and self.lstm_classifier.is_loaded:
            return self._analyze_lstm(buffer)
        else:
            return self._analyze_heuristic(buffer)

    def _analyze_heuristic(self, buffer: PersonTimeSeriesBuffer):
        window = buffer.get_window()
        violations = []

        # Kiểm tra từng loại hành vi
        result = self._vote_phone_usage(window)
        if result:
            violations.append(result)

        if not self.offline_mode:
            # Chế độ Online: Kiểm tra quay đầu bằng Face Mesh
            result = self._vote_looking_away(window)
            if result:
                violations.append(result)
        else:
            # Chế độ Offline: Kiểm tra quay người ra sau bằng Pose landmarks
            result = self._vote_turning_around(window, buffer)
            if result:
                violations.append(result)

        result = self._vote_cheat_sheet(window)
        if result:
            violations.append(result)

        return violations

    def _analyze_lstm(self, buffer: PersonTimeSeriesBuffer):
        features = buffer.to_feature_tensor()
        if len(features) < self.min_frames_required:
            return []
            
        pred_res = self.lstm_classifier.predict(features)
        class_name = pred_res['class_name']
        confidence = pred_res['confidence']
        
        if class_name == 'normal':
            return []
            
        lstm_threshold = 0.75
        if confidence < lstm_threshold:
            return []
            
        window = buffer.get_window()
        current_frame = window[-1]
        
        if class_name == 'phone_usage':
            if 'cell phone' not in current_frame.get('objects_nearby', []):
                return []
            return [{
                'type': 'phone_usage',
                'confidence': round(confidence, 3),
                'threshold': lstm_threshold,
                'source': 'lstm',
                'window_size': len(window),
                'details': {
                    'description': f'LSTM phát hiện Sử dụng điện thoại (Độ tin cậy: {confidence*100:.1f}%)'
                }
            }]
            
        elif class_name == 'cheat_sheet':
            if 'book' not in current_frame.get('objects_nearby', []):
                return []
            return [{
                'type': 'cheat_sheet',
                'confidence': round(confidence, 3),
                'threshold': lstm_threshold,
                'source': 'lstm',
                'window_size': len(window),
                'details': {
                    'description': f'LSTM phát hiện Tài liệu/sách trên bàn (Độ tin cậy: {confidence*100:.1f}%)'
                }
            }]
            
        elif class_name == 'looking_away':
            if self.offline_mode:
                return []
                
            hp = current_frame.get('head_pose', {})
            yaw = hp.get('yaw', 0.0)
            pitch = hp.get('pitch', 0.0)
            is_away = (
                abs(yaw) > self.head_yaw_threshold or
                pitch > self.head_pitch_up_threshold or
                pitch < -self.head_pitch_down_threshold
            )
            if not is_away:
                return []
                
            dominant_direction = "chỗ khác"
            if abs(yaw) > self.head_yaw_threshold:
                dominant_direction = "trái" if yaw < 0 else "phải"
            elif pitch > self.head_pitch_up_threshold:
                dominant_direction = "lên"
            elif pitch < -self.head_pitch_down_threshold:
                dominant_direction = "xuống"
                
            return [{
                'type': 'looking_away',
                'confidence': round(confidence, 3),
                'threshold': lstm_threshold,
                'source': 'lstm',
                'window_size': len(window),
                'details': {
                    'dominant_direction': dominant_direction,
                    'description': f'LSTM phát hiện Quay đầu {dominant_direction} (Độ tin cậy: {confidence*100:.1f}%)'
                }
            }]
            
        elif class_name == 'turning_around':
            if not self.offline_mode:
                return []
                
            kl = current_frame.get('key_landmarks', {})
            l_shoulder = kl.get('left_shoulder', (0.0, 0.0))
            r_shoulder = kl.get('right_shoulder', (0.0, 0.0))
            l_hip = kl.get('left_hip', (0.0, 0.0))
            r_hip = kl.get('right_hip', (0.0, 0.0))
            
            is_turning = False
            if (l_shoulder != (0.0, 0.0) and r_shoulder != (0.0, 0.0) and 
                l_hip != (0.0, 0.0) and r_hip != (0.0, 0.0)):
                is_back_to_camera = False
                if not current_frame.get('face_visible', True):
                    is_mirrored = buffer.is_mirrored
                    if is_mirrored:
                        is_back_to_camera = l_shoulder[0] > r_shoulder[0]
                    else:
                        is_back_to_camera = l_shoulder[0] < r_shoulder[0]
                
                shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
                torso_height = abs((l_shoulder[1] + r_shoulder[1])/2 - (l_hip[1] + r_hip[1])/2)
                is_sideways = False
                if torso_height > 0.01:
                    is_sideways = (shoulder_width / torso_height) < 0.35
                is_turning = is_back_to_camera or is_sideways
                
            if not is_turning:
                return []
                
            return [{
                'type': 'turning_around',
                'confidence': round(confidence, 3),
                'threshold': lstm_threshold,
                'source': 'lstm',
                'window_size': len(window),
                'details': {
                    'description': f'LSTM phát hiện Quay người ra sau (Độ tin cậy: {confidence*100:.1f}%)'
                }
            }]
            
        return []

    def _vote_phone_usage(self, window):
        """
        Voting: Phát hiện sử dụng điện thoại.
        Điều kiện mỗi frame: 'cell phone' có trong objects_nearby.
        """
        total = len(window)
        if total == 0:
            return None

        count = sum(
            1 for frame in window
            if 'cell phone' in frame.get('objects_nearby', [])
        )
        ratio = count / total
        threshold = self.voting_thresholds['phone_usage']

        if ratio >= threshold:
            # Chỉ emit violation nếu điện thoại thực sự xuất hiện ở frame hiện tại (để snapshot có bằng chứng)
            current_frame = window[-1]
            if 'cell phone' not in current_frame.get('objects_nearby', []):
                return None

            return {
                'type': 'phone_usage',
                'confidence': round(ratio, 3),
                'threshold': threshold,
                'source': 'time_series',
                'window_size': total,
                'details': {
                    'frames_with_phone': count,
                    'total_frames': total,
                    'description': f'Điện thoại xuất hiện trong {count}/{total} frames ({ratio*100:.0f}%)'
                }
            }
        return None

    def _vote_looking_away(self, window):
        """
        Voting: Phát hiện quay đầu bất thường.
        Điều kiện mỗi frame: |yaw| > threshold HOẶC |pitch| > threshold.
        """
        total = len(window)
        if total == 0:
            return None

        count = 0
        dominant_direction = {'left': 0, 'right': 0, 'down': 0, 'up': 0}

        for frame in window:
            hp = frame.get('head_pose', {})
            yaw = hp.get('yaw', 0.0)
            pitch = hp.get('pitch', 0.0)

            is_away = (
                abs(yaw) > self.head_yaw_threshold or
                pitch > self.head_pitch_up_threshold or
                pitch < -self.head_pitch_down_threshold
            )
            if is_away:
                count += 1
                # Theo dõi hướng quay chủ đạo
                if abs(yaw) > self.head_yaw_threshold:
                    if yaw < 0:
                        dominant_direction['left'] += 1
                    else:
                        dominant_direction['right'] += 1
                if pitch > self.head_pitch_up_threshold:
                    dominant_direction['up'] += 1
                elif pitch < -self.head_pitch_down_threshold:
                    dominant_direction['down'] += 1

        ratio = count / total
        threshold = self.voting_thresholds['looking_away']

        if ratio >= threshold:
            # Chỉ emit violation nếu ở frame hiện tại sinh viên thực sự đang nhìn đi nơi khác
            current_frame = window[-1]
            hp = current_frame.get('head_pose', {})
            yaw = hp.get('yaw', 0.0)
            pitch = hp.get('pitch', 0.0)
            is_away = (
                abs(yaw) > self.head_yaw_threshold or
                pitch > self.head_pitch_up_threshold or
                pitch < -self.head_pitch_down_threshold
            )
            if not is_away:
                return None

            # Xác định hướng chính
            main_dir = max(dominant_direction, key=dominant_direction.get)
            dir_labels = {
                'left': 'trái', 'right': 'phải',
                'down': 'xuống', 'up': 'lên'
            }

            # Tính angular velocity trung bình
            avg_velocity = self._calc_angular_velocity(window)

            return {
                'type': 'looking_away',
                'confidence': round(ratio, 3),
                'threshold': threshold,
                'source': 'time_series',
                'window_size': total,
                'details': {
                    'frames_looking_away': count,
                    'total_frames': total,
                    'dominant_direction': dir_labels.get(main_dir, main_dir),
                    'angular_velocity': round(avg_velocity, 2),
                    'description': f'Quay đầu {dir_labels.get(main_dir, main_dir)} trong {count}/{total} frames ({ratio*100:.0f}%)'
                }
            }
        return None

    def _vote_cheat_sheet(self, window):
        """
        Voting: Phát hiện tài liệu/sách trên bàn.
        Điều kiện mỗi frame: 'book' có trong objects_nearby.
        """
        total = len(window)
        if total == 0:
            return None

        count = sum(
            1 for frame in window
            if 'book' in frame.get('objects_nearby', [])
        )
        ratio = count / total
        threshold = self.voting_thresholds['cheat_sheet']

        if ratio >= threshold:
            # Chỉ emit violation nếu tài liệu thực sự xuất hiện ở frame hiện tại
            current_frame = window[-1]
            if 'book' not in current_frame.get('objects_nearby', []):
                return None

            return {
                'type': 'cheat_sheet',
                'confidence': round(ratio, 3),
                'threshold': threshold,
                'source': 'time_series',
                'window_size': total,
                'details': {
                    'frames_with_book': count,
                    'total_frames': total,
                    'description': f'Tài liệu/sách xuất hiện trong {count}/{total} frames ({ratio*100:.0f}%)'
                }
            }
        return None

    def _vote_face_missing(self, window):
        """
        Voting: Phát hiện che camera / mất khuôn mặt.
        Điều kiện mỗi frame: face_visible == False.
        """
        total = len(window)
        if total == 0:
            return None

        count = sum(
            1 for frame in window
            if not frame.get('face_visible', True)
        )
        ratio = count / total
        threshold = self.voting_thresholds['face_missing']

        if ratio >= threshold:
            # Chỉ emit nếu ở frame hiện tại khuôn mặt thực sự bị che/mất
            current_frame = window[-1]
            if current_frame.get('face_visible', True):
                return None

            return {
                'type': 'face_missing',
                'confidence': round(ratio, 3),
                'threshold': threshold,
                'source': 'time_series',
                'window_size': total,
                'details': {
                    'frames_without_face': count,
                    'total_frames': total,
                    'description': f'Không phát hiện khuôn mặt trong {count}/{total} frames ({ratio*100:.0f}%)'
                }
            }
        return None

    def _calc_angular_velocity(self, window):
        """
        Tính tốc độ thay đổi góc quay đầu (yaw) trung bình giữa các frame liên tiếp.
        
        Giá trị cao = quay đầu qua lại liên tục (đáng ngờ).
        Giá trị thấp = giữ nguyên hướng nhìn (ít đáng ngờ hơn, dù sai hướng).
        
        Returns:
            float: Angular velocity trung bình (degrees/frame).
        """
        if len(window) < 2:
            return 0.0

        velocities = []
        for i in range(1, len(window)):
            prev_yaw = window[i - 1].get('head_pose', {}).get('yaw', 0.0)
            curr_yaw = window[i].get('head_pose', {}).get('yaw', 0.0)
            velocities.append(abs(curr_yaw - prev_yaw))

        return sum(velocities) / len(velocities) if velocities else 0.0

    def _vote_turning_around(self, window, buffer=None):
        """
        Voting: Phát hiện quay người ra sau / quay nghiêng người góc lớn bằng Pose.
        """
        total = len(window)
        if total == 0:
            return None

        is_mirrored = buffer.is_mirrored if buffer is not None else False

        count = 0
        for frame in window:
            kl = frame.get('key_landmarks', {})
            l_shoulder = kl.get('left_shoulder', (0.0, 0.0))
            r_shoulder = kl.get('right_shoulder', (0.0, 0.0))
            l_hip = kl.get('left_hip', (0.0, 0.0))
            r_hip = kl.get('right_hip', (0.0, 0.0))

            if (l_shoulder != (0.0, 0.0) and r_shoulder != (0.0, 0.0) and 
                l_hip != (0.0, 0.0) and r_hip != (0.0, 0.0)):
                
                # Check back to camera considering face visibility and mirrored stream calibration
                is_back_to_camera = False
                if not frame.get('face_visible', True):
                    if is_mirrored:
                        is_back_to_camera = l_shoulder[0] > r_shoulder[0]
                    else:
                        is_back_to_camera = l_shoulder[0] < r_shoulder[0]

                # 2. Quay nghiêng người góc lớn:
                # Chiều ngang vai:
                shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
                # Chiều dọc thân:
                torso_height = abs((l_shoulder[1] + r_shoulder[1])/2 - (l_hip[1] + r_hip[1])/2)
                
                is_sideways = False
                if torso_height > 0.01:
                     is_sideways = (shoulder_width / torso_height) < 0.35

                if is_back_to_camera or is_sideways:
                    count += 1

        ratio = count / total
        threshold = self.voting_thresholds['turning_around']

        if ratio >= threshold:
            # Chỉ emit nếu ở frame hiện tại thực sự đang quay người
            current_frame = window[-1]
            kl = current_frame.get('key_landmarks', {})
            l_shoulder = kl.get('left_shoulder', (0.0, 0.0))
            r_shoulder = kl.get('right_shoulder', (0.0, 0.0))
            l_hip = kl.get('left_hip', (0.0, 0.0))
            r_hip = kl.get('right_hip', (0.0, 0.0))

            is_turning = False
            if (l_shoulder != (0.0, 0.0) and r_shoulder != (0.0, 0.0) and 
                l_hip != (0.0, 0.0) and r_hip != (0.0, 0.0)):
                
                # Check current frame back to camera status
                is_back_to_camera = False
                if not current_frame.get('face_visible', True):
                    if is_mirrored:
                        is_back_to_camera = l_shoulder[0] > r_shoulder[0]
                    else:
                        is_back_to_camera = l_shoulder[0] < r_shoulder[0]

                shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
                torso_height = abs((l_shoulder[1] + r_shoulder[1])/2 - (l_hip[1] + r_hip[1])/2)
                is_sideways = False
                if torso_height > 0.01:
                    is_sideways = (shoulder_width / torso_height) < 0.35
                is_turning = is_back_to_camera or is_sideways

            if not is_turning:
                return None

            return {
                'type': 'turning_around',
                'confidence': round(ratio, 3),
                'threshold': threshold,
                'source': 'time_series',
                'window_size': total,
                'details': {
                    'frames_turning_around': count,
                    'total_frames': total,
                    'description': f'Quay người ra sau trong {count}/{total} frames ({ratio*100:.0f}%)'
                }
            }
        return None

    def get_config(self):
        """Trả về cấu hình hiện tại của analyzer (để hiển thị trên UI debug)."""
        return {
            'detection_mode': self.detection_mode,
            'offline_mode': self.offline_mode,
            'voting_thresholds': self.voting_thresholds,
            'head_yaw_threshold': self.head_yaw_threshold,
            'head_pitch_up_threshold': self.head_pitch_up_threshold,
            'head_pitch_down_threshold': self.head_pitch_down_threshold,
            'angular_velocity_threshold': self.angular_velocity_threshold,
            'min_frames_required': self.min_frames_required,
        }
