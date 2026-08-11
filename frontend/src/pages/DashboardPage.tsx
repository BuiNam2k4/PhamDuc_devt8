import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Video, 
  Cpu, 
  Clock,
  Smartphone,
  BookOpen,
  RotateCcw,
  LucideIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { roomService } from '../services';
import { MainLayoutContextType } from '../layouts/MainLayout';

interface HourlyDetection {
  time: string;
  phone: number;
  book: number;
  head: number;
}

interface RecentViolation {
  id: number;
  student: string;
  room: string;
  camera: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  time: string;
  icon: LucideIcon;
  color: string;
}

const hourlyDetections: HourlyDetection[] = [
  { time: '08:00', phone: 0, book: 0, head: 1 },
  { time: '08:30', phone: 1, book: 0, head: 2 },
  { time: '09:00', phone: 2, book: 1, head: 4 },
  { time: '09:30', phone: 0, book: 1, head: 1 },
  { time: '10:00', phone: 3, book: 2, head: 5 },
  { time: '10:30', phone: 1, book: 0, head: 2 },
];

const recentViolations: RecentViolation[] = [
  { id: 1, student: 'Nguyễn Văn A (SBD: 102)', room: 'Phòng A1.02', camera: 'CAM-02 (Góc Phải)', type: 'Sử dụng điện thoại', severity: 'HIGH', time: '10:24:12', icon: Smartphone, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 2, student: 'Trần Thị B (SBD: 145)', room: 'Phòng A1.04', camera: 'CAM-01 (Toàn Cảnh)', type: 'Quay đầu bất thường (>45°)', severity: 'MEDIUM', time: '10:18:45', icon: RotateCcw, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 3, student: 'Lê Hoàng C (SBD: 089)', room: 'Phòng B2.01', camera: 'CAM-03 (Bàn Thi)', type: 'Tài liệu cấm trên bàn', severity: 'HIGH', time: '09:55:02', icon: BookOpen, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 4, student: 'Pham Minh D (SBD: 210)', room: 'Phòng A1.02', camera: 'CAM-01 (Góc Trái)', type: 'Quay đầu bất thường (>50°)', severity: 'LOW', time: '09:40:19', icon: RotateCcw, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const context = useOutletContext<MainLayoutContextType>();
  const activeModel = context?.activeModel;
  const [roomCount, setRoomCount] = useState<number>(6);

  useEffect(() => {
    roomService.getAll()
      .then((rooms) => {
        if (Array.isArray(rooms) && rooms.length > 0) {
          setRoomCount(rooms.length);
        }
      })
      .catch((err) => {
        console.warn('Backend API room fetch fallback:', err);
      });
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Hệ Thống Giám Sát Gian Lận Trực Tuyến v1.0
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tổng Quan Giám Sát Phòng Thi Real-Time</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hệ thống kết nối luồng camera RTSP thời gian thực, phân tích hành vi gian lận (Sử dụng điện thoại, Tài liệu cấm, Quay đầu nghi vấn) bằng YOLOv8 & MediaPipe Pose.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/realtime')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-cyan-300" />
              <span>Xem Camera Trực Tiếp</span>
            </button>
            <button
              onClick={() => navigate('/models')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Quản Lý Mô Hình AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phòng thi đang mở</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{String(roomCount).padStart(2, '0')} <span className="text-xs text-slate-400 font-normal">Phòng</span></h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 100% Camera Online
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thí sinh dự thi</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">148 <span className="text-xs text-slate-400 font-normal">Thí sinh</span></h3>
            <p className="text-[11px] text-slate-400 mt-1">6/6 Ca thi sáng</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cảnh báo vi phạm</p>
            <h3 className="text-2xl font-extrabold text-red-400 mt-1">08 <span className="text-xs text-slate-400 font-normal">Trường hợp</span></h3>
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" /> 2 Vi phạm mức cao
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mô hình AI Active</p>
            <h3 className="text-lg font-bold text-cyan-300 mt-1 truncate max-w-[130px]" title={activeModel?.name || 'YOLOv8-v2.1'}>
              {activeModel?.name || 'YOLOv8-v2.1'}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
              F1-Score: {activeModel?.f1Score || '88.5%'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Timeline Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Thống Kê Phát Hiện Gian Lận Theo Giờ (Hôm Nay)</h3>
              <p className="text-xs text-slate-400">Số lượng hành vi nghi vấn phân tích theo từng mốc thời gian thi</p>
            </div>
            <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
              FPS: 22.4 / Latency: 0.8s
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDetections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="phone" name="Dùng điện thoại" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="book" name="Tài liệu cấm" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="head" name="Quay đầu nghi vấn" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Violation Feed */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Nhật Ký Vi Phạm Mới Nhất
              </h3>
              <button 
                onClick={() => navigate('/logs')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Xem tất cả <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentViolations.map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.id} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md border ${v.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">{v.student}</h4>
                          <p className="text-[11px] text-slate-400">{v.room} - {v.camera}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {v.time}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                      <span className="text-red-400 font-medium">{v.type}</span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        v.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {v.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => navigate('/realtime')}
              className="w-full py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-medium text-xs text-center transition-all cursor-pointer"
            >
              Mở Khung Nhìn Giám Sát Camera (Realtime Grid)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
