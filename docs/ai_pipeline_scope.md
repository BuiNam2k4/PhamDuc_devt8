# Báo cáo Phân tích Pipeline AI & Bó hẹp Phạm vi Dự án (Scope Cutting)

Tài liệu này đánh giá hiện trạng phần AI của dự án, đối chiếu với luồng pipeline tiêu chuẩn do Mentor đề xuất, đồng thời thực hiện bó hẹp phạm vi (Scope Cutting) để đảm bảo tính khả thi của dự án và đưa ra các tiêu chí nghiệm thu bằng con số định lượng cụ thể.

---

## 1. Nhận xét định hướng từ Mentor & Định hướng Bó hẹp Scope
> **Ý kiến chỉ đạo:** 
> *"Ý tưởng ổn nhưng cần bó scope lại cho đúng bài toán và năng lực của bản thân. Đừng cố làm một hệ thống “nhận diện mọi hành vi gian lận”. Giai đoạn này Đức chỉ cần chứng minh tốt 2–3 case... Phải đưa ra tiêu chí nghiệm thu bằng con số, không chỉ nói 'AI nhận diện được'. Ví dụ em cần làm báo cáo rõ: Precision / Recall / F1, tỷ lệ false positive, FPS xử lý, thời gian từ camera → AI → cảnh báo Dashboard."*

### Phạm vi mục tiêu mới (Bó hẹp Scope):
Hệ thống sẽ không cố gắng nhận diện tất cả các loại hành vi gian lận phức tạp (như đổi người thi, gian lận âm thanh, v.v.). Thay vào đó, tập trung tối ưu hóa và chứng minh hiệu quả tuyệt đối cho **3 hành vi cốt lõi**:
1. **Sử dụng điện thoại di động (Cell phone usage):** Phát hiện thí sinh cầm hoặc sử dụng điện thoại trong khung hình.
2. **Quay đầu bất thường (Abnormal head rotation):** Phát hiện quay đầu sang trái/phải quá góc độ giới hạn hoặc cúi đầu quá sâu liên tục.
3. **Sự xuất hiện của tài liệu/vật thể cấm (Cheat sheets/Books):** Phát hiện sách, vở hoặc tài liệu không được phép đặt trên bàn thi.

---

## 2. Đối chiếu Hiện trạng AI với Pipeline tiêu chuẩn của Mentor

Luồng pipeline tiêu chuẩn:
RTSP (Camera) -> Giải mã -> YOLOv8 -> Tracking -> MediaPipe Pose -> Chuỗi thời gian -> LSTM (Giai đoạn sau) -> Xác nhận sự kiện (Voting) -> Lưu bằng chứng -> WebSocket

### Bảng Kế hoạch Phát triển & Đối chiếu Hiện trạng (Sắp xếp theo thứ tự thực hiện từ trên xuống dưới)

