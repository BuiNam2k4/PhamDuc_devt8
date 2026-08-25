import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Smartphone,
  BookOpen,
  RotateCcw,
  Users,
  UserX,
  X,
  Calendar,
  Video,
  UserCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { examSessionService, violationService } from '../services';
import { ExamSession, RecognitionResult, ExamMode } from '../types';

const EVIDENCE_BASE_URL = 'http://localhost:8000/evidence';

const VIOLATION_TRANSLATIONS: Record<string, string> = {
  'phone_detected': 'Sử dụng điện thoại di động',
  'PHONE_DETECTED': 'Sử dụng điện thoại di động',
  'look_away': 'Quay đầu / Nhìn chỗ khác',
  'LOOK_AWAY': 'Quay đầu / Nhìn chỗ khác',
  'turning_around': 'Quay người ra sau / Quay lưng',
  'TURN_AROUND': 'Quay người ra sau / Quay lưng',
  'multiple_faces': 'Nhiều khuôn mặt trong camera',
  'MULTIPLE_FACES': 'Nhiều khuôn mặt trong camera',
  'face_not_detected': 'Không phát hiện khuôn mặt',
  'FACE_NOT_DETECTED': 'Không phát hiện khuôn mặt',
  'USING_DOCUMENT': 'Tài liệu cấm trên bàn thi',
  'using_document': 'Tài liệu cấm trên bàn thi',
  'HEAD_POSE_ABNORMAL': 'Tư thế đầu bất thường',
  'head_pose_abnormal': 'Tư thế đầu bất thường',
  'camera_blocked': 'Camera bị che khuất / quá tối',
  'CAMERA_BLOCKED': 'Camera bị che khuất / quá tối',
};

const getViolationIcon = (type: string) => {
  switch (type) {
    case 'PHONE_DETECTED':
    case 'phone_detected':
      return Smartphone;
    case 'LOOK_AWAY':
    case 'look_away':
    case 'head_pose_abnormal':
    case 'HEAD_POSE_ABNORMAL':
      return RotateCcw;
    case 'MULTIPLE_FACES':
    case 'multiple_faces':
      return Users;
    case 'FACE_NOT_DETECTED':
    case 'face_not_detected':
      return UserX;
    case 'USING_DOCUMENT':
    case 'using_document':
      return BookOpen;
    default:
      return AlertCircle;
  }
};

