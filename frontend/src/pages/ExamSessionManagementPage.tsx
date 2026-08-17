import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  Clock,
  BookOpen,
  Building,
  Users,
  Video,
  Monitor,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { examSessionService } from '../services/examSessionService';
import { roomService } from '../services/roomService';
import { subjectService } from '../services/subjectService';
import { studentService } from '../services/studentService';
import { modelService } from '../services/modelService';
import { ExamSession, Room, Subject, Student, ExamMode, Model } from '../types';

export default function ExamSessionManagementPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);

  // Form states
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number>(90);
  const [mode, setMode] = useState<ExamMode>(ExamMode.ONLINE);
  const [roomId, setRoomId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [modelId, setModelId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, roomsData, subjectsData, studentsData, modelsData] = await Promise.all([
        examSessionService.getAll(),
        roomService.getAll(),
        subjectService.getAll(),
        studentService.getAll(),
        modelService.getAll()
      ]);
      setSessions(sessionsData || []);
      setRooms(roomsData || []);
      setSubjects(subjectsData || []);
      setStudents(studentsData || []);
      setModels(modelsData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu ca thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setStartTime(new Date().toISOString().slice(0, 16));
    setDuration(90);
    setMode(ExamMode.ONLINE);
    setRoomId(rooms[0]?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setModelId(models.find(m => m.status === 'ACTIVE')?.id || models[0]?.id || '');
    setSelectedStudentIds([]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (session: ExamSession) => {
    setSelectedSession(session);
    setStartTime(session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '');
    setDuration(session.duration || 90);
    setMode(session.mode || ExamMode.ONLINE);
    setRoomId(session.room?.id || '');
    setSubjectId(session.subject?.id || '');
    setModelId(session.model?.id || '');
    
    // Load student IDs currently assigned to this session
    const currentStudentIds = session.examSessionDetails?.map(detail => detail.student?.id).filter(Boolean) as string[] || [];
    setSelectedStudentIds(currentStudentIds);
    setIsEditModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await examSessionService.create({
        startTime: new Date(startTime).toISOString(),
        duration,
        mode,
        roomId: mode === ExamMode.ONLINE ? undefined : roomId,
        subjectId,
        modelId: modelId || undefined,
        studentIds: selectedStudentIds
      });
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo ca thi');
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      await examSessionService.update(selectedSession.id, {
        startTime: new Date(startTime).toISOString(),
        duration,
        mode,
        roomId: mode === ExamMode.ONLINE ? undefined : roomId,
        subjectId,
        modelId: modelId || undefined
      });
      
      // Update assigned students if list changed
      const currentStudentIds = selectedSession.examSessionDetails?.map(detail => detail.student?.id).filter(Boolean) as string[] || [];
      const hasStudentChanges = JSON.stringify(currentStudentIds.sort()) !== JSON.stringify(selectedStudentIds.sort());
      if (hasStudentChanges) {
        await examSessionService.addStudents(selectedSession.id, selectedStudentIds);
      }

      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật ca thi');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ca thi này không?')) return;
    try {
      await examSessionService.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa ca thi');
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const matchesSubject = session.subject?.name?.toLowerCase().includes(term) || session.subject?.subjectCode?.toLowerCase().includes(term);
    const matchesRoom = session.room?.name?.toLowerCase().includes(term) || session.room?.roomCode?.toLowerCase().includes(term);
    return matchesSubject || matchesRoom;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Quản Lý Ca Thi</h1>
          </div>
          <p className="text-xs text-slate-400">
            Lập lịch ca thi, cấu hình chế độ thi (Online / Offline), gán phòng, môn thi và chỉ định danh sách thí sinh dự thi.
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Lập Ca Thi Mới
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo môn thi, phòng thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Đang tải danh sách ca thi...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không tìm thấy ca thi nào.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Môn Thi</th>
                  <th className="p-3.5">Phòng Thi</th>
                  <th className="p-3.5">Hình Thức</th>
                  <th className="p-3.5">Mô hình AI</th>
                  <th className="p-3.5">Thời Gian Bắt Đầu</th>
                  <th className="p-3.5">Thời Lượng</th>
                  <th className="p-3.5">Thí Sinh Đăng Ký</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-white font-semibold">{session.subject?.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{session.subject?.subjectCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <div>
                          {session.mode === ExamMode.ONLINE ? (
                            <span className="text-slate-400 italic">Không yêu cầu (ONLINE)</span>
                          ) : (
                            <>
                              <div className="text-slate-200">{session.room?.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{session.room?.roomCode}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        session.mode === ExamMode.ONLINE 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {session.mode === ExamMode.ONLINE ? <Video className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {session.mode === ExamMode.ONLINE ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {session.model ? (
                        <div>
                          <div className="text-white font-semibold">{session.model.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{session.model.precision ? `P: ${session.model.precision}` : ''}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Mặc định</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN') : 'Chưa thiết lập'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {session.duration} Phút
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {session.examSessionDetails?.length || 0} Thí sinh
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(session)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3 h-3 text-cyan-400" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-950/80 text-red-300 font-medium inline-flex items-center gap-1 border border-red-900/40 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Lập Ca Thi Mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Môn Thi</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.subjectCode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phòng Thi</label>
                  {mode === ExamMode.ONLINE ? (
                    <div className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 h-[38px]">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      Tự động gán phòng ngẫu nhiên (ONLINE)
                    </div>
                  ) : (
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name} ({room.roomCode})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Thời Gian Bắt Đầu</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Hình Thức Ca Thi</label>
                  <div className="flex gap-4 h-[38px] items-center">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value={ExamMode.ONLINE}
                        checked={mode === ExamMode.ONLINE}
                        onChange={() => setMode(ExamMode.ONLINE)}
                        className="accent-cyan-500"
                      />
                      <Video className="w-4 h-4 text-cyan-400" />
                      ONLINE
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value={ExamMode.OFFLINE}
                        checked={mode === ExamMode.OFFLINE}
                        onChange={() => setMode(ExamMode.OFFLINE)}
                        className="accent-indigo-500"
                      />
                      <Monitor className="w-4 h-4 text-indigo-400" />
                      OFFLINE
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Mô hình AI nhận diện</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Mặc định --</option>
                    {models.filter(m => m.status === 'ACTIVE').map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Assignment List */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Chọn Thí Sinh Dự Thi</label>
                <div className="border border-slate-800 rounded-lg bg-slate-950 p-3 max-h-48 overflow-y-auto space-y-2">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center justify-between text-xs text-slate-300 hover:bg-slate-900 p-1.5 rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleStudentSelection(student.id)}
                          className="accent-cyan-500"
                        />
                        <span className="font-semibold">{student.fullName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                        {student.studentCode} | {student.className || 'N/A'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Lập Ca Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Chỉnh Sửa Ca Thi</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Môn Thi</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.subjectCode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phòng Thi</label>
                  {mode === ExamMode.ONLINE ? (
                    <div className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 h-[38px]">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      Tự động gán phòng ngẫu nhiên (ONLINE)
                    </div>
                  ) : (
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name} ({room.roomCode})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Thời Gian Bắt Đầu</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Hình Thức Ca Thi</label>
                  <div className="flex gap-4 h-[38px] items-center">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value={ExamMode.ONLINE}
                        checked={mode === ExamMode.ONLINE}
                        onChange={() => setMode(ExamMode.ONLINE)}
                        className="accent-cyan-500"
                      />
                      <Video className="w-4 h-4 text-cyan-400" />
                      ONLINE
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value={ExamMode.OFFLINE}
                        checked={mode === ExamMode.OFFLINE}
                        onChange={() => setMode(ExamMode.OFFLINE)}
                        className="accent-indigo-500"
                      />
                      <Monitor className="w-4 h-4 text-indigo-400" />
                      OFFLINE
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Mô hình AI nhận diện</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Mặc định --</option>
                    {models.filter(m => m.status === 'ACTIVE').map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Assignment List */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Chọn Thí Sinh Dự Thi</label>
                <div className="border border-slate-800 rounded-lg bg-slate-950 p-3 max-h-48 overflow-y-auto space-y-2">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center justify-between text-xs text-slate-300 hover:bg-slate-900 p-1.5 rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleStudentSelection(student.id)}
                          className="accent-cyan-500"
                        />
                        <span className="font-semibold">{student.fullName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                        {student.studentCode} | {student.className || 'N/A'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
