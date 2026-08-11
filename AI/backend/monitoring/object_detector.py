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
        Phát hiện các objects trong frame
        """
        if self.model is None:
            return []
        
        try:
            results = self.model(frame, verbose=False)
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
                            
                            obj_info = {
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
            print(f"Error in object detection: {e}")
            return []
    
    def filter_suspicious_objects(self, objects):
        """
        Lọc ra các objects khả nghi
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
