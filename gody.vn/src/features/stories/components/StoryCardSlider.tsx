import React, { useEffect, useState, useRef } from 'react';
import { useStoryStore } from '../store/useStoryStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Plus, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import StoryUploadModal from './StoryUploadModal';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const StoryCardSlider: React.FC = () => {
  const { feeds, isLoading, fetchStoriesFeed, openPlayer } = useStoryStore();
  const { user } = useAuthStore();
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Tải danh sách story feed khi mount
  useEffect(() => {
    fetchStoriesFeed();
  }, [fetchStoriesFeed]);

  // Kiểm tra trạng thái cuộn của thanh trượt để ẩn/hiện phím điều hướng
  const checkScrollStatus = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollStatus);
      // Kiểm tra lần đầu khi mount
      setTimeout(checkScrollStatus, 500);
    }
    return () => {
      if (slider) slider.removeEventListener('scroll', checkScrollStatus);
    };
  }, [feeds]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full mb-10 group/slider select-none">
      
      {/* Nút điều hướng Trái */}
      {showLeftArrow && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-slate-50 text-gray-700 rounded-full shadow-lg border border-slate-100 flex items-center justify-center transition-all scale-90 group-hover/slider:scale-100 active:scale-95"
        >
          <ChevronLeft size={20} className="stroke-[2.5]" />
        </button>
      )}

      {/* Nút điều hướng Phải */}
      {showRightArrow && feeds.length > 0 && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-slate-50 text-gray-700 rounded-full shadow-lg border border-slate-100 flex items-center justify-center transition-all scale-90 group-hover/slider:scale-100 active:scale-95"
        >
          <ChevronRight size={20} className="stroke-[2.5]" />
        </button>
      )}

      {/* Danh sách cuộn ngang */}
      <div 
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        
        {/* CARD 1: Nút tạo tin của chính tôi */}
        <div 
          onClick={() => setIsUploadOpen(true)}
          className="flex flex-col items-center justify-between shrink-0 w-32 h-[190px] rounded-[1.75rem] border border-slate-150 bg-slate-50 hover:bg-slate-100/80 cursor-pointer shadow-sm relative overflow-hidden transition-all duration-300 active:scale-95"
        >
          {/* Avatar / Placeholder hình người */}
          <div className="flex-1 w-full flex items-center justify-center pt-6">
            <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img 
                  src={getImageUrl(user.avatar)} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-400" />
              )}
            </div>
          </div>

          {/* Phần đuôi chứa nút cộng xanh và chữ */}
          <div className="w-full bg-slate-800 text-center py-4 relative flex flex-col items-center justify-center">
            {/* Nút cộng xanh nước biển nằm nổi lên */}
            <div className="absolute -top-5 w-9 h-9 bg-[#1877F2] hover:bg-blue-600 rounded-full border-4 border-slate-50 flex items-center justify-center text-white shadow-md transition-all scale-100 hover:scale-110 active:scale-95 z-10">
              <Plus size={16} className="stroke-[3]" />
            </div>
            <span className="text-[11px] font-black text-white uppercase tracking-wider mt-1.5">Tạo tin</span>
          </div>
        </div>

        {/* CÁC CARDS TIẾP THEO: Stories của Followings */}
        {isLoading ? (
          // Skeleton loader
          Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="shrink-0 w-32 h-[190px] rounded-[1.75rem] bg-slate-100 animate-pulse border border-slate-100"
            />
          ))
        ) : (
          feeds.map((feed, userIndex) => {
            // Lấy story mới nhất của user này để làm ảnh bìa thumbnail
            const latestStory = feed.stories[feed.stories.length - 1];
            
            return (
              <div 
                key={feed.user_id}
                onClick={() => openPlayer(userIndex)}
                className="shrink-0 w-32 h-[190px] rounded-[1.75rem] overflow-hidden cursor-pointer relative shadow-sm border border-slate-100 active:scale-95 transition-all duration-300 group/card"
              >
                {/* Ảnh nền / Cover story */}
                <div className="absolute inset-0 bg-slate-900 z-0">
                  {latestStory.media_type === 'video' ? (
                    // Nếu là video, hiển thị frame video
                    <video 
                      src={latestStory.media_url} 
                      className="w-full h-full object-cover group-hover/card:scale-115 transition-transform duration-700"
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={latestStory.media_url} 
                      alt={feed.full_name} 
                      className="w-full h-full object-cover group-hover/card:scale-115 transition-transform duration-700"
                    />
                  )}
                  {/* Lớp phủ chuyển màu (Gradient overlay) để làm rõ chữ */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75 z-10" />
                </div>

                {/* Bong bóng Avatar góc trên cùng bên trái */}
                <div className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full p-0.5 bg-[#1877F2] shadow-lg animate-in zoom-in duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden border border-white bg-slate-200">
                    <img 
                      src={getImageUrl(feed.avatar) || 'https://i.pravatar.cc/100'} 
                      alt={feed.full_name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Tên người dùng góc dưới cùng */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <h5 className="text-[11px] font-black text-white leading-tight truncate uppercase tracking-tight drop-shadow-md text-left">
                    {feed.full_name}
                  </h5>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal đăng tin */}
      <StoryUploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default StoryCardSlider;
