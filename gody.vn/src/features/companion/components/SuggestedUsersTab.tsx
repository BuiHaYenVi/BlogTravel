import React, { useEffect } from 'react';
import { Sparkles, UserPlus, ExternalLink, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanionStore } from '../store/useCompanionStore';
import { CompanionSuggestion } from '../services/companionApi';
import { useToastStore } from '../../../shared/hooks/useToast';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const ASSETS_URL = BASE_URL.replace('/api', '');

const formatImageUrl = (path: string | null | undefined) => {
  if (!path) return `https://i.pravatar.cc/150?u=${Math.random()}`;
  if (path.startsWith('http')) return path;
  return `${ASSETS_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface UserCardProps {
  user: CompanionSuggestion;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const navigate = useNavigate();
  const followCompanion = useCompanionStore(state => state.followCompanion);
  const addToast = useToastStore(state => state.addToast);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [hasFollowed, setHasFollowed] = React.useState(false);

  const handleFollow = async () => {
    if (hasFollowed) return;
    
    setIsFollowing(true);
    try {
      await followCompanion(user.id);
      setHasFollowed(true);
      addToast(`Đã bắt đầu theo dõi ${user.full_name}`, 'success');
    } catch (error: any) {
      addToast(error.message || 'Không thể theo dõi người dùng này', 'error');
    } finally {
      setIsFollowing(false);
    }
  };

  const goToProfile = () => {
    navigate(`/profile/${user.id}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={goToProfile}
        >
          <img 
            src={formatImageUrl(user.avatar)} 
            alt={user.full_name} 
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-orange-200 transition-colors"
          />
          <div>
            <h3 className="font-bold text-gray-900 leading-tight group-hover:text-orange-500 transition-colors">{user.full_name}</h3>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>
        </div>
        <div className="bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-100">
          {user.matching_score}% phù hợp
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {user.interests.slice(0, 3).map((tag, index) => (
          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
            #{tag}
          </span>
        ))}
        {user.interests.length > 3 && (
          <span className="text-xs text-gray-400 self-center">+{user.interests.length - 3}</span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <div className="flex -space-x-2">
          {user.mutual_friends_avatars.map((avatar, index) => (
            <img 
              key={index}
              src={avatar} 
              alt="mutual friend" 
              className="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {user.mutual_friends_count > 0 ? `${user.mutual_friends_count} bạn chung` : 'Chưa có bạn chung'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleFollow}
          disabled={isFollowing || hasFollowed}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            hasFollowed 
            ? 'bg-green-500 text-white cursor-default' 
            : 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white'
          }`}
        >
          {isFollowing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : hasFollowed ? (
            <Check size={16} />
          ) : (
            <UserPlus size={16} />
          )}
          {hasFollowed ? 'Đã follow' : 'Follow'}
        </button>
        <button 
          onClick={goToProfile}
          className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <ExternalLink size={16} />
          Trang cá nhân
        </button>
      </div>
    </div>
  );
};

interface SuggestedUsersTabProps {
  filter: string;
}

const SuggestedUsersTab: React.FC<SuggestedUsersTabProps> = ({ filter }) => {
  const { suggestions, loading, error, searchQuery, fetchSuggestions } = useCompanionStore();

  useEffect(() => {
    fetchSuggestions(filter);
  }, [filter, searchQuery, fetchSuggestions]);

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tìm bạn đồng hành phù hợp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => fetchSuggestions(filter)}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hệ thống gợi ý thông minh */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <Sparkles size={28} fill="currentColor" fillOpacity={0.3} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hệ thống gợi ý thông minh</h2>
          <p className="text-gray-600 text-sm">Dựa trên sở thích và hành trình của bạn, chúng tôi đã tìm thấy những người bạn đồng hành lý tưởng nhất.</p>
        </div>
      </div>

      {/* Grid danh sách user */}
      {suggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          )}
          {suggestions.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-400">Không tìm thấy người bạn nào phù hợp với sở thích này.</p>
        </div>
      )}
    </div>
  );
};

export default SuggestedUsersTab;
