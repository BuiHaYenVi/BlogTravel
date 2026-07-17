import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmContentProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
}

const DeleteConfirmContent: React.FC<DeleteConfirmContentProps> = ({ 
  onConfirm, 
  onCancel, 
  isDeleting,
  title = "Xóa nội dung",
  message = "Bạn có chắc chắn muốn xóa nội dung này không? Hành động này không thể hoàn tác và nội dung sẽ biến mất vĩnh viễn khỏi cộng đồng."
}) => {
  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 animate-pulse">
          <Trash2 size={40} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-gray-900">{title}</h4>
          <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1 px-6 py-4 rounded-2xl font-black text-sm text-gray-500 hover:bg-slate-100 transition-colors uppercase disabled:opacity-50"
        >
          Để tôi suy nghĩ lại
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 px-6 py-4 rounded-2xl font-black text-sm bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all uppercase disabled:opacity-50"
        >
          {isDeleting ? 'Đang xóa...' : 'Đúng, hãy xóa nó'}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmContent;
