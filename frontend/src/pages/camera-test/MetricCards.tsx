import React from 'react';
import { Sparkles, Compass, Camera } from 'lucide-react';

interface DetectedObject {
  class_name: string;
  class_id: number;
  confidence: number;
  bbox: [number, number, number, number];
  center: [number, number];
  area: number;
}

interface MetricCardsProps {
  faceCount: number;
  headPose: { yaw: number; pitch: number; roll: number };
  detectedObjects: DetectedObject[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  faceCount,
  headPose,
  detectedObjects
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Face Count */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số khuôn mặt</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold ${
            faceCount === 1 ? 'text-emerald-400' :
            faceCount === 0 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {faceCount}
          </span>
          <span className="text-xs text-slate-500">mặt</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-snug">
          {faceCount === 1 ? 'Hợp lệ: Phát hiện chính xác 1 thí sinh.' :
           faceCount === 0 ? 'Cảnh báo: Không phát hiện thí sinh.' :
           'Cảnh báo: Có hơn 1 người trong khung hình.'}
        </p>
      </div>

      {/* Metric 2: Head Pose Angles */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hướng nhìn đầu</span>
          <Compass className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between font-mono">
            <span className="text-slate-400">Quay Trái/Phải (Yaw):</span>
            <span className={`font-bold ${Math.abs(headPose.yaw) > 25 ? 'text-red-400' : 'text-slate-200'}`}>
              {headPose.yaw > 0 ? '+' : ''}{headPose.yaw.toFixed(1)}°
            </span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-slate-400">Cúi/Ngửa (Pitch):</span>
            <span className={`font-bold ${Math.abs(headPose.pitch) > 20 ? 'text-red-400' : 'text-slate-200'}`}>
              {headPose.pitch > 0 ? '+' : ''}{headPose.pitch.toFixed(1)}°
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 leading-snug">
          Ngưỡng vi phạm: Quay Trái/Phải &gt; 25° hoặc Cúi/Ngửa &gt; 20° trong 2 giây liên tiếp.
        </p>
      </div>

      {/* Metric 3: Objects Detected */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vật thể phát hiện</span>
          <Camera className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
          {detectedObjects.length === 0 ? (
            <span className="text-xs text-slate-500 italic">Không có vật thể...</span>
          ) : (
            detectedObjects.map((obj, idx) => {
              const isSuspicious = ['cell phone', 'book', 'laptop'].includes(obj.class_name);
              return (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isSuspicious
                      ? 'bg-red-950/60 text-red-300 border-red-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {obj.class_name} ({Math.round(obj.confidence * 100)}%)
                </span>
              );
            })
          )}
        </div>
        <p className="text-[10px] text-slate-500 leading-snug">
          Phát hiện các vật phẩm cấm thi: Điện thoại (cell phone), Sách vở (book), Máy tính (laptop).
        </p>
      </div>
    </div>
  );
};
