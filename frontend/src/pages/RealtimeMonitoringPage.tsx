import React, { useState, useEffect, useRef } from 'react';
import { VideoOff, Calendar } from 'lucide-react';
import { examSessionService } from '../services/examSessionService';
import { ExamSession } from '../types';
import { CandidateCard, CandidateStatus } from '../components/CandidateCard';
import { MonitoringSessionSelector } from '../components/MonitoringSessionSelector';
import { MonitoringMetadata } from '../components/MonitoringMetadata';

const VIOLATION_TRANSLATIONS: Record<string, string> = {
  'phone_detected': 'Sử dụng điện thoại',
  'PHONE_DETECTED': 'Sử dụng điện thoại',
  'look_away': 'Quay đầu / Nhìn chỗ khác',
  'LOOK_AWAY': 'Quay đầu / Nhìn chỗ khác',
  'turning_around': 'Quay người ra sau / Quay lưng',
  'multiple_faces': 'Nhiều khuôn mặt',
  'face_not_detected': 'Không phát hiện khuôn mặt',
  'camera_blocked': 'Camera bị che khuất'
};

export default function RealtimeMonitoringPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(10);

  // Map of candidate username -> candidate status
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, CandidateStatus>>({});

  const wsRef = useRef<WebSocket | null>(null);

  // Map of active cameras: examSessionCameraId -> { stream, ws, interval, video?, canvas? }
  const activeCamerasRef = useRef<Record<string, { stream: MediaStream; ws: WebSocket; interval: any; video?: HTMLVideoElement; canvas?: HTMLCanvasElement }>>({});

  // Dynamically update interval of all active cameras when FPS is changed
  useEffect(() => {
    const intervalMs = Math.round(1000 / fps);
    console.log(`Updating active room cameras interval to ${fps} FPS (${intervalMs}ms)`);
    Object.keys(activeCamerasRef.current).forEach(id => {
      const active = activeCamerasRef.current[id];
      if (active && active.video && active.canvas) {
        clearInterval(active.interval);
        const { video, canvas, ws } = active;
        active.interval = setInterval(() => {
          if (video && canvas && ws && ws.readyState === WebSocket.OPEN) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
              ws.send(JSON.stringify({
                type: 'frame',
                data: base64Frame,
                timestamp: Date.now()
              }));
            }
          }
        }, intervalMs);
      }
    });
  }, [fps]);

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

  const startRoomCamera = async (examSessionCameraId: string) => {
    try {
      console.log('Starting Room Camera:', examSessionCameraId);

      // Get all video input devices to dynamically map different physical webcams
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const activeCount = Object.keys(activeCamerasRef.current).length;
      const deviceId = videoDevices[activeCount % videoDevices.length]?.deviceId;

      const constraints = deviceId 
        ? { video: { deviceId: { exact: deviceId }, width: 640, height: 480 } }
        : { video: { width: 640, height: 480 } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create hidden capture elements dynamically in DOM
      const containerId = `capture-container-${examSessionCameraId}`;
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.display = 'none';
        document.body.appendChild(container);
      }

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      container.appendChild(video);
      await video.play().catch(() => {});

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      container.appendChild(canvas);

      // Connect to AI WebSocket
      const wsUrl = `ws://localhost:8000/ws/${examSessionCameraId}_admin`;
      console.log('Connecting Admin Room Camera to AI WS:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`Room Camera ${examSessionCameraId} WS Connected.`);
      };
      ws.onclose = () => {
        console.log(`Room Camera ${examSessionCameraId} WS Closed.`);
      };
      ws.onerror = (err) => {
        console.error(`Room Camera ${examSessionCameraId} WS Error:`, err);
      };

      // Loop to send frames to AI backend
      const intervalMs = Math.round(1000 / fps);
      const interval = setInterval(() => {
        if (video && canvas && ws && ws.readyState === WebSocket.OPEN) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
            ws.send(JSON.stringify({
              type: 'frame',
              data: base64Frame,
              timestamp: Date.now()
            }));
          }
        }
      }, intervalMs);

      // Save to active cameras map including video and canvas elements for dynamic FPS updates
      activeCamerasRef.current[examSessionCameraId] = { stream, ws, interval, video, canvas };

      // Update UI state
      setCandidateStatuses(prev => {
        const current = prev[examSessionCameraId];
        if (!current) return prev;
        return {
          ...prev,
          [examSessionCameraId]: {
            ...current,
            isActive: true,
            lastActiveTime: Date.now(),
            logs: [
              {
                id: Date.now().toString(),
                time: new Date().toLocaleTimeString(),
                message: 'Camera phòng thi đã được kết nối và kích hoạt.',
                isViolation: false,
                severity: 'LOW' as const
              },
              ...current.logs
            ].slice(0, 20)
          }
        };
      });

    } catch (err) {
      console.error('Failed to start Room Camera:', err);
      alert('Không thể mở camera. Vui lòng kiểm tra thiết bị hoặc quyền truy cập camera.');
    }
  };

  const stopRoomCamera = (examSessionCameraId: string) => {
    console.log('Stopping Room Camera:', examSessionCameraId);
    const active = activeCamerasRef.current[examSessionCameraId];
    if (active) {
      clearInterval(active.interval);
      active.ws.close();
      active.stream.getTracks().forEach(track => track.stop());
      delete activeCamerasRef.current[examSessionCameraId];
    }

    const container = document.getElementById(`capture-container-${examSessionCameraId}`);
    if (container) {
      container.remove();
    }

    setCandidateStatuses(prev => {
      const current = prev[examSessionCameraId];
      if (!current) return prev;
      return {
        ...prev,
        [examSessionCameraId]: {
          ...current,
          isActive: false,
          logs: [
            {
              id: Date.now().toString(),
              time: new Date().toLocaleTimeString(),
              message: 'Camera phòng thi đã ngắt kết nối.',
              isViolation: false,
              severity: 'LOW' as const
            },
            ...current.logs
          ].slice(0, 20)
        }
      };
    });
  };

  const stopAllRoomCameras = () => {
    console.log('Stopping all Room Cameras...');
    Object.keys(activeCamerasRef.current).forEach(id => {
      const active = activeCamerasRef.current[id];
      if (active) {
        clearInterval(active.interval);
        active.ws.close();
        active.stream.getTracks().forEach(track => track.stop());
      }
      const container = document.getElementById(`capture-container-${id}`);
      if (container) {
        container.remove();
      }
    });
    activeCamerasRef.current = {};
  };

  const toggleRoomCamera = (examSessionCameraId: string) => {
    const active = activeCamerasRef.current[examSessionCameraId];
    if (active) {
      stopRoomCamera(examSessionCameraId);
    } else {
      startRoomCamera(examSessionCameraId);
    }
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
      stopAllRoomCameras();
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

    // In offline mode, the status key is the camera's ID (since username is 'admin').
    // In online mode, it is the student's username.
    const key = username === 'admin' ? examSessionCameraId : username;

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
    stopAllRoomCameras();

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
      <MonitoringSessionSelector
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        selectedSession={selectedSession}
        loadingSessions={loadingSessions}
        isConnected={isConnected}
        soundEnabled={soundEnabled}
        demoMode={demoMode}
        fps={fps}
        setSoundEnabled={setSoundEnabled}
        setDemoMode={setDemoMode}
        setFps={setFps}
        onSessionChange={handleSessionChange}
      />

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
          <MonitoringMetadata selectedSession={selectedSession} />

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
                  onToggleCamera={toggleRoomCamera}
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
    </div>
  );
}
