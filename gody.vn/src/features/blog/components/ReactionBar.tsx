import React from 'react';
import { Heart } from 'lucide-react';

interface ReactionBarProps {
  reactions?: { type: string; count: number; active: boolean }[];
  onReact?: (type: string) => void;
}

const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, onReact }) => {
  const heartReaction = reactions?.find((r: any) => r.type === 'heart');
  const isActive = heartReaction?.active;
  const count = heartReaction?.count || 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onReact?.('heart')}
        className={`flex items-center gap-2 px-5 py-3 rounded-[2rem] font-bold transition-all border ${
          isActive 
            ? "bg-rose-50 text-rose-500 border-rose-200" 
            : "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-500"
        }`}
      >
        <Heart 
          size={20} 
          className={`transition-transform ${isActive ? "fill-current scale-110" : "scale-100"}`} 
        />
        <span>{count > 0 ? count : 'Thích bài viết'}</span>
      </button>
    </div>
  );
};

export default ReactionBar;
