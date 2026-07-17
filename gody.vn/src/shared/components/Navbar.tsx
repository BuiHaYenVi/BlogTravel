import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Compass, User, PenTool, Menu, X, Bell, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNotificationStore } from '../../features/notification/store/useNotificationStore';
import NotificationList from '../../features/notification/components/NotificationList';
import { getImageUrl } from '../utils/imageHelper';
import { motion, AnimatePresence } from 'framer-motion';
import Autocomplete from './common/Autocomplete';
import { searchApi } from '../../features/search/services/searchApi';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, startPolling, stopPolling } = useNotificationStore();
  
  // Đồng bộ theme với class HTML
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.startsWith(path) && path !== '/' 
    ? 'text-orange-500 border-b-2 border-orange-500 font-bold' 
    : location.pathname === path && path === '/'
      ? 'text-orange-500 border-b-2 border-orange-500 font-bold'
      : 'text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium';

  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isAuthenticated, startPolling, stopPolling]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/destination', label: 'Điểm đến' },
    { to: '/companion', label: 'Tìm bạn' },
    { to: '/group', label: 'Nhóm' },
    { to: '/blog', label: 'Blog' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchSuggestions = async (query: string) => {
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
      console.error('Search suggestions failed:', error);
      return [];
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'spot') {
      navigate(`/destination/${suggestion.parentSlug}/spot/${suggestion.id}`);
    } else {
      navigate(`/destination/${suggestion.slug}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800 h-20 transition-all duration-300">
      {theme === 'dark' && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-orange-500 z-[70]"></div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        { /* Logo */ }
        <Link to="/" className="flex items-center gap-2 group text-gray-900 dark:text-white">
          <div className="p-2 bg-orange-500 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-orange-500/20">
            <Compass className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            Blog<span className="text-orange-500">Travel</span>
          </span>
        </Link>

        { /* Desktop Nav */ }
        <nav className="hidden lg:flex gap-8 items-center h-full">
          { navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`h-full flex items-center px-1 transition-all duration-300 tracking-tight whitespace-nowrap ${isActive(link.to)}`}>
              { link.label }
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          { /* Theme Toggle */ }
          <button
            onClick={toggleTheme}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all active:scale-90"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </button>

          { /* Mobile & Desktop Search */ }
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all active:scale-90"
          >
            <Search className="w-5 h-5" />
          </button>

          { /* Notification Dropdown */ }
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all active:scale-90 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 z-50 origin-top-right translate-x-12 sm:translate-x-0"
                  >
                    <NotificationList onClose={() => setNotifOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3">
            <Link 
              to="/blog/create" 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm whitespace-nowrap
                ${location.pathname === '/blog/create' 
                  ? 'bg-orange-500 text-white shadow-orange-500/20 shadow-lg' 
                  : 'bg-orange-50 dark:bg-slate-800 text-orange-500 dark:text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-100 dark:border-slate-700' }`}
            >
              <PenTool className="w-4 h-4" />
              Viết blog
            </Link>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-gray-100 dark:bg-slate-800 mx-1"></div>

          {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'super_admin' || (user as any)?.role_level >= 50) && (
            <Link 
              to="/admin/dashboard" 
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all bg-gray-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-slate-600 hover:shadow-lg active:scale-95 whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              Quản trị
            </Link>
          )}
          
          <div className="flex items-center gap-4">
            { isAuthenticated ? (
              <Link 
                to={`/profile/${user?.id}`} 
                className="flex items-center gap-3 hover:opacity-80 transition-all bg-gray-50 dark:bg-slate-800 p-1 pr-4 rounded-full border border-gray-100 dark:border-slate-700 hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm bg-gray-100 dark:bg-slate-700">
                  <img 
                    src={getImageUrl(user?.avatar)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = 'true';
                        target.src = 'http://localhost:90/Project_DuLichMXH/public/uploads/avatars/default.png';
                      }
                    }}
                  />
                </div>
                <span className="hidden sm:block font-bold text-sm tracking-tight text-gray-700 dark:text-gray-200 whitespace-nowrap max-w-[150px] truncate hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  { user?.name }
                </span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white text-sm font-bold transition-all hover:shadow-lg active:scale-95">
                <User className="w-4 h-4" /> Đăng nhập
              </Link>
            )}

            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              onClick={ () => setMobileOpen((prev) => !prev) }
            >
              { mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" /> }
            </button>
          </div>
        </div>
      </div>

      { /* Mobile Menu */ }
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-8 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={ () => setMobileOpen(false) }
                  className={`block rounded-2xl px-4 py-4 text-xl transition-all ${isActive(link.to).includes('border') ? 'bg-orange-50 dark:bg-slate-800 text-orange-500 dark:text-orange-400 font-bold' : 'text-gray-600 dark:text-gray-300 font-bold' }`}
                >
                  { link.label }
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  to="/blog/create"
                  onClick={ () => setMobileOpen(false) }
                  className="block rounded-2xl px-6 py-4 text-center bg-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/20"
                >
                  Viết blog mới
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      { /* Search Overlay */ }
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-2xl p-6 z-50"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl pr-14 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                <Autocomplete
                  placeholder="Tìm kiếm điểm đến, bài viết, nhóm..."
                  onSearch={handleSearchSuggestions}
                  onSelect={handleSuggestionSelect}
                  onChange={setSearchQuery}
                  autoFocus={true}
                  showIcon={false}
                  className="w-full"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 z-10">
                  <Search size={24} />
                </button>
              </form>
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-slate-800 rounded-full p-3 shadow-sm border border-gray-150 dark:border-slate-700 shrink-0 transition-colors"
                title="Đóng"
              >
                <X size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
