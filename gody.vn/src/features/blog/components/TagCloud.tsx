import React, { useState, useEffect } from 'react';
import { Tag as TagIcon } from 'lucide-react';
import api from '../../../shared/services/api';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const TagCloud: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get('/tags/trending?limit=10');
        if (response.data.success) {
          setTags(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch trending tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) return (
    <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme animate-pulse">
      <div className="h-6 w-32 bg-gray-100 mb-6"></div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-8 w-20 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
    </div>
  );

  if (tags.length === 0) return null;

  return (
    <div className="bg-surface rounded-[2.5rem] p-8 shadow-premium border border-theme">
      <h3 className="text-xl font-black text-base-color mb-6 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-pastel-orange rounded-full"></div>
        Chủ đề phổ biến
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button 
            key={tag.id} 
            className="px-4 py-2 bg-surface-2 border border-theme hover:bg-pastel-orange hover:text-white hover:border-pastel-orange rounded-xl text-[10px] font-black text-faint-color transition-all uppercase cursor-pointer"
          >
            #{tag.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;
