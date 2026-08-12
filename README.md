# Hệ Thống Giám Sát Thi Cử Thông Minh (AI Exam Proctoring System)

Hệ thống giám sát thi cử trực tuyến thông minh kết hợp giữa phân tích hình ảnh AI thời gian thực (Real-time Computer Vision) qua camera thiết bị của sinh viên, lưu vết hành vi gian lận và quản lý phòng thi/ca thi từ xa.

---

## 🏛️ Kiến Trúc Hệ Thống

Dự án bao gồm 3 thành phần chính:
1. **Java Spring Boot Backend** (`/gian_lan`): Quản lý cơ sở dữ liệu (MySQL), CRUD sinh viên, phòng thi, môn học, lập ca thi và cung cấp các REST API xác thực/phân quyền (JWT).
2. **React + Vite Frontend** (`/frontend`): Giao diện dashboard giám sát camera live thời gian thực, quản lý các mô hình AI và thực hiện toàn bộ thao tác quản lý dữ liệu cho quản trị viên (Admin Dashboard).
3. **FastAPI AI Service** (`/AI`): Động cơ AI xử lý luồng camera qua WebSocket sử dụng MediaPipe (nhận diện đầu, khuôn mặt) và YOLOv8 (phát hiện điện thoại, sách/tài liệu).

---

## 🛠️ Yêu Cầu Chuẩn Bị (Prerequisites)

* **Java Development Kit (JDK)**: Phiên bản 21 trở lên.
* **Python**: Phiên bản 3.10 trở lên.
* **MySQL Server**: Cổng mặc định `3306`.

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Dịch Vụ

### 1. Cơ Sở Dữ Liệu (MySQL)
Trước khi chạy backend, hãy chắc chắn rằng MySQL đang hoạt động.
* Tạo cơ sở dữ liệu tên là `gian_lan` trong MySQL:
  ```sql
  CREATE DATABASE gian_lan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
* Thông số kết nối mặc định được khai báo ở [application.yaml](file:///home/phamduc/Documents/techbyte/PhamDuc_devt8/gian_lan/src/main/resources/application.yaml):
  * **Database URL**: `jdbc:mysql://localhost:3306/gian_lan`
  * **Username**: `root`
  * **Password**: `Ducno96421!` (Bạn có thể cấu hình lại mật khẩu qua biến môi trường hoặc chỉnh trực tiếp file cấu hình).

---

### 2. Khởi Động Java Spring Boot Backend
Di chuyển vào thư mục `/gian_lan`:
```bash
cd gian_lan
```
* **Biên dịch dự án**:
  ```bash
  ./mvnw clean compile
  ```
* **Chạy Server**:
  ```bash
  ./mvnw spring-boot:run
  ```
* Backend sẽ chạy tại cổng: `http://localhost:8080` (Tài khoản admin mặc định sẽ tự động được tạo lúc khởi chạy đầu tiên: tài khoản `admin`, mật khẩu `12345678`).

---

### 3. Khởi Động React Frontend
Di chuyển vào thư mục `/frontend`:
```bash
cd frontend
```
* **Cài đặt các gói thư viện**:
  ```bash
  npm install
  ```
* **Chạy giao diện ở chế độ Development**:
  ```bash
  npm run dev
  ```
  Giao diện phát triển sẽ khả dụng tại: `http://localhost:5173`.
* **Build đóng gói Frontend vào Backend**:
  ```bash
  npm run build
  ```
  Vite sẽ tự động biên dịch toàn bộ mã nguồn frontend thành tài nguyên tĩnh và ghi đè vào thư mục `/gian_lan/src/main/resources/static/` để Spring Boot phục vụ trực tiếp tại địa chỉ `http://localhost:8080/`.

---

### 4. Khởi Động FastAPI AI Service
Di chuyển vào thư mục `/AI`:
```bash
cd AI
```
* **Tạo và kích hoạt môi trường ảo (venv)**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
* **Cài đặt các dependencies**:
  ```bash
  pip install -r requirements.txt
  ```
* **Khởi chạy máy chủ AI**:
  ```bash
  python3 run_server.py
  ```
* Máy chủ AI sẽ chạy tại: `http://localhost:8000`.
  * Tài liệu Swagger API Docs: `http://localhost:8000/docs`
  * Địa chỉ kết nối WebSocket: `ws://localhost:8000/ws`

---

## 📊 Bảng Danh Sách Cổng Kết Nối (Port Mappings)

| Thành phần | Địa chỉ chạy mặc định | Mô tả |
| :--- | :--- | :--- |
| **Frontend Dev Server** | `http://localhost:5173` | Giao diện Dashboard React phát triển |
| **Spring Boot Backend** | `http://localhost:8080` | REST API quản trị & phân quyền |
| **FastAPI AI Server** | `http://localhost:8000` | Động cơ phân tích hình ảnh AI |
| **AI WebSocket** | `ws://localhost:8000/ws` | Nhận base64 frame từ Client |
| **MySQL Database** | `localhost:3306` | CSDL quản lý sinh viên/ca thi |
