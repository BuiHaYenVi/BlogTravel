import React from 'react';
import { useToastStore } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'error': return 'bg-rose-50 border-rose-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-xl backdrop-blur-md pointer-events-auto min-w-[300px] ${getBgColor(toast.type)}`}
          >
            {getIcon(toast.type)}
            <span className="flex-1 font-bold text-gray-800 text-sm">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
