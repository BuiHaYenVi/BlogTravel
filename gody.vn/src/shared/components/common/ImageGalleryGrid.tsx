import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryGridProps {
  images: string[];
  className?: string;
}

const ImageGalleryGrid: React.FC<ImageGalleryGridProps> = ({ images, className }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Render logic based on number of images
  const renderGrid = () => {
    if (images.length === 1) {
      return (
        <div className="w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden cursor-pointer" onClick={() => openLightbox(0)}>
          <img src={images[0]} alt="Gallery 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden">
          {images.map((img, i) => (
            <div key={i} className="w-full h-full cursor-pointer overflow-hidden" onClick={() => openLightbox(i)}>
              <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden">
          <div className="w-full h-full cursor-pointer overflow-hidden col-span-1" onClick={() => openLightbox(0)}>
            <img src={images[0]} alt="Gallery 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="grid grid-rows-2 gap-2 h-full">
            <div className="w-full h-full cursor-pointer overflow-hidden" onClick={() => openLightbox(1)}>
              <img src={images[1]} alt="Gallery 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="w-full h-full cursor-pointer overflow-hidden" onClick={() => openLightbox(2)}>
              <img src={images[2]} alt="Gallery 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      );
    }

    // 4 or more images
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square sm:aspect-video rounded-3xl overflow-hidden">
        {images.slice(0, 4).map((img, i) => {
          const isLast = i === 3;
          const remaining = images.length - 4;
          return (
            <div key={i} className="w-full h-full relative cursor-pointer overflow-hidden" onClick={() => openLightbox(i)}>
              <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              
              {isLast && remaining > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center hover:bg-black/60 transition-colors">
                  <span className="text-white text-2xl font-bold">+{remaining}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full ${className || ''}`}>
      {renderGrid()}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-all"
              onClick={closeLightbox}
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 sm:left-10 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm transition-all"
                  onClick={prevImage}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  className="absolute right-4 sm:right-10 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm transition-all"
                  onClick={nextImage}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Main Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl px-4 flex flex-col items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={images[currentIndex]} 
                alt={`Full gallery image ${currentIndex + 1}`} 
                className="w-full max-h-[80vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-10 left-0 right-0 text-center text-white/80 text-sm font-bold">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGalleryGrid;
