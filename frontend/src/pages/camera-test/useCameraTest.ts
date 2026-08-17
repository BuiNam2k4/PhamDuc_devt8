import { useState, useEffect, useRef } from 'react';
import { TestLog } from './ConnectionLogs';
import { DetectedObject, drawOverlay } from './canvasUtils';

export function useCameraTest() {
  // WebCam and Stream State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCamActive, setIsCamActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // WebSocket Connection State
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:8000/ws');
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [backendHealth, setBackendHealth] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendInfo, setBackendInfo] = useState<{ service?: string; version?: string } | null>(null);

  // Real-time Detection State
  const [faceCount, setFaceCount] = useState<number>(0);
  const [headPose, setHeadPose] = useState<{ yaw: number; pitch: number; roll: number }>({ yaw: 0, pitch: 0, roll: 0 });
  const [brightness, setBrightness] = useState<number>(0);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [latency, setLatency] = useState<number>(0);

  // Violatins detected in the current response
  const [isViolation, setIsViolation] = useState<boolean>(false);
  const [violationType, setViolationType] = useState<string>('');

  // Log History
  const [logs, setLogs] = useState<TestLog[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sendLoopRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load available camera devices & verify backend health
  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
        addLog('info', `Tìm thấy ${videoDevices.length} camera khả dụng.`);
      } catch (err) {
        console.error('Error fetching cameras:', err);
        addLog('error', 'Không thể truy cập camera. Hãy kiểm tra quyền truy cập của trình duyệt.');
      }
    };
    getDevices();
    checkBackendHealth();
    return () => {
      stopCamera();
      disconnectWebSocket();
    };
  }, []);

  // Monitor health of FastAPI backend
  const checkBackendHealth = async () => {
    setBackendHealth('checking');
    const healthUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '/health');
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        setBackendHealth('online');
        setBackendInfo(data);
        addLog('success', 'Kết nối thành công với API Health check.', `${data.service} v${data.version}`);
      } else {
        throw new Error(`HTTP Status ${response.status}`);
      }
    } catch (err) {
      setBackendHealth('offline');
      setBackendInfo(null);
      addLog('error', `Không thể kết nối API Health check tại: ${healthUrl}`);
    }
  };

  // Log Helper
  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => {
    const newLog: TestLog = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // Play Beep Alert Sound
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCamActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Auto-play blocked, user interaction may be needed:', playErr);
        }
      }
      setIsCamActive(true);
      addLog('info', 'Đã khởi động camera thành công.');
    } catch (err: any) {
      console.error('Start camera error:', err);
      addLog('error', `Lỗi khởi động camera: ${err.message}`);
    }
  };

  // StopCamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);

    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      ctx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    addLog('info', 'Đã dừng camera.');
  };

  // Toggle WebSocket
  const toggleWebSocket = () => {
    if (wsStatus === 'connected' || wsStatus === 'connecting') {
      disconnectWebSocket();
    } else {
      connectWebSocket();
    }
  };

  // Connect WebSocket
  const connectWebSocket = () => {
    disconnectWebSocket();
    setWsStatus('connecting');
    addLog('info', `Đang kết nối tới WebSocket AI: ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus('connected');
        addLog('success', 'Đã kết nối thành công WebSocket AI Engine!');
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);

          if (res.type === 'error') {
            addLog('error', `Lỗi từ AI Server: ${res.message}`);
            return;
          }

          if (res.timestamp) {
            setLatency(Date.now() - res.timestamp);
          }

          setFaceCount(res.face_count || 0);
          setHeadPose({
            yaw: res.head_yaw || 0,
            pitch: res.head_pitch || 0,
            roll: res.head_roll || 0
          });
          setBrightness(res.brightness || 0);
          setDetectedObjects(res.objects || []);

          if (res.type === 'violation') {
            setIsViolation(true);
            setViolationType(res.violation_type);

            let detailsStr = '';
            if (res.violation_type === 'phone_detected') {
              detailsStr = `Tìm thấy ${res.details?.phone_count || 1} điện thoại`;
            } else if (res.violation_type === 'look_away') {
              detailsStr = `Quay đầu hướng ${res.details?.direction || 'lạ'} trong ${res.details?.duration || 0}s`;
            } else if (res.violation_type === 'multiple_faces') {
              detailsStr = `Phát hiện ${res.details?.face_count || res.details?.person_count || 2} khuôn mặt/người`;
            } else if (res.violation_type === 'face_not_detected') {
              detailsStr = `Không có mặt thí sinh trong ${res.details?.duration || 0}s`;
            } else if (res.violation_type === 'camera_blocked') {
              detailsStr = `Camera quá tối/sáng: ${res.details?.brightness}%`;
            } else if (res.violation_type === 'suspicious_object') {
              detailsStr = `Phát hiện vật thể nghi vấn: ${res.details?.object_type}`;
            }

            addLog('warning', `PHÁT HIỆN HÀNH VI GIAN LẬN: ${translateViolation(res.violation_type)}`, detailsStr);
            playAlertSound();
          } else {
            setIsViolation(false);
            setViolationType('');
          }

          drawOverlay(overlayCanvasRef.current, videoRef.current, res);
        } catch (e) {
          console.error('Error parsing WS message:', e);
          addLog('error', 'Lỗi phân tích dữ liệu trả về từ WebSocket.');
        }
      };

      ws.onclose = (event) => {
        setWsStatus('disconnected');
        addLog('info', `WebSocket đã đóng. Code: ${event.code}.`);
        disconnectWebSocket();
      };

      ws.onerror = () => {
        setWsStatus('disconnected');
        addLog('error', 'Lỗi kết nối WebSocket.');
      };

      wsRef.current = ws;
    } catch (err: any) {
      setWsStatus('disconnected');
      addLog('error', `Không thể khởi tạo WebSocket: ${err.message}`);
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('disconnected');
    setIsViolation(false);
    setViolationType('');
    if (sendLoopRef.current) {
      clearInterval(sendLoopRef.current);
      sendLoopRef.current = null;
    }
  };

  // Send Frame Loop
  useEffect(() => {
    if (isCamActive && wsStatus === 'connected') {
      const intervalMs = Math.round(1000 / fps);
      sendLoopRef.current = setInterval(sendFrame, intervalMs);
    } else {
      if (sendLoopRef.current) {
        clearInterval(sendLoopRef.current);
        sendLoopRef.current = null;
      }
    }
    return () => {
      if (sendLoopRef.current) {
        clearInterval(sendLoopRef.current);
        sendLoopRef.current = null;
      }
    };
  }, [isCamActive, wsStatus, fps]);

  // Send single frame
  const sendFrame = () => {
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    const ws = wsRef.current;

    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.6);

    const payload = {
      type: 'frame',
      data: base64Data,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(payload));
  };

  const translateViolation = (type: string): string => {
    switch (type) {
      case 'phone_detected': return 'Sử dụng điện thoại';
      case 'multiple_faces': return 'Nhiều khuôn mặt';
      case 'face_not_detected': return 'Không phát hiện khuôn mặt';
      case 'look_away': return 'Quay đầu / Nhìn đi chỗ khác';
      case 'camera_blocked': return 'Camera bị che khuất / Ánh sáng kém';
      case 'suspicious_object': return 'Phát hiện vật thể nghi vấn';
      default: return type;
    }
  };

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: (id: string) => {
      setSelectedDeviceId(id);
      if (isCamActive) {
        setTimeout(startCamera, 100);
      }
    },
    isCamActive,
    toggleCamera,
    fps,
    setFps,
    soundEnabled,
    setSoundEnabled,
    wsUrl,
    setWsUrl,
    wsStatus,
    toggleWebSocket,
    backendHealth,
    backendInfo,
    checkBackendHealth,
    faceCount,
    headPose,
    brightness,
    detectedObjects,
    latency,
    isViolation,
    violationType,
    logs,
    clearLogs: () => setLogs([]),
    translateViolation,
    videoRef,
    hiddenCanvasRef,
    overlayCanvasRef
  };
}
