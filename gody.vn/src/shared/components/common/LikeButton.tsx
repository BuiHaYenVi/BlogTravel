import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LikeButtonProps {
  initialLikes?: number;
  isLiked?: boolean;
  size?: number;
  onLike?: () => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ initialLikes = 0, isLiked = false, size = 24, onLike }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.info('LikeButton: Triggering onLike event', { isLiked, initialLikes });
    onLike?.();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`flex items-center gap-2 font-black transition-all group/btn cursor-pointer relative z-30 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
      style={{ pointerEvents: 'auto', outline: 'none' }}
    >
      <div className="relative pointer-events-none flex items-center justify-center">
        <Heart 
          size={size} 
          className={`transition-all duration-300 ${isLiked ? 'fill-rose-500 scale-110' : 'group-hover/btn:scale-110'}`} 
        />
        <AnimatePresence>
          {isLiked && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-500/20 rounded-full"
            />
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm pointer-events-none">{initialLikes.toLocaleString()}</span>
    </button>
  );
};

export default LikeButton;
