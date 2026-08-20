import json
import base64
import cv2
import numpy as np
import os
import logging
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from monitoring.face_detector import FaceDetectorWrapper
from monitoring.head_pose_estimator import HeadPoseEstimator
from monitoring.object_detector import ObjectDetector
from monitoring.violation_detector import ViolationDetector, ViolationDetectorV2
from monitoring.pose_detector import PoseDetectorWrapper
from monitoring.spring_boot_client import SpringBootClient

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(message)s')
logger = logging.getLogger('ai-server')

# Setup directory for saving evidence pictures
EVIDENCE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# Cấu hình chế độ giám sát từ môi trường: True = Offline, False = Online (mặc định)
OFFLINE_MODE = os.getenv("OFFLINE_MODE", "false").lower() in ("true", "1", "yes")

# Global components
face_detector = FaceDetectorWrapper()
head_pose_estimator = HeadPoseEstimator()
object_detector = ObjectDetector()  # Legacy fallback global instance
violation_detector_legacy = ViolationDetector()  # Giữ lại cho backward compat
violation_detector = ViolationDetectorV2(buffer_size=30, stale_timeout=30.0)  # Legacy fallback global instance
violation_detector.behavior_analyzer.offline_mode = OFFLINE_MODE
pose_detector = PoseDetectorWrapper()
spring_boot_client = SpringBootClient()

