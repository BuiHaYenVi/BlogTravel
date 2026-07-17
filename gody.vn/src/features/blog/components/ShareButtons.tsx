import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { getShareUrl, copyToClipboard } from '../../../shared/utils/urlHelper';

const ShareButtons: React.FC = () => {
  const handleCopyLink = () => {
    const link = getShareUrl(window.location.pathname + window.location.search);
    copyToClipboard(link).then(() => alert('Đã sao chép liên kết!'));
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleCopyLink}
        className="w-12 h-12 bg-white text-gray-400 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 hover:text-gray-900 transition-all"
        title="Sao chép liên kết"
      >
        <LinkIcon size={20} />
      </button>
    </div>
  );
};

export default ShareButtons;
