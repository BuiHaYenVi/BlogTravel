import { useState, useEffect } from 'react';
import { adminTripService } from '../services/adminTripService';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTripListPage = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response: any = await adminTripService.getTrips(currentPage, itemsPerPage, search, statusFilter);
      if (response?.data?.data) {
        setTrips(response.data.data);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error("Failed to fetch trips", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentPage, statusFilter, search]); // Debounce search in real app, but this is fine for now

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus === 'banned' ? 'mở khóa' : 'khóa'} lịch trình này?`)) return;
    try {
      const newStatus = currentStatus === 'banned' ? 'open' : 'banned'; // Assuming 'open' is a valid status to revert to
      await adminTripService.updateStatus(id, newStatus);
      fetchTrips();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const confirmDelete = (id: number) => {
    setTripToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (tripToDelete === null) return;
    try {
      await adminTripService.deleteTrip(tripToDelete);
      fetchTrips();
    } catch (error) {
      console.error("Failed to delete trip", error);
    } finally {
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'recruiting':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">Mở</span>;
      case 'ongoing':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">Đang diễn ra</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">Hoàn thành</span>;
      case 'banned':
        return <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider">Bị khóa</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Lịch trình</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Kiểm soát tất cả các chuyến đi của cộng đồng</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tìm theo tiêu đề, người tạo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600">
              <Filter size={18} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="open">Đang mở</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="banned">Bị khóa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Lịch trình</th>
                <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Người tạo</th>
                <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Không tìm thấy lịch trình nào.</td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">{trip.title}</span>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                          <MapPin size={12} /> {trip.destination_name || 'Chưa xác định'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={trip.creator_avatar ? (trip.creator_avatar.startsWith('http') ? trip.creator_avatar : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${trip.creator_avatar}`) : `https://i.pravatar.cc/150?u=${trip.creator_name}`} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-700 text-sm">{trip.creator_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(trip.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(trip.start_date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            const base = window.location.pathname.replace(/\/admin\/trips.*/, '');
                            window.open(`${base}/trip/${trip.id}`, '_blank');
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(trip.id, trip.status)}
                          className={clsx(
                            "p-2 rounded-xl transition-all",
                            trip.status === 'banned' ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50"
                          )}
                          title={trip.status === 'banned' ? "Mở khóa" : "Khóa lịch trình"}
                        >
                          <MoreVertical size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(trip.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400">Trang {currentPage} / {totalPages}</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Xác nhận xóa</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Bạn có chắc chắn muốn xóa lịch trình này? Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị mất.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTripListPage;