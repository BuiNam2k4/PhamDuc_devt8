import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  AlertTriangle, 
  Camera, 
  Clock, 
  CheckCircle,
  Eye,
  Smartphone,
  BookOpen,
  RotateCcw
} from 'lucide-react';

const cameraFeeds = [
  { 
    id: 'CAM-01', 
    room: 'Phòng A1.02 (Toàn cảnh)', 
    fps: 24, 
    latency: '0.7s', 
    alert: true, 
    violation: { student: 'Nguyễn Văn A (SBD: 102)', type: 'Sử dụng điện thoại', bbox: { top: '35%', left: '42%', width: '18%', height: '32%' }, icon: Smartphone },
    candidates: 25
  },
  { 
    id: 'CAM-02', 
    room: 'Phòng A1.02 (Góc phải)', 
    fps: 22, 
    latency: '0.8s', 
    alert: true, 
    violation: { student: 'Trần Thị B (SBD: 145)', type: 'Quay đầu bất thường (52°)', bbox: { top: '25%', left: '60%', width: '20%', height: '35%' }, icon: RotateCcw },
    candidates: 12
  },
  { 
    id: 'CAM-03', 
    room: 'Phòng B2.01 (Toàn cảnh)', 
    fps: 25, 
    latency: '0.6s', 
    alert: false, 
    candidates: 30
  },
  { 
    id: 'CAM-04', 
    room: 'Phòng C1.05 (Toàn cảnh)', 
    fps: 23, 
    latency: '0.9s', 
    alert: false, 
    candidates: 28
  },
];

export default function RealtimeMonitoringPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCam, setSelectedCam] = useState(null);
  const [liveLogs, setLiveLogs] = useState([
    { id: 101, cam: 'CAM-01', student: 'Nguyễn Văn A (SBD: 102)', type: 'Sử dụng điện thoại (YOLOv8: 96%)', time: new Date().toLocaleTimeString(), severity: 'HIGH' },
    { id: 102, cam: 'CAM-02', student: 'Trần Thị B (SBD: 145)', type: 'Quay đầu bất thường (MediaPipe Pose: 52°)', time: new Date().toLocaleTimeString(), severity: 'MEDIUM' }
  ]);

  // Simulate real-time live alert log incoming
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ['Sử dụng điện thoại', 'Tài liệu cấm trên bàn', 'Quay đầu nghi vấn'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const newLog = {
        id: Date.now(),
        cam: 'CAM-01',
        student: `Thí sinh SBD: ${Math.floor(100 + Math.random() * 900)}`,
        type: `${randomType} (Live detection)`,
        time: new Date().toLocaleTimeString(),
        severity: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM'
      };
      setLiveLogs(prev => [newLog, ...prev.slice(0, 7)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls Header */}
      <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-xl font-bold text-white">Giám Sát Camera Phòng Thi Trực Tuyến (RTSP Live)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Luồng video RTSP thời gian thực được trích xuất khung hình và quét bằng YOLOv8 & MediaPipe Pose (Độ trễ &lt; 1 giây).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
              soundEnabled ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{soundEnabled ? 'Âm thanh Cảnh báo: Bật' : 'Âm thanh: Tắt'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid (2x2) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cameraFeeds.map((feed) => (
            <div 
              key={feed.id} 
              className={`glass-panel rounded-xl overflow-hidden border relative flex flex-col justify-between transition-all ${
                feed.alert ? 'border-red-500/80 shadow-xl shadow-red-950/40 animate-alert-border' : 'border-slate-800'
              }`}
            >
              {/* Camera Header Bar */}
              <div className="p-3 bg-slate-950/80 backdrop-blur-md flex items-center justify-between border-b border-slate-800/80 z-20">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${feed.alert ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                  <span className="text-xs font-bold text-white">{feed.id}</span>
                  <span className="text-[11px] text-slate-400">{feed.room}</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">{feed.fps} FPS ({feed.latency})</span>
              </div>

              {/* Video Simulated Stream Canvas */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group">
                {/* Background Video Simulation Pattern */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                  
                  {/* Candidates Visual Elements */}
                  <div className="absolute inset-0 p-6 flex flex-wrap gap-6 items-center justify-center opacity-60">
                    <div className="w-16 h-20 bg-slate-800/60 rounded border border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400">
                      Bàn 01
                    </div>
                    <div className="w-16 h-20 bg-slate-800/60 rounded border border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400">
                      Bàn 02
                    </div>
                    <div className="w-16 h-20 bg-slate-800/60 rounded border border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400">
                      Bàn 03
                    </div>
                    <div className="w-16 h-20 bg-slate-800/60 rounded border border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400">
                      Bàn 04
                    </div>
                  </div>
                </div>

                {/* AI Detection Bounding Box Overlay */}
                {feed.alert && feed.violation && (
                  <div 
                    className="absolute border-2 border-red-500 bg-red-500/20 rounded shadow-lg shadow-red-500/50 animate-alert-border z-10 flex flex-col justify-between p-1"
                    style={feed.violation.bbox}
                  >
                    <div className="bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> {feed.violation.type}
                    </div>
                    <div className="text-[9px] font-semibold text-red-200 bg-slate-950/80 px-1 rounded truncate">
                      {feed.violation.student}
                    </div>
                  </div>
                )}

                {/* Camera Overlay Badge */}
                {feed.alert && (
                  <div className="absolute top-3 right-3 bg-red-600/90 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-20">
                    <AlertTriangle className="w-3.5 h-3.5" /> PHÁT HIỆN GIAN LẠN!
                  </div>
                )}
              </div>

              {/* Camera Footer Controls */}
              <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Số thí sinh: <strong className="text-slate-200">{feed.candidates}</strong></span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => alert(`Đã chụp ảnh snapshot bằng chứng từ ${feed.id}`)} 
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300" 
                    title="Chụp ảnh snapshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedCam(feed.id)} 
                    className="p-1 rounded bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200"
                    title="Xem phóng to camera"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Violation Feed Sidebar */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Nhật Ký Vi Phạm Thời Gian Thực (Live Stream)
              </h3>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">WebSocket</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {liveLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-900/90 border border-red-500/30 hover:border-red-500 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                      {log.cam}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200">{log.student}</h4>
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {log.type}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-[10px] text-slate-400 text-center">
              Khung cảnh báo nhấp nháy đỏ khi camera nhận diện vi phạm với độ trễ &lt; 1.5s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
