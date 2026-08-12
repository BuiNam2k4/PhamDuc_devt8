import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { subjectService } from '../services/subjectService';
import { Subject } from '../types';

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form states
  const [subjectCode, setSubjectCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [department, setDepartment] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAll();
      setSubjects(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenCreateModal = () => {
    setSubjectCode('');
    setName('');
    setCredits(3);
    setDepartment('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setName(subject.name || '');
    setCredits(subject.credits || 3);
    setDepartment(subject.department || '');
    setIsEditModalOpen(true);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subjectService.create({
        subjectCode,
        name,
        credits,
        department
      });
      setIsCreateModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo môn học');
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      await subjectService.update(selectedSubject.id, {
        name,
        credits,
        department
      });
      setIsEditModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật môn học');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này không?')) return;
    try {
      await subjectService.delete(id);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa môn học');
    }
  };

  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.department && sub.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Quản Lý Môn Học</h1>
          </div>
          <p className="text-xs text-slate-400">
            Quản lý danh sách môn thi, số tín chỉ, khoa/viện phụ trách trong hệ thống quản lý thi cử.
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Môn Học Mới
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên môn, mã môn, khoa bộ môn..."
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
              Đang tải danh sách môn học...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không tìm thấy môn học nào.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Mã Môn</th>
                  <th className="p-3.5">Tên Môn Học</th>
                  <th className="p-3.5">Số Tín Chỉ</th>
                  <th className="p-3.5">Khoa Phụ Trách</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{sub.subjectCode}</td>
                    <td className="p-3.5 text-white font-semibold">{sub.name}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                        {sub.credits} Tín chỉ
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{sub.department || 'N/A'}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3 h-3 text-cyan-400" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
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
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Thêm Môn Học Mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Môn Học</label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Môn Học</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Số Tín Chỉ</label>
                  <input
                    type="number"
                    required
                    value={credits}
                    onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Khoa Phụ Trách</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
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
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Sửa Thông Tin Môn Học</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Môn Học (Không thể sửa)</label>
                <input
                  type="text"
                  disabled
                  value={selectedSubject?.subjectCode || ''}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Môn Học</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Số Tín Chỉ</label>
                  <input
                    type="number"
                    required
                    value={credits}
                    onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Khoa Phụ Trách</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
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
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
