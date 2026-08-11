import React, { useState } from 'react';
import { 
  FileVideo, 
  Upload, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Film, 
  FileText, 
  Download,
  Smartphone,
  BookOpen,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

export default function OfflineAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  const mockTimelineResults = [
    { time: '00:14:22', timestampSec: 862, student: 'Thí sinh Bàn 04 (SBD: 112)', type: 'Sử dụng điện thoại di động', confidence: '95.4%', icon: Smartphone, severity: 'HIGH' },
    { time: '00:32:05', timestampSec: 1925, student: 'Thí sinh Bàn 08 (SBD: 145)', type: 'Quay đầu nghi vấn (54°)', confidence: '91.2%', icon: RotateCcw, severity: 'MEDIUM' },
    { time: '00:48:19', timestampSec: 2899, student: 'Thí sinh Bàn 02 (SBD: 098)', type: 'Tài liệu cấm trên bàn thi', confidence: '89.8%', icon: BookOpen, severity: 'HIGH' },
    { time: '01:05:40', timestampSec: 3940, student: 'Thí sinh Bàn 04 (SBD: 112)', type: 'Sử dụng điện thoại di động (Lần 2)', confidence: '97.1%', icon: Smartphone, severity: 'HIGH' },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setScanResult(null);
    }
  };

  const startAnalysis = () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setProgress(0);

    let curr = 0;
    const timer = setInterval(() => {
      curr += 10;
      setProgress(curr);
      if (curr >= 100) {
        clearInterval(timer);
        setIsScanning(false);
        setScanResult({
          fileName: selectedFile.name,
          duration: '01:30:00',
          totalFrames: 135000,
          scannedFrames: 27000, // 5x Frame skipping
          violationsCount: mockTimelineResults.length,
          timeline: mockTimelineResults
        });
      }
    }, 400);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileVideo className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Phân Tích Video Phòng Thi Ngoại Tuyến (Offline Analysis)</h1>
          </div>
          <p className="text-xs text-slate-400">
            Tải lên tệp video đã ghi hình từ trước. Áp dụng kỹ thuật Lọc Khung Hình (Frame Skipping) để quét nhanh và xuất Timeline bằng chứng vi phạm.
          </p>
        </div>
      </div>

      {/* Video Upload & Scanner Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">1. Chọn Tệp Video Phòng Thi</h3>
            
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">Kéo thả hoặc Bấm để chọn tệp</span>
              <span className="text-[10px] text-slate-500 mt-1">Định dạng hỗ trợ: .mp4, .avi, .mkv (Tối đa 2GB)</span>
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-4 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200 font-semibold truncate max-w-[180px]">{selectedFile.name}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          <button
            onClick={startAnalysis}
            disabled={!selectedFile || isScanning}
            className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              !selectedFile || isScanning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
                <span>Đang Quét Video Frame-Skipping ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-300 fill-cyan-300" />
                <span>Bắt Đầu Phân Tích Kỹ Thuật</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Progress & Timeline Output */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Kết Quả Quét & Dòng Thời Gian Vi Phạm (Violation Timeline)
            </h3>

            {scanResult && (
              <button 
                onClick={() => alert('Đã tải về báo cáo vi phạm dạng PDF/Excel!')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" /> Xuất Báo Cáo
              </button>
            )}
          </div>

          {/* Scanning Progress Bar */}
          {isScanning && (
            <div className="space-y-2 py-6">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Tiến trình quét thuật toán Frame Skipping (5x Speed)...</span>
                <span className="font-bold text-cyan-400">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results Timeline */}
          {scanResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Thời lượng video</span>
                  <span className="font-bold text-white">{scanResult.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Khung hình quét (Frame Skip)</span>
                  <span className="font-bold text-cyan-400">27,000 / 135,000</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Phát hiện nghi vấn</span>
                  <span className="font-extrabold text-red-400">{scanResult.violationsCount} Vi phạm</span>
                </div>
              </div>

              {/* Timeline List */}
              <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {scanResult.timeline.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="relative pl-9 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="absolute left-2 top-4 w-4 h-4 rounded-full bg-red-500 border-4 border-slate-950 flex items-center justify-center"></div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                              {item.time}
                            </span>
                            <h4 className="text-xs font-semibold text-white">{item.student}</h4>
                          </div>
                          <p className="text-[11px] text-red-400 font-medium mt-1">{item.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">Độ tin cậy: <strong className="text-emerald-400">{item.confidence}</strong></span>
                        <button 
                          onClick={() => alert(`Xem ảnh bằng chứng snapshot tại mốc thời gian ${item.time}`)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700"
                        >
                          Xem Bằng Chứng
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !isScanning && (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Film className="w-10 h-10 mx-auto text-slate-700" />
              <p>Chưa có tệp video nào được phân tích. Hãy chọn tệp ở cột bên trái và nhấn Bắt Đầu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
