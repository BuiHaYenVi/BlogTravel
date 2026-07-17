import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { userApi } from '../../user/services/userApi';
import * as Icons from 'lucide-react';
import { Compass, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastStore } from '../../../shared/hooks/useToast';
import { locationService } from '../../../services/locationService';

interface TagCategory {
  title?: string;
  name?: string; // API trả về name thay vì title
  icon: string; // API trả về dạng string
  color: string;
  tags: any[]; // Có thể là mảng string hoặc mảng tag object {id, name, slug}
}

const STATIC_CATEGORIES: any[] = [
  {
    name: 'Ẩm thực & Ăn uống',
    icon: 'Utensils',
    color: 'from-amber-400 to-orange-500',
    tags: [
      { name: 'Café lê la', slug: 'cafe-le-la' },
      { name: 'Trà sữa quốc dân', slug: 'tra-sua-quoc-dan' },
      { name: 'Street Food', slug: 'street-food' },
      { name: 'Fine Dining', slug: 'fine-dining' },
      { name: 'Đặc sản vùng miền', slug: 'dac-san-vung-mien' },
      { name: 'BBQ', slug: 'bbq' },
      { name: 'Hải sản', slug: 'hai-san' },
      { name: 'Lẩu tẹt ga', slug: 'lau-tet-ga' },
      { name: 'Bún đậu mắm tôm', slug: 'bun-dau-mam-tom' },
      { name: 'Bánh ngọt & Trà chiều', slug: 'banh-ngot-tra-chieu' },
      { name: 'Đồ chay thanh tịnh', slug: 'do-chay-thanh-tinh' }
    ]
  },
  {
    name: 'Loại hình du lịch',
    icon: 'Plane',
    color: 'from-teal-400 to-emerald-500',
    tags: [
      { name: 'Phượt bụi', slug: 'phuot-bui' },
      { name: 'Nghỉ dưỡng', slug: 'nghi-duong' },
      { name: 'Camping (Cắm trại)', slug: 'camping-cam-trai' },
      { name: 'Glamping (Sang chảnh)', slug: 'glamping-sang-chanh' },
      { name: 'Leo núi', slug: 'leo-nui' },
      { name: 'Du lịch biển', slug: 'du-lich-bien' },
      { name: 'Du lịch sinh thái', slug: 'du-lich-sinh-thai' },
      { name: 'Khám phá mạo hiểm', slug: 'kham-pha-mao-hiem' },
      { name: 'Roadtrip xuyên Việt', slug: 'roadtrip-xuyen-viet' },
      { name: 'Staycation thành phố', slug: 'staycation-thanh-pho' },
      { name: 'Trekking rừng sâu', slug: 'trekking-rung-sau' }
    ]
  },
  {
    name: 'Trải nghiệm & Hoạt động',
    icon: 'Camera',
    color: 'from-blue-400 to-indigo-500',
    tags: [
      { name: 'Nhiếp ảnh', slug: 'nhiep-anh' },
      { name: 'Check-in sống ảo', slug: 'check-in-song-ao' },
      { name: 'Săn mây Đà Lạt', slug: 'san-may-da-lat' },
      { name: 'Chèo thuyền SUP/Kayak', slug: 'cheo-thuyen-sup-kayak' },
      { name: 'Văn hóa & Lịch sử', slug: 'van-hoa-lich-su' },
      { name: 'Đi bar/Pub đêm', slug: 'di-bar-pub-dem' },
      { name: 'Xem concert/Show nhạc', slug: 'xem-concert-show-nhac' },
      { name: 'Team building', slug: 'team-building' },
      { name: 'Chạy bộ ngắm bình minh', slug: 'chay-bo-ngam-binh-minh' }
    ]
  },
  {
    name: 'Vibe chuyến đi & Cạ cứng',
    icon: 'Heart',
    color: 'from-rose-400 to-pink-500',
    tags: [
      { name: 'Du lịch một mình', slug: 'du-lich-mot-minh' },
      { name: 'Đi cùng người yêu', slug: 'di-cung-nguoi-yeu' },
      { name: 'Đi cùng gia đình', slug: 'di-cung-gia-dinh' },
      { name: 'Đi cùng nhóm bạn', slug: 'di-cung-nhom-ban' },
      { name: 'Linh hoạt', slug: 'linh-hoat' },
      { name: 'Du lịch chữa lành', slug: 'du-lich-chua-lanh' },
      { name: 'Chill và thư giãn', slug: 'chill-va-thu-gian' },
      { name: 'Săn ảnh nghệ thuật', slug: 'san-anh-nghe-thuat' }
    ]
  }
];

