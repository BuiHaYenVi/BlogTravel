import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Smile,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flag,
  EyeOff,
  Eye,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { getImageUrl } from '../../utils/imageHelper';
import api from '../../services/api';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { socketService } from '../../../services/socket/socketService';
import ActionDropdown from './ActionDropdown';
import Modal from './Modal';
import DeleteConfirmContent from './DeleteConfirmContent';
import BlogShareModal from './BlogShareModal';
import ReportModal from '../../../components/modals/ReportModal';
import { useThemeStore } from '../../store/useThemeStore';

/**
 * Utility to merge tailwind classes safely
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  parent_id?: string | null;
  replies?: Comment[];
  replies_total?: number;
  replies_page?: number;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  author_name?: string;
  author?: {
    id?: string;
    name: string;
    avatar: string;
  };
  user_id?: string;
  avatar?: string;
  images: string[];
  like_count?: number;
  likes?: number;
  is_liked?: boolean;
  isLiked?: boolean;
  comment_count?: number;
  commentCount?: number;
  created_at?: string;
  group_id?: number | string | null;
  is_group_member?: boolean;
}

interface PostCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onLikeToggle?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isGroupMember?: boolean;
}

const PostCommentModal: React.FC<PostCommentModalProps> = ({ isOpen, onClose, post: initialPost, onLikeToggle, onDelete, isGroupMember }) => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [post, setPost] = useState(initialPost);

  const memberStatus = isGroupMember !== undefined ? isGroupMember : post.is_group_member;
  const isRestricted = !!post.group_id && memberStatus === false;
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // State cho quản lý bình luận
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal post state if initialPost changes
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  // Normalize post data for display
  const normalizedPost = {
    id: post.id,
    authorId: post.user_id || post.author?.id || '',
    authorName: post.author_name || post.author?.name || 'Thành viên',
    authorAvatar: post.avatar || post.author?.avatar || '',
    content: post.content,
    title: post.title,
    images: post.images || [],
    likes: post.like_count ?? post.likes ?? 0,
    isLiked: post.is_liked ?? post.isLiked ?? false,
    commentCount: post.comment_count ?? post.commentCount ?? 0,
    createdAt: post.created_at || new Date().toISOString()
  };

  useEffect(() => {
    if (isOpen && normalizedPost.id) {
      fetchComments();

      // ✅ Socket.io Realtime Logic
      socketService.emit('join_post_room', normalizedPost.id);

      const handleNewComment = (newComment: Comment) => {
        if (!newComment.id) return;
        const commentWithMeta = {
          ...newComment,
          id: String(newComment.id),
          replies: newComment.replies || [],
          replies_total: newComment.replies_total || 0,
          reply_count: newComment.reply_count || 0
        };

        if (!newComment.parent_id) {
          setComments(prev => {
            if (prev.some(c => String(c.id) === String(commentWithMeta.id))) return prev;
            return [commentWithMeta, ...prev];
          });
        } else {
          // Cập nhật phản hồi vào đúng vị trí trong cây thay vì refetch toàn bộ
          const updateRecursive = (list: Comment[]): Comment[] => {
            return list.map(c => {
              if (String(c.id) === String(newComment.parent_id)) {
                const currentReplies = c.replies || [];
                if (currentReplies.some(r => String(r.id) === String(commentWithMeta.id))) return c;
                return {
                  ...c,
                  replies: [...currentReplies, commentWithMeta],
                  replies_total: (c.replies_total || 0) + 1,
                  reply_count: (c.reply_count || 0) + 1
                };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateRecursive(c.replies) };
              }
              return c;
            });
          };
          setComments(prev => updateRecursive(prev));
        }
      };

      socketService.on('receive_new_comment', handleNewComment);

      return () => {
        socketService.emit('leave_post_room', normalizedPost.id);
        socketService.off('receive_new_comment', handleNewComment);
      };
    }
  }, [isOpen, normalizedPost.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/posts/${normalizedPost.id}/comments?page=1&limit=10`);
      if (response.data.success) {
        const cdata = response.data.data;
        const rawList = Array.isArray(cdata.comments) ? cdata.comments : (Array.isArray(cdata) ? cdata : []);
        
        // Chuẩn hóa dữ liệu và lọc bỏ các item lỗi (không có ID)
        const commentsList = rawList
          .filter((c: any) => c && c.id)
          .map((c: any) => ({
            ...c,
            id: String(c.id),
            replies: c.replies || [],
            replies_total: c.replies_total || c.reply_count || 0
          }));

        setComments(commentsList);
        
        if (cdata.total !== undefined) {
           setTotalComments(cdata.total);
           setHasMore(commentsList.length < cdata.total);
        } else {
           setTotalComments(commentsList.length);
           setHasMore(false);
        }
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch comments', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreComments = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await api.get(`/posts/${normalizedPost.id}/comments?page=${nextPage}&limit=10`);
      if (response.data.success) {
        const cdata = response.data.data;
        const rawNew = cdata.comments || [];
        
        const normalizedNew = rawNew
          .filter((c: any) => c && c.id)
          .map((c: any) => ({
            ...c,
            id: String(c.id),
            replies: c.replies || [],
            replies_total: c.replies_total || c.reply_count || 0
          }));

        setComments(prev => {
          const existingIds = new Set(prev.map(c => String(c.id)));
          const uniqueNew = normalizedNew.filter((c: any) => !existingIds.has(String(c.id)));
          return [...prev, ...uniqueNew];
        });
        
        setPage(nextPage);
        if (cdata.total !== undefined) {
           setTotalComments(cdata.total);
           setHasMore((comments.length + normalizedNew.length) < cdata.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch more comments', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchMoreReplies = async (commentId: string) => {
    try {
      // Tìm trang hiện tại của phản hồi cho bình luận này
      let currentPage = 0; // Khởi đầu từ 0 để trang tiếp theo là 1
      const findComment = (list: Comment[]): Comment | null => {
        for (const c of list) {
          if (c.id === commentId) return c;
          if (c.replies) {
            const found = findComment(c.replies);
            if (found) return found;
          }
        }
        return null;
      };
      
      const targetComment = findComment(comments);
      if (targetComment) {
        // Nếu đã có replies thì lấy trang tiếp theo, nếu chưa có thì lấy trang 1
        currentPage = (targetComment.replies && targetComment.replies.length > 0) 
          ? (targetComment.replies_page || 1) 
          : 0;
      }

      const nextPage = currentPage + 1;
      // ✅ Đảm bảo limit=10 đồng bộ với Backend
      const response = await api.get(`/comments/${commentId}/replies?page=${nextPage}&limit=10`);
      
      if (response.data.success) {
        const cdata = response.data.data;
        // Đảm bảo lấy đúng mảng replies từ data trả về
        const newReplies = Array.isArray(cdata.replies) ? cdata.replies : (Array.isArray(cdata) ? cdata : []);
        
        const updateRepliesRecursive = (list: Comment[]): Comment[] => {
          return list.map(c => {
            if (c.id === commentId) {
              const currentReplies = c.replies || [];
              const existingIds = new Set(currentReplies.map(r => String(r.id)));
              const uniqueNewReplies = newReplies.filter((r: Comment) => r.id && !existingIds.has(String(r.id)));
              
              const updatedReplies = [...currentReplies, ...uniqueNewReplies];
              const totalOnServer = cdata.total !== undefined ? cdata.total : (cdata.replies_total !== undefined ? cdata.replies_total : c.replies_total);

              return { 
                ...c, 
                replies: updatedReplies,
                replies_page: nextPage,
                replies_total: totalOnServer,
                // Đồng bộ reply_count nếu cần
                reply_count: totalOnServer > (c.reply_count || 0) ? totalOnServer : c.reply_count
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateRepliesRecursive(c.replies) };
            }
            return c;
          });
        };
        
        setComments(prev => updateRepliesRecursive(prev));
      }
    } catch (error) {
      console.error('Failed to fetch more replies', error);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setCommentText(prev => prev + emojiData.emoji);
  };

  const handleReply = (comment: Comment) => {
    // ✅ Sửa lỗi @undefined: Lấy tên an toàn nhất từ mọi nguồn dữ liệu có thể
    const replyName = comment.full_name || comment.username || 'thành viên';
    
    // Luôn gửi đúng ID của bình luận được click. Backend sẽ lo việc Giới hạn 3 tầng.
    setReplyingTo({ id: comment.id, username: replyName });
    
    // Trải nghiệm Facebook: Tag tên người được phản hồi vào ô input
    setCommentText(`@${replyName} `);
    
    // Tự động focus vào ô nhập liệu
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    const content = commentText.trim();
    const currentParentId = replyingTo?.id;

    // Reset UI state
    setCommentText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setIsSubmitting(true);

    try {
      const response = await api.post(`/posts/${normalizedPost.id}/comments`, {
        content: content,
        parent_id: currentParentId
      });
      
      if (response.data.success) {
        // ✅ BẮT BUỘC REFETCH ĐỂ BACKEND TRẢ VỀ CẤU TRÚC 3 TẦNG CHUẨN
        await fetchComments();
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to post comment', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể kết nối server'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (onDelete) {
        await onDelete(normalizedPost.id);
      } else {
        // Default API delete
        let success = false;
        if (normalizedPost.title) {
          const response = await api.delete(`/blogs/${normalizedPost.id}`);
          success = response.data.success;
          if (success) {
              try {
                const { useBlogStore } = await import('../../../features/blog/store/useBlogStore');
                useBlogStore.setState(state => ({
                  blogs: state.blogs.filter((b: any) => b.id !== normalizedPost.id)
                }));
              } catch (e) {
                console.error('Failed to update blog store:', e);
              }
          }
        } else {
          const response = await api.delete(`/posts/${normalizedPost.id}`);
          success = response.data.success;
          if (success) {
            try {
              const { useGroupStore } = await import('../../../features/group/store/useGroupStore');
              const currentGroup = useGroupStore.getState().currentGroup;
              if (currentGroup) {
                useGroupStore.setState({
                  currentGroup: {
                    ...currentGroup,
                    posts: currentGroup.posts?.filter(p => String(p.id) !== String(normalizedPost.id))
                  }
                });
              }
            } catch (e) {
              console.error('Failed to update group store:', e);
            }
          }
        }
        if (success) {
          alert('Đã xóa bài viết thành công!');
        } else {
          alert('Xóa thất bại.');
        }
      }
      onClose();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể kết nối server'));
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLikePost = async () => {
    const previousPost = { ...post };
    const isCurrentlyLiked = normalizedPost.isLiked;
    
    setPost(prev => ({
      ...prev,
      is_liked: !isCurrentlyLiked,
      isLiked: !isCurrentlyLiked,
      like_count: (normalizedPost.likes) + (isCurrentlyLiked ? -1 : 1),
      likes: (normalizedPost.likes) + (isCurrentlyLiked ? -1 : 1)
    }));

    try {
      const response = await api.post(`/posts/${normalizedPost.id}/like`);
      if (response.data.success) {
        const { is_liked, like_count } = response.data.data;
        setPost(prev => ({
          ...prev,
          is_liked,
          isLiked: is_liked,
          like_count,
          likes: like_count
        }));
        onLikeToggle?.(normalizedPost.id);
      } else {
        setPost(previousPost);
      }
    } catch (error) {
      setPost(previousPost);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const previousComments = [...comments];
    
    const updateLikeRecursive = (list: Comment[]): Comment[] => {
      return list.map(comment => {
        if (comment.id === commentId) {
          const isCurrentlyLiked = comment.is_liked;
          return {
            ...comment,
            is_liked: !isCurrentlyLiked,
            like_count: (comment.like_count || 0) + (isCurrentlyLiked ? -1 : 1)
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateLikeRecursive(comment.replies) };
        }
        return comment;
      });
    };

    setComments(prev => updateLikeRecursive(prev));

    try {
      const response = await api.post(`/comments/${commentId}/like`);
      if (response.data.success) {
        const { is_liked, like_count } = response.data.data;
        const syncRecursive = (list: Comment[]): Comment[] => {
          return list.map(c => {
            if (c.id === commentId) return { ...c, is_liked, like_count };
            if (c.replies) return { ...c, replies: syncRecursive(c.replies) };
            return c;
          });
        };
        setComments(prev => syncRecursive(prev));
      } else {
        setComments(previousComments);
      }
    } catch (error) {
      setComments(previousComments);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
    } catch (e) {
      return 'Vừa xong';
    }
  };

  // ==================== PHÂN QUYỀN BÌNH LUẬN ====================

  /** Chủ comment hoặc Mod/Admin hệ thống (role_level ≥ 50) mới xóa được */
  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    if (String(comment.user_id) === String(user.id)) return true;
    if ((user as any).role_level >= 50) return true;
    return false;
  };

  /** Chỉ Mod/Admin hệ thống (≥ 50) mới ẩn toàn hệ thống */
  const canHideGlobal = (comment: Comment) => {
    if (!user) return false;
    return (user as any).role_level >= 50;
  };

  /** Mọi user đăng nhập đều có thể tự ẩn bình luận với chính mình */
  const canHideForMe = () => !!user;

  /** Không được báo cáo bình luận của chính mình */
  const canReportComment = (comment: Comment) => {
    if (!user) return false;
    return String(comment.user_id) !== String(user.id);
  };

  // ==================== HANDLERS BÌNH LUẬN ====================

  const handleDeleteComment = async () => {
    if (!deletingCommentId || isDeletingComment) return;
    setIsDeletingComment(true);
    try {
      const res = await api.delete(`/comments/${deletingCommentId}`);
      if (res.data.success) {
        const removeRecursive = (list: Comment[]): Comment[] =>
          list.filter(c => c.id !== deletingCommentId)
              .map(c => ({ ...c, replies: c.replies ? removeRecursive(c.replies) : [] }));
        setComments(prev => removeRecursive(prev));
      }
    } catch (e) {
      console.error('Delete comment failed', e);
    } finally {
      setIsDeletingComment(false);
      setShowCommentDeleteModal(false);
      setDeletingCommentId(null);
    }
  };

  const handleHideForMe = async (commentId: string) => {
    try {
      await api.post(`/comments/${commentId}/hide-for-me`);
      // Xóa khỏi UI của user này ngay lập tức
      const removeRecursive = (list: Comment[]): Comment[] =>
        list.filter(c => c.id !== commentId)
            .map(c => ({ ...c, replies: c.replies ? removeRecursive(c.replies) : [] }));
      setComments(prev => removeRecursive(prev));
    } catch (e) {
      console.error('Hide for me failed', e);
    }
    setOpenCommentMenuId(null);
  };

  const handleGlobalHide = async (commentId: string) => {
    try {
      const res = await api.patch(`/comments/${commentId}/hide`);
      if (res.data.success) {
        const removeRecursive = (list: Comment[]): Comment[] =>
          list.filter(c => c.id !== commentId)
              .map(c => ({ ...c, replies: c.replies ? removeRecursive(c.replies) : [] }));
        setComments(prev => removeRecursive(prev));
      }
    } catch (e) {
      console.error('Global hide failed', e);
    }
    setOpenCommentMenuId(null);
  };

  /**
   * ✅ Helper: Parse nội dung bình luận để tô màu @tag_name
   */
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const mentionRegex = /(@[a-zA-Z0-9À-ỹ_]+(?:\s[A-ZÀ-Ỹ][a-zA-Z0-9À-ỹ_]*)*)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (part && part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className="text-blue-600 font-semibold hover:underline cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderCommentsList = (commentList: Comment[], depth = 0) => {
    return commentList.map((comment, index) => {
      const isLast = index === commentList.length - 1;
      
      // ✅ LOGIC CỐ ĐỊNH 3 TẦNG:
      // depth 0: Tầng 1 (Gốc)
      // depth 1: Tầng 2
      // depth >= 2: Tầng 3 (Dừng thụt lề tại đây)
      const visualDepth = depth > 2 ? 2 : depth;
      
      const avatarSize = visualDepth === 0 ? "w-8 h-8" : "w-6 h-6";
      
      // Vị trí đường kẻ nối (Sử dụng visualDepth để cố định vệt kẻ)
      const leftOffset = visualDepth === 1 ? "-left-[26px]" : "-left-[22px]";
      const widthClass = visualDepth === 1 ? "w-[26px]" : "w-[22px]";

      // Đảm bảo key luôn unique — dùng index làm fallback nếu id undefined
      const commentKey = comment.id != null ? String(comment.id) : `comment-depth${depth}-idx${index}`;

      return (
        <div 
          key={commentKey} 
          className={cn(
            "flex flex-col relative", 
            visualDepth > 0 && "pt-3",
            openCommentMenuId === comment.id ? "z-[100]" : "z-10"
          )}
        >
          
          {/* Nối cong vào avatar (cho bình luận con) */}
          {visualDepth > 0 && (
            <div className={cn(
              "absolute border-theme rounded-bl-xl z-0",
              "border-l-2 border-b-2",
              leftOffset, widthClass, "top-0 h-[24px]"
            )} />
          )}

          {/* Đường dọc nối các anh em cùng cấp */}
          {visualDepth > 0 && !isLast && (
            <div className={cn(
              "absolute border-l-2 border-theme z-0",
              leftOffset, "top-[24px] bottom-0"
            )} />
          )}

          <div className="flex gap-2.5 group relative">
            <div className="relative shrink-0 flex flex-col items-center">
               <Link 
                 to={`/profile/${comment.user_id}`}
                 onClick={(e) => e.stopPropagation()}
                 className="hover:opacity-80 transition-opacity shrink-0 relative z-10"
               >
                 <img 
                   src={getImageUrl(comment.avatar)} 
                   className={cn("rounded-full object-cover shadow-sm border border-theme", avatarSize)} 
                   alt={comment.username} 
                 />
               </Link>
               {/* Đường dọc nối xuống replies của chính nó */}
               {((comment.replies && comment.replies.length > 0) || (comment.replies_total && comment.replies_total > 0)) && (
                 <div className="absolute border-l-2 border-slate-100 z-0" style={{
                   top: visualDepth === 0 ? '32px' : '24px',
                   bottom: '0',
                   left: '18px'
                 }}></div>
               )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="bg-surface-2 rounded-2xl rounded-tl-none p-3 inline-block max-w-full shadow-sm hover:bg-surface-2/90 transition-colors border border-theme">
                  <Link 
                    to={`/profile/${comment.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-black text-base-color text-[11px] mb-0.5 block hover:text-blue-700 hover:underline transition-all"
                  >
                    {comment.full_name || comment.username}
                  </Link>
                  <p className="text-xs text-muted-color font-medium leading-relaxed break-words whitespace-pre-wrap">
                    {renderFormattedContent(comment.content)}
                  </p>
                </div>

                {/* Mini-menu 3 chấm quản lý bình luận */}
                {user && (
                  <div className="relative mt-2 shrink-0">
                    <button
                      onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                      className="p-1 rounded-full text-faint-color hover:text-muted-color hover:bg-surface-2 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openCommentMenuId === comment.id && (
                      <div
                        className="absolute left-0 md:left-auto md:right-0 top-8 bg-surface border border-theme rounded-xl shadow-2xl z-[110] min-w-[160px] py-1"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Ẩn với tôi — mọi user */}
                        {canHideForMe() && (
                          <button
                            onClick={() => handleHideForMe(comment.id)}
                            className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-muted-color hover:bg-surface-2 flex items-center gap-2.5 transition-colors"
                          >
                            <EyeOff size={13} className="shrink-0" />
                            Ẩn bình luận này
                          </button>
                        )}

                        {/* Báo cáo — không báo cáo của mình */}
                        {canReportComment(comment) && (
                          <button
                            onClick={() => {
                              setReportingCommentId(comment.id);
                              setShowCommentReportModal(true);
                              setOpenCommentMenuId(null);
                            }}
                            className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-muted-color hover:bg-surface-2 flex items-center gap-2.5 transition-colors"
                          >
                            <Flag size={13} className="shrink-0" />
                            Báo cáo
                          </button>
                        )}

                        {/* Ẩn khỏi tất cả — chỉ Mod/Admin */}
                        {canHideGlobal(comment) && (
                          <button
                            onClick={() => handleGlobalHide(comment.id)}
                            className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 flex items-center gap-2.5 transition-colors"
                          >
                            <Eye size={13} className="shrink-0" />
                            Ẩn khỏi tất cả
                          </button>
                        )}

                        {/* Xóa — chủ hoặc Mod/Admin */}
                        {canDeleteComment(comment) && (
                          <>
                            {(canReportComment(comment) || canHideForMe()) && (
                              <div className="border-t border-theme my-1" />
                            )}
                            <button
                              onClick={() => {
                                setDeletingCommentId(comment.id);
                                setShowCommentDeleteModal(true);
                                setOpenCommentMenuId(null);
                              }}
                              className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 size={13} className="shrink-0" />
                              Xóa bình luận
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1.5 px-1">
                <span className="text-[8px] font-bold text-faint-color uppercase">
                  {formatTime(comment.created_at)}
                </span>
                <button 
                  onClick={isRestricted ? undefined : () => handleLikeComment(comment.id)}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-all",
                    isRestricted ? "opacity-50 cursor-not-allowed text-faint-color" : "hover:scale-110 cursor-pointer",
                    !isRestricted && comment.is_liked ? "text-pastel-orange" : "text-faint-color hover:text-pastel-orange"
                  )}
                  disabled={isRestricted}
                >
                  {comment.is_liked ? 'Đã thích' : 'Thích'} 
                  {comment.like_count ? ` (${comment.like_count})` : ''}
                </button>
                <button 
                  onClick={isRestricted ? undefined : () => handleReply(comment)}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-colors",
                    isRestricted ? "opacity-50 cursor-not-allowed text-faint-color" : "text-faint-color hover:text-blue-500 cursor-pointer"
                  )}
                  disabled={isRestricted}
                >
                  Phản hồi
                </button>
              </div>
            </div>
          </div>
          
          {/* Render Replies (Đệ quy có giới hạn thụt lề) */}
          {((comment.replies && comment.replies.length > 0) || (comment.replies_total && comment.replies_total > 0)) ? (
            <div className={cn("relative mt-1", 
              visualDepth === 0 ? "ml-[42px]" : 
              visualDepth === 1 ? "ml-[34px]" : 
              "ml-0"
            )}>
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-1">
                  {renderCommentsList(comment.replies, depth + 1)}
                </div>
              )}
              
              {/* Load more replies button */}
              {(comment.replies_total !== undefined && (!comment.replies || comment.replies.length < comment.replies_total)) && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <div className="w-8 h-5 border-l-2 border-b-2 border-slate-200 rounded-bl-2xl -mt-5 ml-1"></div>
                  <button 
                    onClick={() => fetchMoreReplies(comment.id)}
                    className="text-[11px] font-bold text-muted-color hover:text-blue-600 transition-colors flex items-center gap-1.5 group/more"
                  >
                    <span className="w-4 h-[1px] bg-muted-color/30 group-hover/more:bg-blue-600/30"></span>
                    {!comment.replies || comment.replies.length === 0 
                      ? `Xem tất cả ${comment.replies_total} phản hồi`
                      : `Xem thêm ${comment.replies_total - comment.replies.length} phản hồi`}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ✅ AnimatePresence bao 1 motion.div duy nhất với key cố định */}
      <AnimatePresence>
        <motion.div
          key="pcm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 lg:p-10"
        >
          {/* Backdrop */}
          <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[210] w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all md:hidden"
          >
            <X size={24} />
          </button>

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface w-full max-w-7xl h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-theme z-[201]"
          >
            {/* ===== LEFT: Media ===== */}
            <div className={cn(
              "w-full lg:flex-1 bg-black flex items-center justify-center relative group overflow-hidden",
              !normalizedPost.images.length && "hidden lg:flex lg:bg-surface-2"
            )}>
              {normalizedPost.images.length > 0 ? (
                <>
                  <img 
                    src={getImageUrl(normalizedPost.images[currentImageIndex])} 
                    className="w-full h-full object-contain" 
                    alt="Post media" 
                  />
                  {normalizedPost.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : normalizedPost.images.length - 1))}
                        className="absolute left-4 w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => setCurrentImageIndex((prev) => (prev < normalizedPost.images.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {normalizedPost.images.map((_, idx) => (
                      <div key={idx} className={cn("h-1.5 rounded-full transition-all", idx === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-white/20 p-12">
                  <MessageCircle size={100} strokeWidth={1} />
                  <p className="mt-4 font-black uppercase tracking-[0.2em] text-sm">Thảo luận bài viết</p>
                </div>
              )}
            </div>

            {/* ===== RIGHT: Comments panel ===== */}
            <div className="w-full lg:w-[450px] flex flex-col h-full bg-surface border-l border-theme text-base-color">
              
              {/* Header */}
              <div className="p-4 md:p-5 border-b border-theme flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Link 
                    to={`/profile/${normalizedPost.authorId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:opacity-80 transition-opacity shrink-0"
                  >
                    <img src={getImageUrl(normalizedPost.authorAvatar)} className="w-10 h-10 rounded-2xl object-cover border-2 border-theme shadow-sm" alt={normalizedPost.authorName} />
                  </Link>
                  <div>
                    <Link 
                      to={`/profile/${normalizedPost.authorId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-black text-base-color leading-tight hover:text-blue-700 hover:underline transition-all"
                    >
                      {normalizedPost.authorName}
                    </Link>
                    <p className="text-[10px] font-bold text-faint-color uppercase tracking-widest mt-0.5">{formatTime(normalizedPost.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionDropdown 
                    isOwner={!!(user && normalizedPost.authorId && String(user.id) === String(normalizedPost.authorId))}
                    onReport={() => setShowReportModal(true)}
                    onDelete={() => setShowDeleteModal(true)}
                  />
                  <button onClick={onClose} className="hidden md:flex p-2 hover:bg-surface-2 rounded-xl text-faint-color transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
                {/* Post content */}
                <div className="p-5 border-b border-theme">
                  {normalizedPost.title && <h2 className="text-lg font-black text-base-color mb-2 leading-tight">{normalizedPost.title}</h2>}
                  <div className="text-sm text-muted-color leading-relaxed font-medium break-words" dangerouslySetInnerHTML={{ __html: normalizedPost.content }} />
                </div>

                {/* Like/comment counts */}
                <div className="px-5 py-3 border-b border-theme flex items-center justify-between text-faint-color">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center border-2 border-white shadow-sm">
                      <Heart size={10} className="text-white fill-current" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight">{normalizedPost.likes} lượt thích</span>
                  </div>
                  <div className="text-[11px] font-bold tracking-tight">{normalizedPost.commentCount} bình luận</div>
                </div>

                {/* Action buttons */}
                <div className="px-2 py-1 border-b border-theme flex items-center">
                  <button
                    onClick={isRestricted ? undefined : handleLikePost}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                      isRestricted ? "opacity-50 cursor-not-allowed text-muted-color" : "cursor-pointer",
                      !isRestricted && normalizedPost.isLiked ? "text-pastel-orange bg-orange-50 dark:bg-orange-950/20" : "text-muted-color hover:bg-surface-2"
                    )}
                    disabled={isRestricted}
                  >
                    <Heart size={18} fill={normalizedPost.isLiked ? "currentColor" : "none"} /> {normalizedPost.isLiked ? 'Đã thích' : 'Thích'}
                  </button>
                  <button 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-muted-color transition-all font-black text-[10px] uppercase tracking-widest",
                      isRestricted ? "opacity-50 cursor-not-allowed" : "hover:bg-surface-2 cursor-pointer"
                    )} 
                    disabled={isRestricted}
                  >
                    <MessageCircle size={18} /> Bình luận
                  </button>
                  <button
                    onClick={isRestricted ? undefined : () => setShowShareModal(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                      isRestricted ? "opacity-50 cursor-not-allowed text-muted-color" : "text-muted-color hover:bg-surface-2 cursor-pointer"
                    )}
                    disabled={isRestricted}
                  >
                    <Share2 size={18} /> Chia sẻ
                  </button>
                </div>

                {/* Comments list */}
                <div className="p-5 space-y-6">
                  <h4 className="text-[10px] font-black text-faint-color uppercase tracking-[0.2em] mb-4">Thảo luận</h4>
                  {loading && comments.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-pastel-orange" size={32} />
                      <p className="text-[10px] font-black text-faint-color uppercase tracking-widest">Đang tải...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-16 text-center space-y-4 opacity-30">
                      <MessageCircle size={48} className="mx-auto text-faint-color" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Chưa có bình luận nào</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-4">
                      {renderCommentsList(comments)}

                      {hasMore && (
                        <div className="pt-4 flex justify-center w-full">
                          <button
                            onClick={fetchMoreComments}
                            disabled={loadingMore}
                            className="px-5 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                          >
                            {loadingMore ? 'Đang tải...' : 'Xem thêm bình luận'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Comment input area */}
              <div className="p-4 bg-surface border-t border-theme shrink-0 relative">
                {isRestricted ? (
                  <div className="text-center py-3.5 px-6 bg-orange-50 dark:bg-orange-950/20 text-pastel-orange border border-orange-100 dark:border-orange-900/30 rounded-xl text-xs font-bold transition-colors">
                    Bạn cần tham gia nhóm để tương tác (thích, bình luận, chia sẻ) bài viết này
                  </div>
                ) : (
                  <>
                    {/* Emoji Picker */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          key="emoji-picker"
                          ref={emojiPickerRef}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-4 mb-4 z-[250] shadow-2xl rounded-2xl overflow-hidden border border-theme"
                        >
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            autoFocusSearch={false}
                            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                            width={320}
                            height={400}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Replying-to indicator */}
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-surface-2 px-3 py-2 rounded-t-xl border-x border-t border-theme mb-[-1px]">
                        <p className="text-[10px] font-bold text-muted-color uppercase tracking-widest">
                          Đang phản hồi <span className="text-pastel-orange">{replyingTo.username}</span>
                        </p>
                        <button onClick={() => setReplyingTo(null)} className="text-faint-color hover:text-muted-color">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Input form */}
                    <form onSubmit={handleAddComment} className="flex items-center gap-3">
                      <img src={getImageUrl(user?.avatar)} className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md border-2 border-theme" alt="Me" />
                      <div className="flex-1 relative group">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder={replyingTo ? `Phản hồi ${replyingTo.username}...` : "Viết bình luận của bạn..."}
                          className="w-full bg-surface-2 border border-theme text-base-color rounded-[1.2rem] py-3 pl-4 pr-16 outline-none focus:ring-4 focus:ring-pastel-orange/5 focus:bg-surface focus:border-pastel-orange/20 transition-all font-medium text-xs shadow-sm"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={cn("p-1 transition-all hover:scale-110", showEmojiPicker ? "text-pastel-orange" : "text-faint-color hover:text-pastel-orange")}
                          >
                            <Smile size={18} />
                          </button>
                          <button
                            type="submit"
                            disabled={!commentText.trim() || isSubmitting}
                            className="text-pastel-orange disabled:opacity-30 p-1.5 hover:scale-110 transition-transform"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} />}
                          </button>
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ✅ Sub-modals nằm NGOÀI AnimatePresence, trong Fragment */}

      {/* Báo cáo bài viết */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportableType={normalizedPost.title ? "blog" : (post.group_id ? "group" : "post")}
        reportableId={normalizedPost.id}
        title="Báo cáo bài viết"
      />

      {/* Báo cáo bình luận */}
      <ReportModal
        isOpen={showCommentReportModal}
        onClose={() => { setShowCommentReportModal(false); setReportingCommentId(null); }}
        reportableType="comment"
        reportableId={reportingCommentId || ''}
        title="Báo cáo bình luận"
      />

      {/* Xóa bình luận */}
      <Modal
        isOpen={showCommentDeleteModal}
        onClose={() => { setShowCommentDeleteModal(false); setDeletingCommentId(null); }}
        title="Xóa bình luận"
      >
        <DeleteConfirmContent
          isDeleting={isDeletingComment}
          onCancel={() => { setShowCommentDeleteModal(false); setDeletingCommentId(null); }}
          onConfirm={handleDeleteComment}
          title="Xóa bình luận"
          message="Bình luận sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?"
        />
      </Modal>

      {/* Xóa bài viết */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
      >
        <DeleteConfirmContent
          isDeleting={isSubmitting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Xóa bài viết"
          message="Bạn có chắc chắn muốn xóa bài viết này không? Bài viết sẽ biến mất vĩnh viễn khỏi trang cá nhân."
        />
      </Modal>

      {/* Chia sẻ */}
      <BlogShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        blog={{
          id: normalizedPost.id,
          title: normalizedPost.title || 'Bài viết',
          excerpt: normalizedPost.content.replace(/<[^>]*>?/gm, '').substring(0, 100),
          images: normalizedPost.images,
          author: {
            name: normalizedPost.authorName,
            avatar: normalizedPost.authorAvatar
          }
        }}
        onShareSuccess={(newCount) => {
          console.log('Shared! New count:', newCount);
        }}
      />
    </>
  );
};

export default PostCommentModal;
