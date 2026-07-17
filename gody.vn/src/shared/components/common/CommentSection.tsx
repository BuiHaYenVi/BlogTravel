import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Loader2, Heart, MessageCircle, MoreHorizontal, Flag, EyeOff, Eye, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { formatRelativeTime } from '../../utils/dateHelper';
import ReportModal from '../../../components/modals/ReportModal';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar: string;
  content: string;
  created_at: string;
  reply_count: number;
  like_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  groupId?: string;
  onCommentSubmit?: (content: string, parentId?: string) => Promise<boolean>;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, groupId, onCommentSubmit }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{id: string, name: string} | null>(null);

  // State quản lý bình luận
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const getAvatarUrl = (path: string | null) => {
    if (!path) return 'https://i.pravatar.cc/100?u=default';
    if (path.startsWith('http')) return path;
    const BASE_API = import.meta.env.VITE_API_URL || '';
    const ASSETS_URL = BASE_API.replace('/api', '');
    return `${ASSETS_URL}${path}`;
  };

  const fetchComments = async (silent = false) => {
    if (!postId) return;
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`posts/${postId}/comments`);
      if (response.data.success) {
        setComments(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch comments failed:', error);
      setComments([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLikeToggle = async (commentId: string) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thực hiện!');
      return;
    }

    try {
      // Tìm comment đệ quy để update UI nhanh
      const findAndToggle = (list: Comment[]): Comment[] => {
        return list.map(c => {
          if (String(c.id) === String(commentId)) {
            const isLikedNow = !c.is_liked;
            const newCount = (parseInt(String(c.like_count || 0))) + (isLikedNow ? 1 : -1);
            return { ...c, is_liked: isLikedNow, like_count: newCount };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: findAndToggle(c.replies) };
          }
          return c;
        });
      };

      // Tìm comment để biết trạng thái hiện tại (để gọi API tương ứng)
      const findComment = (list: Comment[]): Comment | null => {
        for (const c of list) {
          if (String(c.id) === String(commentId)) return c;
          if (c.replies) {
            const found = findComment(c.replies);
            if (found) return found;
          }
        }
        return null;
      };

      const target = findComment(comments);
      if (!target) return;

      // Update UI trước cho mượt
      setComments(prev => findAndToggle(prev));

      // Gọi API
      if (target.is_liked) {
        await api.delete(`comments/${commentId}/like`);
      } else {
        await api.post(`comments/${commentId}/like`);
      }
    } catch (error) {
      console.error('Toggle like failed:', error);
      fetchComments(true);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // ==================== PHÂN QUYỀN ====================
  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    if (String(comment.user_id) === String(user.id)) return true;
    if ((user as any).role_level >= 50) return true;
    return false;
  };
  const canHideGlobal = () => !!user && (user as any).role_level >= 50;
  const canHideForMe = () => !!user;
  const canReportComment = (comment: Comment) => !!user && String(comment.user_id) !== String(user.id);

  // ==================== HANDLERS ====================
  const handleDeleteComment = async () => {
    if (!deletingCommentId || isDeletingComment) return;
    setIsDeletingComment(true);
    try {
      const res = await api.delete(`/comments/${deletingCommentId}`);
      if (res.data.success) {
        const rm = (list: Comment[]): Comment[] =>
          list.filter(c => c.id !== deletingCommentId).map(c => ({ ...c, replies: c.replies ? rm(c.replies) : [] }));
        setComments(prev => rm(prev));
      }
    } catch (e) { console.error(e); }
    finally {
      setIsDeletingComment(false);
      setShowCommentDeleteModal(false);
      setDeletingCommentId(null);
    }
  };

  const handleHideForMe = async (commentId: string) => {
    try {
      await api.post(`/comments/${commentId}/hide-for-me`);
      const rm = (list: Comment[]): Comment[] =>
        list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: c.replies ? rm(c.replies) : [] }));
      setComments(prev => rm(prev));
    } catch (e) { console.error(e); }
    setOpenCommentMenuId(null);
  };

  const handleGlobalHide = async (commentId: string) => {
    try {
      const res = await api.patch(`/comments/${commentId}/hide`);
      if (res.data.success) {
        const rm = (list: Comment[]): Comment[] =>
          list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: c.replies ? rm(c.replies) : [] }));
        setComments(prev => rm(prev));
      }
    } catch (e) { console.error(e); }
    setOpenCommentMenuId(null);
  };

  const handleSubmit = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    
    const success = onCommentSubmit 
      ? await onCommentSubmit(commentText, replyTo?.id)
      : false;

    if (success) {
      setCommentText('');
      setReplyTo(null);
      await fetchComments(true); // Silent update
    }
    setSubmitting(false);
  };

  const CommentItem: React.FC<{ comment: Comment, depth?: number }> = ({ comment, depth = 0 }) => {
    const isReply = depth > 0;
    return (
      <div className={`group ${isReply ? 'mt-4' : 'mt-8 first:mt-0'}`}>
        <div className="flex gap-3 md:gap-4">
          <img 
            src={getAvatarUrl(comment.avatar)} 
            className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm shrink-0 object-cover cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all" 
            alt={comment.username}
            onClick={() => navigate(`/profile/${comment.user_id}`)}
          />
          <div className="flex-1 min-w-0">
            <div className="bg-slate-50 rounded-[1.2rem] p-4 mb-2 group-hover:bg-slate-100/50 transition-colors relative">
              <div className="flex justify-between items-start mb-1">
                <div className="min-w-0">
                  <span 
                    className="font-black text-gray-900 text-[13px] block truncate cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                  >{comment.full_name || comment.username}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-gray-600 font-medium leading-relaxed break-words">{comment.content}</p>
            </div>
            
            <div className="flex items-center gap-4 px-3">
              <button 
                onClick={() => handleLikeToggle(comment.id)}
                className={`flex items-center gap-1.5 text-[9px] font-black transition-colors ${comment.is_liked ? 'text-pastel-orange' : 'text-gray-400 hover:text-pastel-orange'}`}
              >
                <Heart size={14} fill={comment.is_liked ? "currentColor" : "none"} /> {comment.like_count || 0} THÍCH
              </button>
              <button 
                onClick={() => setReplyTo({id: comment.id, name: comment.full_name || comment.username})}
                className={`flex items-center gap-1.5 text-[9px] font-black transition-colors ${replyTo?.id === comment.id ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
              >
                <MessageCircle size={14} /> PHẢN HỒI
              </button>

              {/* Mini-menu 3 chấm */}
              {user && (
                <div className="relative ml-auto">
                  <button
                    onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                    className="p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-slate-100 transition-all"
                  >
                    <MoreHorizontal size={13} />
                  </button>

                  <AnimatePresence>
                    {openCommentMenuId === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-7 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 min-w-[170px] py-1.5 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        {canHideForMe() && (
                          <button onClick={() => handleHideForMe(comment.id)}
                            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-gray-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                            <EyeOff size={13} /> Ẩn bình luận này
                          </button>
                        )}
                        {canReportComment(comment) && (
                          <button onClick={() => { setReportingCommentId(comment.id); setShowCommentReportModal(true); setOpenCommentMenuId(null); }}
                            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-gray-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                            <Flag size={13} /> Báo cáo
                          </button>
                        )}
                        {canHideGlobal() && (
                          <button onClick={() => handleGlobalHide(comment.id)}
                            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-yellow-600 hover:bg-yellow-50 flex items-center gap-2.5 transition-colors">
                            <Eye size={13} /> Ẩn khỏi tất cả
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => { setDeletingCommentId(comment.id); setShowCommentDeleteModal(true); setOpenCommentMenuId(null); }}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                              <Trash2 size={13} /> Xóa bình luận
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <div className={`ml-2 border-l-2 border-slate-50 mt-4 space-y-4 ${depth >= 2 ? 'pl-0' : 'pl-4'}`}>
                {comment.replies.map((reply: Comment) => (
                  <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-pastel-orange" size={32} />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-12">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-50">
        <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <div className="w-1.5 h-8 bg-pastel-orange rounded-full"></div>
          Thảo luận cộng đồng
        </h4>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          {comments.length} Bình luận
        </span>
      </div>

      {/* Input Box */}
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden shrink-0 shadow-md border-2 border-white">
          <img src={getAvatarUrl(user?.avatar || null)} className="w-full h-full object-cover" alt="Me" />
        </div>
        <div className="flex-1">
          {replyTo && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex items-center justify-between bg-orange-50 px-4 py-2 rounded-xl text-[10px] font-black text-pastel-orange uppercase tracking-widest border border-orange-100"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={12} /> Đang trả lời {replyTo.name}
              </span>
              <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 font-black">Hủy</button>
            </motion.div>
          )}
          <div className="relative group">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={replyTo ? `Trả lời ${replyTo.name}...` : "Viết bình luận của bạn..."}
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-4.5 pl-6 pr-24 outline-none focus:ring-4 focus:ring-pastel-orange/5 focus:bg-white focus:border-pastel-orange/20 transition-all font-medium text-sm shadow-sm"
            />
            <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
              <button className="p-2 text-slate-300 hover:text-pastel-orange transition-all hover:scale-110">
                <Smile size={20} />
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !commentText.trim()}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center min-w-[50px]"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        )) : (
          <div className="text-center py-16 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
            <MessageCircle className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Hãy là người đầu tiên để lại bình luận</p>
          </div>
        )}
      </div>
    </div>

    {/* ReportModal bình luận */}
    <ReportModal
      isOpen={showCommentReportModal}
      onClose={() => { setShowCommentReportModal(false); setReportingCommentId(null); }}
      reportableType="comment"
      reportableId={reportingCommentId || ''}
      title="Báo cáo bình luận"
    />

    {/* Modal xác nhận xóa */}
    <AnimatePresence>
      {showCommentDeleteModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCommentDeleteModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10">
            <h3 className="text-lg font-black text-gray-900 mb-2">Xóa bình luận</h3>
            <p className="text-sm text-gray-500 mb-6">Bình luận sẽ bị xóa vĩnh viễn. Bạn có chắc không?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowCommentDeleteModal(false); setDeletingCommentId(null); }}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-gray-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleDeleteComment} disabled={isDeletingComment}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
                {isDeletingComment ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>);
};

export default CommentSection;
