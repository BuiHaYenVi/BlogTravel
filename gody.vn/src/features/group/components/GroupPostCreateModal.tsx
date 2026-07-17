import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroupStore } from '../store/useGroupStore';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import { useToastStore } from '../../../shared/hooks/useToast';

interface GroupPostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | undefined;
  destinations: any[];
  user: any;
  currentGroup: any;
}

const GroupPostCreateModal: React.FC<GroupPostCreateModalProps> = ({
  isOpen,
  onClose,
  groupId,
  destinations,
  user,
  currentGroup
}) => {
  const createPost = useGroupStore(state => state.createPost);
  const { addToast } = useToastStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Clear data when closing/opening
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setSelectedLocation(null);
      setSelectedImages([]);
      setImagePreviews([]);
      setShowLocationPicker(false);
      setLocationSearch('');
      setIsPosting(false);
    }
  }, [isOpen]);

  const MAX_IMAGES = 10;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setSelectedImages(prev => {
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) return prev;
      
      const newFiles = files.slice(0, remaining);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      return [...prev, ...newFiles];
    });
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    // Revoke any created URLs to avoid memory leaks
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim() || !groupId) return;
    setIsPosting(true);
    
    try {
      const success = await createPost(
        groupId,
        content,
        selectedLocation?.id,
        selectedImages,
        title.trim() ? title.trim() : undefined
      );
      
      if (success) {
        addToast('Đăng bài thành công! Vui lòng chờ kiểm duyệt viên phê duyệt.', 'success');
        handleClose();
      }
    } catch (err: any) {
      console.error('Error posting group post:', err);
      addToast(err.response?.data?.message || 'Có lỗi xảy ra khi đăng bài.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-[2.5rem] border border-theme shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-theme flex items-center justify-between">
              <h3 className="text-xl font-black text-base-color tracking-tight">Tạo bài viết mới trong nhóm</h3>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-surface-2 rounded-xl transition-all text-muted-color"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-8 py-6 overflow-y-auto flex-1 space-y-6 no-scrollbar">
              {/* Author Card */}
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(user?.avatar)}
                  className="w-12 h-12 rounded-xl border-2 border-theme object-cover"
                  alt="Avatar"
                />
                <div>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <h4 className="font-bold text-base-color">{user?.name || 'Traveler'}</h4>
                    {selectedLocation && (
                      <span className="text-xs text-muted-color flex items-center gap-1">
                        • đang ở <span className="font-bold text-pastel-orange flex items-center gap-0.5"><MapPin size={12} />{selectedLocation.name}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-pastel-orange uppercase tracking-widest">
                    Đăng trong: {currentGroup?.name}
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề bài viết (không bắt buộc)"
                  className="w-full bg-surface-2 border border-theme rounded-2xl px-6 py-4 outline-none text-base-color placeholder-faint-color focus:border-pastel-orange focus:ring-1 focus:ring-pastel-orange transition-all font-bold"
                />
              </div>

              {/* Content Textarea */}
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Bạn muốn chia sẻ điều gì với nhóm, ${user?.name || 'Traveler'}?`}
                  className="w-full bg-surface-2 border border-theme rounded-2xl px-6 py-5 outline-none text-base-color placeholder-faint-color focus:border-pastel-orange focus:ring-1 focus:ring-pastel-orange transition-all font-medium min-h-[160px] resize-none text-[15px]"
                />
              </div>

              {/* Location Tag */}
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3.5 bg-surface-2 border border-theme rounded-2xl"
                >
                  <div className="flex items-center gap-2 text-pastel-orange text-sm font-semibold">
                    <MapPin size={16} className="text-pastel-orange animate-bounce" />
                    <span className="text-muted-color">Đang check-in tại <span className="text-base-color font-extrabold">{selectedLocation.name}</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation(null)}
                    className="p-1.5 hover:bg-surface text-muted-color hover:text-red-500 rounded-xl transition-all flex items-center justify-center"
                    title="Xóa địa điểm"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-faint-color uppercase tracking-widest px-1">Hình ảnh đính kèm ({imagePreviews.length}/{MAX_IMAGES})</p>
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                      {imagePreviews.map((preview, idx) => (
                        <motion.div
                          key={preview}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', damping: 20 }}
                          className="relative group/thumb"
                        >
                          <div className="w-[120px] h-[90px] rounded-2xl overflow-hidden border border-theme shadow-sm bg-surface-2 transition-all">
                            <img src={preview} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                          </div>
                          
                          {/* Index badge */}
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center">
                            <span className="text-[9px] font-black">{idx + 1}</span>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover/thumb:opacity-100 scale-90 group-hover/thumb:scale-100 z-10"
                            title="Xóa ảnh"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Add More Tile */}
                    {imagePreviews.length < MAX_IMAGES && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-[120px] h-[90px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-pastel-orange hover:bg-orange-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group/add shrink-0"
                        onClick={() => {
                          const fileInput = document.getElementById('add-more-post-images') as HTMLInputElement;
                          fileInput?.click();
                        }}
                      >
                        <Plus className="w-5 h-5 text-slate-400 group-hover/add:text-pastel-orange transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 group-hover/add:text-pastel-orange uppercase tracking-wider mt-1 transition-colors">
                          Thêm ảnh
                        </span>
                        <input
                          id="add-more-post-images"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                      </motion.div>
                    )}
                  </div>
                  
                  {imagePreviews.length >= MAX_IMAGES && (
                    <p className="text-[10px] text-rose-500 font-bold px-1">Đã đạt giới hạn tối đa {MAX_IMAGES} ảnh.</p>
                  )}
                </div>
              )}

              {/* Location Picker */}
              {showLocationPicker && (
                <div className="p-6 bg-surface-2 rounded-3xl border border-theme space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-faint-color uppercase tracking-widest">Chọn địa điểm check-in</p>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(false)}
                      className="text-xs font-bold text-muted-color hover:text-pastel-orange transition-all"
                    >
                      Đóng
                    </button>
                  </div>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Tìm kiếm địa điểm..."
                    className="w-full bg-surface border border-theme rounded-xl px-4 py-2.5 outline-none text-sm text-base-color placeholder-faint-color focus:border-pastel-orange transition-all"
                  />
                  <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto no-scrollbar pt-2">
                    {filteredDestinations.length > 0 ? (
                      filteredDestinations.map(loc => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation({ id: loc.id, name: loc.name });
                            setShowLocationPicker(false);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedLocation?.id === loc.id
                              ? 'bg-pastel-orange text-white border-pastel-orange'
                              : 'bg-surface text-muted-color border-theme hover:border-pastel-orange hover:text-pastel-orange'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-faint-color italic py-2">Không tìm thấy địa điểm phù hợp</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input Tray */}
            <div className="px-8 py-6 bg-surface-2 border-t border-theme flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationPicker(!showLocationPicker);
                    if (!showLocationPicker) setLocationSearch('');
                  }}
                  className={`p-3.5 rounded-xl border border-theme bg-surface hover:border-pastel-orange hover:text-pastel-orange transition-all flex items-center justify-center ${
                    selectedLocation ? 'text-pastel-orange border-pastel-orange' : 'text-muted-color'
                  }`}
                  title="Gắn thẻ địa điểm"
                >
                  <MapPin size={20} />
                </button>
                <label
                  className="p-3.5 rounded-xl border border-theme bg-surface hover:border-pastel-orange hover:text-pastel-orange text-muted-color cursor-pointer transition-all flex items-center justify-center"
                  title="Thêm ảnh/video"
                >
                  <Camera size={20} />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 rounded-2xl font-bold text-muted-color hover:bg-surface transition-all border border-transparent text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPosting || !content.trim()}
                  className="px-8 py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 text-sm"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    'Đăng bài'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GroupPostCreateModal;
