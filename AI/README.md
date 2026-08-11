# AI Exam Monitoring Service

Hệ thống AI Giám sát Thi Online Realtime được xây dựng với **FastAPI**, **MediaPipe**, **OpenCV**, và **YOLOv8**.

## Tính năng AI Giám sát
1. **Phát hiện khuôn mặt (Face Detection)**: Đếm số lượng khuôn mặt, cảnh báo khi có nhiều người hoặc mất khuôn mặt khỏi camera (`MediaPipe Face Detection`).
2. **Ước tính hướng nhìn/đầu (Head Pose Estimation)**: Tính các góc Yaw, Pitch, Roll để phát hiện hành vi quay đầu trái/phải, cúi/ngửa đầu (`MediaPipe Face Mesh` + `SolvePnP`).
3. **Phát hiện vật thể nghi vấn (Suspicious Object Detection)**: Nhận diện điện thoại, sách/tài liệu, thiết bị điện tử, người thứ hai (`YOLOv8`).
4. **Kiểm tra điều kiện ánh sáng (Brightness Inspection)**: Kiểm tra camera bị che / quá tối hoặc chói sáng.
5. **Realtime WebSocket Processing**: Nhận frame mã hóa Base64 từ Web client qua WebSocket (`ws://localhost:8000/ws`) và trả kết quả tức thì.
6. **Graceful Storage Fallback**: Tự động sử dụng in-memory storage lưu log vi phạm nếu chưa cài đặt/chạy MongoDB.

## Hướng dẫn Cài đặt & Chạy

### 1. Cài đặt môi trường Python
```bash
cd AI
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Khởi động AI Server
```bash
python3 run_server.py
```
Server sẽ lắng nghe tại: `http://localhost:8000`
- Swagger UI (API Docs): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- WebSocket Endpoint: `ws://localhost:8000/ws`