# Active WebSocket sessions registry: session_id -> component instances
active_sessions = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời server: startup → shutdown."""
    logger.info("🚀 AI Server starting up...")
    logger.info(f"📡 Spring Boot target: {spring_boot_client.base_url}")
    yield
    # Shutdown: đóng HTTP session
    await spring_boot_client.close()
    logger.info("🛑 AI Server shut down.")


app = FastAPI(
    title="AI Exam Monitoring Service",
    description="Realtime webcam analysis for online exam cheating detection using MediaPipe & YOLO",
    version="1.0.0",
    lifespan=lifespan
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
        self.admin_connections: list[WebSocket] = []
        self.student_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket, is_admin: bool = False):
        await websocket.accept()
        if is_admin:
            self.admin_connections.append(websocket)
            logger.info("👨‍💼 Admin WebSocket connected.")
        else:
            self.student_connections.append(websocket)
            logger.info("🎓 Student/Camera WebSocket connected.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
            logger.info("👨‍💼 Admin WebSocket disconnected.")
        if websocket in self.student_connections:
            self.student_connections.remove(websocket)
            logger.info("🎓 Student/Camera WebSocket disconnected.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def send_to_admins(self, message: str):
        for connection in list(self.admin_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending to admin: {e}")

    async def broadcast(self, message: str):
        # Broadcast to all connections
        for connection in list(self.admin_connections) + list(self.student_connections):
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "AI Exam Monitoring Service",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.websocket("/ws")
@app.websocket("/ws/{session_id_path}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id_path: str = None,
    session_id: str = Query(None)
):
    # Determine the session ID
    resolved_session_id = session_id_path or session_id
    is_admin = (resolved_session_id is None)
    
    await manager.connect(websocket, is_admin=is_admin)
    
    if is_admin:
        # Admin connection: just keep the socket open, receive client heartbeats, and wait
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket)
        return

    # Student connection
    logger.info(f"🔌 New student connected. Session ID: {resolved_session_id}")
    
    # Create session-scoped components to prevent mixing up tracking states
    session_object_detector = ObjectDetector()
    session_violation_detector = ViolationDetectorV2(buffer_size=30, stale_timeout=30.0)
    session_violation_detector.behavior_analyzer.offline_mode = OFFLINE_MODE
    
    # Register session
    active_sessions[resolved_session_id] = {
        "object_detector": session_object_detector,
        "violation_detector": session_violation_detector,
        "connected_at": datetime.utcnow()
    }
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                frame_data = message.get("data", "")
                timestamp = message.get("timestamp", int(datetime.utcnow().timestamp() * 1000))
                
                result = await process_frame(
                    frame_data=frame_data,
                    timestamp=timestamp,
                    object_detector=session_object_detector,
                    violation_detector=session_violation_detector,
                    session_id=resolved_session_id
                )
                
                # Send all results (both detections and violations) to the admins
                await manager.send_to_admins(json.dumps(result))
                    
    except WebSocketDisconnect:
        logger.info(f"🔌 Student disconnected: {resolved_session_id}")
    except Exception as e:
        logger.error(f"❌ WebSocket error in session {resolved_session_id}: {e}")
    finally:
        manager.disconnect(websocket)
        # Clean up session resources to avoid memory leaks
        if resolved_session_id in active_sessions:
            del active_sessions[resolved_session_id]
            logger.info(f"🧹 Cleaned up resources for session: {resolved_session_id}")

async def process_frame(
    frame_data: str,
    timestamp: int,
    object_detector: ObjectDetector,
    violation_detector: ViolationDetectorV2,
    session_id: str = None
):
    try:
        # Clean up base64 header if present
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
            
        image_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"type": "error", "message": "Invalid frame image format"}
        
        # 1. Face detection (for total count in frame)
        faces = face_detector.detect_faces(frame)
        face_count = len(faces)
        
        # 2. Multi head pose estimation using Face Mesh
        head_poses = head_pose_estimator.estimate_poses(frame)
        
        # 3. Multi body pose estimation using MediaPipe Pose
        body_poses = pose_detector.detect_poses(frame)
        
        # 4. Brightness check
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray) / 255.0 * 100)
        
        # 5. Object detection + ByteTrack tracking (YOLOv8)
        objects = object_detector.detect_objects(frame)

        # Tách danh sách persons đã được gán track_id ra riêng
        tracked_persons = [
            obj for obj in objects
            if obj['class_name'] == 'person' and obj['track_id'] != -1
        ]
        
        # Ánh xạ body poses và head poses vào từng tracked_person dựa trên bbox
        for p in tracked_persons:
            px, py, pw, ph = p['bbox']
            p_center = p['center']
            
            # Khớp Body Pose
            matching_pose = None
            for bp in body_poses:
                cx, cy = bp['center_pixel']
                if px <= cx <= px + pw and py <= cy <= py + ph:
                    matching_pose = bp
                    break
            if not matching_pose and body_poses:
                # Tìm pose có khoảng cách tâm gần nhất
                min_d = float('inf')
                for bp in body_poses:
                    cx, cy = bp['center_pixel']
                    dist = (cx - p_center[0])**2 + (cy - p_center[1])**2
                    if dist < min_d:
                        min_d = dist
                        matching_pose = bp
                # Giới hạn khoảng cách tối đa để tránh gán nhầm
                if min_d > (pw**2 + ph**2) * 1.5:
                    matching_pose = None
            
            p['pose_landmarks'] = matching_pose['landmarks'] if matching_pose else []
            
            # Khớp Head Pose (Face Mesh)
            matching_hp = None
            for hp in head_poses:
                hx, hy = hp['center_pixel']
                if px <= hx <= px + pw and py <= hy <= py + ph:
                    matching_hp = hp
                    break
            if not matching_hp and head_poses:
                # Tìm head pose có khoảng cách tâm gần nhất
                min_d = float('inf')
                for hp in head_poses:
                    hx, hy = hp['center_pixel']
                    dist = (hx - p_center[0])**2 + (hy - p_center[1])**2
                    if dist < min_d:
                        min_d = dist
                        matching_hp = hp
                if min_d > (pw**2 + ph**2) * 1.5:
                    matching_hp = None
            
            p['head_pose'] = {
                'yaw': round(matching_hp['yaw'], 2) if matching_hp else 0.0,
                'pitch': round(matching_hp['pitch'], 2) if matching_hp else 0.0,
                'roll': round(matching_hp['roll'], 2) if matching_hp else 0.0
            }
            
        # Xác định head pose chính (của người đầu tiên hoặc face đầu tiên) để tương thích ngược với violation_detector
        head_yaw, head_pitch, head_roll = 0.0, 0.0, 0.0
        if tracked_persons:
            p0 = tracked_persons[0]
            head_yaw = p0['head_pose']['yaw']
            head_pitch = p0['head_pose']['pitch']
            head_roll = p0['head_pose']['roll']
        elif head_poses:
            head_yaw = head_poses[0]['yaw']
            head_pitch = head_poses[0]['pitch']
            head_roll = head_poses[0]['roll']
        
        # 6. Violation evaluation (V2: Time-Series Buffer + Voting)
        violations = violation_detector.check_violations(
            tracked_persons=tracked_persons,
            face_count=face_count,
            brightness=brightness,
            objects=objects,
            timestamp=timestamp,
            offline_mode=OFFLINE_MODE
        )
        
        # Lấy thống kê buffer để gửi về frontend (debug/monitoring)
        buffer_stats = violation_detector.get_buffer_stats()
        
        # Draw boxes/info/skeleton on frame copy for live preview
        fh, fw = frame.shape[:2]
        preview_frame = frame.copy()
        
        # Draw skeletons/poses
        preview_frame = pose_detector.draw_poses(preview_frame, body_poses)
        
        # Draw faces
        for face in faces:
            x, y, w, h = face['bbox']
            x = max(0, min(x, fw - 1))
            y = max(0, min(y, fh - 1))
            w = max(1, min(w, fw - x))
            h = max(1, min(h, fh - y))
            cv2.rectangle(preview_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(preview_frame, f"Face: {face['confidence']:.2f}", (x, y - 5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Draw objects
        for obj in objects:
            ox, oy, ow, oh = obj['bbox']
            ox = max(0, min(ox, fw - 1))
            oy = max(0, min(oy, fh - 1))
            ow = max(1, min(ow, fw - ox))
            oh = max(1, min(oh, fh - oy))
            color = (0, 0, 255) if obj['class_name'] in ['cell phone', 'book'] else (0, 255, 0)
            cv2.rectangle(preview_frame, (ox, oy), (ox + ow, oy + oh), color, 2)
            cv2.putText(preview_frame, f"{obj['class_name']}: {obj['confidence']:.2f}", (ox, oy - 5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Draw Head Pose Info
        pose_text = f"Yaw: {head_yaw:.1f} Pitch: {head_pitch:.1f}"
        cv2.putText(preview_frame, pose_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        # Draw violation if present
        if violations:
            violation_label = f"VIOLATION: {violations[0]['type'].upper()}"
            cv2.putText(preview_frame, violation_label, (preview_frame.shape[1] - 300, 25), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # Encode preview frame back to base64
        _, buffer = cv2.imencode('.jpg', preview_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        preview_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

        response = {
            "type": "detection",
            "session_id": session_id,
            "frame": preview_base64,
            "face_count": face_count,
            "head_yaw": round(head_yaw, 2),
            "head_pitch": round(head_pitch, 2),
            "head_roll": round(head_roll, 2),
            "brightness": round(brightness, 2),
            "objects": objects,
            # tracked_persons: danh sách người đã được ByteTrack gán ID ổn định
            # Format: [{ track_id, bbox, confidence, center, pose_landmarks, head_pose }, ...]
            "tracked_persons": [
                {
                    "track_id": p["track_id"],
                    "bbox": p["bbox"],
                    "confidence": round(p["confidence"], 2),
                    "center": p["center"],
                    "pose_landmarks": p.get("pose_landmarks", []),
                    "head_pose": p.get("head_pose", {"yaw": 0.0, "pitch": 0.0, "roll": 0.0})
                }
                for p in tracked_persons
            ],
            "buffer_stats": buffer_stats,
            "timestamp": timestamp
        }
        
        if violations:
            response["type"] = "violation"
            response["violation_type"] = violations[0]["type"]
            response["violation_source"] = violations[0].get("source", "unknown")
            response["violation_confidence"] = violations[0].get("confidence", 1.0)
            response["violation_track_id"] = violations[0].get("track_id", -1)
            response["details"] = violations[0]["details"]
            
            # Gửi tất cả vi phạm (nếu có nhiều hơn 1)
            if len(violations) > 1:
                response["all_violations"] = [
                    {
                        "type": v["type"],
                        "source": v.get("source", "unknown"),
                        "confidence": v.get("confidence", 1.0),
                        "track_id": v.get("track_id", -1),
                        "details": v["details"]
                    }
                    for v in violations
                ]
            
            # Save annotated evidence image
            try:
                dt_obj = datetime.fromtimestamp(timestamp / 1000)
                time_str = dt_obj.strftime("%Y%m%d_%H%M%S")
                violation_type = violations[0]["type"]
                v_source = violations[0].get('source', 'unknown')
                filename = f"evidence_{time_str}_{violation_type}_{v_source}.jpg"
                filepath = os.path.join(EVIDENCE_DIR, filename)
                
                # Draw boxes/info/skeleton on frame copy
                annotated_frame = frame.copy()
                fh, fw = frame.shape[:2]
                
                # Draw skeletons/poses
                annotated_frame = pose_detector.draw_poses(annotated_frame, body_poses)
                
                # Draw faces
                for face in faces:
                    x, y, w, h = face['bbox']
                    x = max(0, min(x, fw - 1))
                    y = max(0, min(y, fh - 1))
                    w = max(1, min(w, fw - x))
                    h = max(1, min(h, fh - y))
                    cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    cv2.putText(annotated_frame, f"Face: {face['confidence']:.2f}", (x, y - 5), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                
                # Draw objects
                for obj in objects:
                    ox, oy, ow, oh = obj['bbox']
                    ox = max(0, min(ox, fw - 1))
                    oy = max(0, min(oy, fh - 1))
                    ow = max(1, min(ow, fw - ox))
                    oh = max(1, min(oh, fh - oy))
                    color = (0, 0, 255) if obj['class_name'] in ['cell phone', 'book'] else (0, 255, 0)
                    cv2.rectangle(annotated_frame, (ox, oy), (ox + ow, oy + oh), color, 2)
                    cv2.putText(annotated_frame, f"{obj['class_name']}: {obj['confidence']:.2f}", (ox, oy - 5), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
                # Draw Head Pose Info
                pose_text = f"Yaw: {head_yaw:.1f} Pitch: {head_pitch:.1f} Roll: {head_roll:.1f}"
                cv2.putText(annotated_frame, pose_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                
                # Draw violation label on top right
                violation_label = f"VIOLATION: {violation_type.upper()}"
                cv2.putText(annotated_frame, violation_label, (annotated_frame.shape[1] - 300, 25), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
                # Write file
                cv2.imwrite(filepath, annotated_frame)
                logger.info(f"📸 Saved evidence image: {filepath}")
                
                # === BƯỚC 6: Gửi vi phạm lên Spring Boot (fire-and-forget) ===
                async def _send_to_spring_boot(v, fp):
                    try:
                        clean_camera_id = session_id.split("_")[0] if session_id else None
                        is_custom_id = False
                        if clean_camera_id and not clean_camera_id.startswith("session_"):
                            is_custom_id = True
                            
                        parts = session_id.split("_") if session_id else []
                        student_username = parts[1] if len(parts) > 1 else None

                        detail_text = spring_boot_client.build_detail_text(v)
                        result = await spring_boot_client.send_violation(
                            violation_type=v['type'],
                            confidence=v.get('confidence', 1.0),
                            detail=detail_text,
                            image_path=fp,
                            detection_time=datetime.fromtimestamp(
                                timestamp / 1000
                            ).strftime('%Y-%m-%d %H:%M:%S'),
                            exam_session_camera_id=clean_camera_id if is_custom_id else None,
                            student_username=student_username
                        )
                        if result['success']:
                            logger.info(f"📤 Vi phạm đã ghi vào DB Spring Boot")
                        else:
                            logger.warning(
                                f"⚠️ Không gửi được vi phạm lên Spring Boot: "
                                f"{result['error']}"
                            )
                    except Exception as api_err:
                        logger.error(f"❌ Lỗi gọi Spring Boot API: {api_err}")
                
                # Chạy async không chờ để không block frame processing
                asyncio.create_task(_send_to_spring_boot(violations[0], filepath))
                
            except Exception as save_err:
                logger.error(f"Error saving evidence image: {save_err}")
        
        return response
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return {"type": "error", "message": str(e)}

@app.get("/api/violations")
async def get_violations(session_id: str = None):
    """Trả về danh sách vi phạm gần nhất lưu tạm trên bộ nhớ (In-memory)"""
    if session_id:
        session = active_sessions.get(session_id)
        if session:
            return {"violations": list(session["violation_detector"].recent_violations)}
        return {"violations": [], "message": f"Session {session_id} not found or inactive"}
        
    # Combine violations from all active sessions
    all_violations = []
    for s_id, s_data in active_sessions.items():
        for v in s_data["violation_detector"].recent_violations:
            v_copy = dict(v)
            v_copy["session_id"] = s_id
            all_violations.append(v_copy)
            
    # Also include global/legacy violations if any
    for v in violation_detector.recent_violations:
        v_copy = dict(v)
        v_copy["session_id"] = "global"
        all_violations.append(v_copy)
        
    all_violations.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    return {"violations": all_violations}

@app.get("/api/buffer-stats")
async def get_buffer_stats(session_id: str = None):
    """Trả về thống kê Time-Series Buffer (debug/monitoring)"""
    if session_id:
        session = active_sessions.get(session_id)
        if session:
            return session["violation_detector"].get_buffer_stats()
        return {"error": f"Session {session_id} not found"}
        
    # Return stats for all active sessions
    return {
        s_id: s_data["violation_detector"].get_buffer_stats()
        for s_id, s_data in active_sessions.items()
    }

@app.get("/api/analyzer-config")
async def get_analyzer_config(session_id: str = None):
    """Trả về cấu hình Behavior Analyzer hiện tại"""
    if session_id:
        session = active_sessions.get(session_id)
        if session:
            return session["violation_detector"].get_config()
        return {"error": f"Session {session_id} not found"}
    return violation_detector.get_config()

@app.get("/api/spring-boot-stats")
async def get_spring_boot_stats():
    """Trả về thống kê giao tiếp với Spring Boot Backend"""
    return spring_boot_client.get_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
