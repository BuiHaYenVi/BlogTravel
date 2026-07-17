import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getImageUrl } from '../../../shared/utils/imageHelper';

interface UserFriendsListProps {
  friends: any[];
  onSeeAll?: () => void;
}

const UserFriendsList: React.FC<UserFriendsListProps> = ({ friends, onSeeAll }) => {
  const displayFriends = friends.slice(0, 9); // Hiển thị tối đa 9 người bạn (3x3 grid)

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            Bạn bè
            <Users className="w-4 h-4 text-pastel-orange" />
          </h3>
          <p className="text-xs font-bold text-gray-400 mt-1">
            {friends.length} người bạn
          </p>
        </div>
        {friends.length > 0 && onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="text-xs font-black text-pastel-orange hover:text-orange-600 transition-colors uppercase tracking-wider"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {friends.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {displayFriends.map((friend) => (
            <Link 
              key={friend.id} 
              to={`/profile/${friend.id}`}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative bg-gray-50">
                <img 
                  src={getImageUrl(friend.avatar)} 
                  alt={friend.full_name || friend.name || friend.username} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-black text-gray-700 mt-2 truncate w-full text-center group-hover:text-pastel-orange transition-colors">
                {friend.full_name || friend.name || friend.username}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-xs font-bold text-gray-400">Chưa có bạn bè nào.</p>
        </div>
      )}
    </div>
  );
};

export default UserFriendsList;
