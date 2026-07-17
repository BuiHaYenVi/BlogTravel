import React, { useEffect } from 'react';
import { useUserStore } from '../../user/store/useUserStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useToastStore } from '../../../shared/hooks/useToast';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import { UserPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const FriendSuggestion = () => { 
  const { suggestions, loadSuggestions } = useUserStore();
  const { toggleFollow } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const handleFollow = async (userId: string) => {
    try {
      await toggleFollow(userId);
      addToast('Theo dõi người dùng thành công', 'success');
      loadSuggestions(); // Reload to update list
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Không thể theo dõi người dùng', 'error');
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-16 h-16 text-pastel-orange" />
      </div>
      
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2 relative z-10 text-gray-900">
        <div className="w-1.5 h-6 bg-pastel-orange rounded-full"></div> 
        Gợi ý kết bạn
      </h3>

      <div className="space-y-5 relative z-10">
        { suggestions.map(user => (
          <div key={user.id } className="flex items-center gap-3">
            <img src={ getImageUrl(user.avatar) } alt={ user.name } className="w-12 h-12 rounded-full border border-gray-100" />
            <div className="flex-1 min-w-0">
              <Link to={ `/profile/${user.id }`} className="font-bold text-gray-900 text-sm hover:text-pastel-orange transition-colors truncate block">
                { user.name }
              </Link>
              <p className="text-xs text-gray-500">{ user.mutuals } bạn chung</p>
            </div>
            <button 
              onClick={() => handleFollow(user.id)}
              className="w-8 h-8 rounded-full bg-orange-50 text-pastel-orange flex items-center justify-center hover:bg-pastel-orange hover:text-white transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FriendSuggestion;
