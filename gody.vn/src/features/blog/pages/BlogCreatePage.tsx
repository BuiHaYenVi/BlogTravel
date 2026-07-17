import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, HelpCircle, Info, X } from 'lucide-react';

// Specialized components
import CoverUpload from '../components/CoverUpload';
import BlogTitleInput from '../components/BlogTitleInput';
import MetaFields from '../components/MetaFields';
import TiptapEditor from '../components/TiptapEditor';
import ActionButtons from '../components/ActionButtons';

// Hooks & Store
import { usePost } from '../../../shared/hooks/usePost';
import { useBlogEditor } from '../store/useBlogEditor';
import { useAuthStore } from '../../auth/store/useAuthStore';
import BackButton from '../../../shared/components/common/BackButton';
import { useToastStore } from '../../../shared/hooks/useToast';
import Modal from '../../../shared/components/common/Modal';
import { useBlocker } from 'react-router-dom';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const BlogCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { handleCreatePost } = usePost();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const { title, content, coverFile, imageFiles, description, meta, clearDraft } = useBlogEditor();

  const [showExitModal, setShowExitModal] = useState(false);

  // Kiểm tra xem form có dữ liệu chưa
  const isDirty = title.trim() !== '' || (content.trim() !== '' && content !== '<p></p>');

  // Navigation guard
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Sync blocker state with modal
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitModal(true);
    }
  }, [blocker.state]);

  const handleConfirmExit = (save: boolean) => {
    setShowExitModal(false);
    if (save) {
      addToast('Đã lưu bài viết vào nháp!', 'info');
      blocker.proceed?.();
    } else {
      clearDraft();
      addToast('Đã hủy bài viết', 'info');
      blocker.proceed?.();
    }
  };

  // Auto-scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onPublish = async () => {
    if (!title.trim() || !content.trim() || content === '<p></p>') {
      addToast('Vui lòng nhập đầy đủ tiêu đề và nội dung', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const resultId = await handleCreatePost({
        type: 'blog',
        title,
        description,
        content,
        coverFile: coverFile,
        images: imageFiles,
        meta: meta
      });


      if (resultId) {
        addToast("Đăng bài thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.", "success");
        clearDraft();
        setTimeout(() => {
          navigate(`/blog/${resultId}`);
        }, 100);
      } else {
        addToast("Không thể đăng bài. Vui lòng kiểm tra lại thông tin.", "error");
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể đăng bài. Vui lòng thử lại.';
      addToast(errorMessage, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans">
      <div className="max-w-5xl mx-auto px-4 pt-24 mb-4">
        <BackButton />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2DD4BF] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <span className="font-black text-xl italic drop-shadow-sm">B</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none mb-0.5">Viết bài mới</h1>
              <span className="text-[10px] font-black text-[#2DD4BF] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Draft saved
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <Link 
              to="/blog/guide"
              target="_blank"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-teal-100 bg-teal-50/50 text-[#0D9488] hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all duration-300 shadow-sm active:scale-95 group"
            >
              <HelpCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
              <span className="text-[11px] font-black uppercase tracking-wider">Hướng dẫn viết Blog chuẩn Blog Travel</span>
            </Link>
          </div>

          <div className="h-8 w-[1px] bg-gray-100"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-black text-gray-800 leading-none">{user?.name || 'Traveler'}</span>
              <span className="text-[10px] font-bold text-gray-400">Level 5 Traveler</span>
            </div>
            <img
              src={getImageUrl(user?.avatar)}
              className="w-10 h-10 rounded-xl border-2 border-white shadow-md object-cover"
              alt="Avatar"
            />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-48 max-w-5xl mx-auto px-4">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <CoverUpload />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            <BlogTitleInput />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <MetaFields />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16 min-h-[600px]">
            <div className="max-w-4xl mx-auto">
              <TiptapEditor />
            </div>
          </motion.div>
        </div>
      </main>

      <ActionButtons onPublish={onPublish} isLoading={isPublishing} />

      <Modal
        isOpen={showExitModal}
        onClose={() => {
          setShowExitModal(false);
          blocker.reset?.();
        }}
        title="Lưu bản nháp?"
        footer={
          <div className="flex gap-3">
            <button onClick={() => handleConfirmExit(false)} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Hủy bỏ</button>
            <button onClick={() => handleConfirmExit(true)} className="px-6 py-2 rounded-xl font-bold bg-[#2DD4BF] text-white shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all">Lưu nháp và thoát</button>
          </div>
        }
      >
        <p className="text-gray-600 font-medium">Bạn có muốn lưu bài viết này vào bản nháp để tiếp tục chỉnh sửa sau không?</p>
      </Modal>
    </div>
  );
};

export default BlogCreatePage;
