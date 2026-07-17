import React, { useRef } from 'react';
import { Camera, Plus, Image as ImageIcon, MapPin, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlogEditor } from '../store/useBlogEditor';
import { useDestinationStore } from '../../destination/store/useDestinationStore';
import { useMemo } from 'react';

const MAX_IMAGES = 10;

const CoverUpload: React.FC = () => {
  const { coverImage, imagePreviews, updateField, meta } = useBlogEditor();
  const { destinations } = useDestinationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  // Lấy tên tỉnh thành từ slug được chọn
  const provinceName = useMemo(() => {
    if (!meta.provinceSlug) return null;
    const dest = destinations.find(d => d.slug === meta.provinceSlug);
    return dest ? dest.name : null;
  }, [meta.provinceSlug, destinations]);

  // Xử lý chọn ảnh ban đầu (hoặc chọn thêm)
  const handleFilesSelected = (files: File[], isAdding = false) => {
    const store = useBlogEditor.getState();
    const currentFiles = isAdding ? store.imageFiles : [];
    const currentPreviews = isAdding ? store.imagePreviews : [];

    // Tính số ảnh có thể thêm
    const remaining = MAX_IMAGES - currentFiles.length;
    const newFiles = files.slice(0, remaining);

    if (newFiles.length === 0) return;

    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    const mergedFiles = [...currentFiles, ...newFiles];
    const mergedPreviews = [...currentPreviews, ...newPreviews];

    // Ảnh đầu tiên luôn là cover
    updateField('coverFile', mergedFiles[0]);
    updateField('coverImage', mergedPreviews[0]);
    updateField('imageFiles', mergedFiles);
    updateField('imagePreviews', mergedPreviews);
  };

  const handleInitialSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFilesSelected(files, false);
    e.target.value = '';
  };

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFilesSelected(files, true);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const store = useBlogEditor.getState();
    const newFiles = store.imageFiles.filter((_, i) => i !== index);
    const newPreviews = store.imagePreviews.filter((_, i) => i !== index);

    updateField('imageFiles', newFiles);
    updateField('imagePreviews', newPreviews);

    if (newFiles.length > 0) {
      updateField('coverFile', newFiles[0]);
      updateField('coverImage', newPreviews[0]);
    } else {
      updateField('coverFile', null);
      updateField('coverImage', null);
    }
  };

  const hasImages = imagePreviews.length > 0;

  return (
    <div className="w-full">
      {/* ===== TRẠNG THÁI TRỐNG ===== */}
      {!hasImages && (
        <div
          className="w-full h-[340px] md:h-[420px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all hover:border-[#2DD4BF] hover:bg-teal-50/30 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Badge Tỉnh thành - Empty State */}
          <AnimatePresence>
            {provinceName && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 left-1/2 -translate-x-1/2"
              >
                <div className="bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-teal-500" />
                  <span className="text-teal-600 font-black text-[10px] uppercase tracking-wider">{provinceName}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-28 h-28 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-center text-teal-500 mb-8 relative group-hover:shadow-teal-500/10 transition-all"
          >
            <ImageIcon className="w-14 h-14 opacity-20" />
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] rounded-2xl p-2.5 border-4 border-white shadow-2xl">
              <Plus className="w-5 h-5 text-white stroke-[4px]" />
            </div>
          </motion.div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter capitalize leading-tight text-center">
            Ghi lại dấu ấn bằng <br />
            <span className="text-pastel-orange italic font-serif">Hình ảnh</span>
          </h2>
          <p className="max-w-xs text-slate-400 font-bold text-sm tracking-wide leading-relaxed text-center">
            Chọn tối đa <span className="text-slate-600">{MAX_IMAGES} ảnh</span>.<br />
            Ảnh đầu tiên sẽ là <span className="text-slate-600">ảnh bìa</span>.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInitialSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
        </div>
      )}

      {/* ===== TRẠNG THÁI CÓ ẢNH ===== */}
      {hasImages && (
        <div className="w-full space-y-4">
          {/* Badge tỉnh thành */}
          <AnimatePresence>
            {provinceName && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-1"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-teal-600 font-black text-[11px] uppercase tracking-wider">{provinceName}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid thumbnails */}
          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {imagePreviews.map((preview, index) => (
                <motion.div
                  key={preview}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="relative group/thumb"
                >
                  <div className={`w-[140px] h-[100px] rounded-2xl overflow-hidden border-2 shadow-md transition-all ${
                    index === 0
                      ? 'border-[#2DD4BF] shadow-teal-500/20 ring-2 ring-[#2DD4BF]/30'
                      : 'border-white hover:border-slate-300'
                  }`}>
                    <img
                      src={preview}
                      alt={`Ảnh ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Cover badge */}
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D9488]/90 to-transparent px-2 py-1.5 flex items-center gap-1">
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">Ảnh bìa</span>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover/thumb:opacity-100 scale-90 group-hover/thumb:scale-100"
                    title="Xóa ảnh"
                  >
                    <X size={12} />
                  </button>

                  {/* Index badge */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-black">{index + 1}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Nút thêm ảnh */}
            {imagePreviews.length < MAX_IMAGES && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-[140px] h-[100px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2DD4BF] hover:bg-teal-50/30 flex flex-col items-center justify-center cursor-pointer transition-all group/add"
                onClick={() => addMoreRef.current?.click()}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover/add:bg-teal-100 flex items-center justify-center mb-1.5 transition-colors">
                  <Camera className="w-4 h-4 text-slate-400 group-hover/add:text-teal-500 transition-colors" />
                </div>
                <span className="text-[10px] font-black text-slate-400 group-hover/add:text-teal-500 uppercase tracking-wider transition-colors">
                  Thêm ảnh
                </span>
                <span className="text-[9px] text-slate-300 mt-0.5">
                  {imagePreviews.length}/{MAX_IMAGES}
                </span>
                <input
                  type="file"
                  ref={addMoreRef}
                  onChange={handleAddMore}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </motion.div>
            )}
          </div>

          {/* Hint text */}
          <p className="text-[11px] font-bold text-slate-400 px-1">
            💡 Ảnh đầu tiên là <span className="text-teal-600">ảnh bìa</span>. Xóa để thay đổi thứ tự.
            {imagePreviews.length >= MAX_IMAGES && (
              <span className="ml-2 text-orange-500">Đã đạt tối đa {MAX_IMAGES} ảnh.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CoverUpload;
