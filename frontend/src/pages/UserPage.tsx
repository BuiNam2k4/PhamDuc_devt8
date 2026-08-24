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
  Clock,
  BookOpen
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

const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "Ngôn ngữ lập trình nào sau đây được sử dụng phổ biến nhất trong phát triển các ứng dụng AI và Thị giác máy tính?",
    options: ["Java", "C++", "Python", "JavaScript"]
  },
  {
    id: 2,
    question: "Framework nào trong hệ sinh thái Java hỗ trợ xây dựng các dịch vụ RESTful API nhanh chóng, bảo mật và khép kín?",
    options: ["Spring Boot", "Struts", "Hibernate", "Grails"]
  },
  {
    id: 3,
    question: "Trong thuật toán ByteTrack, nhiệm vụ chính của mô hình tracking là gì?",
    options: [
      "Nhận diện đối tượng khuôn mặt",
      "Gán ID ổn định cho đối tượng di chuyển qua các frame hình ảnh",
      "Phát hiện tư thế xương khớp 3D",
      "Phân loại các hành vi gian lận bằng mạng học sâu"
    ]
  },
  {
    id: 4,
    question: "Giao thức truyền dữ liệu nào được sử dụng để stream camera thời gian thực từ thí sinh lên AI Engine?",
    options: ["HTTP/REST", "gRPC", "WebSocket", "FTP"]
  },
  {
    id: 5,
    question: "Độ trễ đầu-cuối (End-to-End Latency) tối ưu của hệ thống giám sát AI proctoring cần đảm bảo là bao nhiêu?",
    options: ["Dưới 1 giây", "Dưới 5 giây", "Dưới 10 giây", "Không giới hạn"]
  }
];

