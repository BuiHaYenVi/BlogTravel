import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuthStore } from '../../auth/store/useAuthStore';
const API_URL = import.meta.env.VITE_API_URL || '';
import { 
  Bell, 
  Search, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  ChevronRight,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import httpClient from '../../../services/api/httpClient';
import { socketService } from '../../../services/socket/socketService';

interface AdminNotification {
  id: number;
  type: string;
  data: any;
  is_read: boolean;
  time_ago: string;
  created_at: string;
}

const AdminLayout = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const notificationRef = useRef<HTMLDivElement>(null);

  // ✅ 1. Logic Fetch dữ liệu linh hoạt (Fallback Array Parsing)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await httpClient.get<any, any>('/admin/notifications/latest');
        if (response && response.data && Array.isArray(response.data.notifications)) {
          setNotifications(response.data.notifications);
        } else if (response && Array.isArray(response.data)) {
          setNotifications(response.data);
        } else if (Array.isArray(response)) {
          setNotifications(response);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };
    fetchNotifications();
  }, []);

  // Handle Socket.io and outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // ✅ 2. Logic Hứng Socket Real-time (Auto Unwrapping)
    const handleNewNotification = (incomingData: any) => {
      console.log("[Socket Debug] Dữ liệu thông báo nhận được:", incomingData);
      
      // Tự động bóc tách nếu Node.js bọc trong trường .notification hoặc .data
      const finalNotif = incomingData?.notification || incomingData?.data || incomingData;
      
      if (finalNotif && finalNotif.type) {
        setNotifications(prev => [finalNotif, ...prev].slice(0, 10)); // Giữ tối đa 10 cái mới nhất
      }
    };

    socketService.on('new_admin_notification', handleNewNotification);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socketService.off('new_admin_notification', handleNewNotification);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await httpClient.put('/admin/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('report')) return <ShieldAlert size={16} className="text-rose-500" />;
    if (type.includes('group')) return <Info size={16} className="text-blue-500" />;
    if (type.includes('system')) return <CheckCircle size={16} className="text-emerald-500" />;
    return <AlertCircle size={16} className="text-pastel-orange" />;
  };

  const getNotificationBg = (type: string) => {
    if (type.includes('report')) return 'bg-rose-50';
    if (type.includes('group')) return 'bg-blue-50';
    if (type.includes('system')) return 'bg-emerald-50';
    return 'bg-orange-50';
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'report_post':
      case 'report_comment':
      case 'report_user':
      case 'report_story':
      case 'report_trip':
        return 'Báo cáo vi phạm mới';
      case 'group_request':
        return 'Yêu cầu duyệt nhóm';
      case 'system_update':
        return 'Hệ thống cập nhật';
      default:
        return 'Thông báo hệ thống';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 backdrop-blur-md lg:px-8 lg:pl-[280px] transition-all duration-300">
          {/* Header Left (Search) */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh..." 
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-pastel-orange/30 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-all ${showNotifications ? 'bg-slate-100 text-pastel-orange' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-[10px] font-black text-pastel-orange uppercase tracking-tighter hover:underline">Đã đọc tất cả</button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer group ${!notif.is_read ? 'bg-slate-50/50' : ''}`}>
                            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${getNotificationBg(notif.type)}`}>
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <p className={`text-xs font-black transition-colors ${!notif.is_read ? 'text-pastel-orange' : 'text-slate-900 group-hover:text-pastel-orange'}`}>
                                  {getNotificationTitle(notif.type)}
                                </p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{notif.data?.message || notif.data?.reason || JSON.stringify(notif.data)}</p>
                                <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tabular-nums">{notif.time_ago}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button className="w-full p-4 text-center border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                      Xem tất cả
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <div 
              className="flex items-center gap-3 pl-1 group cursor-pointer"
              onClick={() => navigate('/admin/profile')}
            >
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-black text-slate-900 group-hover:text-pastel-orange transition-colors">
                  {user?.name || 'Quản trị viên'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {user?.role === 'super-admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : (user?.role || 'Cộng tác viên')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 border-2 border-white overflow-hidden shadow-sm group-hover:border-pastel-orange/30 transition-all">
                <img 
                  src={user?.avatar?.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}/${user?.avatar || 'default-avatar.png'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 lg:pl-[280px] transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Simple Footer */}
        <footer className="py-4 px-8 lg:pl-[280px] border-t border-slate-100 text-[12px] text-slate-400 text-center transition-all duration-300">
          &copy; {new Date().getFullYear()} BlogTravel Platform. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
