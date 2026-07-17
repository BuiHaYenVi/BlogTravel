import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { PenTool, ChevronRight, Home, Clock, Eye, Tag, TrendingUp, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { useBlogDetail } from '../hooks/useBlogDetail';
import { useAuthStore } from '../../auth/store/useAuthStore';

import BlogHeader from '../components/BlogHeader';
import AuthorCard from '../components/AuthorCard';
import ReactionBar from '../components/ReactionBar';
import ImageGalleryGrid from '../../../shared/components/common/ImageGalleryGrid';
import ShareButtons from '../components/ShareButtons';
import RelatedPosts from '../components/RelatedPosts';

import CommentBox from '../../comment/components/CommentBox';
import CommentItem from '../../comment/components/CommentItem';
import BackButton from '../../../shared/components/common/BackButton';

import TrendingPosts from '../components/TrendingPosts';
import TagCloud from '../components/TagCloud';

const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    blog, 
    loading, 
    loadingMoreComments,
    loadMoreComments,
    loadBlog,
    toggleFollow, 
    toggleReaction, 
    addComment, 
    addReply,
    toggleCommentLike,
    loadMoreReplies
  } = useBlogDetail();
  const { user } = useAuthStore();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (id) {
      loadBlog(id);
    }
  }, [id, loadBlog]);

  if (!blog) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <BackButton className="absolute top-8 left-8" />
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-32 transition-colors duration-300">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-pastel-orange z-[60] origin-left"
        style={{ scaleX }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <BackButton className="mb-6" />
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-muted-color mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-pastel-orange flex items-center gap-1 transition-colors">
            <Home size={14} /> Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:text-pastel-orange transition-colors">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-base-color truncate max-w-[200px]">{blog.title}</span>
        </nav>

        <div className="max-w-4xl mx-auto">

          {/* Main Content Column */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-surface rounded-[3rem] p-8 md:p-12 shadow-sm border border-theme relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pastel-orange/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="flex flex-wrap items-center gap-6 mb-8 text-xs font-black text-muted-color uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-pastel-orange">
                    <Clock size={16} /> 12 phút đọc
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} /> 1.2k lượt xem
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={16} /> Kinh nghiệm du lịch
                  </div>
                </div>

                <BlogHeader blog={blog} />

                {/* HTML Content Render */}
                <article
                  className="prose prose-lg prose-slate max-w-none prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-headings:font-black prose-a:text-pastel-orange blog-html-content mt-12 mb-16"
                  dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
                />

                {/* Gallery Images */}
                {blog.images && blog.images.length > 0 && (
                  <div className="mt-8 mb-16">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-pastel-orange rounded-full"></span>
                      Hình ảnh chuyến đi
                    </h3>
                    <ImageGalleryGrid images={blog.images} />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <ReactionBar reactions={blog.reactions} onReact={toggleReaction} />
                  <ShareButtons />
                </div>
              </div>

              {/* Next/Prev Navigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <Link to="#" className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-start gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Bài trước
                  </span>
                  <span className="font-black text-slate-900 group-hover:text-pastel-orange transition-colors line-clamp-1">Kinh nghiệm du lịch An Giang tự túc từ A-Z</span>
                </Link>
                <Link to="#" className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-end text-right gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Bài sau <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="font-black text-slate-900 group-hover:text-pastel-orange transition-colors line-clamp-1">Khám phá ẩm thực đường phố Sài Gòn</span>
                </Link>
              </div>

              <div className="mb-16">
                <AuthorCard author={blog.author} onFollowToggle={toggleFollow} />
              </div>

              {/* Comments Section */}
              <section id="comments" className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-3xl font-black text-gray-900 mb-10 pb-6 border-b border-gray-50 flex items-center gap-3">
                  Cộng đồng thảo luận ({blog.comments.length})
                </h3>

                <div className="mb-12">
                  <CommentBox onAddComment={addComment} />
                </div>

                <div className="space-y-10">
                  {blog.comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLikeToggle={toggleCommentLike}
                      onReplyAdd={addReply}
                      currentUserId={user?.id}
                      onLoadMoreReplies={loadMoreReplies}
                    />
                  ))}
                </div>
                
                {blog.hasMoreComments && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={loadMoreComments}
                      disabled={loadingMoreComments}
                      className="px-6 py-2.5 text-[13px] font-bold text-gray-600 bg-gray-50/50 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                      {loadingMoreComments ? 'Đang tải...' : 'Xem thêm bình luận'}
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Floating Action Button (Mobile & Desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-10 right-10 z-50 md:hidden lg:block"
      >
        <Link
          to="/blog/create"
          className="flex items-center justify-center w-16 h-16 bg-pastel-orange text-white rounded-full shadow-2xl shadow-orange-500/40 hover:bg-orange-500 transition-colors"
          title="Viết blog mới"
        >
          <PenTool size={28} />
        </Link>
      </motion.div>
    </div>
  );
};

export default BlogDetailPage;
