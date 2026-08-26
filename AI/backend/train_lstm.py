"""
LSTM Training Script — train_lstm.py

Tự động tạo dữ liệu chuỗi thời gian đặc trưng giả lập chất lượng cao,
định nghĩa DataLoader, huấn luyện mô hình PyTorch LSTM và lưu trọng số.
"""

import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np

# Thêm thư mục hiện tại vào python path để import được behavior_lstm
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'monitoring'))
from behavior_lstm import BehaviorLSTM, CLASS_LABELS

# Tạo thư mục lưu weights nếu chưa có
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models'), exist_ok=True)

# Thiết lập seed để đảm bảo kết quả huấn luyện giống nhau
np.random.seed(42)
torch.manual_seed(42)


class SyntheticBehaviorDataset(Dataset):
    """
    Dataset tạo dữ liệu giả lập chuỗi 30 frames thời gian cho 5 loại hành vi.
    """
    def __init__(self, num_samples_per_class=800, seq_len=30):
        self.seq_len = seq_len
        self.num_classes = len(CLASS_LABELS)
        self.X = []
        self.y = []
        
        self.generate_data(num_samples_per_class)
        
    def generate_data(self, num_samples):
        for class_idx in range(self.num_classes):
            for _ in range(num_samples):
                seq = self.generate_single_sequence(class_idx)
                self.X.append(seq)
                self.y.append(class_idx)
                
        self.X = np.array(self.X, dtype=np.float32)
        self.y = np.array(self.y, dtype=np.int64)

    def generate_single_sequence(self, class_idx):
        # Khởi tạo ma trận chuỗi [seq_len, 24]
        seq = np.zeros((self.seq_len, 24), dtype=np.float32)
        
        # Thiết lập base landmarks cho tư thế ngồi bình thường trước camera
        # 9 key landmarks: nose, l_shoulder, r_shoulder, l_elbow, r_elbow, l_wrist, r_wrist, l_hip, r_hip
        # Key coordinate values (normalized [0,1])
        base_landmarks = {
            'nose': (0.5, 0.3),
            'left_shoulder': (0.6, 0.45),
            'right_shoulder': (0.4, 0.45),
            'left_elbow': (0.65, 0.65),
            'right_elbow': (0.35, 0.65),
            'left_wrist': (0.65, 0.8),
            'right_wrist': (0.35, 0.8),
            'left_hip': (0.58, 0.9),
            'right_hip': (0.42, 0.9)
        }
        
        # Danh sách keynames khớp với LANDMARK_INDICES trong time_series_buffer
        landmark_keys = [
            'nose', 'left_shoulder', 'right_shoulder', 
            'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 
            'left_hip', 'right_hip'
        ]

        # Sinh chuyển động cơ bản (tất cả classes đều xuất phát từ tư thế ngồi bình thường)
        for t in range(self.seq_len):
            # 1. Head Pose (Yaw, Pitch, Roll) với nhiễu nhẹ
            yaw = np.random.normal(0, 3.0)      # yaw
            pitch = np.random.normal(-5.0, 4.0) # pitch (hơi cúi nhẹ nhìn màn hình)
            roll = np.random.normal(0, 2.0)     # roll
            
            seq[t, 0] = yaw / 180.0
            seq[t, 1] = pitch / 180.0
            seq[t, 2] = roll / 180.0
            
            # 2. Key landmarks coords (x,y)
            col_idx = 3
            for name in landmark_keys:
                bx, by = base_landmarks[name]
                # Thêm jitter nhẹ
                jx = np.random.normal(0, 0.005)
                jy = np.random.normal(0, 0.005)
                seq[t, col_idx] = bx + jx
                seq[t, col_idx + 1] = by + jy
                col_idx += 2
                
            # 3. Object flags & Face visible mặc định
            seq[t, 21] = 0.0  # cell phone flag
            seq[t, 22] = 0.0  # book flag
            seq[t, 23] = 1.0  # face visible
            
        # Áp dụng thay đổi đặc trưng động dựa trên loại hành vi (class_idx)
        if class_idx == 0:
            # Class 0: Normal - Giữ nguyên tư thế chuẩn ngồi thi
            pass
            
        elif class_idx == 1:
            # Class 1: Phone usage
            # Điện thoại xuất hiện từ giữa sequence (ví dụ frame 10-15 trở đi)
            start_frame = np.random.randint(8, 15)
            for t in range(start_frame, self.seq_len):
                seq[t, 21] = 1.0  # Cell Phone Flag = 1.0
                
                # Cánh tay phải hoặc trái di chuyển lên gần mặt (nose coordinate: ~0.3)
                wrist_to_move = 'right_wrist' if np.random.rand() > 0.5 else 'left_wrist'
                wrist_col = 3 + landmark_keys.index(wrist_to_move) * 2
                elbow_col = wrist_col - 2
                
                # Nâng tay lên: giảm y-coord của wrist về gần 0.35 và elbow về 0.45
                seq[t, wrist_col] += np.random.normal(0.05 if wrist_to_move == 'right_wrist' else -0.05, 0.02)
                seq[t, wrist_col + 1] = 0.35 + np.random.normal(0, 0.02)
                seq[t, elbow_col + 1] = 0.45 + np.random.normal(0, 0.02)

        elif class_idx == 2:
            # Class 2: Looking away (Quay đầu)
            # Quay đầu sang trái/phải hoặc cúi xuống quá sâu ở cuối chuỗi
            start_frame = np.random.randint(8, 15)
            look_type = np.random.choice(['left', 'right', 'down', 'up'])
            
            for t in range(start_frame, self.seq_len):
                # Tăng dần góc quay đầu
                progress = (t - start_frame) / (self.seq_len - start_frame)
                
                if look_type == 'left':
                    seq[t, 0] = (-35.0 - np.random.uniform(5, 20)) / 180.0
                    # Nose lệch sang trái (giảm x coordinate)
                    seq[t, 3] -= 0.15 * progress
                elif look_type == 'right':
                    seq[t, 0] = (35.0 + np.random.uniform(5, 20)) / 180.0
                    # Nose lệch sang phải (tăng x coordinate)
                    seq[t, 3] += 0.15 * progress
                elif look_type == 'down':
                    seq[t, 1] = (-40.0 - np.random.uniform(5, 15)) / 180.0
                    seq[t, 4] += 0.1 * progress # Nose đi xuống
                elif look_type == 'up':
                    seq[t, 1] = (30.0 + np.random.uniform(5, 15)) / 180.0
                    seq[t, 4] -= 0.1 * progress # Nose đi lên

        elif class_idx == 3:
            # Class 3: Cheat sheet (Tài liệu cấm)
            start_frame = np.random.randint(8, 15)
            for t in range(start_frame, self.seq_len):
                seq[t, 22] = 1.0  # Book/Document Flag = 1.0
                # Thí sinh cúi đầu nhẹ xuống để đọc tài liệu
                seq[t, 1] = (-25.0 - np.random.uniform(5, 15)) / 180.0
                # Tay có thể hơi di chuyển về phía bàn (y tăng lên)
                seq[t, 15] = 0.85 + np.random.normal(0, 0.02) # Left wrist
                seq[t, 16] = 0.85 + np.random.normal(0, 0.02) # Right wrist

        elif class_idx == 4:
            # Class 4: Turning around (Quay người ra sau / ngồi nghiêng góc lớn)
            start_frame = np.random.randint(8, 15)
            turn_type = np.random.choice(['back', 'sideways'])
            
            for t in range(start_frame, self.seq_len):
                progress = (t - start_frame) / (self.seq_len - start_frame)
                
                if turn_type == 'back':
                    # Không nhìn thấy mặt nữa
                    seq[t, 23] = 0.0  # Face Visibility = 0.0
                    # Đổi vị trí 2 vai (l_shoulder x < r_shoulder x)
                    l_shoulder_x_col = 3 + landmark_keys.index('left_shoulder') * 2
                    r_shoulder_x_col = 3 + landmark_keys.index('right_shoulder') * 2
                    # Gán l_shoulder x = 0.4 (bình thường là 0.6) và r_shoulder x = 0.6 (bình thường là 0.4)
                    seq[t, l_shoulder_x_col] = 0.4 + np.random.normal(0, 0.01)
                    seq[t, r_shoulder_x_col] = 0.6 + np.random.normal(0, 0.01)
                else:
                    # Ngồi nghiêng (Sideways): Khoảng cách vai thu hẹp cực kỳ nhỏ
                    l_shoulder_x_col = 3 + landmark_keys.index('left_shoulder') * 2
                    r_shoulder_x_col = 3 + landmark_keys.index('right_shoulder') * 2
                    # Chiều rộng vai co lại dưới 35% chiều dọc
                    seq[t, l_shoulder_x_col] = 0.52 + np.random.normal(0, 0.01)
                    seq[t, r_shoulder_x_col] = 0.48 + np.random.normal(0, 0.01)

        return seq

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


