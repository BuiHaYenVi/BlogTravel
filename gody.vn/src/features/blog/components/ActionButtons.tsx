import React from 'react';
import { useBlogEditor } from '../store/useBlogEditor';
import { Save, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToastStore } from '../../../shared/hooks/useToast';

interface ActionButtonsProps {
  onPublish: () => void;
  isLoading?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onPublish, isLoading }) => {
  const { clearDraft } = useBlogEditor();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handlePublish = async () => {
    try {
      await onPublish();
    } catch (err: any) {
      addToast(err.message || "Có lỗi xảy ra khi đăng bài", "error");
    }
  };

  return (
    <>
      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 z-40 flex justify-center gap-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <motion.button 
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all bg-white group shadow-sm disabled:opacity-50"
        >
          <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Lưu bản nháp
        </motion.button>
        <motion.button 
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
          onClick={handlePublish}
          className="flex items-center gap-3 px-12 py-4 rounded-2xl bg-gradient-to-r from-[#2DD4BF] to-[#0D9488] font-black text-white transition-all shadow-xl shadow-teal-500/20 transform disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {isLoading ? 'Đang xử lý...' : 'Đăng bài viết ngay'}
        </motion.button>
      </div>
    </>
  );
};

export default ActionButtons;
