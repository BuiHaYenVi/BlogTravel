import { create } from 'zustand';
import { notificationApi } from '../services/notificationApi';

interface Notification {
  id: number;
  user_id: number;
  actor_id: number;
  actor_name: string;
  actor_avatar: string;
  type: 
    | 'follow' | 'like' | 'comment' | 'reply' | 'mention'
    | 'group_post' | 'group_invite' | 'group_join_request' | 'group_request_approved' | 'group_request_rejected'
    | 'trip_invite' | 'trip_update' | 'trip_reminder'
    | 'profile_update' | 'system_alert' | 'achievement' | 'broadcast';
  target_id: number | null;
  target_type: string | null;
  is_read: boolean;
  created_at: string;
  custom_message?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  pollingInterval: ReturnType<typeof setInterval> | null;
  fetchNotifications: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notification: any) => void;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pollingInterval: null,

  fetchNotifications: async () => {
    try {
      const response = await notificationApi.getNotifications();
      console.log('🔔 API Notifications Response:', response.data);
      
      const data = response.data.data || {};
      const notifications = data.notifications || [];
      const unread_count = data.unread_count || 0;
      
      const normalizedNotifications = notifications.map((n: any) => ({
        ...n,
        is_read: n.is_read === true || n.is_read === 't' || n.is_read === 1
      }));

      set({ 
        notifications: normalizedNotifications, 
        unreadCount: parseInt(unread_count as string) || 0, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('❌ Fetch notifications failed:', error);
    }
  },

  startPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Fetch initial
    get().fetchNotifications();
    
    // Set polling (fetch real data from API every 30s)
    const interval = setInterval(() => {
      get().fetchNotifications();
    }, 30000);
    
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  addNotification: (notification: any) => {
    const { notifications, unreadCount } = get();
    // ✅ Tránh trùng lặp nếu socket hoặc polling bắn về thông báo đã có
    if (notifications.some(n => Number(n.id) === Number(notification.id))) return;

    set({
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1
    });
  },

  markAsRead: async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error(error);
    }
  },

  markAllRead: async () => {
    try {
      await notificationApi.markAllRead();
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications: updatedNotifications, unreadCount: 0 });
    } catch (error) {
      console.error(error);
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      const { notifications, unreadCount } = get();
      const target = notifications.find((n) => n.id === id);
      const updatedNotifications = notifications.filter((n) => n.id !== id);
      set({
        notifications: updatedNotifications,
        unreadCount: target && !target.is_read ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    } catch (error) {
      console.error(error);
    }
  },
}));
