import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Film, Eye, Trash2, X, ChevronLeft, ChevronRight,
  Clock, User, Heart, Flag, Play, Image, AlertTriangle, CheckCircle,
  EyeOff, RefreshCw, Filter
} from 'lucide-react';
import { adminStoryService } from '../../../services/adminStoryService';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');

const STATUS_TABS = [
  { key: 'All', label: 'Tất cả', icon: Film },
  { key: 'Active', label: 'Đang hoạt động', icon: CheckCircle },
  { key: 'Expired', label: 'Đã hết hạn', icon: Clock },
  { key: 'Hidden', label: 'Đang ẩn', icon: EyeOff },
  { key: 'Reported', label: 'Bị báo cáo', icon: Flag },
];

interface Story {
  id: number;
  user_id: number;
  media_url: string;
  media_type: string;
  caption: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  username: string;
  email: string;
  avatar: string;
  full_name: string;
  like_count: number;
  report_count: number;
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const isExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

const getStatusBadge = (story: Story) => {
  if (!story.is_active) return { label: 'Đã ẩn', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  if (isExpired(story.expires_at)) return { label: 'Hết hạn', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  if ((story.report_count || 0) > 0) return { label: 'Bị báo cáo', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  return { label: 'Hoạt động', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
};

export default function AdminStoryListPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [hideModal, setHideModal] = useState<{ open: boolean; story: Story | null }>({ open: false, story: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; story: Story | null }>({ open: false, story: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const limit = 12;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await adminStoryService.getStories(page, limit, debouncedSearch, activeTab);
      const data = res?.data;
      if (data?.data) {
        setStories(data.data);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch stories', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const handleHide = async () => {
    if (!hideModal.story) return;
    setActionLoading(true);
    try {
      await adminStoryService.hideStory(hideModal.story.id);
      showToast('Story đã được ẩn thành công');
      setHideModal({ open: false, story: null });
      fetchStories();
    } catch {
      showToast('Ẩn story thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.story) return;
    setActionLoading(true);
    try {
      await adminStoryService.deleteStory(deleteModal.story.id);
      showToast('Story đã được xóa thành công');
      setDeleteModal({ open: false, story: null });
      fetchStories();
    } catch {
      showToast('Xóa story thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
            <Film size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Quản lý Story</h1>
            <p className="text-slate-500 text-sm mt-0.5">Kiểm duyệt và quản lý tin ngắn của người dùng</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/80 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên người dùng, email, caption..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={14} className="text-slate-400 mr-1" />
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #f97316, #ec4899)' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchStories}
            className="p-2.5 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Total count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Tổng cộng <span className="font-bold text-slate-700">{totalItems}</span> stories
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white/50 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-2 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <Film size={36} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-1">Không có story nào</h3>
          <p className="text-slate-400 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
        >
          {stories.map(story => {
            const badge = getStatusBadge(story);
            const avatarUrl = story.avatar && !story.avatar.includes('default')
              ? (story.avatar.startsWith('http') ? story.avatar : `${API_BASE}${story.avatar}`)
              : `https://ui-avatars.com/api/?name=${story.username}&background=random&size=64`;

            return (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-white/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Media Preview */}
                <div
                  className="relative h-52 bg-slate-900 overflow-hidden"
                  onClick={() => setPreviewStory(story)}
                >
                  {story.media_type === 'video' ? (
                    <>
                      <video
                        src={getMediaUrl(story.media_url)}
                        className="w-full h-full object-cover opacity-80"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play size={20} className="text-white" fill="white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={getMediaUrl(story.media_url)}
                      alt={story.caption || 'Story'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e: any) => { e.target.src = 'https://placehold.co/300x400?text=Story'; }}
                    />
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs font-semibold border ${badge.color}`}>
                    {badge.label}
                  </div>

                  {/* Media type icon */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/30 flex items-center justify-center">
                    {story.media_type === 'video'
                      ? <Play size={10} className="text-white" fill="white" />
                      : <Image size={10} className="text-white" />
                    }
                  </div>

                  {/* Caption preview */}
                  {story.caption && (
                    <p className="absolute bottom-2 left-2 right-2 text-white text-xs line-clamp-2 font-medium">
                      {story.caption}
                    </p>
                  )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setPreviewStory(story); }}
                      className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all"
                      title="Xem"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setHideModal({ open: true, story }); }}
                      className="w-9 h-9 rounded-xl bg-amber-500/30 backdrop-blur-sm hover:bg-amber-500/50 flex items-center justify-center text-white transition-all"
                      title="Ẩn story"
                    >
                      <EyeOff size={16} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteModal({ open: true, story }); }}
                      className="w-9 h-9 rounded-xl bg-red-500/30 backdrop-blur-sm hover:bg-red-500/50 flex items-center justify-center text-white transition-all"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={avatarUrl} alt={story.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{story.full_name || story.username}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{story.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10} className="text-rose-400" />
                        {story.like_count || 0}
                      </span>
                      {(story.report_count || 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-red-400">
                          <Flag size={10} />
                          {story.report_count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]">{formatTimeAgo(story.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pageNum = page > 4 ? page - 3 + i : i + 1;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                  page === pageNum
                    ? 'text-white shadow-md'
                    : 'bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-white'
                }`}
                style={page === pageNum ? { background: 'linear-gradient(135deg, #f97316, #ec4899)' } : {}}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setPreviewStory(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full"
              style={{ maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewStory(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all"
              >
                <X size={16} />
              </button>

              {/* User info overlay */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <img
                  src={previewStory.avatar && !previewStory.avatar.includes('default')
                    ? (previewStory.avatar.startsWith('http') ? previewStory.avatar : `${API_BASE}${previewStory.avatar}`)
                    : `https://ui-avatars.com/api/?name=${previewStory.username}&background=random`}
                  alt={previewStory.username}
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <p className="text-white text-sm font-bold drop-shadow">{previewStory.full_name || previewStory.username}</p>
                  <p className="text-white/80 text-xs drop-shadow">{formatTimeAgo(previewStory.created_at)}</p>
                </div>
              </div>

              {/* Media */}
              {previewStory.media_type === 'video' ? (
                <video
                  src={getMediaUrl(previewStory.media_url)}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              ) : (
                <img
                  src={getMediaUrl(previewStory.media_url)}
                  alt={previewStory.caption || 'Story'}
                  className="w-full max-h-[60vh] object-contain bg-black"
                  onError={(e: any) => { e.target.src = 'https://placehold.co/300x500?text=Story'; }}
                />
              )}

              {/* Details */}
              <div className="p-4">
                {previewStory.caption && (
                  <p className="text-slate-700 text-sm mb-3">{previewStory.caption}</p>
                )}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart size={14} className="text-rose-400" /> {previewStory.like_count || 0} likes
                    </span>
                    {(previewStory.report_count || 0) > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <Flag size={14} /> {previewStory.report_count} báo cáo
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadge(previewStory).color}`}>
                    {getStatusBadge(previewStory).label}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Đăng: {new Date(previewStory.created_at).toLocaleString('vi-VN')}</span>
                  <span>Hết hạn: {new Date(previewStory.expires_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setPreviewStory(null); setHideModal({ open: true, story: previewStory }); }}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    <EyeOff size={14} /> Ẩn tin
                  </button>
                  <button
                    onClick={() => { setPreviewStory(null); setDeleteModal({ open: true, story: previewStory }); }}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  >
                    <Trash2 size={14} /> Xóa tin
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide Confirm Modal */}
      <AnimatePresence>
        {hideModal.open && hideModal.story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 mx-auto mb-4">
                <EyeOff size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Ẩn Story</h3>
              <p className="text-slate-500 text-center text-sm mb-6">
                Story của <strong className="text-slate-700">@{hideModal.story.username}</strong> sẽ bị ẩn khỏi tất cả người dùng. Bạn có thể hiện lại sau.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHideModal({ open: false, story: null })}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleHide}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  {actionLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <EyeOff size={14} />
                  )}
                  Xác nhận ẩn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Xóa Story</h3>
              <p className="text-slate-500 text-center text-sm mb-6">
                Story của <strong className="text-slate-700">@{deleteModal.story.username}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, story: null })}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  {actionLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
