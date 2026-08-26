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

## 3. Chi tiết Thuật toán Chuỗi thời gian & Phân tích Hành vi (Time-Series Buffer & Behavior Voting)

Hệ thống sử dụng cơ chế **Chuỗi thời gian (Time-Series Buffer)** kết hợp với **Thuật toán bỏ phiếu (Heuristic Voting)** trên cửa sổ trượt (Sliding Window) để khắc phục nhược điểm của việc đánh giá trên từng khung hình đơn lẻ (thường dẫn đến báo động giả do nhiễu vật thể hoặc chuyển động nhất thời).

### A. Thông số Kỹ thuật & Cấu hình Buffer (`TimeSeriesManager` & `PersonTimeSeriesBuffer`)
* **Kích thước cửa sổ trượt (Sliding Window Size - $W$):** Cố định ở **30 frames** (tương đương khoảng $1.5 - 2.0$ giây hoạt động thực tế với camera tốc độ $15 - 20$ FPS).
* **Ngưỡng tối thiểu để phân tích (`min_frames_required`):** **10 frames**. AI sẽ không đưa ra bất kỳ phán đoán nào nếu dữ liệu trong buffer tích lũy chưa đạt 10 frames (tránh trường hợp dữ liệu ban đầu chưa ổn định).
* **Thời gian dọn dẹp bộ nhớ (`stale_timeout`):** **30.0 giây**. Nếu một thí sinh (`track_id`) biến mất khỏi khung hình quá 30 giây, buffer chuỗi thời gian của thí sinh đó sẽ được tự động giải phóng để tiết kiệm RAM.

### B. Định dạng Tensor Đặc trưng (Feature Tensor for LSTM Integration)
Để chuẩn bị sẵn sàng cho việc tích hợp mô hình học sâu LSTM trong tương lai mà không cần thay đổi kiến trúc dữ liệu nền tảng, hàm `to_feature_tensor()` chuyển đổi buffer 30 frames thành một tensor có kích thước **`[seq_len, 24]`** ($seq\_len \le 30$). Mỗi frame được biểu diễn bằng một vector đặc trưng gồm **24 chiều (features)** như sau:

| Chỉ số cột (Index) | Tên Đặc trưng | Kiểu Dữ liệu / Khoảng giá trị | Giải thích chi tiết |
| :--- | :--- | :--- | :--- |
| **`[0 - 2]`** | **Head Pose** | Float, $[-1.0, 1.0]$ | Các góc quay đầu: **Yaw**, **Pitch**, **Roll**. Được chia cho `180.0` để chuẩn hóa (normalize) về khoảng $[-1.0, 1.0]$. |
| **`[3 - 20]`** | **Key Landmarks** | Float, $[0.0, 1.0]$ | Tọa độ $(x, y)$ của **9 điểm xương/khuôn mặt cốt lõi** từ MediaPipe Pose (tổng cộng 18 giá trị). Đã được MediaPipe chuẩn hóa theo kích thước khung hình.<br>Danh sách điểm: `nose` (0), `left_shoulder` (11), `right_shoulder` (12), `left_elbow` (13), `right_elbow` (14), `left_wrist` (15), `right_wrist` (16), `left_hip` (23), `right_hip` (24). |
| **`[21]`** | **Cell Phone Flag** | Float, $\{0.0, 1.0\}$ | Nhận giá trị `1.0` nếu YOLOv8 phát hiện vật thể `cell phone` ở gần thí sinh trong frame, ngược lại nhận `0.0`. |
| **`[22]`** | **Book/Document Flag**| Float, $\{0.0, 1.0\}$ | Nhận giá trị `1.0` nếu YOLOv8 phát hiện vật thể `book` (tài liệu/sách) ở gần thí sinh trong frame, ngược lại nhận `0.0`. |
| **`[23]`** | **Face Visibility Flag**| Float, $\{0.0, 1.0\}$ | Nhận giá trị `1.0` nếu Face Mesh phát hiện được khuôn mặt, nhận `0.0` nếu bị mất dấu khuôn mặt (ví dụ: bị che mặt). |

### C. Quy tắc Bỏ phiếu & Điều kiện Kích hoạt Vi phạm (Behavior Voting Logic)
Với mỗi frame mới được thêm vào buffer, lớp `BehaviorAnalyzer` thực hiện duyệt qua cửa sổ trượt $W$ (tối đa 30 frames gần nhất) và tính toán tỷ lệ vi phạm ($Ratio = \frac{Count_{vi\_pham}}{W}$). Sự kiện vi phạm chỉ được xác nhận và đẩy lên server backend khi thỏa mãn **đồng thời 2 điều kiện**:
1. **Điều kiện chuỗi thời gian:** Tỷ lệ $Ratio \ge Ngưỡng\_Voting$ tương ứng của hành vi đó.
2. **Điều kiện tức thời (Last Frame Verification):** Hành vi vi phạm vẫn đang tiếp diễn ở khung hình hiện tại (khung hình cuối cùng trong window). Điều này cực kỳ quan trọng để đảm bảo bức ảnh bằng chứng chụp lại (snapshot) chứa hình ảnh trực quan rõ ràng của lỗi đó.