def train_model():
    print("⏳ Creating synthetic proctoring dataset...")
    train_dataset = SyntheticBehaviorDataset(num_samples_per_class=1000)
    val_dataset = SyntheticBehaviorDataset(num_samples_per_class=200)
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🖥️ Using device: {device}")
    
    # Khởi tạo model
    model = BehaviorLSTM(input_dim=24, hidden_dim=64, num_layers=2, num_classes=5)
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    
    epochs = 15
    print(f"🚀 Starting training for {epochs} epochs...")
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total_train += targets.size(0)
            correct_train += predicted.eq(targets).sum().item()
            
        epoch_loss = running_loss / len(train_loader.dataset)
        train_acc = 100.0 * correct_train / total_train
        
        # Validation
        model.eval()
        correct_val = 0
        total_val = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                total_val += targets.size(0)
                correct_val += predicted.eq(targets).sum().item()
                
        val_acc = 100.0 * correct_val / total_val
        
        print(f"Epoch {epoch+1:02d}/{epochs:02d} | Train Loss: {epoch_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")
        
    # Đánh giá chi tiết trên Validation set
    model.eval()
    all_preds = []
    all_targets = []
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            all_preds.extend(predicted.cpu().numpy())
            all_targets.extend(targets.numpy())
            
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    
    print("\n📊 Final Evaluation Matrix (Recall per class):")
    for i in range(len(CLASS_LABELS)):
        class_mask = (all_targets == i)
        class_correct = np.sum((all_preds == i) & class_mask)
        class_total = np.sum(class_mask)
        recall = class_correct / class_total * 100.0
        print(f" - Class {i} ({CLASS_LABELS[i]}): {recall:.1f}% ({class_correct}/{class_total})")
        
    # Lưu weights
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    model_path = os.path.join(model_dir, 'behavior_lstm.pth')
    
    # Save the whole state dict
    torch.save(model.state_dict(), model_path)
    print(f"\n💾 Saved model weights to: {model_path}")
    
    # Chạy thử suy luận mẫu trên 1 numpy array để verify
    from behavior_lstm import BehaviorLSTMClassifier
    classifier = BehaviorLSTMClassifier(model_path)
    test_seq = np.random.rand(30, 24).astype(np.float32)
    res = classifier.predict(test_seq)
    print(f"🧪 Test inference on random sequence: Predicted class = '{res['class_name']}' (confidence = {res['confidence']:.3f})")
    
if __name__ == '__main__':
    train_model()
