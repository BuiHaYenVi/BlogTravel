import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { PROVINCES } from '../../../services/mock/provinces';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../shared/components/common/BackButton';
import { usePostStore } from '../../blog/store/usePostStore';
import { useAuthStore } from '../../auth/store/useAuthStore';

const ReviewCreatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addPost } = usePostStore();
  const { user } = useAuthStore();
  const province = PROVINCES.find(p => p.slug === slug);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const destinationName = province ? province.name : 'Điểm đến';

  const handleSubmit = () => {
    if (!title || !content || rating === 0) return;
    addPost({
      type: 'review',
      title: title,
      content: content,
      author: {
        id: user?.id?.toString() || 'u1',
        name: user?.name || 'Thành viên',
        avatar: user?.avatar || 'https://i.pravatar.cc/150?u=default',
      },
      meta: {
        startDate: new Date().toISOString(),
        totalDays: rating.toString() + ' Sao',
        cost: '',
        tags: 'Review',
        provinceSlug: slug,
      }
    });
    navigate(`/destination/${slug}`);
  };

  return (
    <div className="pt-16 min-h-screen bg-app pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <BackButton className="mb-6" />
        <div className="bg-surface p-8 rounded-xl shadow-sm border border-theme">

          { /* Top Banner Info */}
          <div className="flex gap-6 mb-8 items-center">
            <div className="w-40 h-40 bg-surface-2 rounded-lg overflow-hidden shrink-0 shadow-sm border border-theme">
              <img src="https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c?w=400" className="w-full h-full object-cover" alt="Destination" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-color mb-2">{destinationName}</h1>
            </div>
          </div>

          <form className="space-y-6 max-w-3xl">
            { /* Rating */}
             <div>
              <label className="block text-base-color font-bold mb-2">
                Xếp hạng trải nghiệm của bạn (bắt buộc)
              </label>
              <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'fill-pastel-orange text-pastel-orange' : 'text-faint-color'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            { /* Title */}
            <div>
              <label className="block text-base-color font-bold mb-2">
                Đặt tiêu đề cho đánh giá của bạn (bắt buộc)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-theme bg-surface focus:outline-none focus:border-pastel-orange focus:ring-1 focus:ring-pastel-orange transition-colors text-base-color dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>

            { /* Content */}
             <div>
              <label className="block text-base-color font-bold mb-2">
                Để lại đánh giá (bắt buộc)
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-4 rounded-md border border-theme bg-surface focus:outline-none focus:border-pastel-orange focus:ring-1 focus:ring-pastel-orange transition-colors resize-y text-base-color dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              ></textarea>
            </div>

            { /* Image Upload */}
            <div>
              <label className="block text-base-color font-bold mb-2">
                Tải ảnh lên
              </label>
              <div className="flex gap-4">
                <div className="w-24 h-24 border border-dashed border-theme bg-surface-2 rounded-sm flex items-center justify-center cursor-pointer hover:bg-surface transition-colors dark:hover:bg-slate-700">
                  <Plus className="w-6 h-6 text-pastel-orange" />
                </div>
              </div>
            </div>

            { /* Submit */}
            <div className="pt-4">
              <button 
                type="button" 
                onClick={handleSubmit}
                className="bg-pastel-orange hover:bg-orange-500 text-white font-bold py-3.5 px-12 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 text-lg uppercase tracking-widest"
              >
                GỬI
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ReviewCreatePage;

