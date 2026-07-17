import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Play, Calendar } from 'lucide-react';
import { useStoryStore } from '../store/useStoryStore';
import { StoryItem, UserStoryFeed } from '../services/storyApi';

interface StoryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string | number;
    username: string;
    full_name: string;
    avatar: string | null;
  } | null;
}

const StoryArchiveModal: React.FC<StoryArchiveModalProps> = ({ isOpen, onClose, currentUser }) => {
  const { archive, fetchStoriesArchive, deleteStory, openPlayerWithFeed } = useStoryStore();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStoriesArchive();
    }
  }, [isOpen, fetchStoriesArchive]);

  if (!isOpen || !currentUser) return null;

  const handleDelete = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn việc click mở Player
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tin này khỏi kho lưu trữ?")) {
      setIsDeletingId(storyId);
      await deleteStory(storyId);
      setIsDeletingId(null);
    }
  };

  const handlePlayStory = (startIndex: number) => {
    // Tạo UserStoryFeed ảo đại diện cho các tin lưu trữ
    const feed: UserStoryFeed = {
      user_id: String(currentUser.id),
      username: currentUser.username,
      full_name: currentUser.full_name,
      avatar: currentUser.avatar,
      stories: archive
    };
    
    openPlayerWithFeed(feed, startIndex);
  };

  // Phân loại tin hoạt động và đã hết hạn
  const now = new Date();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[85vh] bg-[#1a1a1a] text-white rounded-[2rem] border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <span>Kho lưu trữ tin ngắn</span>
                  <span className="text-xs bg-white/10 text-white/60 px-2.5 py-1 rounded-full font-bold">
                    {archive.length} tin
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-1">Chỉ bạn mới có thể xem các tin ngắn đã hết hạn của mình.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {archive.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/30 mb-4">
                    <Calendar size={28} />
                  </div>
                  <h4 className="font-bold text-lg text-white/80">Kho lưu trữ trống</h4>
                  <p className="text-sm text-white/40 max-w-sm mt-2">
                    Các tin bạn đăng sau 24 giờ sẽ tự động được đưa vào kho lưu trữ bí mật tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {archive.map((story, index) => {
                    const isExpired = new Date(story.expires_at) < now;
                    return (
                      <div 
                        key={story.id}
                        onClick={() => handlePlayStory(index)}
                        className="group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer shadow-lg hover:shadow-black/50"
                      >
                        {/* Thumbnail Media */}
                        {story.media_type === 'video' ? (
                          <video 
                            src={story.media_url} 
                            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                            muted 
                            playsInline
                          />
                        ) : (
                          <img 
                            src={story.media_url} 
                            alt="Story Thumbnail" 
                            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                          />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-4 opacity-100">
                          
                          {/* Top Badges */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                              isExpired 
                                ? 'bg-black/40 text-white/60 border-white/5' 
                                : 'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>
                              {isExpired ? 'Đã hết hạn' : 'Đang hoạt động'}
                            </span>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDelete(story.id, e)}
                              disabled={isDeletingId === story.id}
                              className="p-1.5 bg-black/40 hover:bg-red-500/80 hover:text-white text-white/70 rounded-md transition-all active:scale-90 flex items-center justify-center"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Center Play Button on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all scale-90 group-hover:scale-100">
                              <Play size={20} className="fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom info (Date & Caption) */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white/50">
                              {new Date(story.created_at).toLocaleDateString('vi-VN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                            {story.caption && (
                              <p className="text-xs font-semibold text-white truncate">
                                {story.caption}
                              </p>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StoryArchiveModal;
