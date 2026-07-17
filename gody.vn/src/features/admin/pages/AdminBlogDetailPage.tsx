import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  Archive,
  MoreVertical,
  Flag,
  Trash2,
  Share2,
  X
} from 'lucide-react';
import { blogService } from '../../../services/blogService';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const AdminBlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlog = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response: any = await blogService.getBlogById(id);
      if (response?.data) {
        const b = response.data;
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace('/api', '');
        setBlog({
          id: b.id.toString(),
          title: b.title || 'Untitled',
          author: {
            id: b.user_id,
            name: b.username || 'User',
            avatar: b.avatar ? getImageUrl(b.avatar) : `https://i.pravatar.cc/150?u=${b.user_id}`
          },
          coverImage: b.cover_image ? getImageUrl(b.cover_image) : 'https://images.unsplash.com/photo-1506197603052-3c3218524458?w=1200',
          content_html: b.content || '',
          status: b.status || 'published',
          views: parseInt(b.views) || 0,
          likes: parseInt(b.like_count) || 0,
          comments_count: parseInt(b.comment_count) || 0,
          createdAt: new Date(b.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(b.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (error) {
      console.error("Failed to fetch blog", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    try {
      const response: any = await blogService.getBlogComments(id);
      if (response?.data) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace('/api', '');
        setComments(response.data.map((c: any) => ({
           id: c.id,
           parentId: c.parent_id,
           user: c.username || 'User',
           avatar: c.avatar && c.avatar !== 'default-avatar.png' ? getImageUrl(c.avatar) : `https://ui-avatars.com/api/?name=${c.username}&background=random`,
           content: c.content,
           time: new Date(c.created_at).toLocaleString('vi-VN')
        })));
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [id]);

  const handleAction = async (type: string) => {
    if (!blog) return;
    try {
      if (type === 'delete') {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
        await blogService.deleteBlog(blog.id);
        alert("Đã xóa bài viết!");
        navigate('/admin/blogs');
      } else if (type === 'approve') {
        await blogService.updateBlogStatus(blog.id, 'published');
        alert("Đã duyệt bài viết!");
        fetchBlog();
      } else if (type === 'hide') {
        await blogService.updateBlogStatus(blog.id, 'archived');
        alert("Đã ẩn bài viết!");
        fetchBlog();
      }
    } catch (error) {
      alert("Thao tác thất bại!");
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await blogService.deleteComment(commentId);
      alert("Đã xóa bình luận!");
      fetchComments(); // Reload comments after deletion
    } catch (error) {
      alert("Xóa bình luận thất bại!");
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'published':
      case 'active':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider"><CheckCircle size={12} /> Công khai</span>;
      case 'pending':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold uppercase tracking-wider"><Clock size={12} /> Chờ duyệt</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider"><X size={12} /> Từ chối</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider"><Archive size={12} /> Đã ẩn</span>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[500px]">
       <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!blog) return (
    <div className="text-center py-20">
       <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
       <button onClick={() => navigate('/admin/blogs')} className="mt-4 text-pastel-orange font-bold">Quay lại danh sách</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm group"
            title="Quay lại trang trước"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-2">
            {getStatusBadge(blog.status)}
            <button 
              onClick={() => {
                console.log("Navigating to Blog List...");
                navigate('/admin/blogs');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-sm group"
              title="Thoát về Quản lý Blog"
            >
              <X size={12} className="group-hover:rotate-90 transition-transform duration-300" />
              Về QL Blog
            </button>
            <h1 className="text-xl font-bold text-slate-900 line-clamp-1 max-w-md ml-2">{blog.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
             <Share2 size={18} />
           </button>
           <button className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-semibold text-sm">
             <Trash2 size={18} /> Gỡ bài
           </button>
           <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm">
             Chỉnh sửa bài viết
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
           {/* Article Body */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="w-full h-80 overflow-hidden">
                <img src={blog.coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                 <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-3">
                      <img src={blog.author.avatar} alt={blog.author.name} className="w-12 h-12 rounded-full border-2 border-slate-50" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{blog.author.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Tác giả</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400">Ngày đăng</p>
                       <p className="text-sm font-semibold text-slate-700 mt-1">{blog.createdAt}</p>
                    </div>
                 </div>

                 <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed" 
                      dangerouslySetInnerHTML={{ __html: blog.content_html }}>
                 </div>
              </div>
           </div>

           {/* Comments Section */}
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle size={22} className="text-pastel-orange" />
                  Bình luận ({blog.comments_count})
                </h3>
                <button className="text-sm font-bold text-pastel-orange hover:underline">Phê duyệt hàng loạt</button>
              </div>

              <div className="space-y-6">
                 {comments.map(comment => (
                   <div key={comment.id} className={`flex gap-4 group ${comment.parentId ? 'ml-12 relative' : ''}`}>
                      {/* Decorative connecting line for replies */}
                      {comment.parentId && (
                         <div className="absolute -left-8 top-5 w-6 h-6 border-b-2 border-l-2 border-slate-200 rounded-bl-xl"></div>
                      )}
                      <img src={comment.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-100 flex-shrink-0 relative z-10" />
                      <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="text-sm font-bold text-slate-900">{comment.user}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400 font-medium">{comment.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleDeleteComment(comment.id)}
                               className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white transition-colors rounded-lg shadow-sm" title="Xóa bình luận"
                             >
                               <Trash2 size={14} />
                             </button>
                             <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-white transition-colors rounded-lg shadow-sm" title="Đánh dấu vi phạm">
                               <Flag size={14} />
                             </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pr-8">{comment.content}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <button className="mt-8 w-full py-3 text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                 Xem thêm bình luận
              </button>
           </div>
        </div>

        {/* Sidebar Sidebar */}
        <div className="space-y-6">
           {/* Summary Stats */}
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6">Chỉ số tương tác</h3>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Eye size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Lượt xem</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{blog.views}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-orange-50 text-pastel-orange rounded-xl flex items-center justify-center"><ThumbsUp size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Yêu thích</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{blog.likes}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><MessageCircle size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Bình luận</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{blog.comments_count}</span>
                 </div>
              </div>
           </div>

           {/* Reported Section Placeholder */}
           <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                 <Flag size={18} className="fill-rose-600" />
                 <h3 className="font-bold text-sm">Báo cáo vi phạm (0)</h3>
              </div>
              <p className="text-xs text-rose-500">Chưa có báo cáo vi phạm nào cho bài viết này.</p>
           </div>

           {/* Quick Settings */}
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Tác vụ nhanh</h3>
              <div className="space-y-2">
                 <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Đẩy bài viết lên trang chủ
                 </button>
                 <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Thay đổi trạng thái lưu trữ
                 </button>
                 <button className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                    Khóa quyền bình luận
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogDetailPage;
