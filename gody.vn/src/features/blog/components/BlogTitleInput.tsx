import React, { useEffect, useRef } from 'react';
import { useBlogEditor } from '../store/useBlogEditor';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogTitleInput: React.FC = () => {
  const { title, description, updateField } = useBlogEditor();
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [description]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <textarea 
          rows={1}
          value={title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Tiêu đề bài viết của bạn" 
          className="w-full text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 border-none px-0 py-2 focus:ring-0 placeholder:text-gray-200 bg-transparent resize-none leading-tight tracking-tight"
          style={{ overflow: 'hidden' }}
          onInput={(e) => {
             const target = e.target as HTMLTextAreaElement;
             target.style.height = 'auto';
             target.style.height = `${target.scrollHeight}px`;
          }}
        />
        <motion.div 
          className="h-1 bg-[#2DD4BF] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: title ? '100%' : '10%' }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <Link 
        to="/blog/guide"
        target="_blank"
        className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest px-1 hover:text-[#2DD4BF] transition-colors group w-fit"
      >
        <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="border-b border-blue-500/10 group-hover:border-[#2DD4BF]">Hướng dẫn viết Blog chuẩn Blog Travel</span>
      </Link>

      <textarea 
        ref={descRef}
        value={description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Giới thiệu ngắn gọn về hành trình của bạn..." 
        rows={1}
        className="w-full text-lg font-medium text-gray-400 border-none px-0 focus:ring-0 placeholder:text-gray-200 bg-transparent resize-none leading-relaxed"
      />
    </div>
  );
};

export default BlogTitleInput;
