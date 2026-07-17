import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '../store/useStoryStore';
import { getShareUrl, copyToClipboard } from '../../../shared/utils/urlHelper';
import { ChevronLeft, ChevronRight, X, MoreHorizontal, AlertTriangle, Play, Pause, Heart, Send } from 'lucide-react';

interface StoryPlayerProps {
  onReportClick: (storyId: string) => void;
}

const STORY_DURATION = 5000; // 5 giây cho mỗi slide ảnh tĩnh

const StoryPlayer: React.FC<StoryPlayerProps> = ({ onReportClick }) => {
  const { 
    playList, 
    activeUserIndex, 
    activeStoryIndex, 
    isPlaying, 
    nextStory, 
    prevStory, 
    closePlayer, 
    pausePlayer, 
    resumePlayer,
    toggleLikeStory
  } = useStoryStore();

  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lấy dữ liệu tin hiện tại đang phát
  const currentUserFeed = activeUserIndex !== null ? playList[activeUserIndex] : null;
  const currentStory = currentUserFeed && currentUserFeed.stories[activeStoryIndex] 
    ? currentUserFeed.stories[activeStoryIndex] 
    : null;

  const duration = currentStory ? STORY_DURATION : STORY_DURATION;

  // Reset elapsed when story changes
  useEffect(() => {
    setElapsed(0);
    setProgress(0);
  }, [activeUserIndex, activeStoryIndex]);

  // Xử lý tự động chạy tiến trình progress bar
  useEffect(() => {
    if (activeUserIndex === null || !currentStory || !isPlaying || showMenu) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return;
    }

    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }

    const intervalStep = 50;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + intervalStep;
        if (next >= duration) {
          clearInterval(timer);
          nextStory();
          return duration;
        }
        setProgress((next / duration) * 100);
        return next;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [activeUserIndex, activeStoryIndex, isPlaying, showMenu, nextStory, currentStory, duration]);

  // Điều khiển tạm dừng/chạy tiếp
  const handlePressStart = () => {
    pausePlayer();
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handlePressEnd = () => {
    resumePlayer();
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Lắng nghe phím mũi tên và ESC để điều khiển bàn phím xịn sò
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeUserIndex === null) return;
      if (e.key === 'Escape') closePlayer();
      if (e.key === 'ArrowRight') nextStory();
      if (e.key === 'ArrowLeft') prevStory();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeUserIndex, closePlayer, nextStory, prevStory]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    await toggleLikeStory(currentStory.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    
    const shareLink = getShareUrl(`/profile/${currentUserFeed?.user_id}?storyId=${currentStory.id}`);
    
    copyToClipboard(shareLink).then(() => {
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }).catch(err => {
      console.error("Lỗi sao chép link:", err);
    });
  };

  if (activeUserIndex === null || !currentUserFeed || !currentStory) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden font-sans">
        
        {/* Nút đóng player góc ngoài cùng bên phải */}
        <button 
          onClick={closePlayer}
          className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95"
        >
          <X size={24} />
        </button>

        {/* Cột điều khiển slide Trái / Phải lớn ở hai bên cánh */}
        <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-6 z-40 hidden md:flex">
          <button 
            onClick={prevStory}
            className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-6 z-40 hidden md:flex">
          <button 
            onClick={nextStory}
            className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Khung trình phát Story Canvas chính (Tỉ lệ chuẩn 9:16 như điện thoại) */}
        <div 
          className="relative w-full max-w-[430px] aspect-[9/16] bg-slate-950 shadow-2xl rounded-[3rem] overflow-hidden border border-white/10 flex flex-col justify-between"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Header chứa Progress Bars & Creator Info */}
          <div 
            className="absolute top-0 left-0 right-0 z-40 p-6 bg-gradient-to-b from-black/75 to-transparent"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            
            {/* Progress Segment Indicators */}
            <div className="flex gap-1.5 mb-4">
              {currentUserFeed.stories.map((story, index) => {
                let segmentProgress = 0;
                if (index < activeStoryIndex) segmentProgress = 100;
                if (index === activeStoryIndex) segmentProgress = progress;

                return (
                  <div key={story.id} className="h-1 flex-1 bg-white/35 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all ease-linear"
                      style={{ 
                        width: `${segmentProgress}%`,
                        transitionDuration: index === activeStoryIndex ? '50ms' : '0ms'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Thông tin tác giả & Nút ba chấm */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={currentUserFeed.avatar || 'https://i.pravatar.cc/150'} 
                  alt={currentUserFeed.full_name} 
                  className="w-10 h-10 rounded-full border-2 border-white/80 object-cover"
                />
                <div>
                  <h4 className="text-sm font-black text-white">{currentUserFeed.full_name}</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {new Date(currentStory.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Nút hành động Play/Pause & báo cáo */}
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) {
                      handlePressStart();
                    } else {
                      handlePressEnd();
                    }
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                  title={isPlaying ? "Tạm dừng" : "Tiếp tục"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePressStart();
                    setShowMenu(!showMenu);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                >
                  <MoreHorizontal size={18} />
                </button>

                {/* Dropdown Menu Báo cáo nhanh */}
                {showMenu && (
                  <div 
                    className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl py-2 border border-slate-100 z-50 animate-in fade-in slide-in-from-top-3 duration-250"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onReportClick(currentStory.id);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-500 font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <AlertTriangle size={14} />
                      BÁO CÁO VI PHẠM
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handlePressEnd();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 text-gray-500 font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      Đóng Menu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Media Canvas chính (Video hoặc Hình ảnh) */}
          <div className="flex-1 w-full h-full bg-slate-900 flex items-center justify-center">
            {currentStory.media_type === 'video' ? (
              <video 
                ref={videoRef}
                src={currentStory.media_url} 
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
                onLoadedData={() => {
                  if (isPlaying && !showMenu) {
                    videoRef.current?.play().catch(() => {});
                  }
                }}
              />
            ) : (
              <img 
                src={currentStory.media_url} 
                alt="Story content" 
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Lớp phủ tương tác thả tim và chia sẻ ở góc dưới bên phải */}
          <div 
            className="absolute bottom-6 right-6 z-40 flex items-center gap-3"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Nút Thả tim */}
            <button
              onClick={handleLikeClick}
              className="p-3 bg-black/40 hover:bg-black/60 active:scale-90 text-white rounded-full transition-all border border-white/10 backdrop-blur-md flex items-center justify-center gap-1.5"
            >
              <Heart
                size={20}
                className={currentStory.is_liked ? "fill-red-500 text-red-500" : "text-white"}
              />
              {currentStory.like_count !== undefined && currentStory.like_count > 0 && (
                <span className="text-xs font-bold text-white">{currentStory.like_count}</span>
              )}
            </button>

            {/* Nút Chia sẻ */}
            <button
              onClick={handleShareClick}
              className="p-3 bg-black/40 hover:bg-black/60 active:scale-90 text-white rounded-full transition-all border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Chia sẻ tin ngắn"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>

          {/* Toast thông báo sao chép */}
          <AnimatePresence>
            {showCopiedToast && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/85 border border-white/20 px-4 py-2 rounded-full text-white text-xs font-bold z-50 shadow-lg backdrop-blur-sm"
              >
                Đã sao chép liên kết tin ngắn!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer chứa Caption chú thích nếu có */}
          {currentStory.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-8 pr-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-left z-30">
              <p className="text-sm font-bold text-white leading-relaxed drop-shadow-md">
                {currentStory.caption}
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};

export default StoryPlayer;
