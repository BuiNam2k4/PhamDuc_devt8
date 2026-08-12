import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  Video, 
  FileVideo, 
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Users,
  BookOpen,
  Building,
  Calendar,
  LogOut,
  User as UserIcon,
  LucideIcon
} from 'lucide-react';
import { authService } from '../services';
import { UserResponse } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge: string | null;
}

const mainNavItems: NavItem[] = [
  { path: '/admin', label: 'Tổng quan Hệ thống', icon: LayoutDashboard, badge: null },
  { path: '/admin/realtime', label: 'Giám sát Camera Live', icon: Video, badge: 'LIVE' },
  { path: '/admin/offline', label: 'Phân tích Video Off', icon: FileVideo, badge: null },
  { path: '/admin/logs', label: 'Nhật ký Vi phạm', icon: AlertTriangle, badge: 'LOGS' },
  { path: '/admin/models', label: 'Quản lý Mô hình AI', icon: Cpu, badge: 'HOT' },
];

const managementNavItems: NavItem[] = [
  { path: '/admin/exam-sessions', label: 'Quản lý Ca Thi', icon: Calendar, badge: null },
  { path: '/admin/students', label: 'Quản lý Thí Sinh', icon: Users, badge: null },
  { path: '/admin/subjects', label: 'Quản lý Môn Học', icon: BookOpen, badge: null },
  { path: '/admin/rooms', label: 'Quản lý Phòng Thi', icon: Building, badge: null },
];

export default function Sidebar() {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const info = await authService.getMyInfo();
        setCurrentUser(info);
      } catch (err) {
        console.error('Failed to load user info in sidebar:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      authService.logout();
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 h-screen flex flex-col justify-between p-4 fixed left-0 top-0 z-40 overflow-y-auto">
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

        {/* Main Navigation Section */}
        <div className="space-y-1 mb-6">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Giám Sát & AI</p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/80 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
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
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Data Management Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Quản Lý Dữ Liệu</p>
          {managementNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/80 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout Button */}
      <div className="space-y-3 mt-6 border-t border-slate-800/80 pt-4">
        {currentUser && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.fullName || currentUser.username}</p>
              <p className="text-[10px] text-slate-400 capitalize">{currentUser.role === 'ADMIN' ? 'Quản trị viên' : currentUser.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium text-xs transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Đăng xuất</span>
        </button>

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
      </div>
    </aside>
  );
}
