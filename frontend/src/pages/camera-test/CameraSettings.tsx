import React from 'react';
import {
  Settings2,
  WifiOff,
  RefreshCw,
  Wifi,
  AlertCircle,
  Volume2,
  VolumeX,
  Square,
  Play
} from 'lucide-react';

interface CameraSettingsProps {
  wsUrl: string;
  setWsUrl: (url: string) => void;
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  isCamActive: boolean;
  toggleWebSocket: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  fps: number;
  setFps: (fps: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleCamera: () => void;
}

export const CameraSettings: React.FC<CameraSettingsProps> = ({
  wsUrl,
  setWsUrl,
  wsStatus,
  isCamActive,
  toggleWebSocket,
  devices,
  selectedDeviceId,
  setSelectedDeviceId,
  fps,
  setFps,
  soundEnabled,
  setSoundEnabled,
  toggleCamera,
}) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Settings2 className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cấu Hình Kết Nối</h2>
      </div>

      {/* WebSocket URL */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WebSocket URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            disabled={wsStatus !== 'disconnected'}
            className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            placeholder="ws://localhost:8000/ws"
          />
          <button
            onClick={toggleWebSocket}
            disabled={isCamActive === false && wsStatus === 'disconnected'}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              wsStatus === 'connected' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-950/20' :
              wsStatus === 'connecting' ? 'bg-amber-600 text-white animate-pulse' :
              'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {wsStatus === 'connected' ? (
              <>
                <WifiOff className="w-3.5 h-3.5" /> Ngắt kết nối
              </>
            ) : wsStatus === 'connecting' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang kết nối
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" /> Kết nối AI
              </>
            )}
          </button>
        </div>
        {wsStatus === 'disconnected' && !isCamActive && (
          <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> Hãy khởi động Camera trước khi kết nối AI.
          </p>
        )}
      </div>

      {/* Choose Webcam Device */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chọn Thiết Bị Camera</label>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={isCamActive}
          className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
        >
          {devices.map((device, idx) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* FPS Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tốc độ gửi (FPS)</label>
            <span className="text-xs font-mono font-bold text-indigo-400">{fps} FPS</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Sound Toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cảnh báo âm thanh</label>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-full py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              soundEnabled ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" /> Bật âm báo
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" /> Tắt âm báo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggle Camera Button */}
      <button
        onClick={toggleCamera}
        className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
          isCamActive
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/20'
        }`}
      >
        {isCamActive ? (
          <>
            <Square className="w-4 h-4" /> Dừng Camera
          </>
        ) : (
          <>
            <Play className="w-4 h-4" /> Bật Camera Thử Nghiệm
          </>
        )}
      </button>
    </div>
  );
};
