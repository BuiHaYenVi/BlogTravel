import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, PenSquare, Search, ArrowRight, Star, MessageCircle, MapPin, Compass } from 'lucide-react';
import Autocomplete, { Suggestion } from '../../../shared/components/common/Autocomplete';
import { searchApi } from '../../search/services/searchApi';
import StoryCardSlider from '../../stories/components/StoryCardSlider';

const popularDestinations = [
  {
    id: 1,
    name: 'Đà Nẵng - Hội An',
    slug: 'da-nang',
    description: 'Khám phá vẻ đẹp pha trộn giữa hiện đại và cổ kính của miền Trung.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Đà Lạt - Lâm Đồng',
    slug: 'lam-dong',
    description: 'Thành phố sương mù với những đồi thông reo và không khí thơ mộng.',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Sapa - Lào Cai',
    slug: 'lao-cai',
    description: 'Nơi gặp gỡ giữa trời và đất với những thửa ruộng bậc thang hùng vĩ.',
    image: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=600&q=80'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearch = React.useCallback(async (query: string): Promise<Suggestion[]> => {
    try {
      const response = await searchApi.searchAll(query, 'location', 10);
      if (response.success && response.data.results.locations) {
        return response.data.results.locations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          subName: loc.type === 'province' ? (loc.region || 'Tỉnh thành') : `Điểm tham quan tại ${loc.region || 'Việt Nam'}`,
          slug: loc.slug,
          type: loc.type,
          parentSlug: loc.parent_slug,
          image: loc.image
        }));
      }
      return [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, []);

  const handleSelect = (option: any) => {
    if (option.type === 'spot') {
      navigate(`/destination/${option.parentSlug}/spot/${option.id}`);
    } else {
      navigate(`/destination/${option.slug}`);
    }
  };

  const goToSearchPage = () => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <div className="w-full bg-app transition-colors duration-300">
      {/* PREMIUM HERO SECTION */}
      <section className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-900 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-gray-900/60"></div>
        </div>
        
        <div className="relative z-50 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 uppercase tracking-tight leading-[1.1]">
              Hành trình của bạn <br />
              <span className="text-orange-500">Bắt đầu từ đây</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-2xl mx-auto font-medium opacity-90">
              Khám phá những điểm đến tuyệt vời, chia sẻ câu chuyện và kết nối cùng cộng đồng Traveler.
            </p>

            <div className="bg-theme-surface/90 dark:bg-theme-surface2/95 backdrop-blur-md p-2 rounded-full shadow-2xl flex flex-col md:flex-row max-w-xl mx-auto gap-2 border border-theme/20">
              <div className="flex-1 px-4">
                <Autocomplete
                  placeholder="Bạn muốn đi đâu? (Đà Lạt, Phú Quốc...)"
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  onChange={setSearchValue}
                />
              </div>
              <button 
                onClick={goToSearchPage}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm"
              >
                TÌM KIẾM
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STORY FEED */}
      <div className="max-w-7xl mx-auto px-4 mt-12 relative z-40">
        <StoryCardSlider />
      </div>

      {/* QUICK ACTIONS */}
      <div className="max-w-7xl mx-auto px-4 mt-8 relative z-40 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/destination" className="group bg-surface p-10 rounded-[2.5rem] shadow-sm border border-theme flex items-center gap-8 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-900 transition-all duration-300">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all flex-shrink-0">
              <MapPin size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-base-color mb-2">Review & Kinh nghiệm</h3>
              <p className="text-muted-color font-medium leading-relaxed">Xem các bài review trải nghiệm về địa điểm và kinh nghiệm du lịch tại tỉnh thành bằng cách click vào xem theo từng địa phương.</p>
            </div>
          </Link>
          <Link to="/blog/create" className="group bg-surface p-10 rounded-[2.5rem] shadow-sm border border-theme flex items-center gap-8 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all flex-shrink-0">
              <PenSquare size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-base-color mb-2">Chia sẻ trải nghiệm</h3>
              <p className="text-muted-color font-medium">Viết blog và lưu giữ những khoảnh khắc tuyệt vời nhất.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* POPULAR DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-[0.3em] mb-4">Gợi ý cho bạn</h2>
            <h3 className="text-4xl font-bold text-base-color tracking-tight">Điểm đến phổ biến</h3>
          </div>
          <Link to="/destination" className="group flex items-center gap-2 text-sm font-bold text-muted-color hover:text-orange-500 transition-colors">
            XEM TẤT CẢ <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularDestinations.map((dest) => (
            <div key={dest.id} className="bg-surface rounded-[2rem] overflow-hidden shadow-sm border border-theme group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
              <Link to={`/destination/${dest.slug}`} className="block h-64 overflow-hidden relative">
                <img src={dest.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dest.name} />
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-orange-600 uppercase tracking-widest shadow-sm">Trending</div>
              </Link>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-base-color mb-3 group-hover:text-orange-500 transition-colors">{dest.name}</h3>
                <p className="text-muted-color font-medium line-clamp-2 leading-relaxed mb-6">{dest.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-theme">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => <img key={i} src={`https://i.pravatar.cc/100?img=${dest.id}${i}`} className="w-8 h-8 rounded-full border-2 border-surface" alt="u" />)}
                  </div>
                  <span className="text-xs font-bold text-faint-color uppercase tracking-widest">Khám phá ngay</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-12 md:p-20 overflow-hidden relative border border-slate-200/80 dark:border-slate-800 transition-all duration-300">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <Compass className="w-[600px] h-[600px] text-slate-900 dark:text-white -mr-40 -mt-20 rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-[0.3em] mb-6">Cộng đồng Blog Travel</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight leading-tight">Gia nhập hàng trăm hội nhóm du lịch trên khắp Việt Nam</h3>
            <p className="text-lg text-slate-600 dark:text-gray-400 font-medium mb-12">Nơi tụ hội của những người đam mê xê dịch, ẩm thực và nhiếp ảnh. Cùng nhau chia sẻ, cùng nhau lên đường.</p>
            <div className="flex flex-wrap gap-4 mb-12">
              <div className="px-6 py-3 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 rounded-2xl flex items-center gap-3">
                <Users className="text-orange-500" size={24} />
                <span className="text-slate-800 dark:text-white font-bold">80k+ Travelers</span>
              </div>
              <div className="px-6 py-3 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 rounded-2xl flex items-center gap-3">
                <Star className="text-yellow-500 dark:text-yellow-400" size={24} />
                <span className="text-slate-800 dark:text-white font-bold">500+ Nhóm</span>
              </div>
            </div>
            <Link to="/group" className="inline-flex items-center gap-3 px-10 py-4 bg-orange-500 text-white font-bold rounded-2xl text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20">
              Khám phá cộng đồng <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
