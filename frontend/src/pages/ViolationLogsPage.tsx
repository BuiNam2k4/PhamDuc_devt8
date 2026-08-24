import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Smartphone,
  BookOpen,
  RotateCcw,
  X,
  LucideIcon
} from 'lucide-react';

interface MockLog {
  id: string;
  student: string;
  sbd: string;
  subject: string;
  room: string;
  camera: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  time: string;
  date: string;
  model: string;
  icon: LucideIcon;
}

const mockLogs: MockLog[] = [
  { id: 'LOG-8801', student: 'Nguyễn Văn A', sbd: '102', subject: 'Lập Trình Java nâng cao', room: 'Phòng A1.02', camera: 'CAM-02', type: 'Sử dụng điện thoại di động', severity: 'HIGH', time: '10:24:12', date: '2026-08-11', model: 'YOLOv8-v2.1', icon: Smartphone },
  { id: 'LOG-8802', student: 'Trần Thị B', sbd: '145', subject: 'Lập Trình Java nâng cao', room: 'Phòng A1.04', camera: 'CAM-01', type: 'Quay đầu bất thường (>45°)', severity: 'MEDIUM', time: '10:18:45', date: '2026-08-11', model: 'YOLOv8-v2.1', icon: RotateCcw },
  { id: 'LOG-8803', student: 'Lê Hoàng C', sbd: '089', subject: 'Cấu Trúc Dữ Liệu', room: 'Phòng B2.01', camera: 'CAM-03', type: 'Tài liệu cấm trên bàn thi', severity: 'HIGH', time: '09:55:02', date: '2026-08-11', model: 'YOLOv8-v2.1', icon: BookOpen },
  { id: 'LOG-8804', student: 'Pham Minh D', sbd: '210', subject: 'Lập Trình Java nâng cao', room: 'Phòng A1.02', camera: 'CAM-01', type: 'Quay đầu bất thường (>50°)', severity: 'LOW', time: '09:40:19', date: '2026-08-11', model: 'YOLOv8-v2.1', icon: RotateCcw },
  { id: 'LOG-8805', student: 'Đặng Tuấn E', sbd: '304', subject: 'Hệ Quản Trị CSDL', room: 'Phòng C1.05', camera: 'CAM-04', type: 'Sử dụng điện thoại di động', severity: 'HIGH', time: '08:45:10', date: '2026-08-11', model: 'YOLOv8-v2.1', icon: Smartphone },
];

export default function ViolationLogsPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedSnapshot, setSelectedSnapshot] = useState<MockLog | null>(null);

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.student.toLowerCase().includes(searchTerm.toLowerCase()) || log.sbd.includes(searchTerm);
    const matchesType = typeFilter === 'ALL' || log.type.includes(typeFilter);
    return matchesSearch && matchesType;
  });

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
          onClick={() => alert('Đã xuất toàn bộ nhật ký vi phạm ra file Excel/PDF!')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Xuất Báo Cáo Kỷ Luật
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo Tên hoặc SBD thí sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Tất cả loại vi phạm</option>
            <option value="điện thoại">Sử dụng điện thoại</option>
            <option value="Tài liệu">Tài liệu cấm</option>
            <option value="Quay đầu">Quay đầu bất thường</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
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
                <th className="p-3.5">Thời Gian</th>
                <th className="p-3.5 text-right">Bằng Chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => {
                const Icon = log.icon;
                return (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{log.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{log.student}</div>
                      <div className="text-[11px] text-slate-400">SBD: {log.sbd}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{log.subject}</div>
                      <div className="text-[11px] text-slate-400">{log.room} ({log.camera})</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 text-red-400 font-semibold">
                        <Icon className="w-4 h-4" />
                        <span>{log.type}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      <div>{log.time}</div>
                      <div className="text-[10px] text-slate-500">{log.date}</div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedSnapshot(log)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
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

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ảnh Bằng Chứng Trích Xuất {selectedSnapshot.id}</h3>
                <p className="text-xs text-slate-400">{selectedSnapshot.student} - SBD: {selectedSnapshot.sbd} ({selectedSnapshot.room})</p>
              </div>
              <button onClick={() => setSelectedSnapshot(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Bounding Box Snapshot */}
            <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center">
                <div className="p-3 rounded-xl border-2 border-red-500 bg-red-500/20 text-center animate-alert-border max-w-xs">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-1" />
                  <span className="text-xs font-bold text-red-300 block">{selectedSnapshot.type}</span>
                  <span className="text-[10px] text-red-200">Khung ảnh trích xuất lúc {selectedSnapshot.time}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
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
