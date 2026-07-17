import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Image as ImageIcon, MessageCircle, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import BackButton from '../../../shared/components/common/BackButton';
import BlogCard from '../components/BlogCard';
import LatestComments from '../components/LatestComments';
import { useBlogStore } from '../store/useBlogStore';

import TagCloud from '../components/TagCloud';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const BlogListPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const { blogs, addBlog, fetchBlogs, loading, page, hasMore } = useBlogStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBlogs(1, true);
  }, []);

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const success = await addBlog({
        title: 'Chia sẻ từ ' + (user?.name || 'Thành viên'),
        content: postContent,
        short_intro: postContent.substring(0, 160),
        images: selectedImages
      });
      if (success) {
        setPostContent('');
        setSelectedImages([]);
        setImagePreviews([]);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="pt-20 min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      {/* CINEMATIC HERO */}
      <div className="relative w-full h-[450px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Blog Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase mb-6 leading-tight">
            BLOG DU LỊCH VIỆT NAM
          </h1>
          <p className="text-gray-200 text-lg md:text-xl font-medium leading-relaxed opacity-90">
            Blog du lịch Việt Nam được chia sẻ từ các travel bloggers, cộng đồng những người đi du lịch
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-10">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-10">
            {/* Create Post Box */}
            <div className="bg-surface rounded-[2.5rem] p-8 shadow-sm border border-theme transition-all focus-within:shadow-xl group">
              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-theme shrink-0">
                  <img src={getImageUrl(user?.avatar)} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Chia sẻ trải nghiệm, blog"
                    className="w-full bg-surface-2 rounded-2xl p-4 text-base-color font-medium outline-none border-2 border-transparent focus:border-pastel-orange/30 focus:bg-surface transition-all resize-none min-h-[100px] placeholder:text-muted-color"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group/img">
                          <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                          <button
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
                    <div className="flex items-center gap-6">
                      <Link 
                        to="/blog/create"
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-pastel-orange transition-colors"
                      >
                        <FileText size={20} className="text-red-400" />
                        Bài viết
                      </Link>
                      <button 
                        onClick={() => {
                          console.log('Image button clicked');
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-pastel-orange transition-colors"
                      >
                        <ImageIcon size={20} className="text-green-400" />
                        Hình ảnh
                      </button>
                      <Link 
                        to="/group"
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-pastel-orange transition-colors"
                      >
                        <MessageCircle size={20} className="text-blue-500" />
                        Cộng đồng
                      </Link>
                    </div>
                    <button 
                      onClick={() => {
                        console.log('Posting blog...', postContent);
                        handlePostSubmit();
                      }}
                      disabled={isPosting || !postContent.trim()}
                      className="px-10 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Blog Feed */}
            <div className="space-y-12">
              {loading && blogs.length === 0 ? (
                <div className="space-y-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : blogs.length > 0 ? (
                <div className="space-y-12">
                  {blogs.map((blog) => (
                    <BlogCard 
                      key={blog.id} 
                      {...blog} 
                      currentUserId={user?.id}
                      onDelete={async (id) => {
                        const success = await useBlogStore.getState().deleteBlog(id);
                        if (success) alert('Đã xóa bài viết thành công!');
                        else alert('Xóa bài viết thất bại!');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold">Chưa có bài viết nào.</p>
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => fetchBlogs(page + 1)}
                    disabled={loading}
                    className="px-12 py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-900 shadow-sm hover:shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Đang tải...' : 'Xem thêm bài viết'} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Latest Comments Component */}
            <LatestComments />

            {/* Promo Banner */}
            <div className="relative rounded-[2.5rem] overflow-hidden group shadow-premium aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                alt="Promo"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10">
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                  Bạn muốn chia sẻ địa điểm mới?
                </h3>
                <p className="text-gray-300 font-medium mb-8 text-sm">
                  Cùng Blog Travel xây dựng cộng đồng du lịch lớn nhất Việt Nam.
                </p>
                <Link to="/blog/create" className="w-full py-4 bg-pastel-orange text-white font-black rounded-2xl text-center hover:bg-orange-500 transition-all shadow-xl shadow-orange-500/20 active:scale-95 uppercase tracking-widest text-xs">
                  Bắt đầu ngay
                </Link>
              </div>
            </div>

            {/* Tags Cloud */}
            <TagCloud />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
