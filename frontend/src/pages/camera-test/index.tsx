import React from 'react';
import { Camera, Server, RefreshCw } from 'lucide-react';
import { useCameraTest } from './useCameraTest';
import { CameraSettings } from './CameraSettings';
import { ConnectionLogs } from './ConnectionLogs';
import { VideoFeed } from './VideoFeed';
import { MetricCards } from './MetricCards';

export default function CameraTestPage() {
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
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
    checkBackendHealth,
    faceCount,
    headPose,
    brightness,
    detectedObjects,
    latency,
    isViolation,
    violationType,
    logs,
    clearLogs,
    translateViolation,
    videoRef,
    overlayCanvasRef,
    hiddenCanvasRef
  } = useCameraTest();

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Kiểm Tra Thiết Bị & Kết Nối AI Engine
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Trang kiểm thử webcam cục bộ, truyền hình ảnh nén qua WebSockets và nhận kết quả phát hiện gian lận real-time.
            </p>
          </div>
        </div>

        {/* AI Server Global Health Indicator */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            backendHealth === 'online' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' :
            backendHealth === 'checking' ? 'bg-slate-800 text-slate-300 border-slate-700' :
            'bg-red-950/60 text-red-300 border-red-500/40'
          }`}>
            <Server className={`w-3.5 h-3.5 ${backendHealth === 'checking' ? 'animate-spin text-slate-400' : ''}`} />
            <span>AI Server Health: {
              backendHealth === 'online' ? 'Hoạt động' :
              backendHealth === 'checking' ? 'Đang kiểm tra...' : 'Ngoại tuyến'
            }</span>
            <button
              onClick={checkBackendHealth}
              className="ml-1 p-0.5 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
              title="Thử lại kết nối"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings & Camera & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings Panel & Logs */}
        <div className="space-y-6">
          <CameraSettings
            wsUrl={wsUrl}
            setWsUrl={setWsUrl}
            wsStatus={wsStatus}
            isCamActive={isCamActive}
            toggleWebSocket={toggleWebSocket}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            fps={fps}
            setFps={setFps}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            toggleCamera={toggleCamera}
          />

          <ConnectionLogs
            logs={logs}
            onClear={clearLogs}
          />
        </div>

        {/* Middle/Right Column: Webcam Feed Display & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <VideoFeed
            isCamActive={isCamActive}
            wsStatus={wsStatus}
            latency={latency}
            brightness={brightness}
            isViolation={isViolation}
            violationType={violationType}
            translateViolation={translateViolation}
            videoRef={videoRef}
            overlayCanvasRef={overlayCanvasRef}
            hiddenCanvasRef={hiddenCanvasRef}
          />

          <MetricCards
            faceCount={faceCount}
            headPose={headPose}
            detectedObjects={detectedObjects}
          />
        </div>

      </div>
    </div>
  );
}
