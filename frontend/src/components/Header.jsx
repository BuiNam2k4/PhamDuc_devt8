import React from 'react';
import { Cpu, Bell, User, Wifi } from 'lucide-react';

export default function Header({ activeModel }) {
  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 ml-64">
      {/* Active Model Quick Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">Mô hình AI Active:</span>
          <span className="text-xs font-semibold text-cyan-300">
            {activeModel ? `${activeModel.name} (F1: ${activeModel.f1Score || 'N/A'})` : 'Chưa chọn (Standard YOLOv8)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
          <Wifi className="w-3.5 h-3.5" />
          <span>Realtime RTSP Latency &lt; 1.0s</span>
        </div>
      </div>

      {/* Right User & System Controls */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
            PVD
          </div>
          <div className="text-left">
            <h4 className="text-xs font-semibold text-white leading-tight">Phạm Văn Đức</h4>
            <p className="text-[10px] text-slate-400">Giám thị Phân hiệu / Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
