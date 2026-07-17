import { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Archive,
  ChevronLeft,
  ChevronRight,
  Map,
  X,
  Tag as TagIcon,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { locationService } from '../../../services/locationService';

const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const AdminLocationPage = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('province');
  
  // Selection & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response: any = await locationService.getLocations(currentPage, itemsPerPage, searchTerm, statusFilter, typeFilter);
      if (response?.data) {
        setLocations(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error("Failed to fetch locations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLocations();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, statusFilter, typeFilter]);

  const handleEdit = (location: any) => {
    setCurrentLocation({
      ...location,
      image: location.image || ''
    });
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentLocation({
      name: '',
      slug: '',
      type: 'attraction',
      region: 'mien-trung',
      address: '',
      description: '',
      image: '',
      tags: []
    });
    setIsEditModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setCurrentLocation({ ...currentLocation, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentLocation.id) {
        await locationService.updateLocation(currentLocation.id, currentLocation);
      } else {
        await locationService.createLocation(currentLocation);
      }
      setIsEditModalOpen(false);
      fetchLocations();
    } catch (error) {
      alert("Thao tác thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (location: any) => {
    setLocationToDelete(location);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    setIsSubmitting(true);
    try {
      await locationService.deleteLocation(locationToDelete.id);
      setIsDeleteModalOpen(false);
      fetchLocations();
    } catch (error) {
      alert("Xóa thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Địa điểm</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các điểm đến du lịch, thông tin tọa độ và hashtag liên quan.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleAddNew} className="flex items-center gap-2 bg-pastel-orange hover:bg-orange-500 text-white px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-pastel-orange/20 font-bold text-sm">
              <Plus size={18} />
              Thêm địa điểm mới
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Tìm tên địa điểm, địa chỉ..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold appearance-none w-full md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Trạng thái: Active</option>
            <option value="deleted">Trạng thái: Deleted</option>
          </select>
          <select 
            className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold appearance-none w-full md:w-48"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            <option value="province">Tỉnh thành</option>
            <option value="spot">Điểm tham quan</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Phân loại</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Vùng miền</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Hashtags</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {locations?.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          <img 
                            src={loc.image 
                              ? (loc.image.startsWith('http') ? loc.image : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${loc.image}`)
                              : 'https://images.unsplash.com/photo-1506197603052-3c3218524458?w=200'} 
                            className="w-full h-full object-cover" 
                            alt={loc.name}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{loc.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {loc.address || 'Chưa cập nhật địa chỉ'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm text-slate-600">{loc.type}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                        {loc.region}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                          {/* Sẽ load tags từ API ở bước nâng cao, hiện tại demo */}
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">#travel</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(loc)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(loc)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">Hiển thị {locations?.length || 0} / {totalItems} địa điểm</p>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30"
               >
                 <ChevronLeft size={18} />
               </button>
               <span className="text-sm font-bold px-4">{currentPage} / {totalPages}</span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30"
               >
                 <ChevronRight size={18} />
               </button>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                   <h3 className="text-xl font-bold text-slate-900">{currentLocation?.id ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}</h3>
                   <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tên địa điểm</label>
                         <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-medium" value={currentLocation?.name || ''} onChange={(e) => handleNameChange(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Slug (URL)</label>
                         <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-medium" value={currentLocation?.slug || ''} onChange={(e) => setCurrentLocation({...currentLocation, slug: e.target.value})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phân loại</label>
                         <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold" value={currentLocation?.type || 'province'} onChange={(e) => setCurrentLocation({...currentLocation, type: e.target.value})}>
                            <option value="province">Tỉnh thành</option>
                            <option value="attraction">Điểm tham quan</option>
                            <option value="restaurant">Nhà hàng</option>
                            <option value="hotel">Khách sạn</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vùng miền</label>
                         <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold" value={currentLocation?.region || 'mien-trung'} onChange={(e) => setCurrentLocation({...currentLocation, region: e.target.value})}>
                            <option value="mien-bac">Miền Bắc</option>
                            <option value="mien-trung">Miền Trung</option>
                            <option value="mien-nam">Miền Nam</option>
                         </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Địa chỉ</label>
                      <input type="text" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-medium" value={currentLocation?.address || ''} onChange={(e) => setCurrentLocation({...currentLocation, address: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mô tả ngắn</label>
                      <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-medium" value={currentLocation?.description || ''} onChange={(e) => setCurrentLocation({...currentLocation, description: e.target.value})} />
                   </div>

                   <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hình ảnh địa điểm</label>
                      <div className="flex gap-4 items-start">
                         <div className="w-24 h-24 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            {currentLocation?.image ? (
                              <img 
                                src={currentLocation.image.startsWith('http') ? currentLocation.image : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${currentLocation.image}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <MapPin size={24} className="text-slate-300" />
                            )}
                         </div>
                         <div className="flex-1 space-y-2">
                            <input 
                              type="text" 
                              placeholder="Dán URL hình ảnh..." 
                              className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-medium" 
                              value={currentLocation?.image || ''} 
                              onChange={(e) => setCurrentLocation({...currentLocation, image: e.target.value})} 
                            />
                            <p className="text-[10px] text-slate-400 italic">* Hiện tại hỗ trợ link ảnh trực tiếp hoặc đường dẫn tương đối từ server.</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                      <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Hủy</button>
                      <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                        {isSubmitting ? 'Đang xử lý...' : 'Lưu thông tin'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <AlertTriangle size={40} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa?</h3>
                <p className="text-slate-500 text-sm mb-8 px-4">
                  Bạn có chắc chắn muốn xóa địa điểm <span className="font-bold text-slate-900">"{locationToDelete?.name}"</span>? 
                  Hành động này sẽ chuyển trạng thái địa điểm sang 'Deleted'.
                </p>
                
                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Hủy</button>
                   <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50">
                      {isSubmitting ? 'Đang xóa...' : 'Vẫn xóa'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLocationPage;
