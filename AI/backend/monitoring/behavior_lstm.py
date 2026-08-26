"""
LSTM Behavior Classifier Module

Định nghĩa kiến trúc mạng PyTorch LSTM để phân loại chuỗi hành vi của thí sinh
và wrapper phục vụ suy luận thời gian thực trong pipeline AI.
"""

import os
import torch
import torch.nn as nn
import numpy as np

# Danh sách các class hành vi tương ứng với nhãn đầu ra
CLASS_LABELS = {
    0: 'normal',
    1: 'phone_usage',
    2: 'looking_away',
    3: 'cheat_sheet',
    4: 'turning_around'
}

class BehaviorLSTM(nn.Module):
    """
    Mạng nơ-ron LSTM phân loại chuỗi thời gian đặc trưng (24 features).
    """
    def __init__(self, input_dim=24, hidden_dim=64, num_layers=2, num_classes=5):
        super(BehaviorLSTM, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_dim, 
            hidden_dim, 
            num_layers, 
            batch_first=True, 
            bidirectional=False
        )
        self.fc = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # Input shape: [batch_size, seq_len, input_dim]
        out, (hn, cn) = self.lstm(x)
        # Lấy output ở bước thời gian cuối cùng (last time step)
        out = out[:, -1, :]  # Shape: [batch_size, hidden_dim]
        logits = self.fc(out)  # Shape: [batch_size, num_classes]
        return logits


class BehaviorLSTMClassifier:
    """
    Wrapper chạy suy luận thời gian thực cho mô hình LSTM.
    Tải weights và chuyển đổi numpy input sang tensor PyTorch.
    """
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = BehaviorLSTM(input_dim=24, hidden_dim=64, num_layers=2, num_classes=5)
        self.model.to(self.device)
        self.model.eval()
        self.is_loaded = False
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, model_path):
        try:
            # Load weights
            checkpoint = torch.load(model_path, map_location=self.device)
            # Support both raw state_dict and dict containing state_dict
            if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            self.model.eval()
            self.is_loaded = True
            print(f"✅ Loaded Behavior LSTM weights successfully from {model_path} ({self.device})")
        except Exception as e:
            print(f"❌ Failed to load LSTM model from {model_path}: {e}")
            self.is_loaded = False

    def predict(self, feature_sequence: np.ndarray):
        """
        Dự đoán lớp hành vi cho một chuỗi đặc trưng.
        
        Args:
            feature_sequence (np.ndarray): numpy array shape [seq_len, 24]
            
        Returns:
            dict: {
                'class_idx': int,
                'class_name': str,
                'confidence': float,
                'probabilities': dict of {class_name: prob}
            }
        """
        if not self.is_loaded:
            return {
                'class_idx': 0,
                'class_name': 'normal',
                'confidence': 1.0,
                'probabilities': {label: 0.0 for label in CLASS_LABELS.values()}
            }
            
        # Thêm batch dimension: [1, seq_len, 24]
        if len(feature_sequence.shape) == 2:
            x = np.expand_dims(feature_sequence, axis=0)
        else:
            x = feature_sequence
            
        # Chuyển sang tensor
        x_tensor = torch.tensor(x, dtype=torch.float32).to(self.device)
        
        with torch.no_grad():
            logits = self.model(x_tensor)
            probabilities = torch.softmax(logits, dim=1).cpu().numpy()[0]
            
        pred_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[pred_idx])
        
        probs_dict = {
            CLASS_LABELS[i]: float(probabilities[i])
            for i in range(len(CLASS_LABELS))
        }
        
        return {
            'class_idx': pred_idx,
            'class_name': CLASS_LABELS[pred_idx],
            'confidence': confidence,
            'probabilities': probs_dict
        }
