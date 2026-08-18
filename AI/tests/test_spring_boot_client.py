"""
Unit Tests cho Spring Boot Client
Chạy: cd AI && python -m pytest tests/test_spring_boot_client.py -v
"""

import sys
import os
import asyncio
import pytest

# Thêm đường dẫn backend vào sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from monitoring.spring_boot_client import SpringBootClient, VIOLATION_TYPE_MAP


# ============================================================
# TEST: Violation Type Mapping
# ============================================================

class TestViolationTypeMapping:

    def test_phone_usage_maps_correctly(self):
        """Python 'phone_usage' → Java 'PHONE_DETECTED'."""
        assert VIOLATION_TYPE_MAP['phone_usage'] == 'PHONE_DETECTED'

    def test_looking_away_maps_correctly(self):
        """Python 'looking_away' → Java 'LOOK_AWAY'."""
        assert VIOLATION_TYPE_MAP['looking_away'] == 'LOOK_AWAY'

    def test_cheat_sheet_maps_correctly(self):
        """Python 'cheat_sheet' → Java 'USING_DOCUMENT'."""
        assert VIOLATION_TYPE_MAP['cheat_sheet'] == 'USING_DOCUMENT'

    def test_face_missing_maps_correctly(self):
        """Python 'face_missing' → Java 'FACE_NOT_DETECTED'."""
        assert VIOLATION_TYPE_MAP['face_missing'] == 'FACE_NOT_DETECTED'

    def test_multiple_faces_maps_correctly(self):
        """Python 'multiple_faces' → Java 'MULTIPLE_FACES'."""
        assert VIOLATION_TYPE_MAP['multiple_faces'] == 'MULTIPLE_FACES'

    def test_camera_blocked_maps_to_other(self):
        """Python 'camera_blocked' → Java 'OTHER'."""
        assert VIOLATION_TYPE_MAP['camera_blocked'] == 'OTHER'

    def test_unknown_type_defaults_to_other(self):
        """Loại vi phạm không biết → fallback 'OTHER'."""
        assert VIOLATION_TYPE_MAP.get('unknown_type', 'OTHER') == 'OTHER'


# ============================================================
# TEST: SpringBootClient initialization
# ============================================================

class TestSpringBootClientInit:

    def test_default_config(self):
        """Client khởi tạo với config mặc định."""
        client = SpringBootClient()
        assert client.base_url == "http://localhost:8080"
        assert client.api_key == "super-secret-ai-token-123"
        assert client._is_available == False

    def test_custom_config(self):
        """Client khởi tạo với config tùy chỉnh."""
        client = SpringBootClient(
            base_url="http://192.168.1.100:9090",
            api_key="custom-key-xyz",
            default_exam_session_camera_id="cam-123",
            default_model_id="model-456",
        )
        assert client.base_url == "http://192.168.1.100:9090"
        assert client.api_key == "custom-key-xyz"
        assert client.default_exam_session_camera_id == "cam-123"
        assert client.default_model_id == "model-456"


# ============================================================
# TEST: build_detail_text
# ============================================================

class TestBuildDetailText:

    def test_basic_violation(self):
        """Build detail text cho violation cơ bản."""
        client = SpringBootClient()
        violation = {
            'type': 'phone_usage',
            'confidence': 0.73,
            'source': 'time_series',
            'track_id': 2,
            'details': {
                'description': 'Điện thoại xuất hiện trong 22/30 frames (73%)'
            },
            'window_size': 30,
        }
        
        text = client.build_detail_text(violation)
        assert 'phone_usage' in text
        assert 'time_series' in text
        assert '73' in text
        assert 'Track ID: 2' in text

    def test_instant_violation_no_track_id(self):
        """Build detail text cho instant violation (không có track_id)."""
        client = SpringBootClient()
        violation = {
            'type': 'camera_blocked',
            'confidence': 1.0,
            'source': 'instant',
            'details': {
                'brightness': 5.2,
                'reason': 'too_dark',
                'description': 'Camera quá tối (5.2%)'
            },
        }
        
        text = client.build_detail_text(violation)
        assert 'camera_blocked' in text
        assert 'instant' in text
        assert 'Track ID' not in text  # Không có track_id → không hiện

    def test_empty_violation(self):
        """Build detail text cho violation rỗng không crash."""
        client = SpringBootClient()
        text = client.build_detail_text({})
        assert 'unknown' in text


# ============================================================
# TEST: get_stats
# ============================================================

class TestGetStats:

    def test_initial_stats(self):
        """Stats ban đầu đều = 0."""
        client = SpringBootClient()
        stats = client.get_stats()
        assert stats['total_sent'] == 0
        assert stats['total_success'] == 0
        assert stats['total_failed'] == 0
        assert stats['is_available'] == False

    def test_stats_has_base_url(self):
        """Stats chứa base_url để debug."""
        client = SpringBootClient(base_url="http://test:8080")
        stats = client.get_stats()
        assert stats['base_url'] == "http://test:8080"


# ============================================================
# TEST: send_violation khi backend unavailable
# ============================================================

class TestSendViolationUnavailable:

    @pytest.mark.asyncio
    async def test_returns_error_when_unavailable(self):
        """Gửi violation khi backend down → trả error không crash."""
        client = SpringBootClient(base_url="http://localhost:99999")
        # Force is_available = False và bypass check interval
        client._is_available = False
        client._last_check_time = 0
        client._check_interval = 0
        
        result = await client.send_violation(
            violation_type="phone_usage",
            confidence=0.8,
            detail="test violation",
        )
        
        assert result['success'] == False
        assert result['error'] is not None
        assert client._stats['total_failed'] >= 1
        
        await client.close()


# ============================================================
# Chạy tests
# ============================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