| Thứ tự thực hiện | Bước trong Pipeline | Trạng thái hiện tại | Chi tiết kỹ thuật & Kế hoạch thực hiện |
| :--- | :--- | :--- | :--- |
| **1** | **Webcam & WebSocket Test Sandbox (Trang Test Admin)** | `Đã hoàn thành` | Đã xây dựng hoàn tất trang kiểm thử `/admin/camera-test`. Cho phép nhà phát triển mở camera cục bộ, chụp ảnh Base64 gửi liên tục lên FastAPI qua WebSocket và nhận phản hồi trực quan các thông số (Yaw/Pitch/Roll, Objects, Face count) thời gian thực. |
| **2** | **Decode & YOLOv8 Object & Person Detection** | `Đã hoàn thành` | Tích hợp thành công **YOLOv8 Nano** để phát hiện các vật thể mục tiêu: Người (`person`), Điện thoại (`cell phone`), Sách/vở (`book`). YOLOv8 chỉ làm nhiệm vụ phát hiện vật thể và xác nhận sự hiện diện của người. |
| **3** | **Multi-Person Tracking (ByteTrack)** | `Đã hoàn thành` | Tích hợp **ByteTrack** (có sẵn trong Ultralytics) bằng cách chuyển `model()` → `model.track(persist=True)`. Mỗi `person` phát hiện được gắn `track_id` ổn định qua các frame. Danh sách `tracked_persons` được trả về trong response WebSocket để Bước 4 (MediaPipe Pose) dùng chạy riêng cho từng thí sinh.<br>✅ **Đã giải quyết Nợ kỹ thuật (Technical Debt):** Đã chuyển đổi `ObjectDetector` và `ViolationDetectorV2` thành session-scoped (khởi tạo riêng biệt cho từng WebSocket session `session_id`), tránh hoàn toàn hiện tượng lẫn lộn tracker state và time-series buffer giữa các phòng thi khi chạy đa luồng. |
| **4** | **MediaPipe Landmarks (Face & Body)** | `Đã hoàn thành` | Tích hợp **MediaPipe Pose** (33 điểm xương cơ thể) chạy đồng thời với **Face Mesh** (đo góc quay đầu). Tự động ánh xạ landmarks tương ứng vào từng thí sinh (`tracked_persons`) thông qua so khớp tọa độ không gian. Vẽ khung xương cơ thể trực quan khi lưu bằng chứng vi phạm. |
| **5** | **Time-Series Buffer (Chuỗi thời gian)** | `Đã hoàn thành` | Đã xây dựng **Time-Series Buffer** (sliding window 30 frames/người) với `TimeSeriesManager` quản lý buffer riêng cho từng `track_id` đang thi. Cấu trúc `to_feature_tensor()` sẵn sàng export tensor shape `[seq_len, 24_features]` phục vụ việc tích hợp mạng LSTM (để lại Giai đoạn sau / Nâng cấp tương lai) mà không cần thay đổi cấu trúc dữ liệu nền tảng. |
| **6** | **LSTM Behavior Analysis (Nhận diện hành vi bằng LSTM)** | `Làm sau` | Tích hợp mô hình học sâu LSTM để nhận diện các chuỗi hành vi bất thường theo thời gian. Hiện tại được thay thế bằng phương pháp heuristic voting (bỏ phiếu) ở Bước 7 để tối ưu hiệu năng và tiến độ dự án. |
| **7** | **Behavior Analysis & Voting (Phân tích hành vi & Xác nhận sự kiện)** | `Đã hoàn thành` | Đã tích hợp **BehaviorAnalyzer** sử dụng thuật toán bỏ phiếu (voting) trên cửa sổ thời gian trượt 30 frames: phone_usage (≥60%), looking_away (≥70%), cheat_sheet (≥50%), face_missing (≥80%). Đã loại bỏ cơ chế cooldown để báo cáo vi phạm liên tục theo thời gian thực. |
| **8** | **Lưu bằng chứng & Gọi API Java (Save Evidence & Spring Boot API)** | `Đã hoàn thành` | Khi vi phạm được xác nhận ở Bước 7, hệ thống tự động chụp ảnh frame bằng chứng lưu vào thư mục `/evidence` của FastAPI và gọi REST API `POST /api/violations` của Spring Boot để lưu vào MySQL. Tích hợp cơ chế xác thực **API Key (X-API-KEY)** an toàn cho giao tiếp nội bộ, loại bỏ hoàn toàn việc đăng nhập người dùng (JWT) phức tạp. |
| **9** | **WebSocket Alert (Cảnh báo thời gian thực)** | `Đã hoàn thành` | Phản hồi thông tin vi phạm (bao gồm `image_url` và `imageUrl`) qua WebSocket về trang giám sát của Admin thời gian thực. Frontend hiển thị log đi kèm thumbnail ảnh bằng chứng và cho phép click xem full-size. |
| **10** | **Kết nối Thí sinh (UserPage.tsx Integration)** | `Đã hoàn thành` | Tích hợp thành công giao diện Mock Exam trong `UserPage.tsx`. Tự động bật camera thí sinh và stream frame ảnh qua WebSocket lên AI server sử dụng `examSessionCameraId` riêng của từng thí sinh để giám sát thời gian thực. Hiển thị cảnh báo trực quan bằng viền đỏ nhấp nháy và mô tả chi tiết lỗi vi phạm từ AI. |
| **11 (Làm cuối)** | **RTSP Input & Decode Adapter** | `Chưa hoàn thiện` | **Hiện tại:** Mới nhận ảnh Base64 từ WebSocket.<br>**Cần bổ sung ở Giai đoạn 2:** Viết bộ adapter nhận luồng camera IP trực tiếp qua giao thức RTSP bằng `cv2.VideoCapture("rtsp://...")`. |


---

## 3. Tiêu chí Nghiệm thu Định lượng (KPIs & Acceptance Criteria)

Để chứng minh năng lực của hệ thống bằng số liệu khoa học, dự án đặt ra các chỉ số nghiệm thu cụ thể sau:

### A. Độ chính xác của Mô hình AI (Model Quality)
Các thông số này được đánh giá trên tập dữ liệu kiểm thử (Test Dataset) chuẩn gồm 3 case mục tiêu:

* **Precision (Độ chính xác dự đoán vi phạm):** ≥ 85%
  *(Trong 100 lần AI báo vi phạm, có ít nhất 85 lần là vi phạm thật).*
* **Recall (Tỷ lệ phát hiện vi phạm):** ≥ 80%
  *(Trong 100 hành vi vi phạm xảy ra trước camera, AI phải phát hiện được ít nhất 80 hành vi).*
* **F1-Score (Chỉ số cân bằng giữa Precision và Recall):** ≥ 82.5%
* **False Positive Rate (Tỷ lệ báo động giả):** ≤ 10%
  *(Không được phép báo nhầm quá nhiều khi thí sinh đang làm bài bình thường).*

