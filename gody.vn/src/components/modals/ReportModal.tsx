import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportApi } from '../../services/api/reportApi';
import { useToast } from '../../shared/hooks/useToast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reportableType: 'blog' | 'post' | 'comment' | 'user' | 'group' | 'trip' | 'story';
  reportableId: string | number;
  title?: string;
}

const REASONS = [
  { id: 'dislike', label: 'Chỉ là tôi không thích nội dung này' },
  { id: 'harassment', label: 'Bắt nạt hoặc liên hệ theo cách không mong muốn' },
  { id: 'suicide', label: 'Tự tử, tự gây thương tích hoặc ăn uống thất thường' },
  { id: 'violence', label: 'Bạo lực, thù ghét hoặc bóc lột' },
  { id: 'restricted', label: 'Bán hoặc quảng bá mặt hàng bị hạn chế' },
  { id: 'nudity', label: 'Ảnh khỏa thân hoặc hoạt động tình dục' },
  { id: 'spam', label: 'Lừa đảo, gian lận hoặc spam' },
  { id: 'fake', label: 'Thông tin sai sự thật' },
];

const reasonMapping: Record<string, string> = {
  dislike: 'inappropriate',
  harassment: 'harassment',
  suicide: 'inappropriate',
  violence: 'inappropriate',
  restricted: 'inappropriate',
  nudity: 'inappropriate',
  spam: 'spam',
  fake: 'fake',
};

const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  reportableType, 
  reportableId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleImmediateSubmit = async (reasonId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Mapping frontend types to backend types
    const typeMapping: Record<string, string> = {
      blog: 'post',
      post: 'post',
      comment: 'comment',
      user: 'user',
      group: 'group_post',
      trip: 'trip',
      story: 'story'
    };

    const backendReason = reasonMapping[reasonId] || 'other';

    const payload = {
      reportable_type: typeMapping[reportableType] || reportableType,
      reportable_id: parseInt(String(reportableId), 10),
      reason: backendReason,
      description: REASONS.find(r => r.id === reasonId)?.label || ''
    };

    try {
      await reportApi.sendReport(payload as any);
      showToast("Cảm ơn bạn đã báo cáo. Ý kiến phản hồi của bạn giúp chúng tôi cải thiện hệ thống.", "success");
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("[User Report Debug] Lỗi khi gửi báo cáo:", error);
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.";
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop tối mờ */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Hộp thoại Card chứa các nội dung */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-[440px] bg-white text-slate-800 rounded-3xl overflow-hidden border border-slate-100 shadow-2xl z-10 font-sans"
          >
            {/* Header Modal */}
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors flex items-center justify-center"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
              <span className="text-base font-black text-slate-900 text-center absolute left-1/2 -translate-x-1/2">Báo cáo</span>
              <div className="w-8 h-8" /> {/* Giữ cân bằng cho tiêu đề */}
            </div>

            {/* Sub-Header câu hỏi */}
            <div className="px-5 py-5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-base font-extrabold text-slate-900">Tại sao bạn báo cáo bài viết này?</p>
            </div>

            {/* Danh sách lý do trực quan */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleImmediateSubmit(reason.id)}
                  disabled={isSubmitting}
                  className="w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors leading-relaxed pr-4">
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
