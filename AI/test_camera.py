import sys
import os
import time
import cv2
import numpy as np

# Add backend to path so we can import monitoring modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from monitoring.face_detector import FaceDetectorWrapper
from monitoring.head_pose_estimator import HeadPoseEstimator
from monitoring.object_detector import ObjectDetector
from monitoring.violation_detector import ViolationDetectorV2
from monitoring.pose_detector import PoseDetectorWrapper

# Cấu hình chế độ giám sát: 
# True = OFFLINE (phòng thi nhiều người, dùng Pose check quay người/lưng)
# False = ONLINE (1 người trước webcam, dùng Face Mesh check quay đầu)
OFFLINE_MODE = True

def main():
    print("=" * 60)
    print("🎥 KHỞI ĐỘNG WEBCAM KIỂM THỬ TRỰC TIẾP (OFFLINE)")
    print("=" * 60)
    print("Đang khởi tạo các mô hình AI (YOLOv8, MediaPipe Face & Pose)... Vui lòng đợi...")

    # Khởi tạo các components
    face_detector = FaceDetectorWrapper()
    head_pose_estimator = HeadPoseEstimator()
    object_detector = ObjectDetector()
    pose_detector = PoseDetectorWrapper()
    violation_detector = ViolationDetectorV2(buffer_size=30, stale_timeout=30.0)
    violation_detector.behavior_analyzer.offline_mode = OFFLINE_MODE

    print("✅ Đã khởi tạo xong các mô hình AI.")
    print("Đang kết nối tới Webcam...")

    # Thử mở camera mặc định (0)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ LỖI: Không thể mở Webcam. Vui lòng kiểm tra lại kết nối camera.")
        return

    print("\n🎥 Webcam đã được bật thành công!")
    print("👉 Nhấn 'q' hoặc phím 'ESC' trên cửa sổ camera để THOÁT.")
    print("=" * 60)

    prev_time = 0
    show_gui = True

    if show_gui:
        try:
            cv2.namedWindow("AI Monitor - Webcam Live Test", cv2.WINDOW_NORMAL)
            cv2.resizeWindow("AI Monitor - Webcam Live Test", 1024, 768)
        except Exception:
            pass

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Lỗi: Không nhận được dữ liệu từ camera.")
            break

        timestamp = int(time.time() * 1000)
        fh, fw = frame.shape[:2]

        # 1. Phát hiện khuôn mặt
        faces = face_detector.detect_faces(frame)
        face_count = len(faces)

        # 2. Ước lượng hướng đầu (Face Mesh)
        head_poses = head_pose_estimator.estimate_poses(frame)

        # 3. Ước lượng xương khớp body (MediaPipe Pose)
        body_poses = pose_detector.detect_poses(frame)

        # 4. Kiểm tra độ sáng trung bình
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray) / 255.0 * 100)

        # 5. Phát hiện objects YOLOv8
        objects = object_detector.detect_objects(frame)

        # Trích xuất danh sách persons. Gán ID tạm thời nếu ByteTrack chưa kịp gán để test offline luôn mượt
        tracked_persons = []
        person_idx = 0
        for obj in objects:
            if obj['class_name'] == 'person':
                person_idx += 1
                p_copy = obj.copy()
                if p_copy['track_id'] == -1:
                    p_copy['track_id'] = person_idx
                tracked_persons.append(p_copy)

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
                min_d = float('inf')
                for bp in body_poses:
                    cx, cy = bp['center_pixel']
                    dist = (cx - p_center[0])**2 + (cy - p_center[1])**2
                    if dist < min_d:
                        min_d = dist
                        matching_pose = bp
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

        # 6. Kiểm tra vi phạm
        violations = violation_detector.check_violations(
            tracked_persons=tracked_persons,
            face_count=face_count,
            brightness=brightness,
            objects=objects,
            timestamp=timestamp
        )

        # ----------------------------------------------------
        # Vẽ Overlay trực quan lên ảnh
        # ----------------------------------------------------
        annotated_frame = frame.copy()

        # Vẽ xương khớp body từ MediaPipe
        annotated_frame = pose_detector.draw_poses(annotated_frame, body_poses)

        # Vẽ boxes khuôn mặt
        for face in faces:
            x, y, w, h = face['bbox']
            x = max(0, min(x, fw - 1))
            y = max(0, min(y, fh - 1))
            w = max(1, min(w, fw - x))
            h = max(1, min(h, fh - y))
            cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), (255, 100, 0), 2)
            cv2.putText(annotated_frame, f"Face: {face['confidence']:.2f}", (x, y - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)

        # Vẽ boxes các objects từ YOLOv8
        for obj in objects:
            ox, oy, ow, oh = obj['bbox']
            ox = max(0, min(ox, fw - 1))
            oy = max(0, min(oy, fh - 1))
            ow = max(1, min(ow, fw - ox))
            oh = max(1, min(oh, fh - oy))
            color = (0, 0, 255) if obj['class_name'] in ['cell phone', 'book'] else (0, 255, 0)
            cv2.rectangle(annotated_frame, (ox, oy), (ox + ow, oy + oh), color, 2)
            cv2.putText(annotated_frame, f"{obj['class_name']} ({obj.get('track_id', -1)})", (ox, oy - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Tính FPS
        curr_time = time.time()
        fps = 1.0 / (curr_time - prev_time) if prev_time != 0 else 0
        prev_time = curr_time

        # Vẽ hình nền mờ cho vùng thông số debug (Dashboard ở góc trái - thu gọn lại)
        cv2.rectangle(annotated_frame, (5, 5), (280, 160), (0, 0, 0), -1)
        # Thêm độ trong suốt nhẹ bằng cách blend ảnh gốc với hộp đen
        alpha = 0.5
        cv2.addWeighted(annotated_frame, alpha, frame, 1 - alpha, 0, frame)
        # Vẽ lại viền sau khi blend
        cv2.rectangle(annotated_frame, (5, 5), (280, 160), (255, 255, 255), 1)

        # Vẽ text thông số cơ bản (fontScale=0.4 cho nhỏ gọn)
        cv2.putText(annotated_frame, f"FPS: {fps:.1f} | Brightness: {brightness:.1f}%", (15, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        
        yaw, pitch = 0.0, 0.0
        if tracked_persons:
            p0 = tracked_persons[0]
            yaw = p0['head_pose']['yaw']
            pitch = p0['head_pose']['pitch']
        cv2.putText(annotated_frame, f"Head Yaw: {yaw:.1f} | Pitch: {pitch:.1f}", (15, 38), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)

        # --- Bảng Voting của Time-Series Buffer ---
        cv2.putText(annotated_frame, "Voting Ratios (30f window):", (15, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Lấy dữ liệu buffer của thí sinh được track đầu tiên để hiển thị tỉ lệ vote trực quan
        if tracked_persons:
            tid = tracked_persons[0]['track_id']
            buffer_obj = violation_detector.ts_manager.get_buffer(tid)
            if buffer_obj:
                window = buffer_obj.get_window()
                total_frames = len(window)
                
                # Tính các tỉ lệ vote
                phone_count = sum(1 for f in window if 'cell phone' in f.get('objects_nearby', []))
                book_count = sum(1 for f in window if 'book' in f.get('objects_nearby', []))
                
                look_away_count = 0
                turning_around_count = 0
                for f in window:
                    # 1. Check quay đầu (Face Mesh)
                    hp = f.get('head_pose', {})
                    fyaw = hp.get('yaw', 0.0)
                    fpitch = hp.get('pitch', 0.0)
                    if abs(fyaw) > 30.0 or fpitch > 25.0 or fpitch < -35.0:
                        look_away_count += 1
                    
                    # 2. Check quay người (Pose landmarks)
                    kl = f.get('key_landmarks', {})
                    ls = kl.get('left_shoulder', (0.0, 0.0))
                    rs = kl.get('right_shoulder', (0.0, 0.0))
                    lh = kl.get('left_hip', (0.0, 0.0))
                    rh = kl.get('right_hip', (0.0, 0.0))
                    if ls != (0.0, 0.0) and rs != (0.0, 0.0) and lh != (0.0, 0.0) and rh != (0.0, 0.0):
                        is_back = ls[0] < rs[0]
                        s_w = abs(ls[0] - rs[0])
                        t_h = abs((ls[1] + rs[1])/2 - (lh[1] + rh[1])/2)
                        is_side = (s_w / t_h < 0.35) if t_h > 0.01 else False
                        if is_back or is_side:
                            turning_around_count += 1
                        
                phone_pct = (phone_count / total_frames * 100) if total_frames > 0 else 0
                look_pct = (look_away_count / total_frames * 100) if total_frames > 0 else 0
                turning_pct = (turning_around_count / total_frames * 100) if total_frames > 0 else 0
                book_pct = (book_count / total_frames * 100) if total_frames > 0 else 0
                
                # Hiển thị trực quan tỉ lệ và tình trạng
                phone_color = (0, 0, 255) if phone_pct >= 60 else (0, 255, 0)
                look_color = (0, 0, 255) if look_pct >= 70 else (0, 255, 0)
                turning_color = (0, 0, 255) if turning_pct >= 50 else (0, 255, 0)
                book_color = (0, 0, 255) if book_pct >= 50 else (0, 255, 0)
                
                cv2.putText(annotated_frame, f"1. Phone: {phone_count}/{total_frames} ({phone_pct:.0f}%) [Req: 60%]", (15, 78), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, phone_color, 1)
                if OFFLINE_MODE:
                    cv2.putText(annotated_frame, f"2. Turn Around: {turning_around_count}/{total_frames} ({turning_pct:.0f}%) [Req: 50%]", (15, 98), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.38, turning_color, 1)
                else:
                    cv2.putText(annotated_frame, f"2. Look Away: {look_away_count}/{total_frames} ({look_pct:.0f}%) [Req: 70%]", (15, 98), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.38, look_color, 1)
                cv2.putText(annotated_frame, f"3. Cheat Sheet: {book_count}/{total_frames} ({book_pct:.0f}%) [Req: 50%]", (15, 118), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, book_color, 1)
                cv2.putText(annotated_frame, f"Buffer Active Length: {total_frames}/30 frames", (15, 138), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, (200, 200, 200), 1)
        else:
            cv2.putText(annotated_frame, "No person tracked in camera.", (15, 85), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 0, 255), 1)

        # Vẽ Banner đỏ cảnh báo nếu phát hiện vi phạm
        if violations:
            violation = violations[0]
            v_type = violation['type']
            v_conf = violation.get('confidence', 1.0)
            v_desc = violation['details'].get('description', '')
            
            # Đè một banner đỏ nổi bật ở dưới cùng hoặc trên cùng
            cv2.rectangle(annotated_frame, (0, fh - 50), (fw, fh), (0, 0, 255), -1)
            cv2.putText(annotated_frame, f"VIOLATION: {v_type.upper()} ({v_conf*100:.0f}%)", (10, fh - 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(annotated_frame, v_desc, (10, fh - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
            
            # Print lỗi ra console
            print(f"⚠️ [{time.strftime('%H:%M:%S')}] VI PHẠM: {v_type} | Chi tiết: {v_desc}")

        # Hiển thị giao diện cửa sổ camera
        if show_gui:
            try:
                cv2.imshow("AI Monitor - Webcam Live Test", annotated_frame)
            except Exception as e:
                print("⚠️ Cảnh báo: Môi trường không hỗ trợ mở giao diện GUI (Headless OS).")
                print("Chế độ chỉ hiển thị Log vi phạm trên Terminal đã được kích hoạt.")
                show_gui = False

        # Phím thoát 'q' hoặc ESC
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            break

    cap.release()
    try:
        cv2.destroyAllWindows()
    except Exception:
        pass
    print("=" * 60)
    print("🔌 Đã tắt camera và đóng chương trình kiểm thử.")
    print("=" * 60)

if __name__ == '__main__':
    main()
