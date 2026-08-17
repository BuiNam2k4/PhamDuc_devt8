import cv2
import numpy as np
import os
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)

# Đường dẫn tới model file
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'models', 'pose_landmarker_lite.task'
)

class PoseDetectorWrapper:
    def __init__(self):
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=RunningMode.IMAGE,
            num_poses=5,  # Hỗ trợ phát hiện tối đa 5 người cùng lúc
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)
        
    def detect_poses(self, frame):
        """
        Phát hiện tư thế cơ thể (33 landmarks) trong frame
        
        Args:
            frame: OpenCV image (BGR format)
            
        Returns:
            list[dict]: Danh sách các tư thế phát hiện được.
                        Mỗi tư thế gồm: 'landmarks' (33 điểm normalized), 'center_pixel' (x, y)
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        result = self.landmarker.detect(mp_image)
        
        h, w = frame.shape[:2]
        poses = []
        
        if result.pose_landmarks:
            for pose_landmarks in result.pose_landmarks:
                landmarks_list = []
                for lm in pose_landmarks:
                    landmarks_list.append({
                        'x': float(lm.x),
                        'y': float(lm.y),
                        'z': float(lm.z),
                        'visibility': float(lm.visibility) if hasattr(lm, 'visibility') else 1.0,
                        'presence': float(lm.presence) if hasattr(lm, 'presence') else 1.0
                    })
                
                # Tính center của body từ trung bình cộng các khớp xương chính (Shoulders và Hips)
                # Landmark indices: 11 (left shoulder), 12 (right shoulder), 23 (left hip), 24 (right hip)
                # Nếu không đủ thì dùng trung vị hoặc mặc định
                key_indices = [11, 12, 23, 24]
                xs = [pose_landmarks[i].x for i in key_indices if i < len(pose_landmarks)]
                ys = [pose_landmarks[i].y for i in key_indices if i < len(pose_landmarks)]
                
                if xs and ys:
                    cx_norm = sum(xs) / len(xs)
                    cy_norm = sum(ys) / len(ys)
                else:
                    # Fallback to average of all landmarks
                    cx_norm = sum(lm.x for lm in pose_landmarks) / len(pose_landmarks)
                    cy_norm = sum(lm.y for lm in pose_landmarks) / len(pose_landmarks)
                
                cx_px = int(cx_norm * w)
                cy_px = int(cy_norm * h)
                
                poses.append({
                    'landmarks': landmarks_list,
                    'center_pixel': (cx_px, cy_px)
                })
                
        return poses

    def draw_poses(self, frame, poses):
        """
        Vẽ các khớp xương lên frame để debug/visualize
        """
        annotated_frame = frame.copy()
        h, w = frame.shape[:2]
        
        # Các cặp điểm để nối thành khung xương (Skeleton connections)
        # MediaPipe Pose connections
        connections = [
            (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), # Thân trên & Tay
            (11, 23), (12, 24), (23, 24),                      # Thân giữa
            (23, 25), (25, 27), (24, 26), (26, 28)             # Chân
        ]
        
        for pose in poses:
            landmarks = pose['landmarks']
            
            # Vẽ các khớp xương (keypoints)
            for idx, lm in enumerate(landmarks):
                # Chỉ vẽ nếu độ tự tin (visibility) đủ cao
                if lm['visibility'] > 0.5:
                    cx, cy = int(lm['x'] * w), int(lm['y'] * h)
                    cv2.circle(annotated_frame, (cx, cy), 4, (0, 255, 255), -1)
            
            # Vẽ đường nối xương
            for start_idx, end_idx in connections:
                if start_idx < len(landmarks) and end_idx < len(landmarks):
                    p1 = landmarks[start_idx]
                    p2 = landmarks[end_idx]
                    if p1['visibility'] > 0.5 and p2['visibility'] > 0.5:
                        x1, y1 = int(p1['x'] * w), int(p1['y'] * h)
                        x2, y2 = int(p2['x'] * w), int(p2['y'] * h)
                        cv2.line(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        
        return annotated_frame
