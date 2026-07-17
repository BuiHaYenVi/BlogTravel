import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import api from '../../../shared/services/api';

interface TrendingPost {
  id: string;
  title: string;
  viewCount: number;
  image: string;
}

const TrendingPosts: React.FC = () => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const ASSETS_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await api.get('/blogs/trending');
        if (response.data.success) {
          const mapped = response.data.data.map((p: any) => ({
            id: String(p.id),
            title: p.title,
            viewCount: parseInt(p.view_count) || 0,
            image: p.cover_image 
              ? (p.cover_image.startsWith('http') ? p.cover_image : `${ASSETS_URL}${p.cover_image}`)
              : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
          }));
          setPosts(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch trending posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-6 w-32 bg-gray-100 mb-6"></div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (posts.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
      <h3 className="font-black text-xl text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="text-pastel-orange" size={20} />
        Đang thịnh hành
      </h3>
      <div className="space-y-6">
        {posts.map(post => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/blog/${post.id}`)}
            className="flex gap-4 group cursor-pointer"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
              <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.title} />
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-pastel-orange transition-colors line-clamp-2 leading-tight">
                {post.title}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold mt-2">{post.viewCount.toLocaleString()} lượt xem</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts;
