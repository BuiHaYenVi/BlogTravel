import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Filter, Globe, TrendingUp, Compass, Heart, Utensils, Mountain, Camera, Check, X, MailOpen } from 'lucide-react';
import BackButton from '../../../shared/components/common/BackButton';
import { useGroupStore } from '../store/useGroupStore';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'Adventure', label: 'Adventure', icon: <Mountain size={14} /> },
  { id: 'Relax', label: 'Relax', icon: <Heart size={14} /> },
  { id: 'Foodie', label: 'Foodie', icon: <Utensils size={14} /> },
  { id: 'Photography', label: 'Photography', icon: <Camera size={14} /> },
];

const GroupListPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [invitations, setInvitations] = useState<any[]>([]);
  const groups = useGroupStore(state => state.groups);
  const fetchGroups = useGroupStore(state => state.loadGroups);
  const loadMyInvitations = useGroupStore(state => state.loadMyInvitations);
  const acceptGroupInvite = useGroupStore(state => state.acceptGroupInvite);
  const rejectGroupInvite = useGroupStore(state => state.rejectGroupInvite);
  const loading = useGroupStore(state => state.loading);

  // States và Refs phục vụ tính năng kéo trượt bằng chuột trên PC (Drag to scroll)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setIsDragging(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.8; // Tốc độ cuộn trượt
    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const filterValue = activeCategory === 'all' ? undefined : activeCategory;
      fetchGroups(searchTerm, filterValue);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeCategory, fetchGroups]);

  useEffect(() => {
    const fetchInvites = async () => {
      const invites = await loadMyInvitations();
      setInvitations(invites);
    };
    fetchInvites();
  }, [loadMyInvitations]);

  const handleAcceptInvite = async (groupId: string) => {
    const result = await acceptGroupInvite(groupId);
    if (result.success) {
      setInvitations(prev => prev.filter(inv => inv.id !== groupId));
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleRejectInvite = async (groupId: string) => {
    const result = await rejectGroupInvite(groupId);
    if (result.success) {
      setInvitations(prev => prev.filter(inv => inv.id !== groupId));
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      {/* CINEMATIC HERO */}
      <div className="relative w-full h-[450px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=2000"
          className="absolute inset-0 w-full h-full object-cover opacity-40 hover:scale-105 transition-transform duration-[5000ms]"
          alt="Group Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 drop-shadow-2xl">
            Hội nhóm <span className="text-pastel-orange">Du Lịch</span>
          </h1>
          <p className="text-gray-300 font-black text-xs md:text-sm uppercase tracking-[0.4em] opacity-80">
            Kết nối những tâm hồn xê dịch • Chia sẻ hành trình thực tế
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-16 relative z-40">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
          <BackButton className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20" />
          <Link 
            to="/group/create" 
            className="group px-10 py-5 bg-white text-gray-900 font-black rounded-[2rem] shadow-2xl hover:bg-pastel-orange hover:text-white transition-all flex items-center gap-3 active:scale-95 text-sm tracking-widest uppercase"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> 
            Tạo hội nhóm mới
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-12">
            {/* Top Invitations Banner */}
            {invitations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-[3000ms]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-[1.8rem] flex items-center justify-center backdrop-blur-md shadow-inner">
                      <MailOpen size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black leading-tight mb-1">Bạn có {invitations.length} lời mời gia nhập nhóm</h3>
                      <p className="text-white/80 font-bold text-xs uppercase tracking-[0.2em]">Hãy kết nối cùng cộng đồng du lịch ngay</p>
                    </div>
                  </div>
                  <div className="flex -space-x-4">
                    {invitations.slice(0, 3).map((inv, i) => (
                      <img 
                        key={inv.id} 
                        src={inv.cover || 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3'} 
                        className="w-14 h-14 rounded-2xl border-4 border-orange-500 object-cover shadow-xl" 
                        style={{ zIndex: 3 - i }}
                        alt="Group Cover"
                      />
                    ))}
                    {invitations.length > 3 && (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-4 border-orange-500 flex items-center justify-center font-black text-sm z-0">
                        +{invitations.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {invitations.slice(0, 2).map((inv) => (
                    <div key={inv.id} className="bg-white/10 backdrop-blur-md rounded-[2rem] p-5 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <img 
                          src={inv.inviter_avatar || `https://i.pravatar.cc/150?u=${inv.owner_id}`} 
                          className="w-12 h-12 rounded-xl border border-white/30 object-cover" 
                          alt="inviter" 
                        />
                        <div>
                          <p className="text-sm font-black tracking-tight">
                            <span className="text-white">{inv.inviter_name || 'Một thành viên'}</span>
                            <span className="text-white/70 font-medium"> đã mời bạn vào </span>
                            <span className="text-yellow-300 font-black">"{inv.name}"</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleAcceptInvite(inv.id)}
                          className="flex-1 sm:flex-none px-6 py-3 bg-white text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 shadow-lg"
                        >
                          Chấp nhận
                        </button>
                        <button 
                          onClick={() => handleRejectInvite(inv.id)}
                          className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95 border border-white/20"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                  {invitations.length > 2 && (
                    <p className="text-center text-[10px] font-black text-white/60 uppercase tracking-widest pt-2">Và {invitations.length - 2} lời mời khác đang chờ...</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Filter Bar */}
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="bg-surface p-6 rounded-[2.5rem] shadow-premium border border-theme flex items-center gap-4 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth cursor-grab select-none active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 mr-4 border-r border-theme pr-6 pointer-events-none">
                <Filter size={18} className="text-pastel-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-color">Lọc theo:</span>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (!isDragging) {
                      setActiveCategory(cat.id);
                    }
                  }}
                  className={`px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategory === cat.id ? 'bg-pastel-orange text-white shadow-xl shadow-orange-500/20' : 'text-muted-color hover:bg-surface-2 hover:text-base-color'}`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Group Grid */}
            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="bg-surface rounded-[3rem] h-[500px] animate-pulse border border-theme shadow-sm" />
                 ))}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {groups.length > 0 ? groups.map((group) => (
                  <div key={group.id} className="bg-surface rounded-[3rem] overflow-hidden shadow-premium border border-theme group hover:shadow-2xl transition-all duration-700">
                    <div className="relative h-64 overflow-hidden">
                      <img src={group.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" alt={group.name} />
                      <div className="absolute top-6 left-6 px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-pastel-orange uppercase tracking-widest shadow-xl">
                        {group.category}
                      </div>
                    </div>
                    <div className="p-10">
                      <h3 className="text-2xl font-black text-base-color mb-4 group-hover:text-pastel-orange transition-colors line-clamp-1 tracking-tight">{group.name}</h3>
                      <p className="text-muted-color font-medium text-[15px] line-clamp-2 leading-relaxed mb-8">{group.description}</p>
                      
                      <div className="flex items-center justify-between pt-8 border-t border-theme">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-pastel-orange">
                            <Users size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-base-color leading-none">{group.memberCount?.toLocaleString() || 0}</span>
                            <span className="text-[10px] font-bold text-faint-color uppercase tracking-widest mt-1">Thành viên</span>
                          </div>
                        </div>
                        <Link to={`/group/${group.id}`} className="px-8 py-3.5 bg-gray-900 text-white text-[11px] font-black rounded-2xl hover:bg-pastel-orange transition-all uppercase tracking-widest shadow-xl active:scale-95 shadow-gray-200 hover:shadow-orange-500/20">
                          {group.isJoined ? 'Xem chi tiết nhóm' : 'Tham gia nhóm'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-faint-color font-black uppercase tracking-widest">Không tìm thấy hội nhóm nào phù hợp</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="bg-surface rounded-[2rem] p-8 shadow-premium border border-theme dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-sm font-black text-base-color uppercase tracking-widest mb-6">LỜI MỜI GIA NHẬP</h3>
              <div className="space-y-4">
                {invitations.length > 0 ? invitations.map((inv) => (
                  <div key={inv.id} className="p-5 bg-surface rounded-2xl border border-theme shadow-sm hover:shadow-md transition-all">
                    <p className="text-sm font-medium text-muted-color leading-relaxed mb-4">
                      <span className="font-bold text-base-color">{inv.inviter_name || 'Thành viên'}</span> đã mời bạn gia nhập nhóm <span className="font-bold text-pastel-orange">{inv.name}</span>
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptInvite(inv.id)}
                        className="flex-1 py-2.5 bg-pastel-orange text-white text-[11px] font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95 uppercase"
                      >
                        Chấp nhận ngay
                      </button>
                      <button 
                        onClick={() => handleRejectInvite(inv.id)}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 text-[11px] font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95 uppercase"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 border-2 border-dashed border-theme rounded-2xl">
                    <p className="text-xs font-bold text-faint-color uppercase tracking-widest text-center">Không có lời mời nào mới</p>
                  </div>
                )}
              </div>
            </div>

            {/* Search Widget */}
            <div className="bg-surface rounded-[2.5rem] p-10 shadow-premium border border-theme dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-[11px] font-black text-muted-color uppercase tracking-[0.2em] mb-8">Tìm kiếm hội nhóm</h3>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-faint-color group-focus-within:text-pastel-orange transition-colors" size={22} />
                <input
                  type="text"
                  placeholder="Nhập tên hội nhóm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-surface-2 border-2 border-transparent focus:border-pastel-orange/20 focus:bg-surface rounded-[1.8rem] outline-none font-bold text-sm text-base-color transition-all shadow-inner dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Trending Widget */}
            <div className="bg-surface rounded-[2.5rem] p-10 shadow-premium border border-theme relative overflow-hidden group dark:bg-slate-800 dark:border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-orange/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-xl font-black text-base-color mb-8 flex items-center gap-3">
                <TrendingUp className="text-pastel-orange" size={24} /> 
                Xu hướng tuần qua
              </h3>
              <div className="space-y-6">
                {['Hội Mê Camping', 'Review Phú Quốc', 'Chợ Phiên Vùng Cao'].map((trend, idx) => (
                  <div key={trend} className="flex items-center gap-4 group/item cursor-pointer">
                    <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center font-black text-pastel-orange text-xs group-hover/item:bg-pastel-orange group-hover/item:text-white transition-all shadow-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-base-color text-sm group-hover/item:text-pastel-orange transition-colors">{trend}</p>
                      <p className="text-[10px] text-faint-color font-bold uppercase tracking-widest">+120 bài viết</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Card */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-premium">
              <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-[3000ms]" />
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.8rem] flex items-center justify-center mb-8 shadow-inner">
                <Compass className="text-pastel-orange w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black mb-4 relative z-10 leading-tight">Mở rộng vòng kết nối</h3>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed relative z-10">Mời bạn bè cùng gia nhập Gody để cùng lên lịch cho những hành trình vĩ đại tiếp theo.</p>
              <button className="w-full py-5 bg-pastel-orange text-white font-black rounded-[1.8rem] hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/20 active:scale-95 uppercase tracking-widest text-xs relative z-10">
                MỜI BẠN BÈ NGAY
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GroupListPage;

