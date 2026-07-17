import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../shared/services/api';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  target: string;
  postId: string;
}

const LatestComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const ASSETS_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  useEffect(() => {
    const fetchLatestComments = async () => {
      try {
        const response = await api.get('/comments/latest');
        if (response.data.success) {
          const mapped = response.data.data.map((c: any) => ({
            id: String(c.id),
            userId: String(c.user_id),
            userName: c.username || 'Traveler',
            avatar: c.avatar 
              ? (c.avatar.startsWith('http') ? c.avatar : `${ASSETS_URL}${c.avatar}`)
              : `https://i.pravatar.cc/150?u=${c.user_id}`,
            target: c.post_title || 'Bài viết',
            postId: String(c.post_id)
          }));
          setComments(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch latest comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestComments();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme animate-pulse">
        <div className="h-6 w-48 bg-gray-100 rounded mb-8"></div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (comments.length === 0) return null;

  return (
    <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme">
      <h3 className="text-xl font-black text-base-color mb-8 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-pastel-orange rounded-full"></div>
        Bình luận mới nhất
      </h3>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            onClick={() => navigate(`/blog/${comment.postId}`)}
            className="flex gap-4 group cursor-pointer border-b border-theme pb-6 last:border-0 last:pb-0"
          >
            <Link 
              to={`/profile/${comment.userId}`}
              onClick={(e) => e.stopPropagation()}
              className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm hover:shadow-md hover:opacity-90 transition-all"
            >
              <img src={comment.avatar} alt={comment.userName} className="w-full h-full object-cover" />
            </Link>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-color leading-tight">
                <Link 
                  to={`/profile/${comment.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-base-color hover:text-pastel-orange hover:underline transition-colors"
                >
                  {comment.userName}
                </Link>
                {' '}bình luận trong{' '}
                <span className="font-bold text-base-color opacity-90 line-clamp-1">{comment.target}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-8 py-3 bg-surface-2 text-faint-color font-bold rounded-2xl hover:bg-pastel-orange hover:text-white transition-all text-xs uppercase tracking-widest cursor-pointer">
        Xem tất cả thảo luận
      </button>
    </div>
  );
};

export default LatestComments;
