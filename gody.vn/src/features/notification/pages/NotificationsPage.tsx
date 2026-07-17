import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { notificationApi } from '../services/notificationApi';
import {
  UserCheck, MessageSquare, Users, UserCog, Clock, Heart, AtSign,
  UserPlus, ShieldCheck, CheckCircle2, XCircle, Map, Calendar,
  Bell, AlertTriangle, Trophy, MessageCircle, Mail, Ban, Gift, Megaphone,
  Trash2, CheckCheck, ChevronLeft, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '../../../shared/utils/dateHelper';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { markAsRead, markAllRead, deleteNotification, unreadCount, fetchNotifications } = useNotificationStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getAllNotifications(pageNum, 20);
      const data = response.data.data || {};
      const items = (data.notifications || []).map((n: any) => ({
        ...n,
        is_read: n.is_read === true || n.is_read === 't' || n.is_read === 1
      }));
      setNotifications(items);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(page);
  }, [page, loadNotifications]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const handleClick = async (n: any) => {
    if (!n.is_read) {
      await markAsRead(n.id);
      setNotifications((prev) => prev.map((item) =>
        item.id === n.id ? { ...item, is_read: true } : item
      ));
    }

    switch (n.type) {
      case 'follow':
      case 'profile_update':
        navigate(`/profile/${n.actor_id}`);
        break;
      case 'like':
      case 'comment':
      case 'reply':
      case 'mention':
        if (n.target_id) navigate(`/blog/${n.target_id}`);
        break;
      case 'group_invite':
      case 'group_join_request':
      case 'group_request_approved':
      case 'group_request_rejected':
      case 'group_post':
        if (n.target_id) navigate(`/group/${n.target_id}`);
        break;
      case 'trip_request':
      case 'trip_invite':
      case 'trip_accepted':
      case 'trip_update':
      case 'trip_reminder':
        if (n.target_id) navigate(`/companion/trip/${n.target_id}`);
        break;
      default:
        break;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // Refresh the main store as well
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      follow: <UserCheck className="w-5 h-5 text-blue-500" />,
      like: <Heart className="w-5 h-5 text-rose-500" />,
      comment: <MessageCircle className="w-5 h-5 text-teal-500" />,
      reply: <MessageSquare className="w-5 h-5 text-green-500" />,
      mention: <AtSign className="w-5 h-5 text-indigo-500" />,
      group_post: <Users className="w-5 h-5 text-purple-500" />,
      group_invite: <UserPlus className="w-5 h-5 text-orange-500" />,
      group_join_request: <ShieldCheck className="w-5 h-5 text-amber-500" />,
      group_request_approved: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      group_request_rejected: <XCircle className="w-5 h-5 text-rose-400" />,
      trip_request: <Map className="w-5 h-5 text-sky-500" />,
      trip_invite: <Map className="w-5 h-5 text-sky-500" />,
      trip_accepted: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      trip_update: <Calendar className="w-5 h-5 text-violet-500" />,
      trip_reminder: <Bell className="w-5 h-5 text-yellow-500" />,
      profile_update: <UserCog className="w-5 h-5 text-slate-500" />,
      system_alert: <AlertTriangle className="w-5 h-5 text-red-500" />,
      achievement: <Trophy className="w-5 h-5 text-yellow-600" />,
      broadcast: <Megaphone className="w-5 h-5 text-blue-600" />,
      message: <Mail className="w-5 h-5 text-blue-400" />,
      ban_warning: <Ban className="w-5 h-5 text-red-700" />,
      gift: <Gift className="w-5 h-5 text-pink-500" />,
    };
    return iconMap[type] || <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getMessage = (n: any): string => {
    if (n.custom_message) return n.custom_message;
    const msgs: Record<string, string> = {
      follow: `<b>${n.actor_name}</b> đã bắt đầu theo dõi bạn`,
      like: `<b>${n.actor_name}</b> đã thích bài viết của bạn`,
      comment: `<b>${n.actor_name}</b> đã bình luận vào bài viết của bạn`,
      reply: `<b>${n.actor_name}</b> đã trả lời bình luận của bạn`,
      mention: `<b>${n.actor_name}</b> đã nhắc đến bạn trong một bài viết`,
      group_post: `Có bài viết mới trong nhóm của <b>${n.actor_name}</b>`,
      group_invite: `<b>${n.actor_name}</b> đã mời bạn gia nhập nhóm`,
      group_join_request: `<b>${n.actor_name}</b> muốn gia nhập nhóm của bạn`,
      group_request_approved: `Yêu cầu gia nhập nhóm của bạn đã được <b>duyệt</b>`,
      group_request_rejected: `Yêu cầu gia nhập nhóm của bạn đã bị <b>từ chối</b>`,
      trip_invite: `<b>${n.actor_name}</b> muốn tham gia chuyến đi của bạn`,
      trip_update: `Lịch trình chuyến đi vừa có sự <b>thay đổi</b> mới`,
      trip_reminder: `<b>Nhắc nhở:</b> Chuyến đi của bạn sắp khởi hành!`,
      profile_update: `<b>${n.actor_name}</b> vừa cập nhật hồ sơ cá nhân`,
      system_alert: `Bài viết của bạn vi phạm <b>tiêu chuẩn cộng đồng</b>`,
      achievement: `Chúc mừng! Bạn vừa đạt danh hiệu <b>${n.actor_name}</b>`,
      broadcast: `<b>Thông báo hệ thống:</b> ${n.actor_name}`,
    };
    return msgs[n.type] || `Bạn có thông báo mới từ <b>${n.actor_name}</b>`;
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      follow: 'Theo dõi',
      like: 'Yêu thích',
      comment: 'Bình luận',
      reply: 'Trả lời',
      mention: 'Nhắc tên',
      group_post: 'Nhóm',
      group_invite: 'Mời nhóm',
      group_join_request: 'Yêu cầu',
      group_request_approved: 'Duyệt',
      group_request_rejected: 'Từ chối',
      trip_request: 'Yêu cầu',
      trip_accepted: 'Duyệt',
      trip_invite: 'Chuyến đi',
      trip_update: 'Cập nhật',
      trip_reminder: 'Nhắc nhở',
      system_alert: 'Hệ thống',
      achievement: 'Thành tựu',
      broadcast: 'Thông báo',
    };
    return labels[type] || 'Khác';
  };

  const getTypeBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      follow: 'bg-blue-100 text-blue-700',
      like: 'bg-rose-100 text-rose-700',
      comment: 'bg-teal-100 text-teal-700',
      reply: 'bg-green-100 text-green-700',
      mention: 'bg-indigo-100 text-indigo-700',
      group_post: 'bg-purple-100 text-purple-700',
      group_invite: 'bg-orange-100 text-orange-700',
      group_join_request: 'bg-amber-100 text-amber-700',
      group_request_approved: 'bg-emerald-100 text-emerald-700',
      group_request_rejected: 'bg-rose-100 text-rose-600',
      trip_request: 'bg-amber-100 text-amber-700',
      trip_accepted: 'bg-emerald-100 text-emerald-700',
      trip_invite: 'bg-sky-100 text-sky-700',
      trip_update: 'bg-violet-100 text-violet-700',
      trip_reminder: 'bg-yellow-100 text-yellow-700',
      system_alert: 'bg-red-100 text-red-700',
      achievement: 'bg-yellow-100 text-yellow-800',
      broadcast: 'bg-blue-100 text-blue-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 font-semibold text-sm hover:bg-orange-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            filter === 'unread'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Chưa đọc
          {unreadCount > 0 && (
            <span className="ml-1.5 bg-white/30 px-1.5 py-0.5 rounded-full text-xs">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
          <p className="text-gray-400 font-medium">Đang tải thông báo...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Bell className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold text-lg">
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Bạn chưa có thông báo nào'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Khi có hoạt động mới, thông báo sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n, idx) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleClick(n)}
                className={`relative flex items-start gap-4 p-5 cursor-pointer transition-all duration-200 group
                  ${!n.is_read ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'bg-white hover:bg-gray-50'}
                  ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                {/* Unread indicator */}
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-300 rounded-r-full" />
                )}

                {/* Avatar + Icon */}
                <div className="relative shrink-0">
                  <img
                    src={n.actor_avatar || 'https://i.pravatar.cc/150?u=system'}
                    alt={n.actor_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-md">
                    {getIcon(n.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-relaxed ${!n.is_read ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
                      dangerouslySetInnerHTML={{ __html: getMessage(n) }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getTypeBadgeColor(n.type)}`}>
                      {getTypeLabel(n.type)}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0"
                  title="Xóa thông báo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2.5 rounded-full font-bold text-sm transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Trang trước
          </button>
          <span className="text-sm font-semibold text-gray-500">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-5 py-2.5 rounded-full font-bold text-sm transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
