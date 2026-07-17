import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '../../../shared/utils/dateHelper';
import ActionDropdown from '../../../shared/components/common/ActionDropdown';
import Modal from '../../../shared/components/common/Modal';
import ReportModal from '../../../components/modals/ReportModal';
import DeleteConfirmContent from '../../../shared/components/common/DeleteConfirmContent';

interface CommentItemProps {
  comment: {
    id: string | number;
    user_id?: string | number;
    author: {
      name: string;
      avatar: string;
      is_verified?: boolean;
      badge_title?: string;
    };
    content: string;
    createdAt: string;
    likes?: number;
    is_liked?: boolean;
    replies?: any[];
    replies_total?: number;
  };
  onLikeToggle?: (id: string | number) => void;
  onReplyAdd?: (id: string | number, content: string) => void;
  onDelete?: (id: string | number) => void;
  onReport?: (id: string | number, reason: string, desc: string) => void;
  onLoadMoreReplies?: (id: string | number) => void;
  depth?: number;
  currentUserId?: string | number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onLikeToggle, 
  onReplyAdd, 
  onDelete,
  onReport,
  onLoadMoreReplies,
  depth = 0,
  currentUserId 
}) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isOwner = currentUserId && comment.user_id && String(currentUserId) === String(comment.user_id);
  const isReply = depth > 0;

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReplyAdd?.(comment.id, replyContent);
    setReplyContent('');
    setShowReplyBox(false);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    if (onDelete) await onDelete(comment.id);
    setIsSubmitting(false);
    setShowDeleteModal(false);
  };

  return (
    <div className={`group ${isReply ? 'mt-4' : ''}`}>
      <div className="flex gap-3 md:gap-4">
        <img 
          src={comment.author.avatar} 
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl border-2 border-white shadow-sm shrink-0 object-cover cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all" 
          alt={comment.author.name}
          onClick={() => comment.user_id && navigate(`/profile/${comment.user_id}`)}
        />
        <div className="flex-1 min-w-0">
          <div className="bg-surface-2 rounded-[1.2rem] md:rounded-[1.5rem] p-4 md:p-5 mb-2 group-hover:bg-surface transition-colors relative border border-theme">
            <div className="flex justify-between items-start mb-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="font-black text-base-color text-sm block truncate cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => comment.user_id && navigate(`/profile/${comment.user_id}`)}
                  >{comment.author.name}</span>
                  {comment.author.is_verified && (
                    <CheckCircle2 size={12} style={{ color: '#1877F2' }} className="flex-shrink-0" />
                  )}
                  {comment.author.badge_title && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50 whitespace-nowrap hidden sm:inline-flex">
                      {comment.author.badge_title}
                    </span>
                  )}
                </div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              
              <ActionDropdown 
                isOwner={!!isOwner}
                onReport={() => setShowReportModal(true)}
                onDelete={() => setShowDeleteModal(true)}
              />
            </div>
            <p className="text-[13px] md:text-sm text-muted-color font-medium leading-relaxed pr-6 break-words">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6 px-3 md:px-4">
            <button 
              onClick={() => onLikeToggle?.(comment.id)}
              className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-black transition-colors ${comment.is_liked ? 'text-pastel-orange' : 'text-gray-400 hover:text-pastel-orange'}`}
            >
              <Heart size={14} fill={comment.is_liked ? "currentColor" : "none"} /> {comment.likes || 0} THÍCH
            </button>
            <button 
              onClick={() => setShowReplyBox(!showReplyBox)}
              className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-black transition-colors ${showReplyBox ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
              <MessageCircle size={14} /> PHẢN HỒI
            </button>
          </div>

          <ReportModal 
            isOpen={showReportModal} 
            onClose={() => setShowReportModal(false)} 
            reportableType="comment"
            reportableId={comment.id}
            title="Báo cáo bình luận"
          />

          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Xác nhận xóa"
          >
            <DeleteConfirmContent 
              isDeleting={isSubmitting}
              onCancel={() => setShowDeleteModal(false)}
              onConfirm={handleDeleteConfirm}
              title="Xóa bình luận"
              message="Bạn có chắc chắn muốn xóa bình luận này? Toàn bộ các phản hồi con cũng sẽ bị xóa vĩnh viễn."
            />
          </Modal>

          {showReplyBox && (
            <div className="mt-4 px-3 md:px-4">
              <form onSubmit={handleReplySubmit} className="relative">
                <input
                  autoFocus
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Trả lời ${comment.author.name}...`}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-2.5 md:py-3 pl-4 md:pl-5 pr-12 outline-none focus:ring-2 focus:ring-pastel-orange/20 transition-all text-sm font-medium shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pastel-orange disabled:opacity-30 p-1 hover:scale-110 transition-transform"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}

          {((comment.replies && comment.replies.length > 0) || (comment.replies_total && comment.replies_total > 0)) ? (
            <div className={`ml-2 md:ml-4 mt-2 space-y-4 ${depth >= 3 ? 'pl-0' : ''}`}>
              {comment.replies && comment.replies.length > 0 && (
                <div className="border-l-2 border-slate-100 pl-3 md:pl-4 space-y-4">
                  {comment.replies.map((reply: any) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      onLikeToggle={onLikeToggle}
                      onReplyAdd={onReplyAdd}
                      onDelete={onDelete}
                      onReport={onReport}
                      onLoadMoreReplies={onLoadMoreReplies}
                      depth={depth + 1} 
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}

              {(comment.replies_total !== undefined && (!comment.replies || comment.replies.length < comment.replies_total)) && (
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <div className="w-6 h-4 border-l-2 border-b-2 border-slate-300 rounded-bl-xl -mt-4 ml-1"></div>
                  <button 
                    onClick={() => onLoadMoreReplies?.(comment.id)}
                    className="text-[12px] font-bold text-gray-500 hover:underline"
                  >
                    {!comment.replies || comment.replies.length === 0 
                      ? `Xem tất cả ${comment.replies_total} phản hồi`
                      : `Xem thêm ${comment.replies_total - comment.replies.length} phản hồi`}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
