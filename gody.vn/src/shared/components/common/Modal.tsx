import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-theme"
          >
            <div className="px-8 py-6 border-b border-theme flex items-center justify-between">
              <h3 className="text-xl font-bold text-base-color">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-muted-color" />
              </button>
            </div>
            
            <div className="px-8 py-6 overflow-y-auto flex-1">
              {children}
            </div>

            {footer && (
              <div className="px-8 py-6 bg-surface-2 border-t border-theme flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
