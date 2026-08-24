"""
Spring Boot API Client — Bước 6 Pipeline AI

HTTP Client để gọi REST API của Spring Boot Backend (port 8080)
sử dụng xác thực API Key để giao tiếp giữa hai dịch vụ.
"""

import os
import json
import time
import asyncio
import logging
from datetime import datetime

import aiohttp

logger = logging.getLogger(__name__)


# =============================================================================
# Mapping: Python violation type -> Java ViolationType enum
# =============================================================================

VIOLATION_TYPE_MAP = {
    'phone_usage':      'PHONE_DETECTED',
    'phone_detected':   'PHONE_DETECTED',
    'looking_away':     'LOOK_AWAY',
    'look_away':        'LOOK_AWAY',
    'turning_around':   'TURN_AROUND',
    'multiple_faces':   'MULTIPLE_FACES',
    'face_missing':     'FACE_NOT_DETECTED',
    'face_not_detected':'FACE_NOT_DETECTED',
    'cheat_sheet':      'USING_DOCUMENT',
    'suspicious_object':'USING_DOCUMENT',
    'camera_blocked':   'OTHER',
}


class SpringBootClient:
    """
    Async HTTP Client để giao tiếp với Spring Boot Backend.
    
    Sử dụng API Key để gửi violation results qua REST API,
    và xử lý lỗi graceful khi backend không khả dụng.
    """

    def __init__(
        self,
        base_url: str = None,
        default_exam_session_camera_id: str = None,
        default_model_id: str = None,
        api_key: str = None,
    ):
        """
        Args:
            base_url: URL của Spring Boot server (VD: "http://localhost:8080")
            default_exam_session_camera_id: ID camera session mặc định 
                (dùng cho sandbox testing khi chưa có session thực)
            default_model_id: ID model AI mặc định trong DB
            api_key: Khóa bí mật dùng cho service-to-service auth
        """
        self.base_url = base_url or os.getenv("SPRING_BOOT_URL", "http://localhost:8080")
        self.api_key = api_key or os.getenv("SPRING_BOOT_API_KEY", "super-secret-ai-token-123")
        self.default_exam_session_camera_id = (
            default_exam_session_camera_id 
            or os.getenv("DEFAULT_EXAM_SESSION_CAMERA_ID", "")
        )
        self.default_model_id = (
            default_model_id 
            or os.getenv("DEFAULT_MODEL_ID", "")
        )
        
        # Connection state
        self._session: aiohttp.ClientSession = None
        self._is_available: bool = False
        self._last_check_time: float = 0
        self._check_interval: float = 30.0  # Kiểm tra lại sau 30 giây nếu backend down
        
        # Stats
        self._stats = {
            'total_sent': 0,
            'total_success': 0,
            'total_failed': 0,
            'last_error': None,
            'last_success_time': None,
        }

    async def _get_session(self) -> aiohttp.ClientSession:
        """Lấy hoặc tạo HTTP session (lazy init)."""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=10, connect=5)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    def _get_auth_headers(self) -> dict:
        """Trả về headers với X-API-KEY."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-KEY"] = self.api_key
        else:
            logger.warning("⚠️ Gửi request không có API Key (api_key chưa được cấu hình)")
        return headers

    async def is_backend_available(self) -> bool:
        """
        Kiểm tra Spring Boot backend có đang chạy không.
        Cache kết quả trong check_interval giây để tránh spam.
        """
        now = time.time()
        if now - self._last_check_time < self._check_interval:
            return self._is_available
        
        self._last_check_time = now
        
        try:
            session = await self._get_session()
            # Gọi endpoint public không cần auth
            async with session.get(f"{self.base_url}/swagger-ui.html", allow_redirects=True) as resp:
                self._is_available = resp.status in (200, 302)
                return self._is_available
        except Exception:
            self._is_available = False
            return False

    async def send_violation(
        self,
        violation_type: str,
        confidence: float,
        detail: str,
        image_path: str = None,
        detection_time: str = None,
        exam_session_camera_id: str = None,
        model_id: str = None,
        student_username: str = None,
    ) -> dict:
        """
        Gửi kết quả vi phạm lên Spring Boot để lưu vào MySQL.
        
        Args:
            violation_type: Loại vi phạm Python (VD: "phone_usage", "looking_away")
            confidence: Độ tin cậy (0.0 → 1.0)
            detail: Mô tả chi tiết dạng text
            image_path: Đường dẫn file ảnh bằng chứng (local)
            detection_time: Thời gian phát hiện (ISO format)
            exam_session_camera_id: ID camera session (nếu None, dùng default)
            model_id: ID model AI (nếu None, dùng default)
            student_username: Tên tài khoản thí sinh (nếu thi online)
            
        Returns:
            dict: {"success": bool, "data": response_data hoặc None, "error": str hoặc None}
        """
        self._stats['total_sent'] += 1
        
        # Kiểm tra backend có sẵn không
        if not await self.is_backend_available():
            self._stats['total_failed'] += 1
            self._stats['last_error'] = "Spring Boot backend không khả dụng"
            logger.warning("⚠️ Bỏ qua gửi violation — Spring Boot không khả dụng")
            return {"success": False, "data": None, "error": "Backend unavailable"}
        
        # Map violation type Python -> Java enum
        java_violation_type = VIOLATION_TYPE_MAP.get(violation_type, 'OTHER')
        
        # Build request payload matching RecognitionResultCreationRequest
        if detection_time is None:
            detection_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # imageUrl: Đường dẫn tương đối hoặc URL tới ảnh bằng chứng
        image_url = ""
        if image_path:
            # Lưu tên file tương đối để frontend có thể truy cập
            image_url = os.path.basename(image_path)
        
        payload = {
            "violationType": java_violation_type,
            "confidence": round(confidence, 4),
            "detectionTime": detection_time,
            "detail": detail,
            "imageUrl": image_url,
            "modelId": model_id or self.default_model_id or None,
            "studentUsername": student_username,
            "examSessionCameraId": (
                exam_session_camera_id 
                or self.default_exam_session_camera_id 
                or "sandbox-test"
            ),
        }
        
        try:
            session = await self._get_session()
            url = f"{self.base_url}/api/violations"
            headers = self._get_auth_headers()
            
            async with session.post(url, json=payload, headers=headers) as resp:
                body = await resp.json()
                
                if resp.status == 200:
                    self._stats['total_success'] += 1
                    self._stats['last_success_time'] = datetime.now().isoformat()
                    result_data = body.get("result", {})
                    result_id = result_data.get("id", "unknown")
                    logger.info(
                        f"✅ Vi phạm đã gửi lên Spring Boot thành công "
                        f"[ID: {result_id}, Type: {java_violation_type}]"
                    )
                    return {"success": True, "data": result_data, "error": None}
                else:
                    error_msg = body.get("message", f"HTTP {resp.status}")
                    self._stats['total_failed'] += 1
                    self._stats['last_error'] = error_msg
                    logger.warning(f"⚠️ Spring Boot trả lỗi: {error_msg}")
                    return {"success": False, "data": None, "error": error_msg}
                    
        except aiohttp.ClientConnectorError:
            self._is_available = False
            self._stats['total_failed'] += 1
            self._stats['last_error'] = "Connection refused"
            logger.warning("⚠️ Mất kết nối Spring Boot")
            return {"success": False, "data": None, "error": "Connection refused"}
        except asyncio.TimeoutError:
            self._stats['total_failed'] += 1
            self._stats['last_error'] = "Request timeout"
            logger.warning("⚠️ Request timeout khi gửi violation")
            return {"success": False, "data": None, "error": "Timeout"}
        except Exception as e:
            self._stats['total_failed'] += 1
            self._stats['last_error'] = str(e)
            logger.error(f"❌ Lỗi khi gửi violation: {e}")
            return {"success": False, "data": None, "error": str(e)}

    def build_detail_text(self, violation: dict) -> str:
        """
        Chuyển violation dict thành chuỗi mô tả để lưu vào DB.
        
        Args:
            violation: dict chứa type, confidence, source, details, track_id, ...
            
        Returns:
            str: Mô tả chi tiết vi phạm
        """
        v_type = violation.get('type', 'unknown')
        confidence = violation.get('confidence', 0.0)
        source = violation.get('source', 'unknown')
        track_id = violation.get('track_id', -1)
        details = violation.get('details', {})
        description = details.get('description', '')
        
        parts = [
            f"Loại: {v_type}",
            f"Nguồn phân tích: {source}",
            f"Độ tin cậy: {confidence:.1%}",
        ]
        
        if track_id != -1:
            parts.append(f"Track ID: {track_id}")
        
        if description:
            parts.append(f"Chi tiết: {description}")
        
        # Thêm thông tin bổ sung từ details
        window_size = violation.get('window_size')
        if window_size:
            parts.append(f"Cửa sổ phân tích: {window_size} frames")
        
        return " | ".join(parts)

    def get_stats(self) -> dict:
        """Trả về thống kê giao tiếp với Spring Boot."""
        return {
            **self._stats,
            'is_available': self._is_available,
            'base_url': self.base_url,
        }

    async def close(self):
        """Đóng HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
            logger.info("🔌 Spring Boot client session đã đóng")
