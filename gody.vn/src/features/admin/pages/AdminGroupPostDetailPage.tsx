import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  CheckCircle,
  Clock,
  Archive,
  Flag,
  Trash2,
  Share2,
  X,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { postService } from '../../../services/postService';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import ImageGalleryGrid from '../../../shared/components/common/ImageGalleryGrid';

const AdminGroupPostDetailPage = () => {
  const params = useParams();
  const id = params.id || params.postId;
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response: any = await postService.getPostById(id);
      if (response?.data) {
        const p = response.data;
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace('/api', '');
        setPost({
          id: p.id.toString(),
          title: p.title || '',
          author: {
            id: p.user_id,
            name: p.username || 'User',
            avatar: p.avatar ? getImageUrl(p.avatar) : `https://ui-avatars.com/api/?name=${p.username}&background=random`
          },
          content_html: p.content || '',
          images: p.images ? (Array.isArray(p.images) ? p.images.map((img: string) => getImageUrl(img)) : [getImageUrl(p.images)]) : p.image ? [getImageUrl(p.image)] : p.cover_image ? [getImageUrl(p.cover_image)] : [],
          status: p.status || 'published',
          views: parseInt(p.views) || 0,
          likes: parseInt(p.like_count) || 0,
          comments_count: parseInt(p.comment_count) || 0,
          createdAt: new Date(p.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(p.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (error) {
      console.error("Failed to fetch post", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    try {
      const response: any = await postService.getPostComments(id);
      if (response?.data) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace('/api', '');
        setComments(response.data.map((c: any) => ({
           id: c.id,
           parentId: c.parent_id,
           user: c.username || 'User',
           avatar: c.avatar ? getImageUrl(c.avatar) : `https://ui-avatars.com/api/?name=${c.username}&background=random`,
           content: c.content,
           time: new Date(c.created_at).toLocaleString('vi-VN')
        })));
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const handleAction = async (type: string) => {
    if (!post) return;
    try {
      if (type === 'delete') {
        requestConfirm('Xóa bài đăng', 'Bạn có chắc chắn muốn xóa bài đăng này?', async () => {
          await postService.deletePost(post.id);
          navigate(-1);
        });
      } else if (type === 'approve') {
        await postService.updatePostStatus(post.id, 'published');
        alert("Đã duyệt bài đăng!");
        fetchPost();
      } else if (type === 'hide') {
        await postService.updatePostStatus(post.id, 'archived');
        alert("Đã ẩn bài đăng!");
        fetchPost();
      }
    } catch (error) {
      alert("Thao tác thất bại!");
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    requestConfirm('Xóa bình luận', 'Bạn có chắc chắn muốn xóa bình luận này?', async () => {
      try {
        await postService.deleteComment(commentId);
        fetchComments();
      } catch (error) {
        alert("Xóa bình luận thất bại!");
      }
    });
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

  if (!post) return (
    <div className="text-center py-20">
       <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy bài đăng</h2>
       <button onClick={() => navigate(-1)} className="mt-4 text-pastel-orange font-bold">Quay lại</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {getStatusBadge(post.status)}
            <h1 className="text-xl font-bold text-slate-900 line-clamp-1 max-w-md">Chi tiết bài đăng</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-semibold text-sm" onClick={() => handleAction('delete')}>
             <Trash2 size={18} /> Gỡ bài
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
           {/* Post Card */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
               <div className="flex items-center gap-4 mb-6">
                  <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full border border-slate-100" />
                  <div>
                     <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
                     <p className="text-[11px] font-medium text-slate-400 mt-0.5">{post.createdAt}</p>
                  </div>
               </div>
               
               {post.title && <h2 className="text-lg font-bold text-slate-800 mb-4">{post.title}</h2>}

               <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[15px]" 
                    dangerouslySetInnerHTML={{ __html: post.content_html }}>
               </div>

                {post.images && post.images.length > 0 && (
                  <div className="mt-6">
                     <ImageGalleryGrid images={post.images} />
                  </div>
                )}
           </div>

           {/* Comments Section */}
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle size={22} className="text-pastel-orange" />
                  Bình luận ({comments.length})
                </h3>
              </div>

              <div className="space-y-6">
                 {comments.map(comment => (
                   <div key={comment.id} className={`flex gap-4 group ${comment.parentId ? 'ml-12 relative' : ''}`}>
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
                 {comments.length === 0 && <p className="text-center text-slate-400 italic py-4">Chưa có bình luận nào.</p>}
              </div>
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6">Tương tác bài đăng</h3>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Eye size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Lượt xem</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{post.views}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-orange-50 text-pastel-orange rounded-xl flex items-center justify-center"><ThumbsUp size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Yêu thích</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{post.likes}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><MessageCircle size={20} /></div>
                       <span className="text-sm font-medium text-slate-500">Bình luận</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{comments.length}</span>
                 </div>
              </div>
           </div>

           <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                 <Flag size={18} className="fill-rose-600" />
                 <h3 className="font-bold text-sm">Báo cáo vi phạm (0)</h3>
              </div>
              <p className="text-xs text-rose-500">Chưa có báo cáo vi phạm nào cho bài đăng này.</p>
           </div>
        </div>
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

export default AdminGroupPostDetailPage;
