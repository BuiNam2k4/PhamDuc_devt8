import cv2
import numpy as np
import os
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    FaceLandmarker,
    FaceLandmarkerOptions,
    RunningMode,
)

# Đường dẫn tới model file
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'models', 'face_landmarker.task'
)

class HeadPoseEstimator:
    def __init__(self):
        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=RunningMode.IMAGE,
            num_faces=5,  # Hỗ trợ phát hiện tối đa 5 khuôn mặt cùng lúc
            min_face_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = FaceLandmarker.create_from_options(options)
        
        # 3D model points của khuôn mặt (trong world coordinates)
        self.model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left Mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ])
        
        # Các landmark indices tương ứng trong MediaPipe Face Mesh
        self.landmark_indices = [
            1,    # Nose tip
            152,  # Chin
            33,   # Left eye left corner
            263,  # Right eye right corner
            61,   # Left mouth corner
            291   # Right mouth corner
        ]
    
    def estimate_poses(self, frame):
        """
        Ước tính head pose cho tất cả các khuôn mặt trong frame.
        
        Returns:
            list[dict]: Danh sách chứa yaw, pitch, roll và center_pixel cho từng khuôn mặt
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        result = self.landmarker.detect(mp_image)
        
        if not result.face_landmarks:
            return []
        
        h, w = frame.shape[:2]
        poses = []
        
        focal_length = w
        center = (w // 2, h // 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float32)
        
        dist_coeffs = np.zeros((4, 1))
        
        for face_landmarks in result.face_landmarks:
            image_points = []
            for idx in self.landmark_indices:
                landmark = face_landmarks[idx]
                x = int(landmark.x * w)
                y = int(landmark.y * h)
                image_points.append([x, y])
            
            image_points = np.array(image_points, dtype=np.float32)
            
            success, rotation_vector, translation_vector = cv2.solvePnP(
                self.model_points,
                image_points,
                camera_matrix,
                dist_coeffs
            )
            
            if success:
                rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
                yaw, pitch, roll = self._rotation_matrix_to_euler_angles(rotation_matrix)
                
                # Lấy điểm mũi (nose tip, index 1) làm center_pixel cho khuôn mặt
                nose = face_landmarks[1]
                nose_x = int(nose.x * w)
                nose_y = int(nose.y * h)
                
                poses.append({
                    'yaw': yaw,
                    'pitch': pitch,
                    'roll': roll,
                    'center_pixel': (nose_x, nose_y)
                })
                
        return poses
    
    def estimate_pose(self, frame, face_info=None):
        """
        Ước tính head pose từ frame (phiên bản tương thích ngược cho 1 mặt)
        
        Returns:
            tuple: (yaw, pitch, roll) trong degrees
        """
        poses = self.estimate_poses(frame)
        if poses:
            return poses[0]['yaw'], poses[0]['pitch'], poses[0]['roll']
        return 0.0, 0.0, 0.0
    
    def _rotation_matrix_to_euler_angles(self, R):
        """
        Chuyển rotation matrix thành Euler angles (yaw, pitch, roll)
        """
        sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
        singular = sy < 1e-6
        
        if not singular:
            x = np.arctan2(R[2, 1], R[2, 2])  # roll
            y = np.arctan2(-R[2, 0], sy)      # pitch
            z = np.arctan2(R[1, 0], R[0, 0])  # yaw
        else:
            x = np.arctan2(-R[1, 2], R[1, 1])  # roll
            y = np.arctan2(-R[2, 0], sy)       # pitch
            z = 0                              # yaw
        
        return float(np.degrees(z)), float(np.degrees(y)), float(np.degrees(x))
    
    def is_looking_away(self, yaw, pitch, yaw_threshold=25, pitch_threshold=20):
        """
        Kiểm tra xem người dùng có đang nhìn chỗ khác không
        """
        if abs(yaw) > yaw_threshold:
            direction = "trái" if yaw < 0 else "phải"
            return True, f"quay đầu {direction}"
        
        if pitch < -pitch_threshold:
            return True, "cúi đầu xuống"
        
        if pitch > pitch_threshold:
            return True, "ngửa đầu lên"
        
        return False, "nhìn thẳng"