Dưới đây là chi tiết các ngưỡng số liệu cụ thể cho từng loại hành vi:

#### 1. Sử dụng Điện thoại Di động (`phone_usage`)
* **Ngưỡng Voting:** **$\ge 60\%$** (ít nhất 18 trong 30 frames gần nhất phát hiện thấy điện thoại).
* **Logic chi tiết:** 
  * Điều kiện frame đơn lẻ: Vật thể `cell phone` nằm trong danh sách các vật thể ở gần thí sinh.
  * Phán quyết: $Ratio = \frac{Frames\_chứa\_phone}{Total\_frames\_in\_window} \ge 0.60$.
  * Điều kiện bổ sung: Frame hiện tại buộc phải chứa `cell phone` để làm bằng chứng chụp ảnh.

#### 2. Quay đầu Bất thường (`looking_away` - Chế độ Online)
* **Ngưỡng Voting:** **$\ge 70\%$** (ít nhất 21 trong 30 frames gần nhất phát hiện quay đầu bất thường).
* **Ngưỡng góc giới hạn (Degrees):**
  * **Yaw (Xoay trái/phải):** $> 30.0^\circ$ hoặc $< -30.0^\circ$.
  * **Pitch (Ngước lên):** $> 25.0^\circ$.
  * **Pitch (Cúi xuống):** $< -35.0^\circ$ (thiết lập sâu hơn để tránh báo sai khi thí sinh cúi xuống nháp hoặc đọc đề bài).
* **Đo tốc độ chuyển động đầu (Angular Velocity):**
  * Tính bằng trung bình độ lệch góc Yaw tuyệt đối giữa các frame liên tiếp: $Velocity_{avg} = \frac{1}{N-1} \sum_{i=1}^{N-1} |Yaw_i - Yaw_{i-1}|$.
  * Nếu tốc độ chuyển động đột ngột vượt quá ngưỡng **$15.0^\circ/\text{frame}$**, hệ thống ghi nhận đây là chuyển động xoay đầu cực nhanh và bất thường.
* **Phán quyết:** Tỷ lệ số frame có góc xoay vượt ngưỡng $\ge 70\%$, và frame hiện tại thí sinh vẫn đang trong trạng thái xoay đầu.

#### 3. Tài liệu/Vật thể cấm trên Bàn thi (`cheat_sheet`)
* **Ngưỡng Voting:** **$\ge 50\%$** (ít nhất 15 trong 30 frames gần nhất phát hiện thấy tài liệu).
* **Logic chi tiết:**
  * Điều kiện frame đơn lẻ: Vật thể `book` nằm trong danh sách các vật thể ở gần thí sinh.
  * Phán quyết: $Ratio = \frac{Frames\_chứa\_book}{Total\_frames\_in\_window} \ge 0.50$, và frame cuối cùng vẫn phát hiện thấy `book`.

#### 4. Quay người ra sau / Tư thế ngồi bất thường (`turning_around` - Chế độ Offline)
* **Ngưỡng Voting:** **$\ge 50\%$** (ít nhất 15 trong 30 frames gần nhất phát hiện tư thế bất thường).
* **Logic phân tích tư thế qua Landmarks xương:**
  * **Quay lưng về phía camera (Back-to-camera):** Phát hiện khi không thấy mặt (`face_visible == False`) kết hợp so sánh tọa độ trục X giữa vai trái (`left_shoulder`) và vai phải (`right_shoulder`).
    * *Hiệu chuẩn động camera đối xứng (Mirrored stream auto-calibration):* Khi yaw $< 15.0^\circ$ (nhìn thẳng), hệ thống tự động xác định luồng camera có bị lật gương hay không. Nếu bị lật gương (mirrored), tư thế quay lưng thỏa mãn: $x_{vai\_trai} > x_{vai\_phai}$. Nếu không lật gương, thỏa mãn: $x_{vai\_trai} < x_{vai\_phai}$.
  * **Quay nghiêng người góc lớn (Sideways):** Đo tỷ số giữa chiều ngang vai (`shoulder_width = |x_{vai\_trai} - x_{vai\_phai}|`) và chiều dọc cơ thể (`torso_height = |y_{trung\_binh\_vai} - y_{trung\_binh\_hông}|`).
    * Tư thế quay nghiêng được xác định khi: $\frac{Shoulder\_width}{Torso\_height} < 0.35$ (tức là vai co hẹp lại dưới 35% so với chiều dài thân khi nhìn nghiêng).

#### 5. Mất Khuôn mặt / Che Camera (`face_missing` - Tắt mặc định / Bật khi cần)
* **Ngưỡng Voting:** **$\ge 80\%$** (ít nhất 24 trong 30 frames gần nhất không tìm thấy khuôn mặt).
* **Logic chi tiết:** Phát hiện khi camera bị che khuất hoặc thí sinh rời khỏi vùng quan sát của camera.

---

## 4. Tiêu chí Nghiệm thu Định lượng (KPIs & Acceptance Criteria)

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

## 5. Kế hoạch Kiểm thử & Chứng minh Hiệu năng (Load & Stress Test)

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

## 6. Chiến lược Phát triển & Từng bước Kiểm thử (Developer Strategy)

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

