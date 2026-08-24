import React from 'react';
import { VideoOff, Camera, AlertCircle, Activity } from 'lucide-react';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  isViolation: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CandidateStatus {
  username: string;
  fullName: string;
  studentCode: string;
  seatNumber: string;
  isActive: boolean;
  lastActiveTime: number;
  faceCount: number;
  headYaw: number;
  headPitch: number;
  brightness: number;
  alert: boolean;
  lastViolationDescription: string;
  currentFrame?: string;
  logs: LogEntry[];
}

interface CandidateCardProps {
  status: CandidateStatus;
  onClearAlert: (username: string) => void;
  onTakeSnapshot: (username: string, fullName: string) => void;
  mode?: 'ONLINE' | 'OFFLINE';
  onToggleCamera?: (username: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  status,
  onClearAlert,
  onTakeSnapshot,
  mode = 'ONLINE',
  onToggleCamera,
}) => {
  return (
    <div 
      className={`glass-panel rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
        status.alert 
          ? 'border-red-500/80 shadow-lg shadow-red-950/30' 
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Card Header: Student Metadata */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-850 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 text-xs font-bold">
            {status.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">{status.fullName}</h3>
            <span className="text-[9px] font-mono text-cyan-400 tracking-wider">SBD: {status.studentCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-900/60 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase">
            Góc {status.seatNumber}
          </span>
          
          {/* Pulse active dot */}
          <span className={`w-2 h-2 rounded-full ${
            status.isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
          }`}></span>
        </div>
      </div>

      {/* Camera stream preview */}
      <div className="relative aspect-video bg-slate-950 border-b border-slate-900/60 flex items-center justify-center overflow-hidden">
        {status.isActive && status.currentFrame ? (
          <img 
            src={status.currentFrame} 
            alt={`Live camera ${status.fullName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-4 text-center">
            <VideoOff className="w-7 h-7 text-slate-700" />
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
              {status.isActive 
                ? 'ĐANG TẢI LUỒNG VIDEO...' 
                : (mode === 'OFFLINE' ? 'CAMERA CHƯA KÍCH HOẠT' : 'THÍ SINH NGOẠI TUYẾN')}
            </span>
            {mode === 'OFFLINE' && !status.isActive && onToggleCamera && (
              <button
                onClick={() => onToggleCamera(status.username)}
                className="mt-2 px-3 py-1 bg-indigo-650 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded font-bold text-[10px] cursor-pointer shadow transition-all border border-indigo-500/20"
              >
                Kích hoạt Camera
              </button>
            )}
          </div>
        )}
        
        {/* Live indicator overlay */}
        {status.isActive && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur text-white text-[8px] font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            LIVE
          </div>
        )}
      </div>

      {/* Card Body: Live Metrics, Alerts and Individual Log */}
      <div className="p-4 space-y-4">
        
        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-850 text-center font-mono text-[10px]">
          <div>
            <span className="text-slate-500 block uppercase text-[8px] font-bold">Người</span>
            <strong className={`text-xs ${
              status.isActive 
                ? (status.faceCount === 1 ? 'text-emerald-400' : 'text-red-400') 
                : 'text-slate-500'
            }`}>
              {status.isActive ? status.faceCount : '--'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[8px] font-bold">
              {mode === 'OFFLINE' ? 'Tư thế' : 'Góc Yaw'}
            </span>
            <strong className={`text-xs ${
              status.isActive 
                ? (mode === 'OFFLINE' 
                    ? (status.alert && status.lastViolationDescription.toLowerCase().includes('quay') ? 'text-red-400' : 'text-emerald-400')
                    : (Math.abs(status.headYaw) > 30.0 ? 'text-red-400' : 'text-slate-300')) 
                : 'text-slate-500'
            }`}>
              {status.isActive 
                ? (mode === 'OFFLINE' 
                    ? (status.alert && status.lastViolationDescription.toLowerCase().includes('quay') ? 'Quay người' : 'Bình thường')
                    : `${status.headYaw.toFixed(1)}°`) 
                : '--'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[8px] font-bold">Camera</span>
            <strong className={`text-xs ${status.isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
              {status.isActive ? `${status.brightness.toFixed(0)}%` : '--'}
            </strong>
          </div>
        </div>

        {/* Alert Box (If flagged) */}
        {status.alert && (
          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Phát Hiện Vi Phạm</h4>
              <p className="text-[10px] text-red-200 font-medium leading-tight">
                {status.lastViolationDescription}
              </p>
            </div>
          </div>
        )}

        {/* Individual Behavior Log View */}
        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Nhật ký hành vi riêng
          </h4>
          <div className="h-32 overflow-y-auto bg-slate-950 border border-slate-850 rounded-xl p-2.5 font-mono text-[10px] space-y-1.5 scrollbar-thin">
            {status.logs.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-start gap-1 pb-1 border-b border-slate-900/60 leading-normal ${
                  log.isViolation 
                    ? (log.severity === 'HIGH' ? 'text-red-400' : 'text-amber-400') 
                    : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
          <span className="text-slate-500 font-semibold font-mono uppercase text-[9px]">
            {status.isActive ? 'ĐANG KẾT NỐI' : 'NGOẠI TUYẾN'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'OFFLINE' && onToggleCamera && (
            <button
              onClick={() => onToggleCamera(status.username)}
              className={`px-2.5 py-1 rounded font-semibold text-[10px] cursor-pointer border transition-all ${
                status.isActive
                  ? 'bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 border-red-900/30'
                  : 'bg-indigo-650/30 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border-indigo-500/20'
              }`}
            >
              {status.isActive ? 'Tắt Cam' : 'Bật Cam'}
            </button>
          )}

          <button
            onClick={() => onTakeSnapshot(status.username, status.fullName)}
            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 cursor-pointer"
            title="Chụp bằng chứng"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {status.alert && (
            <button
              onClick={() => onClearAlert(status.username)}
              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 border border-red-900/30 rounded font-semibold text-[10px] cursor-pointer"
            >
              Xóa cảnh báo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
