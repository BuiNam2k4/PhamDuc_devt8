import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  Users
} from 'lucide-react';
import { roomService } from '../services/roomService';
import { Room } from '../types';

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form states
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [building, setBuilding] = useState('');
  const [description, setDescription] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAll();
      setRooms(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCreateModal = () => {
    setRoomCode('');
    setName('');
    setCapacity(30);
    setBuilding('');
    setDescription('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setSelectedRoom(room);
    setName(room.name || '');
    setCapacity(room.capacity || 30);
    setBuilding(room.building || '');
    setDescription(room.description || '');
    setIsEditModalOpen(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomService.create({
        roomCode,
        name,
        capacity,
        building,
        description
      });
      setIsCreateModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo phòng thi');
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await roomService.update(selectedRoom.id, {
        name,
        capacity,
        building,
        description
      });
      setIsEditModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật phòng thi');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng thi này không?')) return;
    try {
      await roomService.delete(id);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa phòng thi');
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.building && room.building.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Quản Lý Phòng Thi</h1>
          </div>
          <p className="text-xs text-slate-400">
            Quản lý danh sách các phòng thi, địa điểm, sức chứa và phân bố phòng trong hệ thống.
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Phòng Thi Mới
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng, mã phòng, tòa nhà..."
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
              Đang tải danh sách phòng thi...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không tìm thấy phòng thi nào.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Mã Phòng</th>
                  <th className="p-3.5">Tên Phòng</th>
                  <th className="p-3.5">Tòa Nhà</th>
                  <th className="p-3.5">Sức Chứa (Thí Sinh)</th>
                  <th className="p-3.5">Mô Tả</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{room.roomCode}</td>
                    <td className="p-3.5 text-white font-semibold">{room.name}</td>
                    <td className="p-3.5 text-slate-300">{room.building || 'N/A'}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        <Users className="w-3 h-3 text-cyan-400" />
                        {room.capacity || 0}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">{room.description || '-'}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3 h-3 text-cyan-400" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
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
              <h3 className="text-base font-bold text-white">Thêm Phòng Thi Mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Phòng</label>
                <input
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Phòng</label>
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
                  <label className="text-[10px] uppercase font-bold text-slate-400">Sức Chứa</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tòa Nhà</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mô Tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 h-20 resize-none"
                />
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
              <h3 className="text-base font-bold text-white">Sửa Thông Tin Phòng Thi</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Phòng (Không thể sửa)</label>
                <input
                  type="text"
                  disabled
                  value={selectedRoom?.roomCode || ''}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Phòng</label>
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
                  <label className="text-[10px] uppercase font-bold text-slate-400">Sức Chứa</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tòa Nhà</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mô Tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 h-20 resize-none"
                />
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
