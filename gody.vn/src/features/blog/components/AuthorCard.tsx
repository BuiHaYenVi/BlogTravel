import React from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../../shared/utils/imageHelper';

interface AuthorCardProps {
  author: {
    id: string | number;
    name: string;
    avatar: string;
    bio?: string;
    followers?: number;
    following?: number;
    provincesCount?: number;
    isFollowing?: boolean;
    is_verified?: boolean;
    badge_title?: string;
  };
  onFollowToggle?: () => void;
}

const AuthorCard: React.FC<AuthorCardProps> = ({ author, onFollowToggle }) => {
  if (!author) return null;
  
  return (
    <div className="bg-surface rounded-[2.5rem] p-10 border border-theme shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-orange/5 rounded-full -mr-16 -mt-16"></div>
      
      <Link to={`/profile/${author.id}`}>
        <img 
          src={getImageUrl(author.avatar)} 
          className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-xl relative z-10 object-cover hover:scale-105 transition-transform" 
          alt={author.name} 
        />
      </Link>
      
      <div className="flex-1 text-center md:text-left relative z-10">
        <Link to={`/profile/${author.id}`} className="hover:text-pastel-orange transition-colors">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <h3 className="text-2xl font-black text-gray-900">{author.name}</h3>
            {author.is_verified && (
              <CheckCircle2 size={20} style={{ color: '#1877F2' }} className="flex-shrink-0" />
            )}
          </div>
        </Link>
        {author.badge_title && (
          <span className="inline-flex items-center px-3 py-1 mb-4 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50">
            {author.badge_title}
          </span>
        )}
        <p className="text-muted-color font-medium mb-6 leading-relaxed">
          {author.bio || 'Một Traveler đam mê khám phá những vùng đất mới và chia sẻ những trải nghiệm thực tế nhất.'}
        </p>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 mb-8">
          <div className="flex flex-col">
              <span className="text-xl font-black text-base-color">{author.followers || 0}</span>
              <span className="text-[10px] font-bold text-faint-color uppercase tracking-widest">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-base-color">{author.following || 0}</span>
              <span className="text-[10px] font-bold text-faint-color uppercase tracking-widest">Đang theo dõi</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-base-color">{author.provincesCount || 0}</span>
              <span className="text-[10px] font-bold text-faint-color uppercase tracking-widest">Tỉnh thành</span>
            </div>
        </div>

        <button 
          onClick={onFollowToggle}
          className={`px-8 py-3 font-black rounded-2xl transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-lg ${author.isFollowing ? 'bg-surface-2 text-base-color border border-theme' : 'bg-gray-900 dark:bg-orange-500 text-white hover:bg-black dark:hover:bg-orange-600 shadow-gray-200 dark:shadow-orange-500/20'}`}
        >
          {author.isFollowing ? (
            'Đang theo dõi'
          ) : (
            <>
              <UserPlus size={18} /> Theo dõi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthorCard;
