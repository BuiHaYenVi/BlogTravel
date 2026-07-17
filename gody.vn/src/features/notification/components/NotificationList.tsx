import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { 
  UserCheck, MessageSquare, Users, UserCog, Clock, Heart, AtSign, 
  UserPlus, ShieldCheck, CheckCircle2, XCircle, Map, Calendar, 
  Bell, AlertTriangle, Trophy, MessageCircle, Mail, Ban, Gift, Megaphone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '../../../shared/utils/dateHelper';

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead, isLoading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ Debug: Ép in ra danh sách thông báo thực tế từ API
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('📋 [DEBUG] Danh sách thông báo hiện tại:', notifications);
    }
  }, [notifications]);

  const handleNotificationClick = async (n: any) => {
    // 1. Mark as read if unread
    if (!n.is_read) {
      await markAsRead(n.id);
    }

    // 2. Navigate based on type + target_type
    const targetType = n.target_type || '';
    const redirectUrl = n.redirect_url; // Use custom redirect if available
    
    if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      switch (n.type) {
        // === Social ===
        case 'follow':
        case 'profile_update':
          navigate(`/profile/${n.actor_id}`);
          break;
        
        case 'like':
        case 'comment':
        case 'reply':
        case 'mention':
          // target_id luôn là post_id (đã fix ở backend)
          if (n.target_id) navigate(`/blog/${n.target_id}`);
          break;
        
        case 'share':
          if (n.target_id) navigate(`/blog/${n.target_id}`);
          break;
  
        // === Groups ===
        case 'group_invite':
        case 'group_join_request':
        case 'group_request_approved':
        case 'group_request_rejected':
          if (n.target_id) navigate(`/group/${n.target_id}`);
          break;
        
        case 'group_post':
        case 'group_post_pending':
          if (n.target_id) {
            navigate(`/group/${n.target_id}`, { state: { activeTab: 'pending' } });
          }
          break;
        
        // === Trips ===
        case 'trip_request':
        case 'trip_accepted':
        case 'trip_update':
        case 'trip_reminder':
          if (n.target_id) navigate(`/companion/trip/${n.target_id}`);
          break;
        
        case 'trip_invite':
          if (n.target_id) navigate(`/companion/trip/${n.target_id}`);
          break;
        
        default:
          break;
      }
    }

    // 3. Close dropdown
    if (onClose) onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      // Social
      case 'follow': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'like': return <Heart className="w-5 h-5 text-rose-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-teal-500" />;
      case 'reply': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'mention': return <AtSign className="w-5 h-5 text-indigo-500" />;
      
      // Groups
      case 'group_post': 
      case 'group_post_pending': 
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'group_invite': return <UserPlus className="w-5 h-5 text-orange-500" />;
      case 'group_join_request': return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'group_request_approved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'group_request_rejected': return <XCircle className="w-5 h-5 text-rose-400" />;
      
      // Trips
      case 'trip_request':
      case 'trip_invite': return <Map className="w-5 h-5 text-sky-500" />;
      case 'trip_accepted': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'trip_update': return <Calendar className="w-5 h-5 text-violet-500" />;
      case 'trip_reminder': return <Bell className="w-5 h-5 text-yellow-500" />;
      
      // System
      case 'profile_update': return <UserCog className="w-5 h-5 text-slate-500" />;
      case 'system_alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'broadcast': return <Megaphone className="w-5 h-5 text-blue-600" />;
      case 'message': return <Mail className="w-5 h-5 text-blue-400" />;
      case 'ban_warning': return <Ban className="w-5 h-5 text-red-700" />;
      case 'gift': return <Gift className="w-5 h-5 text-pink-500" />;
      
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessage = (n: any) => {
    if (n.custom_message) return n.custom_message;
    
    switch (n.type) {
      // Social
      case 'follow': return `<b>${n.actor_name}</b> đã bắt đầu theo dõi bạn`;
      case 'like': return `<b>${n.actor_name}</b> đã thích bài viết của bạn`;
      case 'comment': return `<b>${n.actor_name}</b> đã bình luận vào bài viết của bạn`;
      case 'reply': return `<b>${n.actor_name}</b> đã trả lời bình luận của bạn`;
      case 'mention': return `<b>${n.actor_name}</b> đã nhắc đến bạn trong một bài viết`;
      
      // Groups
      case 'group_post': return `Có bài viết mới trong nhóm của <b>${n.actor_name}</b>`;
      case 'group_post_pending': return `Có bài viết mới đang <b>chờ duyệt</b> trong nhóm`;
      case 'group_invite': return `<b>${n.actor_name}</b> đã mời bạn gia nhập nhóm`;
      case 'group_join_request': return `<b>${n.actor_name}</b> muốn gia nhập nhóm của bạn`;
      case 'group_request_approved': return `Yêu cầu gia nhập nhóm của bạn đã được <b>duyệt</b>`;
      case 'group_request_rejected': return `Yêu cầu gia nhập nhóm của bạn đã bị <b>từ chối</b>`;
      
      // Trips
      case 'trip_invite': return `<b>${n.actor_name}</b> muốn tham gia chuyến đi của bạn`;
      case 'trip_update': return `Lịch trình chuyến đi vừa có sự <b>thay đổi</b> mới`;
      case 'trip_reminder': return `<b>Nhắc nhở:</b> Chuyến đi của bạn sắp khởi hành!`;
      
      // System
      case 'profile_update': return `<b>${n.actor_name}</b> vừa cập nhật hồ sơ cá nhân`;
      case 'system_alert': return `Bài viết của bạn vi phạm <b>tiêu chuẩn cộng đồng</b>`;
      case 'achievement': return `Chúc mừng! Bạn vừa đạt danh hiệu <b>${n.actor_name}</b>`;
      case 'broadcast': return `<b>Thông báo hệ thống:</b> ${n.actor_name}`;
      
      default: return `Bạn có thông báo mới từ <b>${n.actor_name}</b>`;
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Thông báo
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 flex gap-4 cursor-pointer transition-all duration-300 relative group
                  ${n.is_read ? 'bg-white opacity-80' : 'bg-blue-50/50 hover:bg-blue-50'}`}
              >
                {!n.is_read && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
                
                <div className="relative shrink-0">
                  <img 
                    src={n.actor_avatar || 'https://i.pravatar.cc/150?u=system'} 
                    alt={n.actor_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm text-gray-800 leading-snug notification-content"
                    dangerouslySetInnerHTML={{ __html: getMessage(n) }}
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(n.created_at)}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            !isLoading && (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
        <button 
          onClick={() => {
            navigate('/notifications');
            if (onClose) onClose();
          }}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  );
};

export default NotificationList;
