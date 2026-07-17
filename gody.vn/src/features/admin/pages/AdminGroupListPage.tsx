import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UsersRound, 
  Lock, 
  Globe, 
  ExternalLink,
  Trash2,
  FolderOpen,
  Filter,
  Download,
  CheckCircle,
  Clock,
  EyeOff,
  Eye,
  AlertTriangle,
  Calendar,
  ChevronDown,
  X,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGroupService } from '../../../services/adminGroupService';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const AdminGroupListPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'hidden'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [memberRange, setMemberRange] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [groupStats, setGroupStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const requestConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmConfig({ title, message, action });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmExecute = async () => {
    if (confirmConfig) {
      await confirmConfig.action();
      setIsConfirmModalOpen(false);
      setConfirmConfig(null);
    }
  };

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const [groupsRes, statsRes]: any = await Promise.all([
        adminGroupService.getGroups(currentPage, itemsPerPage, searchTerm),
        adminGroupService.getGroupStats()
      ]);

      let groupsData: any[] = [];
      let pagination: any = null;

      const resData = groupsRes?.data?.data;
      if (resData?.data && Array.isArray(resData.data)) {
        groupsData = resData.data;
        pagination = resData.pagination;
      } else if (Array.isArray(resData)) {
        groupsData = resData;
      }

      const isActiveVal = (val: any) => val === true || val === 1 || val === 't' || val === 'true';

      setGroups(groupsData.map((g: any) => ({
        id: String(g.id),
        name: g.name || 'Hội nhóm chưa đặt tên',
        category: g.category || 'Du lịch',
        memberCount: parseInt(g.member_count) || 0,
        isPrivate: isActiveVal(g.is_private),
        coverImage: g.cover_image 
          ? getImageUrl(g.cover_image)
          : 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400',
        createdAt: new Date(g.created_at).toLocaleDateString('vi-VN'),
        status: isActiveVal(g.is_active) ? 'active' : 'hidden',
        owner: g.owner || g.username || 'Admin',
        reports: parseInt(g.reports_count) || 0
      })));
      
      setTotalPages(pagination?.total_pages || 1);
      setGroupStats(statsRes?.data?.data || statsRes?.data || null);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGroups();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage]);

  const stats = [
    { label: 'Tổng số nhóm', value: groupStats?.total || '0', change: '+5%', icon: <UsersRound className="text-blue-500" /> },
    { label: 'Đang hoạt động', value: groupStats?.active || '0', change: '+2%', icon: <CheckCircle className="text-emerald-500" /> },
    { label: 'Bị báo cáo', value: groupStats?.reported || '0', change: '+1', icon: <AlertTriangle className="text-rose-500" /> },
  ];

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesTab = activeTab === 'active' ? group.status === 'active' : group.status === 'hidden';
      const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
      let matchesRange = true;
      if (memberRange === 'small') matchesRange = group.memberCount < 1000;
      else if (memberRange === 'medium') matchesRange = group.memberCount >= 1000 && group.memberCount < 10000;
      else if (memberRange === 'large') matchesRange = group.memberCount >= 10000;

      return matchesTab && matchesCategory && matchesRange;
    });
  }, [groups, activeTab, categoryFilter, memberRange]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
      await adminGroupService.updateGroupStatus(id, newStatus);
      alert(`Đã ${newStatus === 'active' ? 'hiển thị lại' : 'tạm ẩn'} nhóm!`);
      fetchGroups();
    } catch { alert("Cập nhật trạng thái thất bại!"); }
  };

  const handleDelete = async (id: string) => {
    requestConfirm('Xóa nhóm vĩnh viễn', 'Bạn có chắc chắn muốn xóa vĩnh viễn nhóm này?', async () => {
      try {
        await adminGroupService.deleteGroup(id);
        fetchGroups();
      } catch { alert("Xóa nhóm thất bại!"); }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Hội nhóm</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium font-vietnam">Giám sát hoạt động và điều phối các cộng đồng du lịch.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
              <Download size={18} /> Xuất dữ liệu
            </button>
            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
              <FolderOpen size={18} /> Quản lý danh mục
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {stats.map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.25rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">{stat.icon}</div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-2xl">
               {[
                 { id: 'active', label: 'Hoạt động', icon: <CheckCircle size={14} />, count: groupStats?.active || 0 },
                 { id: 'hidden', label: 'Đang ẩn', icon: <EyeOff size={14} />, count: groupStats?.hidden || 0 },
               ].map((tab) => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={clsx("px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === tab.id ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")}>
                    {tab.icon} {tab.label} <span className="opacity-40 tabular-nums">({tab.count})</span>
                 </button>
               ))}
            </div>

            <div className="relative w-full lg:w-80">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Search size={18} /></span>
              <input type="text" placeholder="Tìm tên nhóm, quản trị viên..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest"><Filter size={14} /> Bộ lọc:</div>
            <select className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100 transition-colors" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
               <option value="all">Tất cả danh mục</option>
               <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
               <option value="Khám phá">Khám phá</option>
               <option value="Ẩm thực">Ẩm thực</option>
               <option value="Phượt">Phượt</option>
            </select>
            <select className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100 transition-colors" value={memberRange} onChange={(e) => setMemberRange(e.target.value)}>
               <option value="all">Quy mô thành viên</option>
               <option value="small">Dưới 1,000</option>
               <option value="medium">1,000 - 10,000</option>
               <option value="large">Trên 10,000</option>
            </select>
            <button onClick={() => { setCategoryFilter('all'); setMemberRange('all'); setSearchTerm(''); }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline ml-auto">Đặt lại mặc định</button>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGroups.length > 0 ? filteredGroups.map(group => (
            <div key={group.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all flex flex-col group/card">
              <div className="h-44 relative overflow-hidden">
                 <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 cursor-pointer" onClick={() => navigate(`/admin/groups/${group.id}`)} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                 <div className="absolute top-4 left-4"><span className="px-3 py-1 rounded-xl bg-white/90 backdrop-blur-md text-[9px] font-black text-slate-800 uppercase tracking-widest">{group.category}</span></div>
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all">
                    <button onClick={() => handleDelete(group.id)} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all"><Trash2 size={16} /></button>
                 </div>
                 <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-bold">
                    <div className="flex items-center gap-1.5">{group.isPrivate ? <Lock size={12} className="opacity-70" /> : <Globe size={12} className="text-emerald-400" />}<span className="text-[10px] uppercase">{group.isPrivate ? 'Riêng tư' : 'Công khai'}</span></div>
                    {group.reports > 0 && <span className="flex items-center gap-1 text-[10px] text-rose-300 bg-black/40 px-2 py-0.5 rounded-lg border border-rose-300/30"><AlertTriangle size={10} /> {group.reports} Báo cáo</span>}
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                 <div className="flex-1 space-y-2">
                    <h3 className="font-black text-slate-900 text-xl leading-tight hover:text-pastel-orange cursor-pointer transition-colors" onClick={() => navigate(`/admin/groups/${group.id}`)}>{group.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">Quản trị: <span className="text-slate-900 font-bold hover:underline cursor-pointer">@{group.owner}</span></p>
                 </div>
                 <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex flex-col"><span className="text-2xl font-black text-slate-900 tabular-nums leading-none">{group.memberCount.toLocaleString()}</span><span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">Thành viên</span></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleToggleStatus(group.id, group.status)} className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", group.status === 'active' ? "bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600 border-slate-50" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-50")}>{group.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />} {group.status === 'active' ? 'Ẩn' : 'Hiện'}</button>
                        <button onClick={() => navigate(`/admin/groups/${group.id}`)} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><ExternalLink size={16} /></button>
                    </div>
                 </div>
              </div>
            </div>
          )) : <div className="col-span-full py-20 text-center text-slate-400 font-medium italic bg-white rounded-[2.5rem]">Không tìm thấy hội nhóm nào trong danh mục này</div>}
        </motion.div>
      )}
      
      <div className="flex items-center justify-center gap-2 mt-12">
         <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"><ChevronLeft size={20} /></button>
         <div className="flex gap-2 px-4">{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={clsx("w-12 h-12 rounded-2xl text-sm font-bold transition-all shadow-sm", currentPage === page ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50")}>{page}</button>))}</div>
         <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"><ChevronRight size={20} /></button>
      </div>

      <AnimatePresence>
        {isConfirmModalOpen && confirmConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsConfirmModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{confirmConfig.title}</h3>
                <p className="text-slate-500 font-medium mb-8">
                  {confirmConfig.message}
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmExecute}
                    className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
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

export default AdminGroupListPage;
