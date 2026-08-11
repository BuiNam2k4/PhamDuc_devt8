import cv2
import mediapipe as mp
import numpy as np

class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Khởi tạo face detection với confidence threshold
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,  # 0 cho camera gần (< 2m), 1 cho camera xa
            min_detection_confidence=0.6
        )
    
    def detect_faces(self, frame):
        """
        Phát hiện khuôn mặt trong frame
        
        Args:
            frame: OpenCV image (BGR format)
            
        Returns:
            list: Danh sách các khuôn mặt được phát hiện
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_frame)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = frame.shape
                
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                face_info = {
                    'bbox': (x, y, width, height),
                    'confidence': float(detection.score[0]),
                    'keypoints': self._extract_keypoints(detection, w, h)
                }
                faces.append(face_info)
        
        return faces
    
    def _extract_keypoints(self, detection, img_width, img_height):
        """Trích xuất các điểm đặc trưng từ detection"""
        keypoints = {}
        
        if hasattr(detection.location_data, 'relative_keypoints'):
            for idx, keypoint in enumerate(detection.location_data.relative_keypoints):
                x = int(keypoint.x * img_width)
                y = int(keypoint.y * img_height)
                
                keypoint_names = [
                    'right_eye', 'left_eye', 'nose_tip', 
                    'mouth_center', 'right_ear_tragion', 'left_ear_tragion'
                ]
                
                if idx < len(keypoint_names):
                    keypoints[keypoint_names[idx]] = (x, y)
        
        return keypoints
    
    def draw_detections(self, frame, faces):
        """
        Vẽ các detection lên frame
        """
        for face in faces:
            x, y, w, h = face['bbox']
            confidence = face['confidence']
            
            color = (0, 255, 0) if len(faces) == 1 else (0, 0, 255)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            
            label = f"Face: {confidence:.2f}"
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            for keypoint_name, (kx, ky) in face['keypoints'].items():
                cv2.circle(frame, (kx, ky), 3, (255, 0, 0), -1)
        
        face_count_text = f"Faces: {len(faces)}"
        cv2.putText(frame, face_count_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        return frame
    
    def is_face_in_center(self, face, frame_shape, threshold=0.3):
        """
        Kiểm tra xem khuôn mặt có ở giữa khung hình không
        """
        x, y, w, h = face['bbox']
        frame_h, frame_w = frame_shape[:2]
        
        face_center_x = x + w // 2
        face_center_y = y + h // 2
        
        frame_center_x = frame_w // 2
        frame_center_y = frame_h // 2
        
        distance_x = abs(face_center_x - frame_center_x) / frame_w
        distance_y = abs(face_center_y - frame_center_y) / frame_h
        
        return distance_x < threshold and distance_y < threshold
