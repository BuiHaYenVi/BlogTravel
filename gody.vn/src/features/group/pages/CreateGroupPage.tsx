import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Users,
  Image as ImageIcon,
  Check,
  Compass,
  Mountain,
  Heart,
  Utensils,
  Camera,
  Map,
  Globe,
  ShieldCheck
} from 'lucide-react';
import BackButton from '../../../shared/components/common/BackButton';
import { useGroupStore } from '../store/useGroupStore';

interface GroupFormData {
  name: string;
  category: string;
  description: string;
  cover: string;
  is_private: boolean;
}

const categories = [
  { name: 'Adventure', icon: <Mountain size={18} />, color: 'bg-orange-100 text-orange-600' },
  { name: 'Relax', icon: <Heart size={18} />, color: 'bg-rose-100 text-rose-600' },
  { name: 'Foodie', icon: <Utensils size={18} />, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Photography', icon: <Camera size={18} />, color: 'bg-blue-100 text-blue-600' },
  { name: 'Culture', icon: <Map size={18} />, color: 'bg-purple-100 text-purple-600' },
  { name: 'Chung', icon: <Compass size={18} />, color: 'bg-gray-100 text-gray-600' },
];

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    category: 'Chung',
    description: '',
    cover: '',
    is_private: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createGroup = useGroupStore(state => state.createGroup);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, cover: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const groupId = await createGroup({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        cover_image: formData.cover,
        is_private: formData.is_private
      });

      if (groupId) {
        navigate(`/group/${groupId}`);
      } else {
        alert('Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Lỗi kết nối server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-app pb-20 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <BackButton className="mb-8" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-[3rem] shadow-2xl p-10 md:p-12 border border-theme overflow-hidden relative dark:bg-slate-800 dark:border-slate-700"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pastel-orange/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

          <div className="mb-12 relative z-10">
            <div className="w-20 h-20 bg-pastel-orange/10 rounded-[2rem] flex items-center justify-center mb-6 text-pastel-orange shadow-inner">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-base-color tracking-tight">Tạo hội nhóm mới</h1>
            <p className="text-muted-color mt-3 text-lg font-medium">Bắt đầu một cộng đồng nhỏ cho riêng bạn hoặc hội nhóm du lịch.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            {/* Cover Image Selection */}
            <div>
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-4 ml-1">Ảnh bìa hội nhóm</label>
              <div className="relative h-64 border-2 border-dashed border-gray-200 rounded-[2.5rem] overflow-hidden group hover:border-pastel-orange transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                />

                {formData.cover ? (
                  <div className="h-full relative">
                    <img src={formData.cover} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-black">Nhấn để thay đổi</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-surface-2 text-muted-color group-hover:bg-orange-50/30 dark:group-hover:bg-orange-900/10 transition-colors">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20 group-hover:text-pastel-orange group-hover:opacity-100 transition-all" />
                    <p className="font-bold">Kéo ảnh vào hoặc click để tải lên</p>
                    <p className="text-xs uppercase tracking-widest font-black mt-2 opacity-50">Kích thước khuyên dùng: 1200x600</p>
                  </div>
                )}
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-1 ml-1">Tên hội nhóm</label>
              <input
                type="text"
                required
                placeholder="VD: Nhóm bay lắc Đà Lạt 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-8 py-5 bg-surface-2 border-2 border-transparent focus:border-pastel-orange/20 focus:bg-surface focus:ring-8 focus:ring-orange-100/30 rounded-[2rem] outline-none transition-all text-xl font-black text-base-color dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-1 ml-1">Chủ đề chính</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                    className={`
                      flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-black
                      ${formData.category === cat.name
                        ? 'border-pastel-orange bg-orange-50 text-pastel-orange shadow-lg shadow-orange-100'
                        : 'border-theme bg-surface-2 text-muted-color hover:border-theme'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={formData.category === cat.name ? 'text-pastel-orange' : 'text-muted-color'}>
                        {cat.icon}
                      </span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    {formData.category === cat.name && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy settings */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-1 ml-1">Chế độ riêng tư</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_private: false })}
                  className={`
                    flex flex-col items-start p-6 rounded-3xl border-2 transition-all text-left
                    ${!formData.is_private
                      ? 'border-pastel-orange bg-orange-50/30 text-slate-800 dark:text-slate-100 shadow-md shadow-orange-100/50'
                      : 'border-theme bg-surface-2 text-muted-color hover:border-theme'}
                  `}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2.5 rounded-xl ${!formData.is_private ? 'bg-orange-100 text-pastel-orange' : 'bg-slate-200 text-slate-400'}`}>
                      <Globe size={20} />
                    </div>
                    {!formData.is_private && <Check size={18} className="text-pastel-orange" />}
                  </div>
                  <h4 className="font-black text-slate-900 text-base">Nhóm công khai</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1 leading-normal">Mọi người đều có thể tìm thấy nhóm, xem thành viên và bài viết.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_private: true })}
                  className={`
                    flex flex-col items-start p-6 rounded-3xl border-2 transition-all text-left
                    ${formData.is_private
                      ? 'border-pastel-orange bg-orange-50/30 text-slate-800 dark:text-slate-100 shadow-md shadow-orange-100/50'
                      : 'border-theme bg-surface-2 text-muted-color hover:border-theme'}
                  `}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2.5 rounded-xl ${formData.is_private ? 'bg-orange-100 text-pastel-orange' : 'bg-slate-200 text-slate-400'}`}>
                      <ShieldCheck size={20} />
                    </div>
                    {formData.is_private && <Check size={18} className="text-pastel-orange" />}
                  </div>
                  <h4 className="font-black text-slate-900 text-base">Nhóm riêng tư</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1 leading-normal">Chỉ thành viên mới xem được bài đăng. Yêu cầu tham gia cần được phê duyệt.</p>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-1 ml-1">Mô tả ngắn gọn</label>
              <textarea
                rows={3}
                placeholder="Mô tả mục đích của nhóm này để mọi người dễ dàng tham gia..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-8 py-5 bg-surface-2 border-2 border-transparent focus:border-pastel-orange/20 focus:bg-surface focus:ring-8 focus:ring-orange-100/30 rounded-[2rem] outline-none transition-all text-lg font-medium text-base-color resize-none dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400"
              />
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-5 bg-surface-2 text-muted-color rounded-3xl font-black text-lg hover:bg-surface-2 dark:hover:bg-slate-600 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-5 bg-pastel-orange text-white rounded-3xl font-black text-xl hover:bg-orange-600 shadow-2xl shadow-orange-200/50 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  <>Hoàn tất tạo nhóm <Check className="w-6 h-6" /></>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateGroupPage;
