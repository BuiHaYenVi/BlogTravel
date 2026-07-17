import React, { useState, useEffect } from 'react';
import { X, MapPin, Home, Cake, GraduationCap, Loader2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../services/userApi';
import { useToastStore } from '../../../shared/hooks/useToast';

interface EditIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onUpdateSuccess: () => void;
}

const EditIntroModal: React.FC<EditIntroModalProps> = ({ isOpen, onClose, userData, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    current_city: '',
    hometown: '',
    birth_date: '',
    education_school: '',
    workplace: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        current_city: userData.current_city || '',
        hometown: userData.hometown || '',
        birth_date: userData.birth_date ? userData.birth_date.split('T')[0] : '',
        education_school: userData.education_school || '',
        workplace: userData.workplace || '',
      });
    }
  }, [userData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userApi.updateProfile(userData.id, formData);
      addToast('Cập nhật thông tin thành công', 'success');
      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Chỉnh sửa chi tiết</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nơi sống hiện tại</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.current_city}
                      onChange={(e) => setFormData({ ...formData, current_city: e.target.value })}
                      placeholder="Thành phố hiện tại"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Quê quán</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.hometown}
                      onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                      placeholder="Tỉnh/Thành phố quê hương"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Ngày sinh</label>
                  <div className="relative">
                    <Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Học vấn</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.education_school}
                      onChange={(e) => setFormData({ ...formData, education_school: e.target.value })}
                      placeholder="Trường học"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-pastel-orange transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nơi làm việc</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.workplace}
                      onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                      placeholder="Công ty / Nơi làm việc"
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu thông tin'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditIntroModal;
