import React, { useState, useEffect } from 'react';
import { X, Type, MapPin, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import { useToastStore } from '../../../shared/hooks/useToast';

interface EditPostQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onUpdateSuccess: () => void;
}

const EditPostQuickModal: React.FC<EditPostQuickModalProps> = ({ isOpen, onClose, post, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        location_name: post.location_name || '',
      });
    }
  }, [post, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setLoading(true);
    try {
      await api.put(`blogs/${post.id}`, formData);
      addToast('Cập nhật bài viết thành công', 'success');
      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Không thể cập nhật bài viết', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Sửa nhanh bài viết</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Tiêu đề bài viết</label>
                  <div className="relative">
                    <Type className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tiêu đề mới..."
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Địa điểm</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      placeholder="Gắn thẻ địa điểm..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Lưu thay đổi</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditPostQuickModal;
