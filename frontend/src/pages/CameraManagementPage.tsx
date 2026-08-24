import React, { useState, useEffect } from 'react';
import { 
  Camera as CameraIcon, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  Activity,
  MapPin,
  Wifi
} from 'lucide-react';
import { cameraService } from '../services/cameraService';
import { Camera, CameraStatus } from '../types';

export default function CameraManagementPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  // Form states
  const [cameraCode, setCameraCode] = useState('');
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<CameraStatus | string>(CameraStatus.ONLINE);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const data = await cameraService.getAll();
      setCameras(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách camera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleOpenCreateModal = () => {
    setCameraCode('');
    setName('');
    setIpAddress('');
    setLocation('');
    setStatus(CameraStatus.ONLINE);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (camera: Camera) => {
    setSelectedCamera(camera);
    setName(camera.name || '');
    setIpAddress(camera.ipAddress || '');
    setLocation(camera.location || '');
    setStatus(camera.status || CameraStatus.ONLINE);
    setIsEditModalOpen(true);
  };

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cameraService.create({
        cameraCode,
        name,
        ipAddress,
        location,
        status
      });
      setIsCreateModalOpen(false);
      fetchCameras();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo camera');
    }
  };

  const handleUpdateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera) return;
    try {
      await cameraService.update(selectedCamera.id, {
        name,
        ipAddress,
        location,
        status
      });
      setIsEditModalOpen(false);
      fetchCameras();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật thông tin camera');
    }
  };

  const handleDeleteCamera = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa camera này không?')) return;
    try {
      await cameraService.delete(id);
      fetchCameras();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa camera');
    }
  };

  const filteredCameras = cameras.filter(camera => 
    (camera.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (camera.cameraCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (camera.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (camera.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CameraIcon className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Quản Lý Camera</h1>
          </div>
          <p className="text-xs text-slate-400">
            Quản lý hệ thống camera giám sát phòng thi offline, luồng RTSP AI và cấu hình vị trí lắp đặt.
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Camera Mới
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã camera, vị trí, IP..."
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
              Đang tải danh sách camera...
            </div>
          ) : filteredCameras.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không tìm thấy camera nào.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Mã Camera</th>
                  <th className="p-3.5">Tên Camera</th>
                  <th className="p-3.5">Địa chỉ IP / RTSP Source</th>
                  <th className="p-3.5">Vị Trí lắp đặt</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCameras.map((camera) => (
                  <tr key={camera.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{camera.cameraCode}</td>
                    <td className="p-3.5 text-white font-semibold">{camera.name}</td>
                    <td className="p-3.5 text-slate-300 font-mono flex items-center gap-1.5 mt-2">
                      <Wifi className="w-3.5 h-3.5 text-slate-500" />
                      {camera.ipAddress || 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {camera.location || 'Chưa xác định'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        camera.status === CameraStatus.ONLINE 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : camera.status === CameraStatus.RECORDING
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : camera.status === CameraStatus.ERROR
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {camera.status === CameraStatus.ONLINE ? 'ONLINE' :
                         camera.status === CameraStatus.RECORDING ? 'RECORDING' :
                         camera.status === CameraStatus.ERROR ? 'ERROR' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(camera)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3 h-3 text-cyan-400" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteCamera(camera.id)}
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
              <h3 className="text-base font-bold text-white">Thêm Camera Mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamera} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Camera</label>
                <input
                  type="text"
                  required
                  value={cameraCode}
                  placeholder="CAM_01"
                  onChange={(e) => setCameraCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Camera</label>
                <input
                  type="text"
                  required
                  value={name}
                  placeholder="Camera góc trái"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Địa chỉ IP / Link RTSP</label>
                <input
                  type="text"
                  required
                  value={ipAddress}
                  placeholder="rtsp://admin:123456@192.168.1.100:554/stream1"
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Vị Trí lắp đặt</label>
                <input
                  type="text"
                  value={location}
                  placeholder="Phòng A101"
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Trạng Thái ban đầu</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value={CameraStatus.ONLINE}>ONLINE</option>
                  <option value={CameraStatus.OFFLINE}>OFFLINE</option>
                  <option value={CameraStatus.RECORDING}>RECORDING</option>
                  <option value={CameraStatus.ERROR}>ERROR</option>
                </select>
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
              <h3 className="text-base font-bold text-white">Sửa Thông Tin Camera</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCamera} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mã Camera (Không thể sửa)</label>
                <input
                  type="text"
                  disabled
                  value={selectedCamera?.cameraCode || ''}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Tên Camera</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Địa chỉ IP / Link RTSP</label>
                <input
                  type="text"
                  required
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Vị Trí lắp đặt</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Trạng Thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value={CameraStatus.ONLINE}>ONLINE</option>
                  <option value={CameraStatus.OFFLINE}>OFFLINE</option>
                  <option value={CameraStatus.RECORDING}>RECORDING</option>
                  <option value={CameraStatus.ERROR}>ERROR</option>
                </select>
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
