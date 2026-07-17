import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useBlogStore } from '../store/useBlogStore';
import ActionDropdown from '../../../shared/components/common/ActionDropdown';
import Modal from '../../../shared/components/common/Modal';
import ReportModal from '../../../components/modals/ReportModal';
import DeleteConfirmContent from '../../../shared/components/common/DeleteConfirmContent';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import PostCommentModal from '../../../shared/components/common/PostCommentModal';
import BlogShareModal from '../../../shared/components/common/BlogShareModal';
import ImageGalleryGrid from '../../../shared/components/common/ImageGalleryGrid';

interface Author {
  name: string;
  avatar: string;
  is_verified?: boolean;
  badge_title?: string;
}

interface SharedPost {
  id: string;
  title: string;
  short_intro: string;
  cover_image?: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface BlogCardProps {
  id: string;
  user_id?: string | number;
  title: string;
  content: string;
  excerpt: string;
  type: 'horizontal' | 'multi-image';
  images: string[];
  author: Author;
  likes: number;
  isLiked?: boolean;
  commentCount: number;
  category?: string;
  currentUserId?: string | number;
  shared_post?: SharedPost | null;
  onDelete?: (id: string) => Promise<void>;
  onReport?: (id: string, reason: string, desc: string) => Promise<void>;
}

const BlogCard: React.FC<BlogCardProps> = ({
  id,
  user_id,
  title,
  content,
  excerpt,
  type,
  images,
  author,
  likes,
  isLiked = false,
  commentCount,
  category = 'DU LỊCH',
  currentUserId,
  shared_post,
  onDelete,
  onReport
}) => {
  const { likeBlog, unlikeBlog } = useBlogStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId && user_id && String(currentUserId) === String(user_id);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      unlikeBlog(id);
    } else {
      likeBlog(id);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCommentModal(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Share button clicked! Opening modal...");
    setShowShareModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    if (onDelete) await onDelete(id);
    setIsSubmitting(false);
    setShowDeleteModal(false);
  };

  const cleanExcerpt = excerpt ? excerpt.replace(/<[^>]*>?/gm, '').trim() : '';
  const displayCategory = category && category !== 'DU LỊCH' ? category : 'DU LỊCH';

  return (
    <article className="bg-surface rounded-[2.5rem] p-8 shadow-sm border border-theme hover:shadow-xl transition-all duration-500 flex flex-col group relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link 
            to={`/profile/${user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 hover:opacity-90 transition-opacity"
          >
            <img src={getImageUrl(author.avatar)} alt={author.name} className="w-full h-full object-cover" />
          </Link>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <Link 
                to={`/profile/${user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-black text-base-color leading-tight text-sm tracking-tight truncate hover:text-pastel-orange hover:underline transition-colors dark:text-white"
              >
                {author.name}
              </Link>
              {shared_post && <span className="text-slate-400 text-xs font-medium ml-1">đã chia sẻ một bài viết</span>}
              {author.is_verified && (
                <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: '#1877F2' }} />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-pastel-orange uppercase tracking-[0.2em]">{displayCategory}</span>
              {author.badge_title && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50 whitespace-nowrap">
                  {author.badge_title}
                </span>
              )}
            </div>
          </div>
        </div>

        <ActionDropdown 
          isOwner={!!isOwner}
          onReport={() => setShowReportModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />
      </div>

      <div className="mb-6 flex-1">
        <Link to={`/blog/${id}`}>
          <h2 className="text-2xl font-black text-base-color mb-3 hover:text-pastel-orange transition-colors line-clamp-2 leading-[1.2] tracking-tighter">
            {title}
          </h2>
        </Link>
        <p className="text-muted-color font-medium leading-relaxed line-clamp-2 text-sm">
          {cleanExcerpt}
        </p>
      </div>

      {shared_post && (
        <div className="mb-8 border border-slate-200 rounded-[2rem] overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors group/shared">
          {shared_post.cover_image && (
            <div className="w-full h-[200px] overflow-hidden">
              <img src={getImageUrl(shared_post.cover_image)} alt={shared_post.title} className="w-full h-full object-cover group-hover/shared:scale-105 transition-transform duration-700" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <img src={getImageUrl(shared_post.author?.avatar)} alt={shared_post.author?.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
              <span className="text-xs font-bold text-slate-700">{shared_post.author?.name}</span>
            </div>
            <Link to={`/blog/${shared_post.id}`} onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-slate-900 text-lg mb-2 line-clamp-2 hover:text-pastel-orange transition-colors">{shared_post.title}</h3>
            </Link>
            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{shared_post.short_intro}</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="mb-8">
          <ImageGalleryGrid
            images={images.map(img => getImageUrl(img))}
            className="rounded-[2rem] overflow-hidden"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-theme">
        <div className="flex gap-6">
          <button 
            onClick={handleLikeToggle}
            className={`flex items-center gap-2 font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-color hover:text-rose-500'}`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-bounce' : ''} /> 
            <span className="text-xs font-black">{likes}</span>
          </button>
          <button 
            onClick={handleCommentClick}
            className="flex items-center gap-2 text-muted-color font-bold hover:text-teal-500 transition-colors"
          >
            <MessageCircle size={20} /> 
            <span className="text-xs font-black">{commentCount}</span>
          </button>
          <button 
            onClick={handleShareClick}
            className="flex items-center gap-2 text-muted-color font-bold hover:text-slate-400 transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
        
        <Link to={`/blog/${id}`} className="group text-[10px] font-black text-pastel-orange uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
          Xem thêm 
          <div className="w-6 h-6 rounded-full bg-pastel-orange/10 flex items-center justify-center group-hover:bg-pastel-orange group-hover:text-white transition-all">
            <ArrowRight size={12} />
          </div>
        </Link>
      </div>

      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        reportableType="blog"
        reportableId={id}
        title="Báo cáo bài viết"
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
          title="Xóa bài viết"
          message="Bạn có chắc chắn muốn xóa bài viết này không? Bài viết sẽ biến mất vĩnh viễn khỏi trang cá nhân và các nhóm."
        />
      </Modal>

      <PostCommentModal 
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        post={{
          id,
          title,
          content,
          author,
          images,
          likes,
          isLiked,
          commentCount
        }}
        onDelete={onDelete}
      />

      <BlogShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        blog={{
          id,
          title,
          excerpt: cleanExcerpt,
          images,
          author
        }}
        onShareSuccess={(newCount) => {
          console.log('Shared! New count:', newCount);
          useBlogStore.getState().fetchBlogs();
        }}
      />
    </article>
  );
};

export default BlogCard;
