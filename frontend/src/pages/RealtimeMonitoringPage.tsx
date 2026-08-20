import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  User,
  Clock,
  CheckCircle,
  VideoOff,
  RefreshCw,
  Play,
  StopCircle,
  Calendar,
  Layers,
  Activity,
  Camera
} from 'lucide-react';
import { examSessionService } from '../services/examSessionService';
import { ExamSession } from '../types';
import { CandidateCard, CandidateStatus } from '../components/CandidateCard';

const VIOLATION_TRANSLATIONS: Record<string, string> = {
  'phone_detected': 'Sử dụng điện thoại',
  'PHONE_DETECTED': 'Sử dụng điện thoại',
  'look_away': 'Quay đầu / Nhìn chỗ khác',
  'LOOK_AWAY': 'Quay đầu / Nhìn chỗ khác',
  'turning_around': 'Quay người ra sau / Quay lưng',
  'multiple_faces': 'Nhiều khuôn mặt',
  'face_not_detected': 'Không phát hiện khuôn mặt',
  'camera_blocked': 'Camera bị che khuất',
  'suspicious_object': 'Tài liệu / Vật thể cấm'
};

export default function RealtimeMonitoringPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Map of candidate username -> candidate status
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, CandidateStatus>>({});

  const wsRef = useRef<WebSocket | null>(null);

  // Room Camera State for Offline Mode
  const [roomCameraActive, setRoomCameraActive] = useState<boolean>(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const roomVideoRef = useRef<HTMLVideoElement | null>(null);
  const roomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomWsRef = useRef<WebSocket | null>(null);
  const roomIntervalRef = useRef<any>(null);
  const roomStreamRef = useRef<MediaStream | null>(null);

  // Fetch all exam sessions on mount
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await examSessionService.getAll();
      setSessions(data || []);
    } catch (e) {
      console.error('Lỗi khi tải danh sách ca thi:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (roomCameraActive && selectedSession && selectedSession.mode === 'OFFLINE' && selectedCameraId) {
      console.log('Switching stream to exam session camera ID:', selectedCameraId);
      stopRoomCamera();
      const timeout = setTimeout(() => {
        startRoomCamera(selectedCameraId);
      }, 450);
      return () => clearTimeout(timeout);
    }
  }, [selectedCameraId]);

  const startRoomCamera = async (examSessionCameraId: string) => {
    try {
      console.log('Starting Room Camera for offline proctoring...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' }
      });
      roomStreamRef.current = stream;
      if (roomVideoRef.current) {
        roomVideoRef.current.srcObject = stream;
      }
      setRoomCameraActive(true);

      // Connect to AI WebSocket
      const wsUrl = `ws://localhost:8000/ws/${examSessionCameraId}_admin`;
      console.log('Connecting Admin Room Camera to AI WS:', wsUrl);
      const ws = new WebSocket(wsUrl);
      roomWsRef.current = ws;

      ws.onopen = () => {
        console.log('Room Camera WS Connected.');
      };
      ws.onclose = () => {
        console.log('Room Camera WS Closed.');
      };
      ws.onerror = (err) => {
        console.error('Room Camera WS Error:', err);
      };

      // Loop to send frames to AI backend
      const intervalMs = Math.round(1000 / 10); // 10 FPS
      roomIntervalRef.current = setInterval(() => {
        const video = roomVideoRef.current;
        const canvas = roomCanvasRef.current;
        const activeWs = roomWsRef.current;

        if (video && canvas && activeWs && activeWs.readyState === WebSocket.OPEN) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
            activeWs.send(JSON.stringify({
              frame: base64Frame,
              timestamp: Date.now()
            }));
          }
        }
      }, intervalMs);

    } catch (err) {
      console.error('Failed to start Room Camera:', err);
      alert('Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera.');
    }
  };

  const stopRoomCamera = () => {
    console.log('Stopping Room Camera...');
    if (roomIntervalRef.current) {
      clearInterval(roomIntervalRef.current);
      roomIntervalRef.current = null;
    }
    if (roomWsRef.current) {
      roomWsRef.current.close();
      roomWsRef.current = null;
    }
    if (roomStreamRef.current) {
      roomStreamRef.current.getTracks().forEach(track => track.stop());
      roomStreamRef.current = null;
    }
    if (roomVideoRef.current) {
      roomVideoRef.current.srcObject = null;
    }
    setRoomCameraActive(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Establish WebSocket connection to the AI Backend
  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        console.log("Admin WS: Đang kết nối tới AI backend...");
        ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;

        ws.onopen = () => {
          if (active) {
            setIsConnected(true);
            console.log("Admin WS: Đã kết nối thành công");
          }
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            handleIncomingData(data);
          } catch (e) {
            console.error("Admin WS: Lỗi giải mã message:", e);
          }
        };

        ws.onclose = () => {
          if (active) {
            setIsConnected(false);
            console.log("Admin WS: Đã ngắt kết nối. Thử kết nối lại sau 3s...");
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (err) => {
          console.error("Admin WS: Lỗi socket:", err);
          ws?.close();
        };
      } catch (e) {
        console.error("Admin WS: Lỗi thiết lập socket:", e);
      }
    };

    connect();

    return () => {
      active = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      stopRoomCamera();
    };
  }, [soundEnabled]); // Rebind handleIncomingData with latest soundEnabled state

  // Process incoming data from WebSocket (either detection telemetry or violations)
  const handleIncomingData = (data: any) => {
    const sessionId = data.session_id;
    if (!sessionId) return;

    // session_id is format: {examSessionCameraId}_{student_username}
    const parts = sessionId.split("_");
    if (parts.length < 2) return;
    const examSessionCameraId = parts[0];
    const username = parts[1];

    // In offline mode, the status key is the camera's ID. In online mode, it is the student username.
    const key = selectedSession?.mode === 'OFFLINE' ? examSessionCameraId : username;

    setCandidateStatuses(prev => {
      const current = prev[key];
      if (!current) return prev; // Target does not belong to the selected exam session

      const isViolation = data.type === 'violation';
      let message = '';
      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

      if (isViolation) {
        const rawType = data.violation_type || '';
        const translatedType = VIOLATION_TRANSLATIONS[rawType] || rawType || 'Nghi vấn gian lận';
        message = `Cảnh báo: ${translatedType} (${Math.round((data.violation_confidence || 0.9) * 100)}%)`;
        severity = 'HIGH';

        // Play sound alert
        if (soundEnabled) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
            audio.play().catch(() => { });
          } catch (e) { }
        }
      } else {
        // Regular detection telemetry
        if (data.face_count === 0) {
          message = 'Cảnh báo: Không phát hiện khuôn mặt';
          severity = 'MEDIUM';
        } else if (data.face_count > 1) {
          message = 'Cảnh báo: Nhiều khuôn mặt trong camera';
          severity = 'HIGH';

          if (soundEnabled) {
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
              audio.play().catch(() => { });
            } catch (e) { }
          }
        } else if (Math.abs(data.head_yaw) > 30.0) {
          message = `Quay đầu quá mức (${data.head_yaw.toFixed(1)}°)`;
          severity = 'MEDIUM';
        } else {
          message = 'Bình thường';
          severity = 'LOW';
        }
      }

      // Add log entry if it differs from the last one (except violations which are always logged)
      const lastLog = current.logs[0];
      const newLogs = [...current.logs];
      if (!lastLog || lastLog.message !== message || isViolation) {
        newLogs.unshift({
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          message,
          isViolation: isViolation || severity === 'HIGH' || severity === 'MEDIUM',
          severity
        });
      }

      return {
        ...prev,
        [key]: {
          ...current,
          isActive: true,
          lastActiveTime: Date.now(),
          faceCount: data.face_count ?? 0,
          headYaw: data.head_yaw ?? 0,
          headPitch: data.head_pitch ?? 0,
          brightness: data.brightness ?? 100,
          alert: isViolation ? true : current.alert,
          lastViolationDescription: isViolation ? message : current.lastViolationDescription,
          currentFrame: data.frame,
          logs: newLogs.slice(0, 20)
        }
      };
    });
  };

  // Check for candidate inactivity (heartbeat timeout) every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCandidateStatuses(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach(username => {
          const c = updated[username];
          if (c.isActive && Date.now() - c.lastActiveTime > 6000) {
            updated[username] = {
              ...c,
              isActive: false,
              logs: [
                {
                  id: Date.now().toString(),
                  time: new Date().toLocaleTimeString(),
                  message: 'Thí sinh đã ngắt kết nối.',
                  isViolation: false,
                  severity: 'LOW' as const
                },
                ...c.logs
              ].slice(0, 20)
            };
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle Exam Session Selection
  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSessionId(id);
    setDemoMode(false);
    stopRoomCamera();

    if (!id) {
      setSelectedSession(null);
      setCandidateStatuses({});
      return;
    }

    const session = sessions.find(s => s.id === id);
    if (session) {
      setSelectedSession(session);

      // Initialize candidate statuses
      const initialStatuses: Record<string, CandidateStatus> = {};

      if (session.mode === 'OFFLINE') {
        // Offline Mode: The Room Cameras are the proctoring targets
        if (session.examSessionCameras && session.examSessionCameras.length > 0) {
          session.examSessionCameras.forEach(esc => {
            initialStatuses[esc.id] = {
              username: esc.id,
              fullName: esc.camera?.name || `Camera ${esc.id.slice(0, 5)}`,
              studentCode: esc.camera?.cameraCode || 'RTSP / USB',
              seatNumber: esc.camera?.location || 'Phòng thi',
              isActive: false,
              lastActiveTime: 0,
              faceCount: 0,
              headYaw: 0,
              headPitch: 0,
              brightness: 100,
              alert: false,
              lastViolationDescription: '',
              logs: [
                {
                  id: 'init',
                  time: new Date().toLocaleTimeString(),
                  message: 'Chờ giám thị kết nối camera...',
                  isViolation: false,
                  severity: 'LOW' as const
                }
              ]
            };
          });
          setSelectedCameraId(session.examSessionCameras[0].id);
        } else {
          // Fallback if no cameras defined in DB
          initialStatuses['room-camera'] = {
            username: 'room-camera',
            fullName: `Camera Giám Sát (${session.room?.name || 'Phòng thi'})`,
            studentCode: 'RTSP / USB',
            seatNumber: 'Trung tâm',
            isActive: false,
            lastActiveTime: 0,
            faceCount: 0,
            headYaw: 0,
            headPitch: 0,
            brightness: 100,
            alert: false,
            lastViolationDescription: '',
            logs: [
              {
                id: 'init',
                time: new Date().toLocaleTimeString(),
                message: 'Chờ giám thị kích hoạt camera phòng...',
                isViolation: false,
                severity: 'LOW' as const
              }
            ]
          };
          setSelectedCameraId('room-camera');
        }
      } else {
        // Online Mode: Individual student proctoring
        session.examSessionDetails?.forEach(detail => {
          if (detail.student) {
            const username = detail.student.username;
            initialStatuses[username] = {
              username,
              fullName: detail.student.fullName || username,
              studentCode: detail.student.studentCode || 'N/A',
              seatNumber: detail.seatNumber || 'N/A',
              isActive: false,
              lastActiveTime: 0,
              faceCount: 0,
              headYaw: 0,
              headPitch: 0,
              brightness: 100,
              alert: false,
              lastViolationDescription: '',
              logs: [
                {
                  id: 'init',
                  time: new Date().toLocaleTimeString(),
                  message: 'Chờ thí sinh kết nối thiết bị...',
                  isViolation: false,
                  severity: 'LOW' as const
                }
              ]
            };
          }
        });
      }
      setCandidateStatuses(initialStatuses);
    }
  };

  // Demo simulation mode to verify real-time log behavior on selected candidates
  useEffect(() => {
    if (!demoMode || !selectedSession) return;

    const interval = setInterval(() => {
      const details = selectedSession.examSessionDetails || [];
      if (details.length === 0) return;

      // Pick a random student in the active session list
      const randomDetail = details[Math.floor(Math.random() * details.length)];
      if (!randomDetail.student) return;
      const username = randomDetail.student.username;

      // Generate randomized behavior scenarios
      const rand = Math.random();
      let face_count = 1;
      let head_yaw = (Math.random() - 0.5) * 16; // normal range
      let head_pitch = (Math.random() - 0.5) * 10;
      let brightness = 75 + Math.random() * 25;
      let type = 'detection';
      let violation_type = '';

      if (rand > 0.92) {
        // Phone violation
        type = 'violation';
        violation_type = 'phone_detected';
      } else if (rand > 0.84) {
        // Look away
        head_yaw = Math.random() > 0.5 ? 42.0 : -45.5;
      } else if (rand > 0.76) {
        // Multiple faces
        face_count = 2;
      } else if (rand > 0.68) {
        // Face missing
        face_count = 0;
      }

      // Generate a mock base64 SVG frame for demo simulation
      const colors = ['#0f172a', '#1e1b4b', '#111827', '#030712'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const studentNameClean = randomDetail.student.fullName || username;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
        <rect width="320" height="240" fill="${randomColor}"/>
        <text x="50%" y="30%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#38bdf8" font-weight="bold">
          [MÔ PHỎNG CAMERA]
        </text>
        <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#ffffff" font-weight="bold">
          ${studentNameClean}
        </text>
        <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="10" fill="#a7f3d0">
          Nguoi: ${face_count} | Goc: ${head_yaw.toFixed(1)}deg
        </text>
        ${violation_type ? `
          <rect x="10" y="10" width="300" height="25" rx="4" fill="#ef4444" opacity="0.8"/>
          <text x="160" y="22" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold">
            CANH BAO GIAN LAN!
          </text>
        ` : ''}
      </svg>`;
      const mockFrame = `data:image/svg+xml;base64,${btoa(svg)}`;

      const mockMessage = {
        type,
        session_id: `${selectedSession.examSessionCameraId || selectedSession.id || 'sandbox'}_${username}`,
        frame: mockFrame,
        face_count,
        head_yaw,
        head_pitch,
        brightness,
        violation_type,
        violation_confidence: 0.85 + Math.random() * 0.12
      };

      handleIncomingData(mockMessage);
    }, 2000);

    return () => clearInterval(interval);
  }, [demoMode, selectedSession, soundEnabled]);

  const clearAlert = (username: string) => {
    setCandidateStatuses(prev => {
      const c = prev[username];
      if (!c) return prev;
      return {
        ...prev,
        [username]: {
          ...c,
          alert: false,
          lastViolationDescription: ''
        }
      };
    });
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Top Banner and Ca thi Selector */}
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
            <div className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${isConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/30 animate-pulse'
              }`}>
              <Activity className="w-3.5 h-3.5" />
              AI Connection: {isConnected ? 'Đang hoạt động' : 'Đang kết nối lại'}
            </div>

            {/* Sound alert switch */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${soundEnabled
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
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${demoMode
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
              >
                {demoMode ? <StopCircle className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-slate-400" />}
                <span>{demoMode ? 'Chế độ Demo: Đang chạy' : 'Chạy mô phỏng (Demo)'}</span>
              </button>
            )}

            {/* Camera Selector for Offline Mode */}
            {selectedSession && selectedSession.mode === 'OFFLINE' && selectedSession.examSessionCameras && selectedSession.examSessionCameras.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">Vị trí Camera:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="bg-transparent border-0 text-slate-300 text-[11px] font-bold outline-none cursor-pointer pr-4 py-0.5"
                >
                  {selectedSession.examSessionCameras.map((esc) => (
                    <option key={esc.id} value={esc.id} className="bg-slate-950 text-slate-300">
                      {esc.camera?.name || `Camera ${esc.id.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Room Camera Switch for Offline Mode */}
            {selectedSession && selectedSession.mode === 'OFFLINE' && (
              <button
                onClick={() => {
                  if (roomCameraActive) {
                    stopRoomCamera();
                  } else {
                    startRoomCamera(selectedCameraId || selectedSession.examSessionCameraId || 'room-camera');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${roomCameraActive
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  }`}
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>{roomCameraActive ? 'Tắt Camera Phòng Thi' : 'Kích hoạt Camera Phòng'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Ca Thi */}
        <div className="flex flex-col sm:flex-row gap-4 items-center border-t border-slate-850 pt-5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Chọn ca thi cần giám sát:</label>
          <div className="relative w-full sm:max-w-md">
            <select
              value={selectedSessionId}
              onChange={handleSessionChange}
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

      {/* Main Area: Candidate Grid */}
      {!selectedSession ? (
        // Empty State: No Session Selected
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Chưa chọn ca thi</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn cần chọn một ca thi ở danh sách phía trên để bắt đầu lấy danh sách thí sinh và theo dõi hành vi qua camera AI.
            </p>
          </div>
        </div>
      ) : (
        // Session Selected: Render Candidate Grid
        <div className="space-y-6">
          {/* Selected Session Metadata Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div className="text-xs leading-none space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Môn Thi</span>
                <span className="font-semibold text-slate-200">{selectedSession.subject?.name}</span>
              </div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div className="text-xs leading-none space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Thời Lượng</span>
                <span className="font-semibold text-slate-200">{selectedSession.duration} phút</span>
              </div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <div className="text-xs leading-none space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Hình thức</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedSession.mode}</span>
              </div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="text-xs leading-none space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Thí sinh</span>
                <span className="font-semibold text-slate-200">{selectedSession.examSessionDetails?.length || 0} Học viên</span>
              </div>
            </div>
          </div>

          {/* Grid of Candidate Monitor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(candidateStatuses).map((username) => {
              const status = candidateStatuses[username];
              return (
                <CandidateCard
                  key={username}
                  status={status}
                  onClearAlert={clearAlert}
                  onTakeSnapshot={(uname, fname) => alert(`Chụp ảnh bằng chứng cho thí sinh: ${fname}`)}
                  mode={selectedSession?.mode}
                />
              );
            })}
          </div>

          {/* Empty detail state */}
          {selectedSession.examSessionDetails?.length === 0 && (
            <div className="glass-panel p-8 text-center border border-slate-800 rounded-2xl">
              <VideoOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Không có thí sinh nào được đăng ký trong ca thi này.</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden elements for capturing room camera in offline mode */}
      <video ref={roomVideoRef} style={{ display: 'none' }} autoPlay playsInline muted />
      <canvas ref={roomCanvasRef} style={{ display: 'none' }} width={640} height={480} />
    </div>
  );
}
