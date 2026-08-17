import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Video, 
  VideoOff, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Info,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { authService, examSessionService } from '../services';
import { UserResponse, ExamSession } from '../types';

// Helper function to format start time and end time
const formatExamTime = (startTimeStr?: string, duration?: number) => {
  if (!startTimeStr) return { date: 'N/A', time: 'N/A' };
  try {
    const start = new Date(startTimeStr);
    const dateStr = start.toLocaleDateString('vi-VN');
    const timeStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    if (duration) {
      const end = new Date(start.getTime() + duration * 60000);
      const endTimeStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return { date: dateStr, time: `${timeStr} - ${endTimeStr} (${duration} phút)` };
    }
    
    return { date: dateStr, time: timeStr };
  } catch (e) {
    return { date: startTimeStr, time: '' };
  }
};

export default function UserPage() {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userInfo, sessionList] = await Promise.all([
          authService.getMyInfo(),
          examSessionService.getAll()
        ]);
        setCurrentUser(userInfo);
        setSessions(sessionList || []);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleToggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      authService.logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide leading-tight uppercase">AI Proctor</h1>
            <p className="text-[11px] text-cyan-400 font-medium">Cổng thông tin Thí Sinh</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-2 border border-red-900/40 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </nav>

      {/* Main Content Dashboard */}
      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student Profile & Camera Test */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Profile Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-cyan-400" /> Thông tin Thí Sinh
            </h2>

            {loading ? (
              <div className="py-4 text-center text-xs text-slate-500">Đang tải...</div>
            ) : currentUser ? (
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold">
                    {currentUser.fullName ? currentUser.fullName.charAt(0) : currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{currentUser.fullName || 'Chưa cập nhật họ tên'}</h3>
                    <p className="text-[10px] text-cyan-400 font-mono">Tài khoản: {currentUser.username}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200 font-medium">{currentUser.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vai trò:</span>
                    <span className="text-slate-200 font-medium capitalize">Thí sinh</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-red-400">Không tìm thấy thông tin sinh viên</div>
            )}
          </div>

          {/* Camera Verification Widget */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" /> Kiểm tra Thiết bị Camera
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vui lòng kiểm tra camera trước giờ thi để đảm bảo hệ thống giám sát AI hoạt động ổn định.
            </p>

            {/* Video Preview Box */}
            <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-4">
                  <VideoOff className="w-8 h-8 text-slate-600" />
                  <span className="text-[11px]">Camera chưa được kích hoạt</span>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            <button
              onClick={handleToggleCamera}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                cameraActive 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20'
              }`}
            >
              {cameraActive ? (
                <>
                  <VideoOff className="w-4 h-4" /> Tắt Camera Test
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" /> Bật Camera Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: List of Scheduled Exam Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> Ca Thi Đã Đăng Ký
              </h2>
              <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                {sessions.length} Ca thi
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Đang tải danh sách ca thi...
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                <Clock className="w-8 h-8 text-slate-700 mx-auto" />
                <p>Bạn không có ca thi nào lịch sắp tới.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const examTime = formatExamTime(session.startTime, session.duration);
                  return (
                    <div 
                      key={session.id} 
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-400 uppercase font-mono bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                            {session.subject?.subjectCode || 'N/A'}
                          </span>
                          <h3 className="font-semibold text-white text-sm">{session.subject?.name || 'Môn học không xác định'}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Ngày: {examTime.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Thời gian: {examTime.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Phòng thi</span>
                          <span className="text-xs text-slate-200 font-semibold">
                            {session.mode === 'ONLINE' ? 'Trực tuyến' : (session.room?.name || 'N/A')}
                          </span>
                        </div>
                        
                        <button 
                          disabled
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold select-none flex items-center gap-1.5 opacity-60 cursor-not-allowed"
                        >
                          <Info className="w-3.5 h-3.5" /> Chưa bắt đầu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Notice Widget */}
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed text-slate-300">
                <h4 className="font-bold text-white">Lưu ý phòng thi</h4>
                <p>Hãy đảm bảo bạn có mặt tại phòng thi đúng giờ được ghi trên lịch. Khi vào ca thi, hệ thống sẽ yêu cầu quyền mở Camera liên tục để giám sát gian lận trực tuyến.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
