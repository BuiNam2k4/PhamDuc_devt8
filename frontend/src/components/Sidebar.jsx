import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Video, 
  FileVideo, 
  AlertTriangle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Tổng quan Hệ thống', icon: LayoutDashboard, badge: null },
  { id: 'models', label: 'Quản lý Mô hình AI', icon: Cpu, badge: 'HOT' },
  { id: 'realtime', label: 'Giám sát Camera Live', icon: Video, badge: 'LIVE' },
  { id: 'offline', label: 'Phân tích Video Off', icon: FileVideo, badge: null },
  { id: 'logs', label: 'Nhật ký Vi phạm', icon: AlertTriangle, badge: 'LOGS' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 glass-panel border-r border-slate-800 h-screen flex flex-col justify-between p-4 fixed left-0 top-0 z-40">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide leading-tight uppercase">AI Proctor</h1>
            <p className="text-[11px] text-cyan-400 font-medium">Giám sát Thi cử v1.0</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Quản trị</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/80 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                      item.badge === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                      item.badge === 'HOT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status Footnote */}
      <div className="glass-panel-accent p-3 rounded-xl border border-indigo-500/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-300">Trạng thái Server</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-active-glow"></span>
            Hoạt động
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          Backend Java Spring Boot & FastAPI AI Engine (RTSP 20 FPS).
        </p>
      </div>
    </aside>
  );
}
