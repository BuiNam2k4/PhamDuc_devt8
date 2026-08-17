import React from 'react';
import { Camera, Activity, AlertTriangle, Gauge } from 'lucide-react';

interface VideoFeedProps {
  isCamActive: boolean;
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  latency: number;
  brightness: number;
  isViolation: boolean;
  violationType: string;
  translateViolation: (type: string) => string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  hiddenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  isCamActive,
  wsStatus,
  latency,
  brightness,
  isViolation,
  violationType,
  translateViolation,
  videoRef,
  overlayCanvasRef,
  hiddenCanvasRef,
}) => {
  return (
    <div className={`glass-panel rounded-2xl overflow-hidden border relative flex flex-col justify-between transition-all ${
      isViolation ? 'border-red-500/80 shadow-2xl shadow-red-950/30 animate-alert-border' : 'border-slate-800'
    }`}>
      
      {/* Header Feed info */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-between border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            wsStatus === 'connected' ? 'bg-emerald-500 animate-ping' :
            isCamActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
          }`}></span>
          <span className="text-xs font-bold text-white">LIVE WEBCAM PREVIEW</span>
          {isCamActive && (
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
              640x480 resolution
            </span>
          )}
        </div>

        {wsStatus === 'connected' && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>LATENCY: {latency}ms</span>
          </div>
        )}
      </div>

      {/* Video + Overlay Container */}
      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Placeholder shown when camera is not active */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300"
          style={{ display: isCamActive ? 'none' : 'flex', zIndex: 10 }}
        >
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">Camera Thử Nghiệm Chưa Khởi Chạy</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Vui lòng bấm nút <strong>"Bật Camera Thử Nghiệm"</strong> ở cột cấu hình để bắt đầu.
          </p>
        </div>

        {/* Video element and overlay canvas are always in the DOM but hidden when camera is inactive */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            transform: 'scaleX(-1)',
            display: isCamActive ? 'block' : 'none'
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '105%', // slightly larger to align perfectly
            pointerEvents: 'none', 
            display: isCamActive ? 'block' : 'none',
            zIndex: 5
          }}
        />
        <canvas
          ref={hiddenCanvasRef}
          width="640"
          height="480"
          style={{ display: 'none' }}
        />

        {isCamActive && isViolation && (
          <div className="absolute top-4 left-4 right-4 bg-red-600/90 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-red-500/30 flex items-center gap-2 animate-bounce z-20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>CẢNH BÁO VI PHẠM AI: {translateViolation(violationType).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Video Footer info stats */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          Độ sáng khung hình: <strong className="text-slate-200">{Math.round(brightness)}%</strong>
        </span>
        <span>
          {wsStatus === 'connected' ? 'Đang gửi frames lên AI Engine...' : 'WebSocket chưa kết nối'}
        </span>
      </div>
    </div>
  );
};
