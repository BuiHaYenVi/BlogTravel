import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Tag,
  Star,
  Heart,
  ChevronLeft,
  Camera,
  Info,
  MessageSquare,
  Navigation,
  Calendar,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Pencil
} from 'lucide-react';
import { PROVINCES } from '../../../services/mock/provinces';
import SpotReviews from '../components/SpotReviews';
import BackButton from '../../../shared/components/common/BackButton';
import DestinationSidebar from '../components/DestinationSidebar';

const SpotDetailPage = () => {
  const { slug, spotId } = useParams<{ slug: string; spotId: string }>();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Keep scroll position
  }, [spotId]);

  const province = PROVINCES.find(p => p.slug === slug);
  const spot = province?.attractions?.find(a => a.id === spotId);

  if (!spot) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-app">
        <h2 className="text-2xl font-black text-base-color mb-4">Oops! Không tìm thấy địa điểm</h2>
        <button
          onClick={() => navigate(-1)}
          className="bg-pastel-orange text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${size} ${i <= Math.floor(rating) ? 'fill-[#F09B3E] text-[#F09B3E]' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 pt-24 md:pt-32">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Side: Sidebar */}
          <div className="lg:w-[350px] shrink-0">
            <div className="mb-8">
              <BackButton />
            </div>
            <DestinationSidebar provinceName={province?.name || ''} slug={slug || ''} />
          </div>

          {/* Right Side: Main Content */}
          <div className="flex-1">
            {/* Spot Title & Ratings */}
            <div className="mb-10">
              <h1 className="text-[40px] md:text-[54px] font-bold text-base-color mb-4 tracking-tight leading-tight">{spot.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                {renderStars(spot.rating || 4.5, "w-5 h-5")}
                <div className="flex items-center gap-4 text-[15px] font-bold">
                  <span className="text-gray-400 font-bold">•</span>
                  <span className="text-muted-color">{spot.reviews} reviews</span>
                  <span className="text-gray-400 font-bold">•</span>
                  <Link to={`/destination/${slug}/review/create`} className="text-[#F09B3E] hover:underline flex items-center gap-1.5">
                    <Pencil size={16} /> Viết review
                  </Link>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="mb-16">
              <div className="relative rounded-[2.5rem] overflow-hidden group shadow-2xl bg-gray-100 h-[350px] md:h-[500px]">
                <img src={spot.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" alt={spot.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-8 right-8 flex flex-col md:flex-row gap-4 items-end md:items-center">
                  <div className="flex gap-2">
                    <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-gray-900 transition-all shadow-xl">
                      <ChevronLeft size={24} />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-gray-900 transition-all shadow-xl">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                  <button className="bg-white px-8 py-4 rounded-2xl font-black text-gray-900 shadow-2xl hover:bg-gray-50 transition-all active:scale-95 text-sm uppercase tracking-widest">
                    Xem tất cả ảnh
                  </button>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-12">
              <p className="text-muted-color text-lg md:text-xl leading-relaxed font-medium">
                {spot.description || "Vùng đất linh thiêng và thơ mộng, nơi hội tụ những giá trị văn hóa và tâm linh sâu sắc, là điểm đến không thể bỏ qua cho mọi hành trình khám phá."}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-surface rounded-[2rem] p-8 md:p-10 border border-theme shadow-sm mb-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <h3 className="text-3xl font-bold text-base-color mb-6 tracking-tight">Thông tin cần biết</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-2 text-muted-color text-lg">
                  <span className="font-bold text-base-color shrink-0 mt-1">• Địa chỉ:</span>
                  <span className="font-medium ml-2">{spot.address}</span>
                </li>
              </ul>
            </div>

            {/* Detailed Context Section */}
            <div className="mb-24 border-t border-theme pt-20">
              <h3 className="text-[36px] md:text-[44px] font-bold text-base-color mb-10 tracking-tight leading-tight">Du lịch {spot.name}</h3>
              <div className="space-y-12">
                <p className="text-muted-color text-[19px] leading-relaxed font-medium">
                  Khu vực núi có đến 200 ngôi đền, chùa, am, miếu nằm rải rác ở chân núi, sườn núi và cả trên đỉnh. Trên đỉnh núi có một pháo đài được xây dựng từ thời Pháp. Vào mùa lễ hội, nơi đây có rất nhiều điều để khám phá, nếu bạn là người có tâm cầu nguyện, cầu mong bình an cho người thân, có thể đến viếng miếu Bà chúa Xứ - nơi đây nổi tiếng linh thiêng, đón hàng ngàn lượt người từ thập phương đến cúng bái mỗi năm.
                </p>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-theme bg-surface-2">
                  <img src="https://images.unsplash.com/photo-1596402184320-417d717867cd?w=1200&q=80" className="w-full object-cover" alt="context" />
                </div>
                <p className="text-muted-color text-[19px] leading-relaxed font-medium">
                  Trên đỉnh <span className="text-[#F09B3E]">núi Sam</span> còn có dấu tích bệ đá nơi tượng bà chúa Xứ lúc chưa đưa về miếu. Sau này, tượng bà chúa Xứ được di chuyển xuống miếu và hiện miếu này nằm ở chân núi Sam.
                </p>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-theme bg-surface-2">
                  <img src="https://images.unsplash.com/photo-1518005020251-5fb5c5a2176b?w=1200&q=80" className="w-full object-cover" alt="context" />
                </div>
              </div>
            </div>

            {/* Nearby Attractions */}
            <div className="mb-24">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-bold text-base-color tracking-tight">Các địa điểm tham quan gần đó</h3>
                <Link to={`/destination/${slug}`} className="text-[#F09B3E] font-black text-sm uppercase tracking-widest hover:underline">Xem tất cả</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {province?.attractions?.filter(a => a.id !== spotId).map(nearby => (
                  <div key={nearby.id} className="group flex flex-col h-full bg-surface rounded-[2.5rem] p-4 border border-theme shadow-sm hover:shadow-md transition-all">
                    <Link to={`/destination/${slug}/spot/${nearby.id}`} className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 block">
                      <img src={nearby.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={nearby.name} />
                    </Link>
                    <div className="px-2 pb-2 flex flex-col flex-1">
                      <Link to={`/destination/${slug}/spot/${nearby.id}`}>
                        <h4 className="font-bold text-xl text-base-color mb-2 line-clamp-1 group-hover:text-[#F09B3E] transition-colors">{nearby.name}</h4>
                      </Link>
                      <div className="flex items-center gap-2 mb-8">
                        {renderStars(nearby.rating || 4, "w-3.5 h-3.5")}
                        <span className="text-[12px] text-faint-color font-bold uppercase tracking-widest">{nearby.reviews} reviews</span>
                      </div>
                      <Link 
                        to={`/destination/${slug}/review/create`} 
                        className="mt-auto w-full py-4 bg-[#F09B3E] hover:bg-orange-600 text-white text-center rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/10 transition-all active:scale-95"
                      >
                        Viết review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-20 border-t border-theme">
              <SpotReviews spotId={spotId!} slug={slug!} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetailPage;