export default function UserPage() {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Exam Room State
  const [examJoined, setExamJoined] = useState(false);
  const [activeExamSession, setActiveExamSession] = useState<ExamSession | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [fps, setFps] = useState<number>(10);
  // Mock quiz answers
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Refs
  const examVideoRef = useRef<HTMLVideoElement>(null);
  const examStreamRef = useRef<MediaStream | null>(null);
  const examWsRef = useRef<WebSocket | null>(null);
  const examSendLoopRef = useRef<any>(null);
  const examCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
      // Cleanup exam if active
      if (examSendLoopRef.current) clearInterval(examSendLoopRef.current);
      if (examWsRef.current) examWsRef.current.close();
      if (examStreamRef.current) examStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Frame capture loop controlled by active exam connection and FPS setting
  useEffect(() => {
    if (!examJoined || wsStatus !== 'connected' || !examWsRef.current) {
      if (examSendLoopRef.current) {
        clearInterval(examSendLoopRef.current);
        examSendLoopRef.current = null;
      }
      return;
    }

    if (examSendLoopRef.current) {
      clearInterval(examSendLoopRef.current);
    }

    const intervalMs = Math.round(1000 / fps);
    console.log(`Starting frame send loop at ${fps} FPS (${intervalMs}ms)`);

    examSendLoopRef.current = setInterval(() => {
      const video = examVideoRef.current;
      const canvas = examCanvasRef.current;
      const activeWs = examWsRef.current;

      if (!video || !canvas || !activeWs || activeWs.readyState !== WebSocket.OPEN) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.6);

      const payload = {
        type: 'frame',
        data: base64Data,
        timestamp: Date.now()
      };

      activeWs.send(JSON.stringify(payload));
    }, intervalMs);

    return () => {
      if (examSendLoopRef.current) {
        clearInterval(examSendLoopRef.current);
        examSendLoopRef.current = null;
      }
    };
  }, [examJoined, wsStatus, fps]);

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

  const handleJoinExam = async (session: ExamSession) => {
    if (session.mode === 'OFFLINE') {
      alert('Đây là ca thi offline. Bạn cần làm bài trực tiếp tại phòng thi.');
      return;
    }
    // Stop any active camera test first
    stopCamera();
    
    setActiveExamSession(session);
    setExamJoined(true);
    setAnswers({});
    setWsStatus('connecting');
    
    // Start camera for the exam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      examStreamRef.current = stream;
      
      setTimeout(() => {
        if (examVideoRef.current) {
          examVideoRef.current.srcObject = stream;
        }
      }, 200);
      
      // Connect to WebSocket
      const sessionCameraId = session.examSessionCameraId || session.id || 'sandbox-test';
      const studentUsername = currentUser?.username || 'unknown';
      const wsUrl = `ws://localhost:8000/ws/${sessionCameraId}_${studentUsername}`;
      console.log('Connecting to Exam AI WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      examWsRef.current = ws;
      
      ws.onopen = () => {
        setWsStatus('connected');
        console.log('Exam WS Connected.');
      };
      
      ws.onmessage = (event) => {
        // Silent proctoring mode: student page receives no incoming telemetry messages
      };
      
      ws.onclose = () => {
        setWsStatus('disconnected');
        console.log('Exam WS Closed.');
      };
      
      ws.onerror = (err) => {
        console.error('Exam WS Error:', err);
      };
      
    } catch (err) {
      console.error('Failed to start camera or WS for exam:', err);
      alert('Không thể khởi chạy camera giám sát. Vui lòng cấp quyền và thử lại.');
      handleExitExam();
    }
  };

  const handleExitExam = () => {
    if (examSendLoopRef.current) {
      clearInterval(examSendLoopRef.current);
      examSendLoopRef.current = null;
    }
    
    if (examWsRef.current) {
      examWsRef.current.close();
      examWsRef.current = null;
    }
    
    if (examStreamRef.current) {
      examStreamRef.current.getTracks().forEach(track => track.stop());
      examStreamRef.current = null;
    }
    
    if (examVideoRef.current) {
      examVideoRef.current.srcObject = null;
    }
    
    setExamJoined(false);
    setActiveExamSession(null);
  };
  
  const handleSubmitExam = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài thi không? Dữ liệu bài làm và hình ảnh giám sát AI sẽ được lưu trữ.')) {
      alert('Nộp bài thành công! Cảm ơn bạn đã hoàn thành bài thi.');
      handleExitExam();
    }
  };

  if (examJoined && activeExamSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col transition-all duration-300 relative overflow-hidden">

        {/* Top Navbar */}
        <nav className="glass-panel border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm uppercase tracking-wide leading-tight">AI PROCTOR - PHÒNG THI TRỰC TUYẾN</h1>
              <p className="text-[11px] text-cyan-400 font-mono">Ca thi: {activeExamSession.subject?.name || 'Môn học'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : wsStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
              }`}></span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                AI Proctor: {wsStatus === 'connected' ? 'ĐANG GIÁM SÁT' : wsStatus === 'connecting' ? 'ĐANG KẾT NỐI' : 'MẤT KẾT NỐI'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-200">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono">60:00</span>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 overflow-hidden">
          {/* Left: Mock Exam quiz (col-span-3) */}
          <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-y-auto max-h-[78vh]">
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="font-bold text-white text-base">ĐỀ THI KIỂM THỬ THỜI GIAN THỰC</h2>
                <p className="text-xs text-slate-400 mt-1">Vui lòng hoàn thành các câu hỏi trắc nghiệm dưới sự giám sát của hệ thống AI proctoring.</p>
              </div>

              <div className="space-y-5">
                {MOCK_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="space-y-2.5 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-850 transition-all">
                    <h3 className="text-xs font-semibold text-slate-200 leading-relaxed">
                      Câu {idx + 1}: {q.question}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`p-2.5 rounded-xl text-[11px] font-medium text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60 shadow-md shadow-indigo-600/5'
                                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700/60 hover:text-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Đã trả lời: <span className="text-slate-300 font-bold font-mono">{Object.keys(answers).length}/5</span> câu hỏi
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExitExam}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  Thoát phòng thi
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Nộp bài thi
                </button>
              </div>
            </div>
          </div>

          {/* Right: Camera Feed & Proctoring Console (col-span-1) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-400 animate-pulse" /> Camera Giám Sát
                </h3>
                <span className="text-[10px] text-cyan-400 font-mono">{fps} FPS (640x480)</span>
              </div>

              <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video
                  ref={examVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={examCanvasRef} width={640} height={480} className="hidden" />
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <span className="text-[10px] text-slate-400 font-medium">Tần suất gửi ảnh (FPS):</span>
                <div className="flex gap-1.5">
                  {[3, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      onClick={() => setFps(val)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all border cursor-pointer ${
                        fps === val
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wide">Giám sát Bảo mật</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Hệ thống AI đang chạy ngầm để giám sát và ghi nhận ca thi một cách bảo mật. Vui lòng tập trung làm bài và giữ khuôn mặt chính diện với camera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                        
                        {session.mode === 'OFFLINE' ? (
                          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none">
                            <Info className="w-3.5 h-3.5 text-slate-500 animate-pulse" /> Thi tại phòng
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleJoinExam(session)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Vào phòng thi
                          </button>
                        )}
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
