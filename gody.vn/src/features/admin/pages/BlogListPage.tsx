import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  BookOpen, 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  Calendar,
  CheckCircle,
  Clock,
  Archive,
  ExternalLink,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  EyeOff,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Blog Type
interface Blog {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorAvatar: string;
  coverImage: string;
  status: 'published' | 'pending' | 'rejected' | 'archived' | 'scheduled';
  views: number;
  comments: number;
  likes: number;
  reports: number;
  createdAt: string;
  publishAt?: string;
}

import { blogService } from '../../../services/blogService';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const BlogListPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  
  // Selection state
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<keyof Blog>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Modals
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: string, ids: string[]}>({
    isOpen: false,
    type: '',
    ids: []
  });
  const [editBlog, setEditBlog] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response: any = await blogService.getBlogs(currentPage, itemsPerPage, searchTerm, statusFilter);
      if (response?.data?.data) {
        setBlogs(response.data.data.map((b: any) => ({
          id: b.id.toString(),
          title: b.title || 'Untitled',
          excerpt: b.content?.substring(0, 100) + '...',
          author: b.username || 'User',
          authorAvatar: b.avatar ? getImageUrl(b.avatar) : `https://i.pravatar.cc/150?u=${b.user_id}`,
          coverImage: b.cover_image && b.cover_image !== '' ? getImageUrl(b.cover_image) : 'https://images.unsplash.com/photo-1506197603052-3c3218524458?w=400',
          status: b.status || 'published',
          views: parseInt(b.views) || 0,
          likes: 0,
          comments: 0,
          reports: 0,
          createdAt: new Date(b.created_at).toLocaleDateString('vi-VN')
        })));
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch blogs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBlogs();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, statusFilter, reportFilter, sortField, sortOrder]);

  // Selected for Preview (Removed in favor of direct navigation)

  const handleSort = (field: keyof Blog) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBlog) return;
    setIsSubmitting(true);
    try {
      await blogService.updateBlog(editBlog.id, {
        title: editBlog.title,
        status: editBlog.status
      });
      alert("Cập nhật blog thành công!");
      setEditBlog(null);
      fetchBlogs();
    } catch (error) {
      alert("Cập nhật thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginatedBlogs = blogs;

  const handleAction = async (type: string, ids: string[]) => {
    if (type === 'delete' || type === 'bulk_delete') {
      setConfirmModal({ isOpen: true, type, ids });
      return;
    }
    // ... rest of simple actions
    processAction(type, ids);
  };

  const processAction = async (type: string, ids: string[]) => {
    try {
      if (type === 'delete' || type === 'bulk_delete') {
        await Promise.all(ids.map(id => blogService.deleteBlog(id)));
        alert("Đã xóa blog thành công!");
      } else if (type === 'approve' || type === 'restore') {
        await Promise.all(ids.map(id => blogService.updateBlogStatus(id, 'published')));
        alert(type === 'approve' ? "Đã duyệt blog thành công!" : "Đã hiển thị lại blog!");
      } else if (type === 'hide') {
        await Promise.all(ids.map(id => blogService.updateBlogStatus(id, 'archived')));
        alert("Đã ẩn blog thành công!");
      }
      fetchBlogs();
      setSelectedBlogs([]);
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (error) {
      alert("Thao tác thất bại!");
    }
  };

  const toggleSelectAll = () => {
    if (selectedBlogs.length === paginatedBlogs.length && paginatedBlogs.length > 0) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(paginatedBlogs.map(b => b.id));
    }
  };

  const toggleSelectBlog = (id: string) => {
    if (selectedBlogs.includes(id)) {
      setSelectedBlogs(selectedBlogs.filter(bid => bid !== id));
    } else {
      setSelectedBlogs([...selectedBlogs, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'published':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle size={12} /> Công khai
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
            <X size={12} /> Từ chối
          </span>
        );
      case 'archived':
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Archive size={12} /> Đã ẩn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
             {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Blog</h1>
          <p className="text-slate-500 text-sm mt-1">Kiểm duyệt blog, quản lý báo cáo và bình luận từ cộng đồng.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
              <Archive size={18} />
              Kho lưu trữ
            </button>
            <button onClick={() => fetchBlogs()} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
              <BookOpen size={18} />
              Làm mới dữ liệu
            </button>
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedBlogs.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border border-slate-800"
          >
             <div className="flex items-center gap-3 border-r border-slate-700 pr-8">
                <span className="bg-pastel-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-pastel-orange/20">{selectedBlogs.length}</span>
                <span className="text-sm font-bold">Blog được chọn</span>
             </div>
             <div className="flex items-center gap-5">
                <button onClick={() => handleAction('hide', selectedBlogs)} className="flex items-center gap-2 hover:text-amber-400 transition-colors text-sm font-bold">
                   <EyeOff size={18} /> Ẩn blog
                </button>
                <button onClick={() => handleAction('bulk_delete', selectedBlogs)} className="flex items-center gap-2 hover:text-rose-400 transition-colors text-sm font-bold">
                   <Trash2 size={18} /> Xóa
                </button>
             </div>
             <button onClick={() => setSelectedBlogs([])} className="ml-4 text-xs text-slate-400 hover:text-white underline font-medium">Hủy</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Navigation */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap bg-slate-50 p-1.5 rounded-2xl w-full xl:w-auto">
            {['all', 'archived', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                  statusFilter === status 
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {status === 'all' ? 'Tất cả' : 
                 status === 'archived' ? 'Đã ẩn' : 'Từ chối'}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
             <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Search size={18} />
                </span>
                <input 
                  type="text" 
                  placeholder="Tìm tiêu đề, tác giả..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
                <select 
                  className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold appearance-none"
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                >
                  <option value="all">Báo cáo: Tất cả</option>
                  <option value="reported">Có báo cáo vi phạm</option>
                  <option value="clean">Không có báo cáo</option>
                </select>
                <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors">
                   <Filter size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Content Table */}
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
                  <th className="px-6 py-5 w-12">
                    <button onClick={toggleSelectAll} className="text-slate-300 hover:text-pastel-orange transition-colors">
                        {selectedBlogs.length === paginatedBlogs.length && paginatedBlogs.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th 
                    className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Blog
                      {sortField === 'title' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  <th 
                    className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100/50 transition-colors"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Tương tác
                      {sortField === 'views' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors text-right"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Thời gian
                      {sortField === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedBlogs.map((blog) => (
                  <tr 
                    key={blog.id} 
                    className={clsx(
                      "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                      selectedBlogs.includes(blog.id) && "bg-orange-50/30"
                    )}
                    onClick={() => navigate(`/admin/blogs/${blog.id}`)}
                  >
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelectBlog(blog.id); }}>
                      <button className={clsx(
                        "transition-colors",
                        selectedBlogs.includes(blog.id) ? "text-pastel-orange" : "text-slate-200 group-hover:text-slate-300"
                      )}>
                          {selectedBlogs.includes(blog.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 max-w-[400px]">
                        <div className="relative flex-shrink-0 w-20 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-100">
                          <img 
                            src={blog.coverImage} 
                            alt="Cover" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1506197603052-3c3218524458?w=400'; }}
                          />
                          {blog.reports > 0 && (
                            <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 text-rose-500 shadow-sm border border-rose-100">
                                <AlertTriangle size={12} fill="currentColor" className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-pastel-orange transition-colors">{blog.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1.5">
                                <img src={blog.authorAvatar} className="w-5 h-5 rounded-full ring-1 ring-slate-100" />
                                <span className="text-[11px] font-bold text-slate-600">{blog.author}</span>
                            </div>
                            {blog.reports > 0 && (
                              <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <AlertTriangle size={10} /> {blog.reports} báo cáo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-5">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-slate-700">{blog.views >= 1000 ? `${(blog.views/1000).toFixed(1)}k` : blog.views}</span>
                          <div className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Views</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-pastel-orange">
                          <span className="text-sm font-bold">{blog.likes}</span>
                          <div className="text-[10px] opacity-60 font-medium tracking-tight uppercase">Likes</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-blue-500">
                          <span className="text-sm font-bold">{blog.comments}</span>
                          <div className="text-[10px] opacity-60 font-medium tracking-tight uppercase">Cmts</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-[11px] text-slate-500 font-bold whitespace-nowrap">
                        {blog.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 group/actions">
                        {(blog.status === 'archived' || blog.status === 'hidden' || blog.status === 'rejected') && (
                          <button onClick={() => handleAction('restore', [blog.id])} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Hiện blog / Duyệt blog">
                            <Check size={18} />
                          </button>
                        )}
                        {(blog.status === 'published' || blog.status === 'active' || blog.status === 'pending') && (
                          <button onClick={() => handleAction('hide', [blog.id])} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Ẩn blog">
                            <EyeOff size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditBlog({...blog})} 
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" 
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleAction('delete', [blog.id])} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                          <MoreVertical size={16} />
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
        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col">
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Thống kê nội dung</span>
               <p className="text-sm text-slate-600 font-medium">Hệ thống có tổng cộng <strong>{totalItems}</strong> blog.</p>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 disabled={currentPage === 1}
                 className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  <ChevronLeft size={20} />
               </button>
               <div className="flex gap-1.5 px-4 font-bold">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "w-10 h-10 rounded-xl text-sm transition-all",
                        currentPage === page ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100"
                      )}
                    >
                       {page}
                    </button>
                  ))}
               </div>
               <button 
                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                 disabled={currentPage === totalPages}
                 className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  <ChevronRight size={20} />
               </button>
            </div>
        </div>
      </div>

      {/* Preview Modal removed */}
      
      {/* Quick Edit Modal */}
      <AnimatePresence>
        {editBlog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setEditBlog(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa nhanh</h3>
                   <button onClick={() => setEditBlog(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                      <X size={20} />
                   </button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiêu đề blog</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-medium"
                        value={editBlog.title}
                        onChange={(e) => setEditBlog({...editBlog, title: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold appearance-none"
                        value={editBlog.status}
                        onChange={(e) => setEditBlog({...editBlog, status: e.target.value})}
                      >
                         <option value="archived">Đã ẩn</option>
                         <option value="rejected">Từ chối</option>
                      </select>
                   </div>
                   <div className="flex gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setEditBlog(null)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                         Hủy
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                         {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận xóa blog</h3>
              <p className="text-sm text-slate-500 text-center mb-8">
                Bạn có chắc chắn muốn XÓA VĨNH VIỄN <strong>{confirmModal.ids.length}</strong> blog đã chọn? Hành động này sẽ xóa dữ liệu khỏi database và không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => { processAction(confirmModal.type, confirmModal.ids); setConfirmModal({ ...confirmModal, isOpen: false }); }}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogListPage;
