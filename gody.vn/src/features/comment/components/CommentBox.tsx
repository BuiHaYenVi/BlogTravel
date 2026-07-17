import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { getImageUrl } from '../../../shared/utils/imageHelper';

interface CommentBoxProps {
  onAddComment?: (content: string) => void;
  placeholder?: string;
}

const CommentBox: React.FC<CommentBoxProps> = ({ 
  onAddComment, 
  placeholder = "Chia sẻ suy nghĩ của bạn về bài viết này..." 
}) => {
  const [content, setContent] = useState('');
  const { user } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddComment?.(content);
    setContent('');
  };

  return (
    <div className="flex gap-4">
      <img 
        src={getImageUrl(user?.avatar)} 
        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" 
        alt="me" 
      />
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 pr-16 outline-none focus:bg-white focus:ring-4 focus:ring-pastel-orange/10 transition-all font-medium text-gray-700 resize-none min-h-[80px]"
        />
        <button 
          type="submit"
          disabled={!content.trim()}
          className="absolute right-3 bottom-3 w-10 h-10 bg-pastel-orange text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default CommentBox;
