import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackButtonProps {
  className?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = "", label = "Quay lại" }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ x: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(-1)}
      className={`flex items-center gap-2 text-muted-color hover:text-base-color font-bold transition-all group ${className}`}
    >
      <div className="p-2 bg-surface rounded-xl shadow-sm border border-theme group-hover:border-theme/70 transition-colors">
        <ArrowLeft size={18} />
      </div>
      <span className="text-sm uppercase tracking-widest">{label}</span>
    </motion.button>
  );
};

export default BackButton;
