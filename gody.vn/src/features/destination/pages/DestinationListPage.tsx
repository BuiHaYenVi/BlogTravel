import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { useDestinationStore } from '../store/useDestinationStore';
import BackButton from '../../../shared/components/common/BackButton';

const DestinationListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('all');
  const { destinations, fetchDestinations, loading } = useDestinationStore();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const regions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Miền Bắc', label: 'Miền Bắc' },
    { id: 'Miền Trung', label: 'Miền Trung' },
    { id: 'Tây Nguyên', label: 'Tây Nguyên' },
    { id: 'Miền Nam', label: 'Miền Nam' },
    { id: 'Miền Tây', label: 'Miền Tây' },
  ];

  const uniqueProvinces = destinations.reduce((acc: any[], current: any) => {
    const x = acc.find(item => item.name === current.name);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  const filteredProvinces = uniqueProvinces.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = activeRegion === 'all' || p.region === activeRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="pt-20 min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      
      {/* SIMPLE HERO BANNER */}
      <div className="relative w-full h-[400px] bg-gray-900 flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&w=1920&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Destination Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20"></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter"
          >
            Điểm đến <span className="text-teal-400">Việt Nam</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-200 font-medium leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Khám phá trọn vẹn vẻ đẹp 34 tỉnh thành Việt Nam với thông tin du lịch chi tiết và tin cậy.
          </motion.p>
          
          {/* Advanced Search UI */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative"
          >
            <div className="relative group shadow-2xl rounded-3xl overflow-hidden">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-500 z-10">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên tỉnh thành (VD: Hà Giang, Ninh Bình...)"
                className="w-full bg-surface border-none pl-16 pr-6 py-5 focus:outline-none focus:ring-0 text-lg font-bold text-base-color transition-all placeholder-gray-400 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter & Results Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-surface rounded-[3rem] shadow-xl border border-theme p-8 md:p-12">
          {/* Region Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setActiveRegion(region.id)}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  activeRegion === region.id 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105' 
                    : 'bg-surface-2 text-muted-color hover:bg-surface-2 hover:text-base-color'
                }`}
              >
                {region.label}
              </button>
            ))}
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-6 mb-8">
              <h2 className="text-sm font-black text-base-color tracking-[0.3em] uppercase whitespace-nowrap">
                {loading ? 'Đang cập nhật...' : `${activeRegion === 'all' ? 'Tất cả điểm đến' : activeRegion} (${filteredProvinces.length})`}
              </h2>
              <div className="flex-1 h-px bg-surface-2"></div>
            </div>

            {/* Featured Images Gallery for Destinations */}
            {!loading && filteredProvinces.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
                {filteredProvinces.slice(0, 10).map((province: any) => (
                  <Link 
                    key={`gallery-${province.id}`}
                    to={`/destination/${province.slug}`}
                    className="relative flex-shrink-0 w-48 h-64 rounded-[2rem] overflow-hidden group shadow-md"
                  >
                    <img 
                      src={province.image} 
                      alt={province.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-bold text-sm truncate">{province.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-2 bg-gray-50 rounded-full w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredProvinces.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-8">
              {filteredProvinces.map((province: any, idx: number) => (
                <motion.div
                  key={province.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Link 
                    to={`/destination/${province.slug}`} 
                    className="group flex items-center gap-4 py-2 hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-base-color group-hover:text-teal-50 transition-colors tracking-tight">
                        {province.name}
                      </h3>
                      <p className="text-[10px] font-bold text-faint-color uppercase tracking-widest">
                        {province.region || 'Việt Nam'}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-surface-2 rounded-[3rem] border-2 border-dashed border-theme">
              <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-faint-color mx-auto mb-6 shadow-sm">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-faint-color mb-2">Không tìm thấy kết quả</h3>
              <p className="text-faint-color font-medium">Thử tìm kiếm với từ khóa hoặc khu vực khác nhé!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DestinationListPage;
