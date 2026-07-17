import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { MapPin, Settings, CheckCircle, UserPlus, UserMinus, Heart, MessageSquare, Share2, Grid, Image, Map, Trophy, Users, ChevronRight, LogOut, Plus, X, Home, Cake, GraduationCap, ChevronLeft, Briefcase, MoreHorizontal, Pencil, Trash2, AlertCircle, Star, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useUserStore } from '../../../features/user/store/useUserStore';
import { useStoryStore } from '../../stories/store/useStoryStore';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import UserFriendsList from '../components/UserFriendsList';
import BackButton from '../../../shared/components/common/BackButton';
import { useToastStore } from '../../../shared/hooks/useToast';
import { useChatStore } from '../../chat/store/useChatStore';

// Modals mới
import EditIntroModal from '../components/EditIntroModal';
import DeletePostModal from '../../blog/components/DeletePostModal';
import EditPostQuickModal from '../../blog/components/EditPostQuickModal';

// Phân hệ Story 24h
import StoryPlayer from '../../stories/components/StoryPlayer';
import ReportModal from '../../../components/modals/ReportModal';
import StoryUploadModal from '../../stories/components/StoryUploadModal';
import StoryArchiveModal from '../../stories/components/StoryArchiveModal';

const ProfilePage = () => {
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const id = pathId || queryId;
  const navigate = useNavigate();
  const storyScrollRef = useRef<HTMLDivElement>(null);

  const { user: currentUser, isAuthenticated, toggleFollow, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { profile, posts, photos, groups, locations, reviews, followers, following, friends, userStories, loadProfile, loadUserContent, loadUserStories, loadFollowers, loadFollowing, loadFriends } = useUserStore();
  const { addToast } = useToastStore();
  const openChat = useChatStore(state => state.openChat);
  const { openPlayer, openPlayerWithFeed, closePlayer } = useStoryStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReportStoryId, setSelectedReportStoryId] = useState<string | null>(null);

  // States mới cho Story 24h & Avatar Lightbox
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);

  // States cho tương tác
  const [isEditIntroOpen, setIsEditIntroOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);

  const scrollStories = (direction: 'left' | 'right') => {
    if (storyScrollRef.current) {
      const scrollAmount = 200;
      storyScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleFollow = async () => {
    if (!id) return;
    try {
      await toggleFollow(id, isFollowing);
      loadProfile(id, true);
      addToast(isFollowing ? 'Đã bỏ theo dõi người dùng' : 'Theo dõi người dùng thành công', 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể thực hiện yêu cầu';
      addToast(errorMsg, 'error');
    }
  };

  const handleAvatarClick = () => {
    if (userStories && userStories.length > 0) {
      const feed = {
        user_id: String(targetUser.id),
        username: targetUser.username || targetUser.name,
        full_name: targetUser.name,
        avatar: targetUser.avatar,
        stories: userStories
      };
      openPlayerWithFeed(feed, 0);
    } else {
      setIsAvatarLightboxOpen(true);
    }
  };

  const refreshProfile = () => {
    const targetId = id || currentUser?.id;
    if (targetId) {
      loadProfile(targetId.toString());
    }
  };

  const refreshContent = () => {
    const targetId = id || currentUser?.id;
    if (targetId) {
      loadUserContent(targetId.toString());
    }
  };

  const badges = [
    { id: 'b1', name: 'Thánh check-in An Giang', icon: '🏯', color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400', description: 'Đã ghé thăm hơn 5 địa điểm tại An Giang' },
    { id: 'b2', name: 'Reviewer tâm huyết', icon: '✍️', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400', description: 'Có hơn 10 bài viết được cộng đồng yêu thích' },
    { id: 'b3', name: 'Người dẫn đường', icon: '🧭', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', description: 'Đã tạo và quản lý 3 hội nhóm du lịch' },
    { id: 'b4', name: 'Sứ giả hòa bình', icon: '🕊️', color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400', description: 'Được vinh danh bởi Blog Travel Team' },
  ];

  useEffect(() => {
    const targetId = id || currentUser?.id;
    if (targetId) {
      setLoading(true);
      Promise.all([
        loadProfile(targetId.toString()),
        loadUserContent(targetId.toString()),
        loadFriends(targetId.toString())
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [id, currentUser?.id, loadProfile, loadUserContent, loadFriends]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
        <p className="font-bold text-faint-color">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isMe = !id || id === currentUser.id.toString();
  const targetUser = (isMe ? profile || currentUser : profile) as any;
  
  if (!targetUser) {
    return (
      <div className="pt-32 text-center">
        <p className="text-faint-color font-bold">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  const isFollowing = targetUser.is_following !== undefined 
    ? targetUser.is_following 
    : currentUser.following?.includes(id || '');

  const followersCount = targetUser?.stats?.followers_count || targetUser?.followers || 0;
  const followingCount = targetUser?.stats?.following_count || (isMe ? currentUser.following?.length : 0) || 0;

  return (
    <div className="pt-24 min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <BackButton className="mb-8" />

        {/* HEADER SECTION */}
        <div className="bg-surface rounded-[3rem] shadow-premium border border-theme p-12 mb-8 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pastel-orange/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-pastel-orange/10"></div>

          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-12 relative z-10">
            <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
              {userStories && userStories.length > 0 ? (
                <div className="p-[4px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-[2.75rem] transition-transform duration-300 group-hover:scale-105">
                  <div className="w-44 h-44 rounded-[2.5rem] overflow-hidden border-[4px] border-white dark:border-slate-900 shadow-2xl bg-white dark:bg-slate-800">
                    <img src={getImageUrl(targetUser.avatar)} className="w-full h-full object-cover" alt={targetUser.name} />
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden border-[6px] border-white dark:border-slate-900 shadow-2xl transition-transform duration-300 group-hover:scale-105 bg-white dark:bg-slate-800">
                  <img src={getImageUrl(targetUser.avatar)} className="w-full h-full object-cover" alt={targetUser.name} />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-400 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
                <CheckCircle className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4 justify-center lg:justify-start">
                <h1 className="text-4xl font-black text-base-color tracking-tight">{targetUser.name}</h1>
                {targetUser.isPartner && (
                  <span className="inline-block px-4 py-1 bg-green-50 dark:bg-green-950/30 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 dark:border-green-500/20">
                    PARTNER
                  </span>
                )}
              </div>

              <div className="mb-8 max-w-xl">
                <p className="text-muted-color text-xl font-medium leading-relaxed italic">
                  {targetUser.bio ? `"${targetUser.bio}"` : ""}
                </p>
              </div>

              <div className="flex items-center gap-12 justify-center lg:justify-start">
                <button 
                  onClick={() => {
                    const targetId = id || currentUser?.id;
                    if (targetId) {
                      loadFollowers(targetId.toString());
                      setShowFollowers(true);
                    }
                  }}
                  className="text-left hover:opacity-70 transition-opacity"
                >
                  <p className="text-2xl font-black text-base-color">{followersCount}</p>
                  <p className="text-xs font-bold text-faint-color uppercase tracking-widest">Followers</p>
                </button>
                <button 
                  onClick={() => {
                    const targetId = id || currentUser?.id;
                    if (targetId) {
                      loadFollowing(targetId.toString());
                      setShowFollowing(true);
                    }
                  }}
                  className="text-left hover:opacity-70 transition-opacity"
                >
                  <p className="text-2xl font-black text-base-color">{followingCount}</p>
                  <p className="text-xs font-bold text-faint-color uppercase tracking-widest">Following</p>
                </button>
                <div className="text-left">
                  <p className="text-2xl font-black text-base-color">{posts?.length || 0}</p>
                  <p className="text-xs font-bold text-faint-color uppercase tracking-widest">Bài viết</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              {!isMe ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                    <button
                      onClick={handleToggleFollow}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={`flex-1 lg:w-64 py-5 font-black rounded-[1.5rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                        ${isFollowing 
                          ? (isHovered ? 'bg-red-50 dark:bg-red-950/30 text-red-500 shadow-red-200/30 border border-red-100 dark:border-red-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 shadow-gray-200/30') 
                          : 'bg-gradient-to-r from-pastel-orange to-orange-500 text-white shadow-orange-500/30 hover:shadow-orange-500/40'}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className={`w-6 h-6 transition-transform ${isHovered ? 'scale-110' : ''}`} />
                          <span>{isHovered ? 'Hủy theo dõi' : 'Đang theo dõi'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-6 h-6" />
                          <span>Theo dõi</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          if (!id) return;
                          addToast('Đang kết nối hội thoại...', 'info');
                          await openChat(id);
                        } catch (err) {
                          addToast('Không thể mở hội thoại. Vui lòng thử lại.', 'error');
                        }
                      }}
                      className="flex-1 lg:w-64 py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-6 h-6 text-orange-500" />
                      <span>Nhắn tin</span>
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-slate-800">
                      <Share2 className="w-6 h-6 mx-auto" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/profile/edit" className="w-full lg:w-64 py-5 bg-gray-900 dark:bg-slate-800 text-white font-black rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-slate-700 transition-all">
                    <Settings className="w-6 h-6" />
                    Thiết lập hồ sơ
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="w-full lg:w-64 py-4 bg-orange-50 dark:bg-orange-950/30 text-orange-500 font-black rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all border border-orange-100 dark:border-orange-500/20"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    Giao diện: {theme === 'dark' ? 'Sáng' : 'Tối'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full lg:w-64 py-4 bg-red-50 dark:bg-red-950/30 text-red-500 font-black rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NỬA DƯỚI: BỐ CỤC GRID 2 CỘT CHẶT CHẼ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT TRÁI (COL-SPAN-1): CHỨC NĂNG CÁ NHÂN */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* CARD 1: TIN CỦA BẠN & TIN NỔI BẬT */}
            <div className="bg-surface rounded-2xl shadow-sm p-5 border border-theme transition-colors">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold text-base-color">Tin của bạn</h3>
                {isMe && (
                  <span 
                    onClick={() => setIsArchiveModalOpen(true)}
                    className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                  >
                    Xem tất cả
                  </span>
                )}
              </div>
              <div className="relative group/carousel">
                {/* Left Button */}
                <button 
                  onClick={() => scrollStories('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-orange-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Scroll Container */}
                <div 
                  ref={storyScrollRef}
                  className="flex flex-nowrap overflow-x-hidden gap-3 scroll-smooth no-scrollbar p-1"
                >
                  {/* Nút Tạo tin (Chỉ hiện với Me) */}
                  {isMe && (
                    <div 
                      onClick={() => setIsUploadOpen(true)}
                      className="w-28 shrink-0 aspect-[9/16] rounded-xl overflow-hidden cursor-pointer relative shadow-md group/create border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-orange-300 transition-colors"
                    >
                      <img 
                        src={getImageUrl(targetUser.avatar)} 
                        className="w-full h-full object-cover opacity-50 group-hover/create:scale-110 transition-transform duration-500" 
                        alt="Create Story"
                      />
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform group-hover/create:scale-110">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-white drop-shadow-md">Tạo tin</span>
                      </div>
                    </div>
                  )}

                  {/* Tin nổi bật / Featured Items */}
                  {userStories && userStories.length > 0 ? (
                    userStories.map((story: any, storyIndex: number) => (
                      <div 
                        key={story.id} 
                        onClick={() => {
                          const feed = {
                            user_id: String(targetUser.id),
                            username: targetUser.username || targetUser.name,
                            full_name: targetUser.name,
                            avatar: targetUser.avatar,
                            stories: userStories
                          };
                          openPlayerWithFeed(feed, storyIndex);
                        }}
                        className="w-28 shrink-0 aspect-[9/16] rounded-xl overflow-hidden group/story cursor-pointer relative shadow-sm border border-gray-50 dark:border-slate-700"
                      >
                        {story.media_type === 'video' ? (
                          <video 
                            src={getImageUrl(story.media_url)} 
                            className="w-full h-full object-cover group-hover/story:scale-110 transition-transform duration-700" 
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img 
                            src={getImageUrl(story.media_url)} 
                            className="w-full h-full object-cover group-hover/story:scale-110 transition-transform duration-700" 
                            alt="Story"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      </div>
                    ))
                  ) : (
                    !isMe && <div className="flex items-center justify-center w-full h-full min-h-[160px]"><p className="text-xs text-gray-400 font-bold px-4">Chưa có tin nào.</p></div>
                  )}
                </div>

                {/* Right Button */}
                <button 
                  onClick={() => scrollStories('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-orange-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CARD 2: Giới thiệu */}
            <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-faint-color uppercase tracking-[0.2em]">Giới thiệu</h3>
                {isMe && (
                  <button 
                    onClick={() => setIsEditIntroOpen(true)}
                    className="p-2 hover:bg-app text-muted-color hover:text-base-color rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-muted-color font-medium leading-relaxed mb-8">
                {targetUser.bio || "Người yêu du lịch, thích khám phá những cung đường mới và chia sẻ những khoảnh khắc đẹp của cuộc sống qua từng chuyến đi."}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-theme">
                  <span className="text-faint-color font-bold text-xs uppercase tracking-widest">Nơi sống</span>
                  <span className="font-black text-base-color">{targetUser.current_city || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-theme">
                  <span className="text-faint-color font-bold text-xs uppercase tracking-widest">Quê quán</span>
                  <span className="font-black text-base-color">{targetUser.hometown || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-theme">
                  <span className="text-faint-color font-bold text-xs uppercase tracking-widest">Học vấn</span>
                  <span className="font-black text-base-color">{targetUser.education_school || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-theme">
                  <span className="text-faint-color font-bold text-xs uppercase tracking-widest">Nơi làm việc</span>
                  <span className="font-black text-base-color">{targetUser.workplace || "Chưa cập nhật"}</span>
                </div>
              </div>
            </div>

            {/* CARD 3: Sở thích */}
            {(targetUser.interests && targetUser.interests.length > 0) || isMe ? (
              <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-faint-color uppercase tracking-[0.2em] flex items-center gap-2">
                    Sở thích
                    <Heart className="w-4 h-4 text-orange-500 fill-current" />
                  </h3>
                  {isMe && (
                    <button 
                      onClick={() => navigate('/onboarding', { replace: true })}
                      className="p-2 hover:bg-app text-muted-color hover:text-base-color rounded-full transition-colors"
                      title="Chỉnh sửa sở thích"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {targetUser.interests && targetUser.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {targetUser.interests.map((interest: string, index: number) => (
                      <span 
                        key={index} 
                        className="px-4 py-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-xs font-black rounded-xl border border-orange-100 dark:border-orange-500/20 hover:bg-orange-100 transition-colors cursor-default"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold">Bạn chưa chọn sở thích nào.</p>
                    <button 
                      onClick={() => navigate('/onboarding', { replace: true })}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-orange-500/10 active:scale-95"
                    >
                      Chọn sở thích ngay
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* CARD 4: Bạn bè */}
            <UserFriendsList 
              friends={friends} 
              onSeeAll={() => {
                const targetId = id || currentUser?.id;
                if (targetId) {
                  loadFriends(targetId.toString());
                  setShowFriends(true);
                }
              }} 
            />

            {/* CARD 5: Huy hiệu */}
            <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme overflow-hidden relative group transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-sm font-black text-faint-color uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Huy hiệu
                <Trophy className="w-4 h-4 text-yellow-500" />
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className={`p-4 rounded-2xl ${badge.color} flex flex-col items-center text-center gap-2 cursor-help group/badge relative`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] font-black leading-tight">{badge.name}</span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      {badge.description}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CARD 6: Bản đồ */}
            <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme transition-colors">
              <h3 className="text-sm font-black text-faint-color uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Bản đồ dấu chân
                <MapPin className="w-4 h-4 text-rose-500" />
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-base-color">{locations?.length || 0}/34</span>
                  <span className="text-xs font-bold text-faint-color uppercase">Tỉnh thành đã đi</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((locations?.length || 0) / 34) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {locations && locations.slice(0, 6).map((p: any) => (
                    <div key={p.id} className="p-3 bg-app rounded-xl text-center border border-theme">
                      <p className="text-[10px] font-black text-base-color truncate">{p.name}</p>
                      <p className="text-[8px] font-bold text-emerald-500 uppercase">{p.my_checkin_count || 1} check-in</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (COL-SPAN-2): TABS VÀ FEED CHIA SẺ */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs Navigation */}
            <div className="flex gap-2 p-2 bg-surface rounded-[2rem] border border-theme transition-colors">
              {[
                { id: 'posts', label: 'Bài viết', icon: Grid },
                { id: 'photos', label: 'Hình ảnh', icon: Image },
                { id: 'saved', label: 'Địa điểm', icon: Map },
                { id: 'groups', label: 'Hội nhóm', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-app text-base-color shadow-md scale-[1.02]'
                    : 'text-faint-color hover:text-muted-color'
                    }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-pastel-orange' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
              {activeTab === 'posts' && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {posts && posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {posts.map((p: any) => (
                        <div key={p.id} className="bg-surface rounded-[2.5rem] overflow-hidden shadow-premium border border-theme group cursor-pointer active:scale-[0.98] transition-all flex flex-col relative">
                          
                          {/* Menu ba chấm (nếu là bài của chính mình) */}
                          {isMe && (
                            <div className="absolute top-4 right-4 z-20">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === p.id ? null : p.id);
                                }}
                                className="w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-all"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {activeMenuId === p.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-40 bg-surface rounded-2xl border border-theme shadow-xl py-2 z-30"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedPost(p);
                                        setIsEditPostOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4 py-3 text-left font-bold text-xs text-base-color hover:bg-app flex items-center gap-2 transition-colors"
                                    >
                                      <Pencil className="w-4 h-4 text-blue-500" />
                                      <span>Sửa nhanh</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedPost(p);
                                        setIsDeleteModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-4 py-3 text-left font-bold text-xs text-red-500 hover:bg-app flex items-center gap-2 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Xóa bài viết</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          <Link to={`/blog/${p.id}`} className="h-64 overflow-hidden relative block">
                            <img
                              src={getImageUrl(p.images && p.images[0] ? p.images[0] : p.cover_image)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              alt={p.title}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-8">
                              <div className="flex items-center gap-2 text-white font-black">
                                <Heart className="w-6 h-6 fill-current text-red-500" /> {p.like_count || p.likes_count || 0}
                              </div>
                              <div className="flex items-center gap-2 text-white font-black">
                                <MessageSquare className="w-6 h-6 fill-current text-blue-400" /> {p.comment_count || p.comments_count || 0}
                              </div>
                            </div>
                            {p.location_name && (
                              <div className="absolute top-6 left-6 bg-black/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                                {p.location_name}
                              </div>
                            )}
                          </Link>
                          <div className="p-6">
                            <h2 className="text-lg font-black text-base-color line-clamp-1 mb-2 group-hover:text-pastel-orange transition-colors">
                              {p.title}
                            </h2>
                            <p className="text-faint-color text-[10px] font-bold uppercase tracking-widest">
                              {new Date(p.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-theme transition-colors">
                      <p className="text-muted-color font-bold">Chưa có bài viết nào.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'photos' && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {photos && photos.length > 0 ? (
                    photos.map((photo: any, i: number) => (
                      <div key={i} className="aspect-square rounded-[2rem] overflow-hidden group relative cursor-pointer border border-theme">
                        <img
                          src={getImageUrl(photo.url)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          alt="User Photo"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Link to={`/blog/${photo.post_id || photo.blog_id}`}>
                            <Heart className="text-white w-8 h-8 fill-current hover:text-red-500 transition-colors" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-theme transition-colors">
                      <p className="text-muted-color font-bold">Chưa có hình ảnh nào.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {locations && locations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {locations.map((loc: any) => (
                        <Link to={`/destination/${loc.slug || loc.id}`} key={loc.id} className="flex gap-6 bg-surface p-6 rounded-[2rem] border border-theme hover:shadow-xl transition-all group">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative border border-theme">
                            <img src={getImageUrl(loc.image)} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <h4 className="text-lg font-black text-base-color group-hover:text-pastel-orange transition-colors">{loc.name}</h4>
                            <p className="text-sm text-muted-color font-bold flex items-center gap-2 mt-1">
                              <MapPin className="w-4 h-4 text-pastel-orange" /> {loc.region || 'Việt Nam'}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase mt-2">{loc.my_checkin_count || 1} lần ghé thăm</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-theme transition-colors">
                      <p className="text-muted-color font-bold">Người dùng chưa có dấu chân tại địa điểm nào.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'groups' && (
                <motion.div
                  key="groups"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {groups && groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groups.map((group: any) => (
                        <div key={group.id} className="bg-surface p-6 rounded-[2.5rem] border border-theme shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-theme">
                            <img src={getImageUrl(group.cover_image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={group.name} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-base-color group-hover:text-pastel-orange transition-colors">{group.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${group.my_role === 'owner' ? 'bg-orange-50 dark:bg-orange-950/30 text-pastel-orange' : 'bg-app text-faint-color'}`}>
                                {group.my_role === 'owner' ? 'Quản trị viên' : 'Thành viên'}
                              </span>
                              <span className="text-[10px] font-bold text-muted-color">{group.actual_member_count || group.members_count || 0} TV</span>
                            </div>
                          </div>
                          <Link to={`/groups/${group.id}`}>
                            <ChevronRight className="w-5 h-5 text-faint-color group-hover:text-pastel-orange group-hover:translate-x-1 transition-all" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-theme transition-colors">
                      <p className="text-muted-color font-bold">Người dùng chưa tham gia hội nhóm nào.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* User Followers / Following / Friends List Modals */}
      <AnimatePresence>
        {(showFollowers || showFollowing || showFriends) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowFollowers(false); setShowFollowing(false); setShowFriends(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-theme"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-theme flex items-center justify-between">
                <h3 className="text-xl font-black text-base-color">
                  {showFollowers ? 'Người theo dõi' : showFollowing ? 'Đang theo dõi' : 'Bạn bè'}
                </h3>
                <button onClick={() => { setShowFollowers(false); setShowFollowing(false); setShowFriends(false); }} className="p-2 hover:bg-app text-muted-color hover:text-base-color rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {(showFollowers ? followers : showFollowing ? following : friends).length > 0 ? (
                  (showFollowers ? followers : showFollowing ? following : friends).map((u: any) => (
                    <Link 
                      key={u.id} 
                      to={`/profile/${u.id}`} 
                      onClick={() => { setShowFollowers(false); setShowFollowing(false); setShowFriends(false); }}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-app transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                          <img src={getImageUrl(u.avatar)} className="w-full h-full object-cover" alt={u.name} />
                        </div>
                        <div>
                          <p className="font-black text-base-color text-sm group-hover:text-pastel-orange transition-colors">{u.full_name || u.name || u.username}</p>
                          <p className="text-[10px] text-faint-color font-bold uppercase tracking-widest line-clamp-1">{u.location || 'Thành viên'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-faint-color group-hover:text-pastel-orange group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-color font-bold">Chưa có danh sách.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Lightbox Modal */}
      <AnimatePresence>
        {isAvatarLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAvatarLightboxOpen(false)}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsAvatarLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/75 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-3xl max-h-[85vh] overflow-hidden rounded-[2rem] shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={getImageUrl(targetUser.avatar)}
                className="max-w-full max-h-[85vh] object-contain mx-auto"
                alt={targetUser.name}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals chỉnh sửa / Tương tác */}
      <EditIntroModal 
        isOpen={isEditIntroOpen} 
        onClose={() => setIsEditIntroOpen(false)} 
        userData={targetUser} 
        onUpdateSuccess={refreshProfile} 
      />

      <DeletePostModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setSelectedPost(null); }} 
        postId={selectedPost?.id || null} 
        onDeleteSuccess={refreshContent} 
      />

      <EditPostQuickModal 
        isOpen={isEditPostOpen} 
        onClose={() => { setIsEditPostOpen(false); setSelectedPost(null); }} 
        post={selectedPost} 
        onUpdateSuccess={refreshContent} 
      />

      {/* Phân hệ Story 24h */}
      <StoryPlayer 
        onReportClick={(storyId) => { 
          setSelectedReportStoryId(storyId); 
          setIsReportOpen(true); 
        }} 
      />

      <StoryUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={() => {
          if (profile?.id) {
            loadUserStories(profile.id);
          }
        }}
      />

      <StoryArchiveModal 
        isOpen={isArchiveModalOpen} 
        onClose={() => setIsArchiveModalOpen(false)} 
        currentUser={currentUser ? {
          id: currentUser.id,
          username: (currentUser as any).username || currentUser.name || '',
          full_name: currentUser.name || '',
          avatar: currentUser.avatar || null
        } : null} 
      />

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => { 
          setIsReportOpen(false); 
          setSelectedReportStoryId(null); 
        }} 
        onSuccess={() => {
          closePlayer();
        }}
        reportableType="story" 
        reportableId={selectedReportStoryId || ''} 
      />
    </div>
  );
};

export default ProfilePage;
