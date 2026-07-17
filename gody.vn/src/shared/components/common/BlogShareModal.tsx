import React, { useState, useEffect } from 'react';
import { X, Send, Link as LinkIcon, Copy, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';
import { getShareUrl } from '../../utils/urlHelper';
import api from '../../services/api';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { useChatStore } from '../../../features/chat/store/useChatStore';
import { useToast } from '../../hooks/useToast';

interface Author {
  name: string;
  avatar: string;
}

interface BlogShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: {
    id: string;
    title: string;
    excerpt?: string;
    images?: string[];
    author?: Author;
  };
  onShareSuccess?: (newShareCount: number) => void;
}

const BlogShareModal: React.FC<BlogShareModalProps> = ({ isOpen, onClose, blog, onShareSuccess }) => {
  const { user } = useAuthStore();
  const { openChat, sendMessage } = useChatStore();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingToFriend, setSendingToFriend] = useState<string | null>(null);

  // ✅ FETCH BẠN BÈ (MUTUAL FOLLOWS)
  useEffect(() => {
    if (isOpen && user) {
      const fetchFriends = async () => {
        setLoadingFriends(true);
        try {
          const response = await api.get('/follow/mutual');
          if (response.data.success) {
            setFriends(response.data.data.friends || []);
          }
        } catch (error) {
          console.error('Failed to fetch friends:', error);
        } finally {
          setLoadingFriends(false);
        }
      };
      fetchFriends();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // ✅ CHIA SẺ VỀ TƯỜNG (REPOST)
  const handleShareToTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post(`/blogs/${blog.id}/share`, { content });
      if (response.data.success) {
        if (onShareSuccess) {
          onShareSuccess(response.data.data?.share_count);
        }
        showToast('Chia sẻ bài viết lên tường thành công!', 'success');
        onClose();
        setContent('');
      } else {
        showToast('Lỗi: ' + response.data.message, 'error');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      showToast('Lỗi khi chia sẻ: ' + (error.response?.data?.message || 'Vui lòng thử lại'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ GỬI QUA TIN NHẮN CHO BẠN BÈ
  const handleSendToFriend = async (friendId: string) => {
    setSendingToFriend(friendId);
    try {
      // 1. Mở hoặc tạo hội thoại (Sửa receiver_id -> user_id)
      const res: any = await api.post('chats/start', { user_id: friendId });
      if (res.data.success) {
        const convId = res.data.data.id.toString();
        const shareLink = getShareUrl(`/blog/${blog.id}`);
        const messageText = content.trim() 
          ? `${content}\n\n${shareLink}` 
          : `Mình muốn chia sẻ bài viết này với bạn:\n${shareLink}`;

        // 2. Gửi tin nhắn chứa link
        await sendMessage(convId, friendId, messageText);
        showToast('Đã gửi tin nhắn cho bạn bè!', 'success');
      }
    } catch (error) {
      console.error('Send to friend error:', error);
      showToast('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
    } finally {
      setSendingToFriend(null);
    }
  };

  const handleCopyLink = () => {
    const link = getShareUrl(`/blog/${blog.id}`);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-[500px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-50">
            <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">Chia sẻ bài viết</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto max-h-[75vh] no-scrollbar">
            {/* User Input Section */}
            <div className="flex gap-4 mb-6">
              <img 
                src={getImageUrl(user?.avatar)} 
                alt={user?.name} 
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-md shrink-0" 
              />
              <div className="flex-1">
                <h4 className="font-black text-slate-900 text-sm">{user?.name || user?.username || 'Bạn'}</h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hãy nói gì đó về nội dung này..."
                  className="w-full mt-2 text-sm text-slate-600 outline-none resize-none min-h-[70px] placeholder:text-slate-400 font-medium leading-relaxed"
                  autoFocus
                />
              </div>
            </div>

            {/* Original Post Preview (Facebook Style) */}
            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden mb-6 bg-slate-50/50">
              {blog.images && blog.images.length > 0 && (
                <div className="w-full h-[180px] overflow-hidden">
                  <img src={getImageUrl(blog.images[0])} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" alt="Preview" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black text-white bg-pastel-orange px-2 py-0.5 rounded-full uppercase tracking-widest">Blog</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {blog.author?.name || 'Tác giả'}
                  </span>
                </div>
                <h5 className="font-black text-slate-900 text-sm line-clamp-1 leading-snug">{blog.title}</h5>
                {blog.excerpt && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{blog.excerpt}</p>}
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-5">
              {/* Copy Link */}
              <button 
                onClick={handleCopyLink}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <LinkIcon size={18} />
                  </div>
                  <span className="font-bold text-slate-700 text-sm tracking-tight">Sao chép liên kết bài viết</span>
                </div>
                {copied ? (
                  <span className="text-blue-600 flex items-center gap-1.5 text-xs font-black bg-blue-100/50 px-3 py-1.5 rounded-full animate-in zoom-in-95 duration-200">
                    <CheckCircle2 size={14} /> Đã chép
                  </span>
                ) : (
                  <Copy size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                )}
              </button>

              {/* ✅ Gửi bằng tin nhắn - HIỆN THÔNG MINH */}
              {friends.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Gửi bằng tin nhắn</h4>
                    {loadingFriends && <Loader2 size={12} className="animate-spin text-slate-400" />}
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                    {friends.map(friend => (
                      <button 
                        key={friend.id} 
                        onClick={() => handleSendToFriend(friend.id)}
                        disabled={sendingToFriend === friend.id}
                        className="flex flex-col items-center gap-2 shrink-0 group relative w-20"
                      >
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md transition-all group-hover:scale-105 group-active:scale-95 bg-slate-50">
                            <img 
                              src={getImageUrl(friend.avatar)} 
                              alt={friend.full_name} 
                              className={cn(
                                "w-full h-full object-cover",
                                sendingToFriend === friend.id ? "opacity-40 grayscale" : "opacity-100"
                              )} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = 'true';
                                  target.src = 'http://localhost:90/Project_DuLichMXH/public/uploads/avatars/default.png';
                                }
                              }}
                            />
                          </div>
                          {sendingToFriend === friend.id && (
                             <div className="absolute inset-0 flex items-center justify-center">
                               <Loader2 size={20} className="animate-spin text-blue-600" />
                             </div>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-900 transition-colors truncate w-full text-center px-1">
                          {friend.full_name || friend.username}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-xs uppercase tracking-widest"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleShareToTimeline}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl font-black text-white bg-gradient-to-br from-blue-600 to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Chia sẻ ngay
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Helper function
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default BlogShareModal;
