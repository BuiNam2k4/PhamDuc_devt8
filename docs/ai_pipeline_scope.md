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
RTSP (Camera) -> Giải mã -> YOLOv8 -> Tracking -> MediaPipe Pose -> Chuỗi thời gian -> LSTM -> Xác nhận sự kiện -> Lưu bằng chứng -> WebSocket

### Bảng so sánh Hiện trạng (Đã làm được vs Chưa làm được)

| Bước trong Pipeline | Trạng thái hiện tại | Chi tiết kỹ thuật đã có / Cần bổ sung |
| :--- | :--- | :--- |
| **1. RTSP Input & Decode** | `Chưa hoàn thiện` | **Hiện tại:** Nhận ảnh Base64 kịch bản webcam gửi qua WebSocket.<br>**Cần bổ sung:** Code kết nối luồng RTSP trực tiếp bằng `cv2.VideoCapture("rtsp://...")` đối với camera phòng thi. |
| **2. YOLOv8 Detection** | `Đã hoàn thành` | Tích hợp thành công **YOLOv8 Nano (`yolov8n.pt`)** để nhận diện các vật thể mục tiêu: người, điện thoại, sách/vở, máy tính, v.v. |
| **3. Multi-Person Tracking** | `Chưa có` | **Hiện tại:** Phân tích từng frame độc lập, không giữ được danh tính (ID) của người thi.<br>**Cần bổ sung:** Tích hợp bộ theo vết **ByteTrack** hoặc **SORT** để gán ID cố định cho từng thí sinh. |
| **4. MediaPipe Pose** | `Chưa có` | **Hiện tại:** Chỉ dùng FaceMesh để tính góc đầu.<br>**Cần bổ sung:** Sử dụng **MediaPipe Pose** trích xuất 33 điểm landmarks xương cơ thể để phục vụ việc nhận diện cử chỉ tay/thân người. |
| **5. Time-Series Buffer** | `Chưa có` | **Hiện tại:** Chưa lưu trữ lịch sử frame cũ.<br>**Cần bổ sung:** Xây dựng hàng đợi (Queue) lưu chuỗi landmarks dài 30-50 frames cho mỗi ID thí sinh. |
| **6. LSTM Classifier** | `Chưa có` | **Hiện tại:** Dùng các ngưỡng tĩnh (threshold) thô sơ để phạt vi phạm tức thời.<br>**Cần bổ sung:** Load model mạng hồi quy LSTM đã huấn luyện để phân loại chuỗi hành động động từ chuỗi thời gian keypoints. |
| **7. Xác nhận sự kiện** | `Đã có một phần` | **Hiện tại:** Dựa trên thời gian vi phạm tích lũy liên tục (ví dụ: quay đầu quá 2s).<br>**Cần sửa đổi:** Bỏ cơ chế cooldown cố định 5 giây (để tránh bỏ lọt vi phạm) và thay thế bằng thuật toán bỏ phiếu (voting) trên cửa sổ thời gian (sliding window) của LSTM để xác thực sự kiện. |
| **8. Lưu bằng chứng** | `Chưa có` | **Hiện tại:** Chỉ lưu log tạm trong RAM của Python.<br>**Cần bổ sung:** Chụp frame vi phạm, lưu vào folder `evidence/` và viết HTTP client gọi REST API `POST /api/violations` sang Java Spring Boot để ghi nhận DB. |
| **9. WebSocket Alert** | `Đã hoàn thành` | Phát tín hiệu JSON chứa thông tin vi phạm theo thời gian thực về Frontend qua kênh WebSocket để hiển thị tức thời lên Dashboard. |

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
     * **t_inference**: Thời gian mô hình AI (YOLO + Pose + LSTM) xử lý.
     * **t_network**: Thời gian gọi REST API sang Spring Boot và phản hồi WebSocket đến Frontend.
2. **Thử nghiệm Đa luồng (Simultaneous Streams):**
   * Giả lập **3 luồng** và **5 luồng** camera RTSP hoạt động đồng thời gửi dữ liệu về AI Server.
   * Đo đạc xem CPU/GPU có bị quá tải không, FPS của từng luồng có bị tụt xuống dưới 10 FPS hay không và độ trễ phản hồi có bị vượt quá 1 giây hay không.
   * Báo cáo sẽ chỉ rõ giới hạn phần cứng hiện tại chịu tải được tối đa bao nhiêu luồng camera đồng thời mà vẫn giữ được độ trễ dưới 1 giây.

---

## 5. Chiến lược Phát triển & Từng bước Kiểm thử (Developer Strategy)

Để dự án đạt hiệu quả cao nhất và dễ dàng demo trước hội đồng chấm điểm trên một thiết bị duy nhất, chiến lược triển khai của lập trình viên sẽ được chia làm 2 giai đoạn:

### Giai đoạn 1: Phát triển luồng Webcam qua WebSockets (Hoàn thành trước)
* **Mục tiêu:** Xây dựng trọn vẹn luồng dữ liệu hai chiều và hoàn thiện lõi phân tích AI (YOLOv8 -> Tracking -> MediaPipe -> LSTM -> Spring Boot DB).
* **Cách thực hiện:**
  * Sử dụng webcam tích hợp trên laptop/máy tính của lập trình viên.
  * Phía React Frontend sẽ chụp frame ảnh từ webcam, mã hóa thành chuỗi Base64 và liên tục gửi qua WebSocket tới cổng `ws://localhost:8000/ws` của Python AI.
  * Phía Python AI nhận chuỗi Base64, decode ra mảng pixel thông thường để chạy thử nghiệm và tối ưu hóa model nhận diện.
* **Lý do lựa chọn:** Giúp quá trình phát triển diễn ra nhanh chóng, dễ dàng debug lỗi và có sẵn giao diện trực quan để demo cho hội đồng chấm mà không cần bất kỳ cài đặt phần cứng mạng nào.

### Giai đoạn 2: Tích hợp và Kiểm thử luồng RTSP (Hoàn thành sau)
* **Mục tiêu:** Chuyển đổi và cấu hình luồng nhận dữ liệu trực tiếp từ các camera vật lý thông qua giao thức RTSP.
* **Cách thực hiện:**
  * Viết thêm bộ adapter đầu vào cho Python AI để thay thế luồng nhận Base64 từ WebSocket bằng kết nối camera IP qua lệnh `cv2.VideoCapture("rtsp://...")`.
  * **Phương án giả lập:** Sử dụng chính điện thoại cá nhân (cài app phát RTSP như *IP Webcam* hoặc *RTSP Camera*) kết nối chung mạng Wifi nội bộ với máy tính để làm camera IP giả lập. Hoặc sử dụng công cụ *MediaMTX* để giả lập stream webcam máy tính thành link RTSP nội bộ.
  * Chạy stress test đa luồng (3 luồng và 5 luồng đồng thời) để đánh giá ngưỡng hiệu năng của server.

