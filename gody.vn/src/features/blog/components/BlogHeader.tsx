import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '../../../shared/utils/dateHelper';

interface BlogHeaderProps {
  blog: {
    title: string;
    image?: string;
    short_intro?: string;
    location_name?: string;
    author: {
      name: string;
      avatar: string;
      is_verified?: boolean;
      badge_title?: string;
    };
    createdAt: string;
  };
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ blog }) => {
  return (
    <div className="space-y-12">
      {/* 1. Title & Intro Section */}
      <div className="max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-black text-base-color leading-[1.1] tracking-tighter mb-6">
          {blog.title}
        </h1>
        <p className="text-lg md:text-xl text-muted-color font-medium leading-relaxed italic border-l-4 border-pastel-orange pl-6">
          {blog.short_intro || "Một hành trình đầy cảm hứng khám phá vẻ đẹp Việt Nam."}
        </p>
      </div>

      {/* 2. Author & Info Section */}
      <div className="flex items-center gap-4">
        <img
          src={blog.author.avatar}
          className="w-14 h-14 rounded-full border-4 border-white shadow-xl"
          alt={blog.author.name}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-gray-900 leading-none">{blog.author.name}</p>
            {blog.author.is_verified && (
              <CheckCircle2 size={14} style={{ color: '#1877F2' }} className="flex-shrink-0" />
            )}
            {blog.author.badge_title && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50">
                {blog.author.badge_title}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {formatRelativeTime(blog.createdAt)}
          </p>
        </div>
      </div>

      {/* 3. Hero Image Section (Matches anhbia.jpg) */}
      <div className="relative aspect-[16/8] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
        <img
          src={blog.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          alt={blog.title}
        />
        
        {/* Province Badge Overlay */}
        {blog.location_name && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 left-8 z-10"
          >
            <div className="bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-pastel-orange rounded-full animate-pulse" />
              <span className="text-gray-900 font-black text-xs uppercase tracking-[0.2em]">{blog.location_name}</span>
            </div>
          </motion.div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default BlogHeader;
