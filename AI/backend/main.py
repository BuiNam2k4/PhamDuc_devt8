import json
import base64
import cv2
import numpy as np
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from monitoring.face_detector import FaceDetector
from monitoring.head_pose_estimator import HeadPoseEstimator
from monitoring.object_detector import ObjectDetector
from monitoring.violation_detector import ViolationDetector

# Global components
face_detector = FaceDetector()
head_pose_estimator = HeadPoseEstimator()
object_detector = ObjectDetector()
violation_detector = ViolationDetector()

app = FastAPI(
    title="AI Exam Monitoring Service",
    description="Realtime webcam analysis for online exam cheating detection using MediaPipe & YOLO",
    version="1.0.0"
)

# Enable CORS for React Frontend (3000/5173) & Spring Boot Backend (8080)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "AI Exam Monitoring Service",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                frame_data = message.get("data", "")
                timestamp = message.get("timestamp", int(datetime.utcnow().timestamp() * 1000))
                
                result = await process_frame(frame_data, timestamp)
                await manager.send_personal_message(json.dumps(result), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def process_frame(frame_data: str, timestamp: int):
    try:
        # Clean up base64 header if present
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
            
        image_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"type": "error", "message": "Invalid frame image format"}
        
        # 1. Face detection
        faces = face_detector.detect_faces(frame)
        face_count = len(faces)
        
        # 2. Head pose estimation
        head_yaw, head_pitch, head_roll = 0.0, 0.0, 0.0
        if face_count > 0:
            head_yaw, head_pitch, head_roll = head_pose_estimator.estimate_pose(frame, faces[0])
        
        # 3. Brightness check
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray) / 255.0 * 100)
        
        # 4. Object detection (YOLOv8)
        objects = object_detector.detect_objects(frame)
        
        # 5. Violation evaluation
        violations = violation_detector.check_violations(
            face_count=face_count,
            head_yaw=head_yaw,
            head_pitch=head_pitch,
            brightness=brightness,
            objects=objects,
            timestamp=timestamp
        )
        
        response = {
            "type": "detection",
            "face_count": face_count,
            "head_yaw": round(head_yaw, 2),
            "head_pitch": round(head_pitch, 2),
            "head_roll": round(head_roll, 2),
            "brightness": round(brightness, 2),
            "objects": objects,
            "timestamp": timestamp
        }
        
        if violations:
            response["type"] = "violation"
            response["violation_type"] = violations[0]["type"]
            response["details"] = violations[0]["details"]
        
        return response
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return {"type": "error", "message": str(e)}

@app.get("/api/violations")
async def get_violations():
    """Trả về danh sách vi phạm gần nhất lưu tạm trên bộ nhớ (In-memory)"""
    return {"violations": list(violation_detector.recent_violations)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
