import React, { useState, useRef, useEffect } from 'react';
import { Ellipsis, Flag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionDropdownProps {
  onReport: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ onReport, onDelete, isOwner }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-surface-2 rounded-full transition-colors text-muted-color hover:text-base-color"
      >
        <Ellipsis size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-surface rounded-2xl shadow-xl border border-theme z-50 overflow-hidden"
          >
            <div className="p-2">
              <button
                onClick={() => {
                  onReport();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-base-color hover:bg-surface-2 rounded-xl transition-colors text-left"
              >
                <Flag size={18} className="text-gray-400" />
                Báo cáo vi phạm
              </button>

              {isOwner && onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <Trash2 size={18} />
                  Xóa bài viết
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionDropdown;