### B. Hiệu năng Hệ thống (Performance & Latency)
* **Tốc độ xử lý (Inference Speed):** ≥ 15 FPS trên mỗi luồng camera để đảm bảo mượt mà.
* **Tổng thời gian trễ đầu-cuối (End-to-End Latency):** ≤ 1.0 giây
  *(Thời điểm camera ghi hình vi phạm -> AI nhận -> AI xử lý -> Gọi API Java ghi nhận DB -> WebSocket gửi về giao diện Dashboard -> Giao diện sáng đèn đỏ phải dưới 1 giây).*

---

## 4. Kế hoạch Kiểm thử & Chứng minh Hiệu năng (Load & Stress Test)

Cuối tháng cần chứng minh khả năng đáp ứng mục tiêu **dưới 1 giây** dưới các điều kiện tải thực tế:

1. **Thử nghiệm Đơn luồng (1 Camera):**
   * Chạy hệ thống với 1 luồng webcam học sinh.
   * Sử dụng log timestamp ở từng chặng để đo thời gian xử lý:
     * **t_decode**: Thời gian giải mã frame ảnh.
     * **t_inference**: Thời gian mô hình AI (YOLO + Pose) xử lý.
     * **t_network**: Thời gian gọi REST API sang Spring Boot và phản hồi WebSocket đến Frontend.
2. **Thử nghiệm Đa luồng (Simultaneous Streams):**
   * Giả lập **3 luồng** và **5 luồng** camera RTSP hoạt động đồng thời gửi dữ liệu về AI Server.
   * Đo đạc xem CPU/GPU có bị quá tải không, FPS của từng luồng có bị tụt xuống dưới 10 FPS hay không và độ trễ phản hồi có bị vượt quá 1 giây hay không.
   * Báo cáo sẽ chỉ rõ giới hạn phần cứng hiện tại chịu tải được tối đa bao nhiêu luồng camera đồng thời mà vẫn giữ được độ trễ dưới 1 giây.

---

## 5. Chiến lược Phát triển & Từng bước Kiểm thử (Developer Strategy)

Để dự án đạt hiệu quả cao nhất và dễ dàng demo trước hội đồng chấm điểm trên một thiết bị duy nhất, chiến lược triển khai của lập trình viên sẽ được chia làm 2 giai đoạn:

### Giai đoạn 1: Phát triển luồng Webcam qua WebSockets (Hoàn thành trước)
* **Mục tiêu:** Xây dựng trọn vẹn luồng dữ liệu hai chiều và hoàn thiện lõi phân tích AI (YOLOv8 -> Tracking -> MediaPipe -> Voting/Heuristic -> Spring Boot DB, chuẩn bị sẵn cấu trúc cho LSTM ở giai đoạn sau).
* **Cách thực hiện:**
  * Sử dụng webcam tích hợp trên laptop/máy tính của lập trình viên.
  * **Trang kiểm thử (Phát triển & Debug):** Sử dụng trang **"Thử nghiệm AI Cam" (`/admin/camera-test`)** để mở camera local, vẽ overlay và gửi Base64 qua WebSocket lên Python AI Server, đồng thời nhận phản hồi để hiển thị kết quả đo lường và theo dõi các thông số phát hiện (Yaw/Pitch/Roll, Objects, Violations).
  * **Đồng bộ hóa cảnh báo:** Python AI Server sau khi nhận diện vi phạm sẽ tự động broadcast kết quả qua WebSocket đến tất cả các client đang mở (bao gồm cả màn hình giám sát phòng thi Admin `RealtimeMonitoringPage.tsx`).
  * **Tích hợp chính thức (Cuối cùng):** Sau khi toàn bộ các bước xử lý (YOLO, Tracking, Pose, Voting, DB) chạy trơn tru, chúng ta mới sao chép luồng gửi ảnh tự động này vào trang thi của Thí sinh (`UserPage.tsx`) để đưa vào vận hành thực tế.
* **Lý do lựa chọn:** Giúp quá trình phát triển diễn ra nhanh chóng, dễ dàng debug lỗi và có sẵn giao diện trực quan để demo cho hội đồng chấm mà không cần bất kỳ cài đặt phần cứng mạng nào.

### Giai đoạn 2: Tích hợp và Kiểm thử luồng RTSP (Hoàn thành sau)
* **Mục tiêu:** Chuyển đổi và cấu hình luồng nhận dữ liệu trực tiếp từ các camera vật lý thông qua giao thức RTSP.
* **Cách thực hiện:**
  * Viết thêm bộ adapter đầu vào cho Python AI để thay thế luồng nhận Base64 từ WebSocket bằng kết nối camera IP qua lệnh `cv2.VideoCapture("rtsp://...")`.
  * **Phương án giả lập:** Sử dụng chính điện thoại cá nhân (cài app phát RTSP như *IP Webcam* hoặc *RTSP Camera*) kết nối chung mạng Wifi nội bộ với máy tính để làm camera IP giả lập. Hoặc sử dụng công cụ *MediaMTX* để giả lập stream webcam máy tính thành link RTSP nội bộ.
  * Chạy stress test đa luồng (3 luồng và 5 luồng đồng thời) để đánh giá ngưỡng hiệu năng của server.