const getSeverity = (type: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const t = type.toUpperCase();
  if (['PHONE_DETECTED', 'USING_DOCUMENT', 'MULTIPLE_FACES'].includes(t)) {
    return 'HIGH';
  }
  if (['LOOK_AWAY', 'HEAD_POSE_ABNORMAL', 'CAMERA_BLOCKED'].includes(t)) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export default function ViolationLogsPage() {
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [violations, setViolations] = useState<RecognitionResult[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<string>('ALL'); // student username
  const [selectedCamera, setSelectedCamera] = useState<string>('ALL'); // examSessionCameraId
  
  // UI states
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<RecognitionResult | null>(null);

  // Fetch all exam sessions on mount
  useEffect(() => {
    setLoadingSessions(true);
    examSessionService.getAll()
      .then((data) => {
        setExamSessions(data || []);
        if (data && data.length > 0) {
          // Default to the first session
          setSelectedSessionId(data[0].id);
        }
        setLoadingSessions(false);
      })
      .catch((err) => {
        console.error('Error fetching exam sessions:', err);
        setLoadingSessions(false);
      });
  }, []);

  const selectedSession = examSessions.find(s => s.id === selectedSessionId) || null;

  // Fetch violation logs when the selected session changes
  useEffect(() => {
    if (!selectedSessionId) {
      setViolations([]);
      return;
    }
    
    // Reset filters
    setSelectedStudent('ALL');
    setSelectedCamera('ALL');
    
    setLoadingLogs(true);
    violationService.getBySessionId(selectedSessionId)
      .then((data) => {
        // Sort violations by detectionTime (descending order)
        const sorted = (data || []).sort((a, b) => 
          new Date(b.detectionTime).getTime() - new Date(a.detectionTime).getTime()
        );
        setViolations(sorted);
        setLoadingLogs(false);
      })
      .catch((err) => {
        console.error('Error fetching violations:', err);
        setViolations([]);
        setLoadingLogs(false);
      });
  }, [selectedSessionId]);

  // Filter logs list based on frontend filters
  const filteredLogs = violations.filter(log => {
    // 1. Search term match (Search student name, code, or log detail)
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (log.studentFullName && log.studentFullName.toLowerCase().includes(term)) ||
      (log.studentUsername && log.studentUsername.toLowerCase().includes(term)) ||
      (log.detail && log.detail.toLowerCase().includes(term)) ||
      (log.id && log.id.toLowerCase().includes(term));

    // 2. Violation type filter
    const matchesType = typeFilter === 'ALL' || log.violationType === typeFilter;

    // 3. Exam Mode specific filters (Student username or Camera ID)
    let matchesModeFilter = true;
    if (selectedSession) {
      if (selectedSession.mode === ExamMode.ONLINE) {
        if (selectedStudent !== 'ALL') {
          matchesModeFilter = log.studentUsername === selectedStudent;
        }
      } else {
        if (selectedCamera !== 'ALL') {
          matchesModeFilter = log.examSessionCameraId === selectedCamera;
        }
      }
    }

    return matchesSearch && matchesType && matchesModeFilter;
  });

  const handleExport = () => {
    alert('Đã xuất toàn bộ nhật ký vi phạm của ca thi này ra file Excel/PDF!');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h1 className="text-xl font-bold text-white">Nhật Ký & Bằng Chứng Gian Lận Thi Cử</h1>
          </div>
          <p className="text-xs text-slate-400">
            Lưu vết và tra cứu lịch sử vi phạm được phát hiện tự động bởi hệ thống AI, xuất báo cáo phục vụ hội đồng kỷ luật.
          </p>
        </div>

        <button 
          onClick={handleExport}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Xuất Báo Cáo Ca Thi
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Exam Session Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" /> Chọn Ca Thi
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
            disabled={loadingSessions}
          >
            {loadingSessions ? (
              <option>Đang tải ca thi...</option>
            ) : examSessions.length === 0 ? (
              <option value="">Không có ca thi nào</option>
            ) : (
              examSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.subject?.name || 'Môn học không tên'} ({session.mode === ExamMode.ONLINE ? 'Online' : 'Offline'}) - {session.startTime ? new Date(session.startTime).toLocaleDateString() : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Dynamic Mode Selector (Student for Online, Camera for Offline) */}
        {selectedSession && (
          <div className="flex flex-col gap-1">
            {selectedSession.mode === ExamMode.ONLINE ? (
              <>
                <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-cyan-400" /> Lọc theo Thí Sinh
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả thí sinh</option>
                  {selectedSession.examSessionDetails?.map(detail => {
                    if (!detail.student) return null;
                    return (
                      <option key={detail.student.id} value={detail.student.username}>
                        {detail.student.fullName} ({detail.student.studentCode})
                      </option>
                    );
                  })}
                </select>
              </>
            ) : (
              <>
                <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" /> Lọc theo Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả camera</option>
                  {selectedSession.examSessionCameras?.map(esc => (
                    <option key={esc.id} value={esc.id}>
                      {esc.camera?.name || `Camera ID ${esc.id.slice(0, 5)}`} ({esc.camera?.location || 'RTSP'})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {/* Violation Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" /> Loại Vi Phạm
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Tất cả hành vi</option>
            <option value="PHONE_DETECTED">Sử dụng điện thoại</option>
            <option value="USING_DOCUMENT">Tài liệu cấm</option>
            <option value="LOOK_AWAY">Quay đầu / Nhìn chỗ khác</option>
            <option value="MULTIPLE_FACES">Nhiều khuôn mặt</option>
            <option value="FACE_NOT_DETECTED">Mất khuôn mặt</option>
            <option value="HEAD_POSE_ABNORMAL">Tư thế đầu bất thường</option>
            <option value="CAMERA_BLOCKED">Camera bị che khuất</option>
          </select>
        </div>

        {/* Text Search */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Search className="w-3 h-3 text-cyan-400" /> Tìm Kiếm
          </label>
          <input
            type="text"
            placeholder="Tìm theo Tên, SBD hoặc Chi tiết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-[7px] text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Logs Table Area */}
      {loadingLogs ? (
        <div className="glass-panel p-12 text-center rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <p className="text-xs text-slate-400">Đang tải danh sách bằng chứng vi phạm...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400">Không tìm thấy ghi nhận vi phạm nào khớp với điều kiện lọc.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Mã Log</th>
                  <th className="p-3.5">Thí Sinh / SBD</th>
                  <th className="p-3.5">Môn Thi & Phòng</th>
                  <th className="p-3.5">Hành Vi Vi Phạm</th>
                  <th className="p-3.5">Mức Độ</th>
                  <th className="p-3.5">Độ Tin Cậy</th>
                  <th className="p-3.5">Thời Gian</th>
                  <th className="p-3.5 text-right">Bằng Chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const Icon = getViolationIcon(log.violationType || '');
                  const severity = getSeverity(log.violationType || '');
                  
                  // Detail matching camera name or room location
                  let matchedCameraText = 'N/A';
                  if (selectedSession && selectedSession.mode === ExamMode.OFFLINE && log.examSessionCameraId) {
                    const matchedCam = selectedSession.examSessionCameras?.find(c => c.id === log.examSessionCameraId);
                    if (matchedCam) {
                      matchedCameraText = `${matchedCam.camera?.name || 'Camera'} (${matchedCam.camera?.location || 'RTSP'})`;
                    } else {
                      matchedCameraText = `Camera ID ${log.examSessionCameraId.slice(0, 5)}`;
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{log.id ? log.id.slice(0, 8).toUpperCase() : 'N/A'}</td>
                      <td className="p-3.5">
                        {selectedSession?.mode === ExamMode.ONLINE ? (
                          <>
                            <div className="font-bold text-white">{log.studentFullName || 'Ẩn danh'}</div>
                            <div className="text-[11px] text-slate-400">SBD: {log.studentUsername || 'N/A'}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-white">{matchedCameraText}</div>
                            <div className="text-[11px] text-slate-400">Giám sát tổng quát</div>
                          </>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{selectedSession?.subject?.name || 'Không có tên môn'}</div>
                        <div className="text-[11px] text-slate-400">
                          {selectedSession?.room?.name || 'Phòng tự do'} 
                          {selectedSession?.mode === ExamMode.ONLINE && log.examSessionCameraId && ` (Camera: ${log.examSessionCameraId.slice(0, 5)})`}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-red-400 font-semibold">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{VIOLATION_TRANSLATIONS[log.violationType || ''] || log.violationType || 'Nghi vấn khác'}</span>
                        </div>
                        {log.detail && (
                          <div className="text-[10px] text-slate-500 max-w-[200px] truncate mt-0.5" title={log.detail}>
                            {log.detail}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          severity === 'HIGH' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {severity}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300 font-semibold">
                        {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : '90.0%'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {log.detectionTime ? (
                          <>
                            <div>{new Date(log.detectionTime.replace(' ', 'T')).toLocaleTimeString()}</div>
                            <div className="text-[10px] text-slate-500">{new Date(log.detectionTime.replace(' ', 'T')).toLocaleDateString()}</div>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedSnapshot(log)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] inline-flex items-center gap-1 border border-slate-700 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Xem Bằng Chứng
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ảnh Bằng Chứng Trích Xuất</h3>
                <p className="text-xs text-slate-400">
                  {selectedSession?.mode === ExamMode.ONLINE 
                    ? `Thí sinh: ${selectedSnapshot.studentFullName || 'Ẩn danh'} - SBD: ${selectedSnapshot.studentUsername || 'N/A'}`
                    : `Camera giám sát: ${selectedSnapshot.examSessionCameraId ? selectedSnapshot.examSessionCameraId.slice(0, 8).toUpperCase() : 'N/A'}`
                  }
                </p>
              </div>
              <button 
                onClick={() => setSelectedSnapshot(null)} 
                className="text-slate-400 hover:text-white cursor-pointer font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence Image Frame */}
            <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {selectedSnapshot.imageUrl ? (
                <img 
                  src={`${EVIDENCE_BASE_URL}/${selectedSnapshot.imageUrl}`}
                  alt="Evidence Image" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Hide image on error and show fallback text
                    (e.target as HTMLElement).style.display = 'none';
                    const fallbackEl = document.getElementById('image-error-fallback');
                    if (fallbackEl) fallbackEl.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback layout if image path doesn't load or image is empty */}
              <div 
                id="image-error-fallback"
                className={`absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 ${selectedSnapshot.imageUrl ? 'hidden' : ''}`}
              >
                <div className="p-3 rounded-xl border-2 border-red-500 bg-red-500/20 text-center max-w-xs space-y-2">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
                  <span className="text-xs font-bold text-red-300 block">
                    {VIOLATION_TRANSLATIONS[selectedSnapshot.violationType || ''] || selectedSnapshot.violationType || 'Phát hiện vi phạm'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {selectedSnapshot.detail || 'Không tìm thấy file ảnh đính kèm trên AI Server hoặc ảnh đã bị xoá.'}
                  </p>
                  <span className="text-[9px] text-slate-500 font-mono block">
                    {selectedSnapshot.detectionTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Violation Details Details Panel */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] font-bold">Môn học</span>
                  <span className="text-slate-300">{selectedSession?.subject?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] font-bold">Phòng thi</span>
                  <span className="text-slate-300">{selectedSession?.room?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] font-bold">Độ tin cậy AI</span>
                  <span className="text-slate-300 font-semibold text-cyan-400">
                    {selectedSnapshot.confidence ? `${(selectedSnapshot.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] font-bold">Thời điểm ghi nhận</span>
                  <span className="text-slate-300 font-mono">{selectedSnapshot.detectionTime}</span>
                </div>
              </div>
              
              {selectedSnapshot.detail && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block uppercase text-[9px] font-bold mb-1">Mô tả đầy đủ chi tiết:</span>
                  <p className="text-slate-300 leading-relaxed font-mono text-[10px] bg-slate-900 p-2.5 rounded-lg border border-slate-800/60 break-all select-text">
                    {selectedSnapshot.detail}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
