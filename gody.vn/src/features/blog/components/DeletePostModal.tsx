import React, { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import { useToastStore } from '../../../shared/hooks/useToast';

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | number | null;
  onDeleteSuccess: () => void;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({ isOpen, onClose, postId, onDeleteSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleDelete = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      await api.delete(`blogs/${postId}`);
      addToast('Xóa bài viết thành công', 'success');
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Không thể xóa bài viết', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Xóa bài viết?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác và toàn bộ dữ liệu liên quan sẽ biến mất.
              </p>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" /> Xóa ngay</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeletePostModal;
