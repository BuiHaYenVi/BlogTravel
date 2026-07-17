import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useDestinationStore } from '../store/useDestinationStore';
import { Flag, MapPin, Heart, ChevronRight, CloudSun, Utensils, Info, MessageSquare, Star, ArrowRight, Car, Home, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../../shared/components/common/BackButton';
import DestinationSidebar from '../components/DestinationSidebar';
import CheckinButtons from '../components/CheckinButtons';

const ProvinceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const activeTab = query.get('tab') || 'intro';

  const { currentDestination, fetchDestinationDetail, loading } = useDestinationStore();
  const [selectedTip, setSelectedTip] = useState<{ title: string, content: string, icon: any } | null>(null);
  const [provinceImages, setProvinceImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchDestinationDetail(slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, fetchDestinationDetail]);

  // Fetch province images from PHP API
  useEffect(() => {
    if (!currentDestination) return;
    const getFolderName = (name: string) => {
      if (!name) return '';
      if (name.includes('Bà Rịa') || name.includes('Vũng Tàu')) return 'BaRia-VungTau';
      return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[\s–-]+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    };
    const folderName = getFolderName(currentDestination.name);
    if (!folderName) return;

    setImagesLoading(true);
    fetch(`${(import.meta.env.VITE_API_URL || '').split('/Project_DuLichMXH')[0]}/63TinhThanhVN/list_images.php?province=${encodeURIComponent(folderName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.images && data.images.length > 0) {
          const imgUrls = data.images.map((filename: string) =>
            `${(import.meta.env.VITE_API_URL || '').split('/Project_DuLichMXH')[0]}/63TinhThanhVN/${folderName}/${encodeURIComponent(filename)}`
          );
          setProvinceImages(imgUrls);
        } else {
          setProvinceImages([]);
        }
      })
      .catch(() => setProvinceImages([]))
      .finally(() => setImagesLoading(false));
  }, [currentDestination]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-app">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!currentDestination) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center">
        <BackButton />
        <p className="mt-8 text-gray-500 font-bold">Không tìm thấy thông tin địa điểm.</p>
      </div>
    );
  }

  const province = currentDestination;
  const provinceName = province.name;

  return (
    <div className="min-h-screen bg-app font-sans pb-20 transition-colors duration-300">
      { /* Tip Detail Modal */}
      <AnimatePresence>
        {selectedTip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTip(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-surface rounded-[3rem] shadow-2xl overflow-hidden p-10 md:p-16 border border-theme"
            >
              <button 
                onClick={() => setSelectedTip(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center text-muted-color hover:bg-orange-50 hover:text-orange-500 transition-all shadow-sm border border-theme"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-500 mb-10 shadow-inner">
                  {selectedTip.icon}
                </div>
                <span className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase mb-4 block">Thông tin chi tiết</span>
                <h3 className="text-4xl font-black text-base-color mb-8 tracking-tight">{selectedTip.title}</h3>
                <div className="w-20 h-1.5 bg-surface-2 rounded-full mb-10"></div>
                <p className="text-xl text-muted-color font-medium leading-relaxed italic">
                  "{selectedTip.content}"
                </p>
                <button 
                  onClick={() => setSelectedTip(null)}
                  className="mt-12 px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest"
                >
                  Đã hiểu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      { /* Cover Area */}
      <div className="relative w-full h-[350px] md:h-[450px] bg-gray-900 flex items-center justify-center overflow-hidden">
        <img
          src={province.coverImage || "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc"}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/20"></div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-7xl font-bold text-white uppercase tracking-tighter mb-4 drop-shadow-2xl">{provinceName}</h1>
          <p className="text-white/80 font-medium tracking-widest uppercase text-xs md:text-sm">Khám phá vẻ đẹp Việt Nam</p>
        </div>
      </div>

      { /* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-30">
        <div className="flex flex-col lg:flex-row gap-12">
          { /* Left Sidebar */}
          <div className="lg:w-[350px] shrink-0">
            <div className="mb-10">
              <BackButton />
            </div>
            <DestinationSidebar provinceName={provinceName} slug={slug || ''} />
          </div>

          { /* Right Main Content */}
          <div className="flex-1 space-y-12">
            <div className="bg-surface rounded-[2.5rem] shadow-sm border border-theme p-8 md:p-12 transition-colors duration-300">
              {activeTab === 'intro' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.3em] text-orange-500 uppercase mb-2 block">Tổng quan</span>
                      <h2 className="text-4xl font-bold text-base-color tracking-tight">Về vùng đất này</h2>
                    </div>
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                      <Link to={`/destination/${slug}/review/create`} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest text-center">
                        Viết đánh giá
                      </Link>
                    </div>
                  </div>

                  <div className="mb-12">
                    <CheckinButtons destinationId={Number(province.id)} />
                  </div>

                  <div className="prose prose-lg max-w-none text-gray-600 mb-12">
                    <p className="text-xl md:text-2xl leading-relaxed font-bold text-base-color mb-8 tracking-tight">
                      {province.introduction || 'Khám phá vẻ đẹp tiềm ẩn và những câu chuyện thú vị tại vùng đất này.'}
                    </p>
                    <p className="leading-relaxed text-lg font-medium">
                      {province.description || 'Thông tin đang được cập nhật bởi cộng đồng Traveler.'}
                    </p>
                  </div>

                  { /* Gallery Section - Ảnh riêng của từng tỉnh */ }
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-base-color mb-6 flex items-center gap-2">
                      <Star className="text-orange-500 w-5 h-5 fill-current" />
                      Hình ảnh đặc trưng
                    </h3>

                    {imagesLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
                          <span className="text-sm text-gray-400 font-medium">Đang tải hình ảnh...</span>
                        </div>
                      </div>
                    ) : provinceImages.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {provinceImages.map((imgSrc, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1, duration: 0.5 }}
                              onClick={() => setSelectedImage(imgSrc)}
                              className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer ${
                                idx === 0 ? 'col-span-2 row-span-2 h-[300px] md:h-[450px]' : 'h-[180px] md:h-[217px]'
                              }`}
                            >
                              <img 
                                src={imgSrc} 
                                alt={`${provinceName} - Ảnh ${idx + 1}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).parentElement?.classList.add('hidden');
                                }} 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                                  📷 Xem ảnh
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Image Lightbox */}
                        <AnimatePresence>
                          {selectedImage && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedImage(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                              />
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="relative max-w-5xl max-h-[85vh] w-full"
                              >
                                <button 
                                  onClick={() => setSelectedImage(null)}
                                  className="absolute -top-12 right-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all z-10"
                                >
                                  <X size={20} />
                                </button>
                                <img 
                                  src={selectedImage} 
                                  alt={provinceName}
                                  className="w-full h-full object-contain rounded-2xl shadow-2xl"
                                />
                                {/* Navigation dots */}
                                <div className="flex justify-center gap-2 mt-4">
                                  {provinceImages.map((img, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        img === selectedImage 
                                          ? 'bg-orange-500 scale-125' 
                                          : 'bg-white/50 hover:bg-white/80'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-surface-2 rounded-3xl border border-dashed border-theme">
                        <p className="text-faint-color font-medium">Chưa có hình ảnh cho tỉnh này</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-6">
                    <div 
                      onClick={() => setSelectedTip({ title: 'Di chuyển', icon: <Car size={48} />, content: province.travelTips?.di_chuyen || 'Khí hậu ôn hòa, lý tưởng để du lịch quanh năm.' })}
                      className="p-8 bg-surface-2 dark:bg-slate-800/50 rounded-3xl border border-theme group hover:bg-surface hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-95"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl shadow-sm flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Car size={28} />
                      </div>
                      <h4 className="font-bold text-base-color mb-2 text-lg">Di chuyển</h4>
                      <p className="text-sm text-muted-color font-medium leading-relaxed line-clamp-3">
                        {province.travelTips?.di_chuyen || 'Khí hậu ôn hòa, lý tưởng để du lịch quanh năm.'}
                      </p>
                    </div>
                    <div 
                      onClick={() => setSelectedTip({ title: 'Ẩm thực', icon: <Utensils size={48} />, content: province.travelTips?.an_uong || 'Nhiều món đặc sản đậm đà hương vị vùng miền.' })}
                      className="p-8 bg-surface-2 dark:bg-slate-800/50 rounded-3xl border border-theme group hover:bg-surface hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-95"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl shadow-sm flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Utensils size={28} />
                      </div>
                      <h4 className="font-bold text-base-color mb-2 text-lg">Ẩm thực</h4>
                      <p className="text-sm text-muted-color font-medium leading-relaxed line-clamp-3">
                        {province.travelTips?.an_uong || 'Nhiều món đặc sản đậm đà hương vị vùng miền.'}
                      </p>
                    </div>
                    <div 
                      onClick={() => setSelectedTip({ title: 'Lưu trú', icon: <Home size={48} />, content: province.travelTips?.luu_tru || 'Nơi giao thoa của nhiều nét đẹp truyền thống.' })}
                      className="p-8 bg-surface-2 dark:bg-slate-800/50 rounded-3xl border border-theme group hover:bg-surface hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-95"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl shadow-sm flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Home size={28} />
                      </div>
                      <h4 className="font-bold text-base-color mb-2 text-lg">Lưu trú</h4>
                      <p className="text-sm text-muted-color font-medium leading-relaxed line-clamp-3">
                        {province.travelTips?.luu_tru || 'Nơi giao thoa của nhiều nét đẹp truyền thống.'}
                      </p>
                    </div>
                    <div 
                      onClick={() => setSelectedTip({ title: 'Lưu ý', icon: <AlertCircle size={48} />, content: province.travelTips?.luu_y || 'Thông tin quan trọng cho chuyến đi của bạn.' })}
                      className="p-8 bg-surface-2 dark:bg-slate-800/50 rounded-3xl border border-theme group hover:bg-surface hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-95"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl shadow-sm flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <AlertCircle size={28} />
                      </div>
                      <h4 className="font-bold text-base-color mb-2 text-lg">Lưu ý</h4>
                      <p className="text-sm text-muted-color font-medium leading-relaxed line-clamp-3">
                        {province.travelTips?.luu_y || 'Thông tin quan trọng cho chuyến đi của bạn.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attractions' && (
                <div className="animate-fade-in space-y-12">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.3em] text-orange-500 uppercase mb-2 block">Khám phá</span>
                      <h2 className="text-4xl font-bold text-base-color tracking-tight">Điểm đến tại {provinceName}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {province.attractions && province.attractions.length > 0 ? (
                      (() => {
                        const uniqueAttractions = province.attractions.reduce((acc: any[], current: any) => {
                          const x = acc.find(item => item.name === current.name);
                          if (!x) return acc.concat([current]);
                          return acc;
                        }, []);
                        return uniqueAttractions.map((attraction: any) => {
                          const getFolderName = (name: string) => {
                            if (!name) return '';
                            if (name.includes('Bà Rịa') || name.includes('Vũng Tàu')) return 'BaRia-VungTau';
                            return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[\s–-]+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                          };
                          
                          const folderName = getFolderName(provinceName);
                          const apiUrl = import.meta.env.VITE_API_URL || '';
                          const baseDomain = apiUrl.split('/Project_DuLichMXH')[0];
                          const attractionImgSrc = encodeURI(`${baseDomain}/63TinhThanhVN/${folderName}/DiemDuLich/${attraction.name}.jpg`);

                          return (
                          <div key={attraction.id} className="bg-surface rounded-[2.5rem] border border-theme p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all duration-500 group">
                          <div className="w-full md:w-64 h-48 rounded-3xl overflow-hidden shadow-lg shrink-0">
                            <img 
                              src={attractionImgSrc} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              alt={attraction.name}
                              onError={(e) => {
                                // Fallback về ảnh mặc định nếu file không tồn tại
                                (e.target as HTMLImageElement).src = attraction.image;
                              }}
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <span className="bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 text-[10px] font-black px-4 py-1 rounded-lg uppercase tracking-widest">{attraction.category || 'Địa điểm'}</span>
                                <div className="flex items-center gap-1.5 text-orange-500 font-black">
                                  <Star size={14} fill="currentColor" />
                                  <span className="text-sm">{attraction.rating || '4.5'}</span>
                                  <span className="text-faint-color text-xs font-medium">({attraction.reviews} đánh giá)</span>
                                </div>
                              </div>
                              <h3 className="text-2xl font-black text-base-color mb-3 group-hover:text-orange-500 transition-colors">{attraction.name}</h3>
                              <p className="text-muted-color font-medium text-sm line-clamp-2 mb-6">{attraction.description || attraction.address}</p>
                              
                              {attraction.highlightReview && (
                                <div className="p-4 bg-surface-2 rounded-2xl border border-theme flex items-start gap-4 shadow-sm">
                                  <img src={attraction.highlightReview.avatar} className="w-8 h-8 rounded-full border border-theme" alt="u" />
                                  <div>
                                    <p className="text-[11px] font-bold text-base-color mb-0.5">{attraction.highlightReview.user}</p>
                                    <p className="text-[12px] text-muted-color font-medium italic line-clamp-1 italic">"{attraction.highlightReview.comment}"</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex md:flex-col justify-between items-center gap-4">
                             <Link to={`/destination/${slug}/spot/${attraction.id}`} className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-faint-color hover:text-orange-500 hover:bg-surface-2 transition-all shadow-sm border border-theme">
                               <ChevronRight size={24} />
                             </Link>
                          </div>
                        </div>
                        );
                        })
                      })()
                    ) : (
                      <div className="text-center py-20 bg-surface-2 rounded-3xl border border-dashed border-theme">
                        <p className="text-faint-color font-bold uppercase tracking-widest">Đang cập nhật địa điểm du lịch</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'experiences' && (
                <div className="animate-fade-in space-y-12">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.3em] text-orange-500 uppercase mb-2 block">Cộng đồng</span>
                      <h2 className="text-4xl font-bold text-base-color tracking-tight leading-tight">Kinh nghiệm du lịch {provinceName}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                    {province.experiences && province.experiences.length > 0 ? (
                      province.experiences.map((exp: any) => (
                        <article key={exp.id} className="bg-surface rounded-[3rem] overflow-hidden shadow-premium border border-theme group hover:shadow-2xl transition-all duration-700">
                          <div className="relative h-[300px] overflow-hidden">
                            <img src={exp.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={exp.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8">
                              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-xl">{exp.title}</h3>
                            </div>
                          </div>
                          <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-4">
                                <img src={exp.author.avatar} className="w-12 h-12 rounded-[1rem] border-2 border-theme shadow-lg" alt={exp.author.name} />
                                <div>
                                  <p className="font-black text-base-color text-sm">{exp.author.name}</p>
                                  <p className="text-[10px] text-faint-color font-bold uppercase tracking-widest mt-0.5">Thành viên Gody</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2 text-rose-500 font-black">
                                  <Heart size={20} fill="currentColor" className="drop-shadow-md" />
                                  <span className="text-sm">{exp.loves}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-color font-black">
                                  <MessageSquare size={20} />
                                  <span className="text-sm">{exp.commentCount || 0}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-muted-color font-medium text-lg leading-relaxed mb-10 line-clamp-3">
                              {exp.excerpt}
                            </p>
                            <Link to={`/blog/${exp.id}`} className="inline-flex items-center gap-3 px-10 py-4 bg-surface-2 text-base-color font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest dark:bg-slate-700">
                              Xem chi tiết blog <ArrowRight size={16} />
                            </Link>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="text-center py-20 bg-surface-2 rounded-3xl border border-dashed border-theme">
                        <p className="text-faint-color font-bold uppercase tracking-widest">Chưa có bài viết kinh nghiệm nào</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvinceDetail;

