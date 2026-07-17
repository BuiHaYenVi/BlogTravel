import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/common/Modal';
import { useStoryStore } from '../store/useStoryStore';
import { useToastStore } from '../../../shared/hooks/useToast';
import { Image as ImageIcon, Video as VideoIcon, Upload, Check } from 'lucide-react';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const StoryUploadModal: React.FC<StoryUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  
  const { uploadStory, isSubmitting } = useStoryStore();
  const { addToast } = useToastStore();

  // Tạo preview URL khi file thay đổi
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setFileType(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setFileType(selectedFile.type.startsWith('video/') ? 'video' : 'image');

    // Dọn dẹp bộ nhớ
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Giới hạn kích thước 20MB
      if (file.size > 20 * 1024 * 1024) {
        addToast("Kích thước file tối đa cho phép là 20MB", "error");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      const success = await uploadStory(selectedFile, caption);
      if (success) {
        addToast("Đăng tin ngắn 24h thành công!", "success");
        // Reset state
        setSelectedFile(null);
        setCaption('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        addToast("Đăng tin ngắn thất bại. Vui lòng thử lại.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Có lỗi xảy ra khi tải tin ngắn lên", "error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Kiểm tra định dạng đuôi file cơ bản trước
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        addToast("Chỉ chấp nhận file Ảnh (JPG, PNG, WEBP) hoặc Video (MP4, WEBM)", "error");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        addToast("Kích thước file tối đa cho phép là 20MB", "error");
        return;
      }

      setSelectedFile(file);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Tạo tin ngắn 24h"
    >
      <div className="space-y-6">
        {!previewUrl ? (
          // Khung kéo thả file
          <label 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 hover:border-pastel-orange hover:bg-orange-50/10 rounded-[2rem] p-12 cursor-pointer transition-all duration-300 min-h-[300px]"
          >
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-pastel-orange mb-4 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-base font-black text-gray-900 mb-1">Kéo thả ảnh hoặc video ngắn vào đây</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">hoặc nhấp chuột để chọn tệp</p>
            
            <div className="flex gap-4">
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-gray-500 rounded-xl text-xs font-black border border-gray-100">
                <ImageIcon size={14} className="text-orange-500" />
                HÌNH ẢNH
              </span>
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-gray-500 rounded-xl text-xs font-black border border-gray-100">
                <VideoIcon size={14} className="text-blue-500" />
                VIDEO NGẮN
              </span>
            </div>
          </label>
        ) : (
          // Preview file đã chọn
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="relative aspect-[9/16] max-h-[380px] mx-auto rounded-[2rem] overflow-hidden bg-black shadow-2xl border-4 border-white">
              {fileType === 'video' ? (
                <video 
                  src={previewUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              )}
              
              <button 
                onClick={() => setSelectedFile(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/45 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Khung mô tả (caption) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nhập mô tả của tin (Caption)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={100}
                placeholder="Thêm chú thích thú vị cho hành trình của bạn..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold outline-none focus:border-pastel-orange/20 focus:bg-white transition-all"
              />
            </div>

            {/* Các nút bấm */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="flex-1 py-4 bg-slate-50 text-gray-500 hover:bg-slate-100 rounded-2xl text-sm font-black transition-colors uppercase"
              >
                Chọn lại tệp
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-pastel-orange text-white hover:shadow-lg hover:shadow-pastel-orange/20 disabled:opacity-50 disabled:shadow-none rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 uppercase"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Chia sẻ lên Tin của bạn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StoryUploadModal;