const OnboardingPage = () => {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore(state => state.addToast);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Kiểm tra xem user đã có sẵn sở thích trong DB chưa (chế độ Chỉnh sửa)
  const hasExistingInterests = user?.interests && user.interests.length > 0;

  // Load sở thích cũ của user lên để sửa
  useEffect(() => {
    if (user?.interests && Array.isArray(user.interests)) {
      setSelectedTags(user.interests);
    }
  }, [user]);

  // Load danh mục & tag từ database
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response: any = await locationService.getOnboardingTags();
        if (response?.success && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories(STATIC_CATEGORIES);
        }
      } catch (error) {
        console.error("Failed to load onboarding tags", error);
        setCategories(STATIC_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, []);

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleComplete = async () => {
    if (selectedTags.length < 3) {
      addToast('Vui lòng chọn ít nhất 3 sở thích để tiếp tục', 'error');
      return;
    }

    if (!user?.id) {
      addToast('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', 'error');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      const response = await userApi.updateProfile(user.id, {
        interests: selectedTags
      });

      if (response.success) {
        const serverUser = response.data;
        updateProfile({
          interests: Array.isArray(serverUser.interests)
            ? serverUser.interests
            : (typeof serverUser.interests === 'string' ? serverUser.interests.split(', ') : [])
        });
        
        addToast(hasExistingInterests ? 'Cập nhật sở thích thành công!' : 'Đã lưu sở thích của bạn!', 'success');
        
        if (hasExistingInterests) {
          navigate('/profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        addToast(response.message || 'Cập nhật thất bại', 'error');
      }
    } catch (err: any) {
      console.error('Onboarding Save Error:', err);
      addToast(err.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasExistingInterests) {
      navigate('/profile', { replace: true });
    } else {
      addToast('Bạn có thể cập nhật sở thích sau trong phần chỉnh sửa hồ sơ', 'info');
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl -z-10"></div>

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">GODY.VN</span>
        </div>
        <button 
          onClick={handleBack}
          className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-4 rounded-xl hover:bg-slate-100 flex items-center gap-1.5"
        >
          {hasExistingInterests ? (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </>
          ) : (
            <span>Bỏ qua</span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-center items-center z-10">
        <div className="text-center max-w-xl mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight"
          >
            {hasExistingInterests ? 'Cập nhật sở thích của bạn ✨' : 'Chào mừng bạn đến với Gody! 👋'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-500 text-sm md:text-base font-medium"
          >
            Chọn các chủ đề và hoạt động bạn thích để hệ thống tìm bạn đồng hành hợp gu và gợi ý những hành trình phù hợp nhất.
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="w-full space-y-6 mb-12">
          {categories.map((cat, catIdx) => {
            const IconComponent = (Icons as any)[cat.icon];
            return (
              <motion.div 
                key={cat.id || cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: catIdx * 0.1 }}
                className="bg-white border border-slate-200/80 rounded-[1.75rem] p-6 shadow-sm shadow-slate-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-sm flex items-center justify-center`}>
                    {IconComponent ? <IconComponent className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-md">{cat.name}</h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {cat.tags.map((tag: any) => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    const isSelected = selectedTags.includes(tagName);
                    return (
                      <button
                        key={tag.id || tagName}
                        onClick={() => handleTagToggle(tagName)}
                        className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all duration-200 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-transparent shadow-md shadow-teal-500/10 scale-[1.02]'
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {isSelected && <Icons.Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        <span>{tagName}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Panel */}
        <div className="w-full flex flex-col items-center gap-3.5 sticky bottom-6 bg-white border border-slate-200/80 p-5 rounded-2xl max-w-md shadow-xl shadow-slate-200/50 backdrop-blur-md">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-500">Đã chọn:</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-md font-black transition-all ${selectedTags.length >= 3 ? 'text-teal-600' : 'text-orange-500'}`}>
                {selectedTags.length}
              </span>
              <span className="text-xs text-slate-400">/ tối thiểu 3 sở thích</span>
            </div>
          </div>

          <button
            onClick={handleComplete}
            disabled={selectedTags.length < 3 || saving}
            className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all duration-300 ${
              selectedTags.length >= 3
                ? 'bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-500/10 cursor-pointer active:scale-98'
                : 'bg-slate-100 text-slate-400 border border-slate-200/40 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <>
                <span>{hasExistingInterests ? 'Cập nhật thay đổi' : 'Hoàn tất chọn lựa'}</span>
                <Icons.ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} Gody.vn Travel Platform. Mạng xã hội du lịch hàng đầu Việt Nam.
      </footer>
    </div>
  );
};

export default OnboardingPage;
