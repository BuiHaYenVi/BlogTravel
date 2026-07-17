import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReportModalContentProps {
  onSubmit: (reason: string, description: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const REASONS = [
  { id: 'spam', label: 'Spam / Nội dung rác' },
  { id: 'inappropriate', label: 'Nội dung không phù hợp' },
  { id: 'harassment', label: 'Quấy rối / Đả kích' },
  { id: 'not_interested', label: 'Chỉ là tôi không thích nội dung này' },
  { id: 'copyright', label: 'Vi phạm bản quyền' },
  { id: 'fake', label: 'Thông tin giả mạo' },
  { id: 'other', label: 'Lý do khác' },
];

const ReportModalContent: React.FC<ReportModalContentProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, description);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
        <AlertTriangle className="shrink-0" size={24} />
        <p className="text-sm font-medium leading-relaxed">
          Báo cáo của bạn sẽ giúp chúng tôi giữ gìn cộng đồng du lịch an toàn và thân thiện hơn.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-black text-gray-900 uppercase tracking-wider">Chọn lý do báo cáo</p>
        <div className="grid grid-cols-1 gap-2">
          {REASONS.map((reason) => (
            <label 
              key={reason.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedReason === reason.id 
                ? 'border-pastel-orange bg-pastel-orange/5 text-pastel-orange' 
                : 'border-slate-50 bg-slate-50 text-gray-600 hover:border-slate-200'
              }`}
            >
              <input 
                type="radio" 
                name="report_reason" 
                className="hidden" 
                value={reason.id}
                onChange={(e) => setSelectedReason(e.target.value)}
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedReason === reason.id ? 'border-pastel-orange' : 'border-gray-300'
              }`}>
                {selectedReason === reason.id && <div className="w-2.5 h-2.5 rounded-full bg-pastel-orange" />}
              </div>
              <span className="text-sm font-bold">{reason.label}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedReason === 'other' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-black text-gray-900 uppercase tracking-wider">Mô tả chi tiết</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vui lòng cung cấp thêm thông tin để chúng tôi xử lý tốt hơn..."
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-medium outline-none focus:border-pastel-orange/20 focus:bg-white transition-all min-h-[120px]"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl font-black text-sm text-gray-500 hover:bg-slate-100 transition-colors uppercase"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedReason || (selectedReason === 'other' && !description.trim()) || isSubmitting}
          className="flex-[2] px-6 py-4 rounded-2xl font-black text-sm bg-pastel-orange text-white hover:shadow-lg hover:shadow-pastel-orange/20 disabled:opacity-50 disabled:shadow-none transition-all uppercase"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
        </button>
      </div>
    </div>
  );
};

export default ReportModalContent;
