import cv2
import numpy as np

class ObjectDetector:
    def __init__(self):
        # Load YOLOv8 model
        try:
            from ultralytics import YOLO
            self.model = YOLO('yolov8n.pt')  # nano version for speed
        except Exception as e:
            print(f"⚠️ Warning: Could not load YOLO model: {e}")
            print("Object detection will be disabled until ultralytics model is ready")
            self.model = None
        
        self.target_classes = {
            'person': 0,
            'cell phone': 67,
            'book': 84,
            'laptop': 72,
            'mouse': 74,
            'keyboard': 75,
            'bottle': 39,
            'cup': 41
        }
        
        self.confidence_threshold = 0.5
    
    def detect_objects(self, frame):
        """
        Phát hiện và tracking objects trong frame.
        Sử dụng ByteTrack (tích hợp sẵn trong Ultralytics) để gán track_id
        cố định cho từng đối tượng xuyên suốt nhiều frame liên tiếp.

        Returns:
            list[dict]: Mỗi phần tử chứa thông tin vật thể + track_id (nếu có).
                        track_id = -1 nếu không track được.
        """
        if self.model is None:
            return []
        
        try:
            # Dùng model.track() thay vì model() để bật ByteTrack
            # persist=True: giữ track_id ổn định giữa các frame liên tiếp
            results = self.model.track(frame, persist=True, verbose=False)
            detected_objects = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = self.model.names[class_id]
                        
                        if confidence >= self.confidence_threshold:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            
                            # Lấy track_id từ ByteTrack (-1 nếu chưa được gán ID)
                            track_id = int(box.id[0]) if box.id is not None else -1
                            
                            obj_info = {
                                'track_id': track_id,       # ID ổn định qua các frame
                                'class_name': class_name,
                                'class_id': class_id,
                                'confidence': float(confidence),
                                'bbox': (int(x1), int(y1), int(x2-x1), int(y2-y1)),
                                'center': (int((x1+x2)/2), int((y1+y2)/2)),
                                'area': int((x2-x1) * (y2-y1))
                            }
                            
                            detected_objects.append(obj_info)
            
            return detected_objects
            
        except Exception as e:
            print(f"Error in object detection/tracking: {e}")
            return []
    
    def filter_suspicious_objects(self, objects):
        """
        Lọc ra các objects khả nghi, giữ lại track_id để
        các bước sau (MediaPipe Pose, LSTM) biết cần xử lý ai.
        """
        suspicious = {
            'phones': [],
            'extra_persons': [],
            'books': [],
            'electronics': []
        }
        
        for obj in objects:
            class_name = obj['class_name']
            
            if class_name == 'cell phone':
                suspicious['phones'].append(obj)
            elif class_name == 'person':
                suspicious['extra_persons'].append(obj)
            elif class_name == 'book':
                suspicious['books'].append(obj)
            elif class_name in ['laptop', 'mouse', 'keyboard']:
                suspicious['electronics'].append(obj)
        
        return suspicious

