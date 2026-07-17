import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/common/Toast';
import ChatSystem from '../../features/chat/ChatSystem';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { socketService } from '../../services/socket/socketService';
import { useNotificationStore } from '../../features/notification/store/useNotificationStore';
import { useToast } from '../hooks/useToast';

const MainLayout = () => {
  const { pathname } = useLocation();
  const { initSocket } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { showToast } = useToast();

  useEffect(() => { 
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); 
  }, [pathname]);

  useEffect(() => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const token = state?.token || state?.user?.token;
        if (token) {
          initSocket(token);

          // ✅ Lắng nghe thông báo Real-time
          const handleNewNotif = (notif: any) => {
            console.log('🔔 [SOCKET] Nhận thông báo mới:', notif);
            addNotification(notif);
            
            // Hiển thị toast nhanh
            showToast('Bạn có thông báo mới!', 'info');
          };

          console.log('📡 [SOCKET] Đang thiết lập lắng nghe new_notification...');
          socketService.on('new_notification', handleNewNotif);

          return () => {
            socketService.off('new_notification', handleNewNotif);
          };
        }
      } catch (e) {
        console.error('Lỗi khởi tạo socket:', e);
      }
    }
  }, [initSocket, addNotification, showToast]);

  return (
    <div className="min-h-screen flex flex-col bg-app text-base-color font-sans transition-colors duration-300">
      <Navbar />

      <div className="h-20"></div>

      <main className="grow flex flex-col w-full relative">
        <Outlet />
      </main>

      <Footer />
      <Toast />
      <ChatSystem />
    </div>
  );
};

export default MainLayout;
