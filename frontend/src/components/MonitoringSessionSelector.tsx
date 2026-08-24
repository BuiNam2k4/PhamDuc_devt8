import React from 'react';
import { Shield, Volume2, VolumeX, StopCircle, Play, RefreshCw, Activity } from 'lucide-react';
import { ExamSession } from '../types';

interface MonitoringSessionSelectorProps {
  sessions: ExamSession[];
  selectedSessionId: string;
  selectedSession: ExamSession | null;
  loadingSessions: boolean;
  isConnected: boolean;
  soundEnabled: boolean;
  demoMode: boolean;
  fps: number;
  setSoundEnabled: (val: boolean) => void;
  setDemoMode: (val: boolean) => void;
  setFps: (val: number) => void;
  onSessionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const MonitoringSessionSelector: React.FC<MonitoringSessionSelectorProps> = ({
  sessions,
  selectedSessionId,
  selectedSession,
  loadingSessions,
  isConnected,
  soundEnabled,
  demoMode,
  fps,
  setSoundEnabled,
  setDemoMode,
  setFps,
  onSessionChange,
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">Giám Sát Ca Thi Thời Gian Thực</h1>
          </div>
          <p className="text-xs text-slate-400">
            Vui lòng chọn ca thi đã lên lịch để quản lý thiết bị camera và nhật ký hành vi của từng thí sinh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* WS Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
            isConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-950/40 text-amber-400 border-amber-500/30 animate-pulse'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            AI Connection: {isConnected ? 'Đang hoạt động' : 'Đang kết nối lại'}
          </div>

          {/* Sound alert switch */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{soundEnabled ? 'Âm báo: Bật' : 'Âm báo: Tắt'}</span>
          </button>

          {/* Demo mode switch */}
          {selectedSession && (
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                demoMode
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {demoMode ? <StopCircle className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-slate-400" />}
              <span>{demoMode ? 'Chế độ Demo: Đang chạy' : 'Chạy mô phỏng (Demo)'}</span>
            </button>
          )}

          {/* FPS Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FPS:</span>
            <div className="flex gap-1.5">
              {[3, 5, 10, 15].map((val) => (
                <button
                  key={val}
                  onClick={() => setFps(val)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                    fps === val
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow shadow-cyan-500/10'
                      : 'bg-slate-950 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-400'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Ca Thi */}
      <div className="flex flex-col sm:flex-row gap-4 items-center border-t border-slate-850 pt-5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Chọn ca thi cần giám sát:</label>
        <div className="relative w-full sm:max-w-md">
          <select
            value={selectedSessionId}
            onChange={onSessionChange}
            disabled={loadingSessions}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">-- Click chọn ca thi --</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                [{session.subject?.subjectCode}] {session.subject?.name} - {session.mode} (Ngày {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'N/A'})
              </option>
            ))}
          </select>
        </div>
        {loadingSessions && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
      </div>
    </div>
  );
};
