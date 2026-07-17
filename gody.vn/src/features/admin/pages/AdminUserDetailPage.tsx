import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  AlertOctagon,
  Globe,
  ThumbsUp,
  Clock,
  History,
  Lock,
  ChevronRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Star,
  Trophy,
  Sparkles,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { userService } from '../../../services/userService';
import { adminStoryService } from '../../../services/adminStoryService';
import { getImageUrl } from '../../../shared/utils/imageHelper';

// ─── Badge config ───────────────────────────────────────────────────────────
const BLOG_BADGES = [
  { title: 'Blogger Mới', minPosts: 1, icon: '✍️', color: 'from-sky-400 to-blue-500', desc: 'Viết ≥ 1 bài blog' },
  { title: 'Blogger Năng Nổ', minPosts: 5, icon: '🔥', color: 'from-orange-400 to-rose-500', desc: 'Viết ≥ 5 bài blog' },
  { title: 'Chuyên Gia Chia Sẻ', minPosts: 15, icon: '⭐', color: 'from-amber-400 to-yellow-500', desc: 'Viết ≥ 15 bài blog' },
  { title: 'Đại Sứ Du Lịch', minPosts: 30, icon: '🏆', color: 'from-purple-500 to-indigo-600', desc: 'Viết ≥ 30 bài blog' },
];

const GROUP_BADGES = [
  { title: 'Thành Viên Kết Nối', minPosts: 1, icon: '🤝', color: 'from-teal-400 to-cyan-500', desc: 'Đăng ≥ 1 bài trong nhóm' },
  { title: 'Người Hoạt Động Tích Cực', minPosts: 10, icon: '💪', color: 'from-emerald-400 to-green-500', desc: 'Đăng ≥ 10 bài trong nhóm' },
  { title: 'Trụ Cột Cộng Đồng', minPosts: 25, icon: '👑', color: 'from-rose-500 to-pink-600', desc: 'Đăng ≥ 25 bài trong nhóm' },
];

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('blogs');
  const [userData, setUserData] = useState<any>(null);
  const [userContent, setUserContent] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Badge management state
  const [isVerified, setIsVerified] = useState(false);
  const [badgeTitle, setBadgeTitle] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [badgeToast, setBadgeToast] = useState<{ show: boolean; msg: string; ok: boolean }>({ show: false, msg: '', ok: true });

  const showBadgeToast = (msg: string, ok = true) => {
    setBadgeToast({ show: true, msg, ok });
    setTimeout(() => setBadgeToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchUserData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userRes, contentRes, reportsRes]: any = await Promise.all([
        userService.getUserById(id),
        userService.getUserContent(id, 10),
        userService.getUserReports(id)
      ]);

        if (userRes?.data) {
          const u = userRes.data;
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const baseUrl = apiUrl.replace('/api', '');
          setUserData({
            id: u.id,
            username: u.username,
            name: u.full_name || u.username,
            email: u.email,
            avatar: u.avatar && u.avatar !== 'default-avatar.png' ? getImageUrl(u.avatar) : `https://ui-avatars.com/api/?name=${u.username}&background=random`,
          bio: u.bio || 'Chưa có tiểu sử.',
          location: u.hometown || 'Chưa cập nhật',
          role: u.role_name,
          status: u.status.charAt(0).toUpperCase() + u.status.slice(1),
          verified: true,
          createdAt: new Date(u.created_at).toLocaleDateString('vi-VN'),
          stats: {
            blogs: parseInt(u.blogs_count) || 0,
            posts: parseInt(u.posts_count) || 0,
            groups: parseInt(u.groups_count) || 0,
            followers: 0,
            following: 0,
            likes: parseInt(u.likes_given_count) || 0,
            reports: reportsRes?.data?.length || 0
          }
        });

        // Sync badge & verify state from API
        setIsVerified(u.is_verified === true || u.is_verified === 't' || u.is_verified === '1' || u.is_verified === 1);
        setBadgeTitle(u.badge_title || null);
      }

      if (contentRes?.data) {
        setUserContent(contentRes.data);
      }

      if (reportsRes?.data) {
        setUserReports(reportsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const handleBanToggle = async () => {
    if (!userData) return;
    try {
      if (userData.status === 'Active') {
        await userService.banUser(id!);
      } else {
        await userService.unbanUser(id!);
      }
      fetchUserData();
    } catch (error) {
      console.error("Action failed", error);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await userService.deleteUser(id);
      navigate('/admin/users');
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Toggle VIP blue tick
  const handleToggleVerify = async () => {
    if (!id) return;
    setVerifyLoading(true);
    try {
      await adminStoryService.verifyUser(id, !isVerified);
      setIsVerified(v => !v);
      showBadgeToast(!isVerified ? '✅ Đã cấp tích xanh VIP!' : '❌ Đã thu hồi tích xanh VIP');
    } catch {
      showBadgeToast('Thao tác thất bại', false);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Remove badge title (set to null via API — we reuse verifyUser pattern)
  const handleRemoveBadge = async () => {
    if (!id || !badgeTitle) return;
    if (!window.confirm(`Xóa danh hiệu "${badgeTitle}" của người dùng này?`)) return;
    try {
      // Call the backend helper by sending a special field via updateUser
      await userService.updateUser(id, { badge_title: '' });
      setBadgeTitle(null);
      showBadgeToast('Đã xóa danh hiệu thành công');
    } catch {
      showBadgeToast('Xóa danh hiệu thất bại', false);
    }
  };

  // Grant a specific badge manually
  const handleGrantBadge = async (title: string) => {
    if (!id) return;
    try {
      await userService.updateUser(id, { badge_title: title });
      setBadgeTitle(title);
      showBadgeToast(`🏅 Đã trao danh hiệu "${title}"`);
    } catch {
      showBadgeToast('Trao danh hiệu thất bại', false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[500px]">
       <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!userData) return (
    <div className="text-center py-20">
       <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy người dùng</h2>
       <button onClick={() => navigate('/admin/users')} className="mt-4 text-pastel-orange font-bold">Quay lại danh sách</button>
    </div>
  );

  const user = userData;
  const totalBlogPosts = user.stats.blogs;
  const totalGroupPosts = user.stats.posts;

  const currentBlogBadge = [...BLOG_BADGES].reverse().find(b => totalBlogPosts >= b.minPosts);
  const currentGroupBadge = [...GROUP_BADGES].reverse().find(b => totalGroupPosts >= b.minPosts);

  const violations = [
    { id: 1, reason: 'Ngôn từ không phù hợp', date: '12/03/2026', action: 'Cảnh báo', status: 'Closed' },
  ];

  const tabs = [
    { id: 'blogs', label: 'Bài viết', icon: <FileText size={16} /> },
    { id: 'badges', label: 'Danh hiệu', icon: <Award size={16} /> },
    { id: 'violations', label: 'Vi phạm', icon: <AlertOctagon size={16} />, count: user.stats.reports },
  ];

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {badgeToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium text-sm ${badgeToast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {badgeToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết Người dùng</h1>
            <p className="text-slate-500 text-sm font-medium">Quản lý hồ sơ và lịch sử hoạt động của thành viên.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
              onClick={handleBanToggle}
              className={clsx(
                "px-4 py-2.5 border rounded-2xl transition-all text-sm font-bold shadow-sm flex items-center gap-2",
                user.status === 'Active' ? "bg-white border-rose-200 text-rose-600 hover:bg-rose-50" : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              )}
            >
              {user.status === 'Active' ? <Lock size={16} /> : <ShieldCheck size={16} />}
              {user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
           </button>

           {/* VIP Toggle button in top bar */}
           <button
             onClick={handleToggleVerify}
             disabled={verifyLoading}
             className={clsx(
               "px-4 py-2.5 rounded-2xl transition-all text-sm font-bold shadow-sm flex items-center gap-2 border",
               isVerified
                 ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                 : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
             )}
             title={isVerified ? 'Thu hồi tích xanh VIP' : 'Cấp tích xanh VIP'}
           >
             {verifyLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
             {isVerified ? 'VIP ✓' : 'Cấp VIP'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: Profile Info */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
             {/* Header Background Accent */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-pastel-orange/30 via-orange-50 to-white"></div>
             
             <div className="relative pt-12 flex flex-col items-center text-center">
                <div className="relative">
                   <div className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white group cursor-pointer">
                     <img src={user.avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   {/* Blue tick badge on avatar */}
                   {isVerified && (
                     <div className="absolute -bottom-2 -right-2 bg-[#1877F2] text-white p-2 rounded-2xl shadow-lg border-4 border-white transition-transform hover:scale-110" title="Tài khoản VIP đã xác minh">
                        <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                     </div>
                   )}
                </div>
                
                <h2 className="mt-6 text-2xl font-bold text-slate-900 flex items-center gap-2">
                   {user.name}
                   {isVerified && <CheckCircle2 size={18} style={{ color: '#1877F2' }} />}
                </h2>

                <div className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
                  <Shield size={14} />
                  {user.role}
                </div>

                {/* Badge display */}
                {badgeTitle && (
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50">
                    <Award size={13} />
                    {badgeTitle}
                  </div>
                )}
                
                <p className="mt-4 text-sm text-slate-500 leading-relaxed font-medium">
                  "{user.bio}"
                </p>

                <div className="grid grid-cols-3 w-full gap-4 mt-8 border-t border-slate-50 pt-8">
                   <div className="text-center">
                      <div className="text-xl font-bold text-slate-900 tabular-nums">{user.stats.followers}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Fans</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xl font-bold text-slate-900 tabular-nums">{user.stats.blogs + user.stats.posts}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Posts</div>
                   </div>

                   <div className="text-center text-pastel-orange">
                      <div className="text-xl font-bold tabular-nums">{user.stats.likes.toLocaleString()}</div>
                      <div className="text-[10px] opacity-60 uppercase font-bold tracking-tight">Likes</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <Globe size={20} className="text-pastel-orange" />
                Thông tin kết nối
             </h3>
             <div className="space-y-5">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
                    <Mail size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                     <p className="text-slate-700">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
                    <MapPin size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location</p>
                     <p className="text-slate-700">{user.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
                    <Calendar size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Join Date</p>
                     <p className="text-slate-700">{user.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                   <div className={clsx(
                     "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border",
                     user.status === 'Active' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                   )}>
                    {user.status === 'Active' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                     <p className={user.status === 'Active' ? "text-emerald-600" : "text-rose-600"}>{user.status}</p>
                  </div>
                </div>
             </div>
             
             <div className="pt-6 flex gap-3">
                 <button 
                    onClick={() => navigate('/admin/users')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-200 transition-all text-sm font-bold"
                  >
                   <Edit size={16} /> Edit Profile
                 </button>
                 <button 
                    onClick={handleDelete}
                    className="w-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all"
                  >
                   <Trash2 size={20} />
                 </button>

             </div>
          </div>
        </div>

        {/* Right Col: Tabs & Content */}
        <div className="xl:col-span-2 space-y-6">
           {/* Tab Navigation */}
           <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex gap-2">
              {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={clsx(
                     "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all relative overflow-hidden",
                     activeTab === tab.id 
                       ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                       : "text-slate-500 hover:bg-slate-50"
                   )}
                 >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 bg-pastel-orange text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] tabular-nums">
                        {tab.count}
                      </span>
                    )}
                 </button>
              ))}
           </div>

           {/* Tab Content */}
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]"
              >
                 {/* ── Bài viết tab ── */}
                 {activeTab === 'blogs' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                             <FileText size={18} className="text-pastel-orange" />
                             Bài viết gần đây
                          </h4>
                          <button className="text-[11px] font-bold text-pastel-orange uppercase hover:underline">Xem tất cả</button>
                       </div>
                       <div className="space-y-4">
                          {userContent.length > 0 ? userContent.map(item => (
                             <div key={item.id} onClick={() => navigate(`/admin/blogs/${item.id}`)} className="flex gap-4 p-4 rounded-3xl border border-slate-50 hover:border-orange-100 hover:bg-orange-50/20 transition-all group cursor-pointer">
                                <div className="w-24 h-16 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                   <FileText size={24} className="text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h5 className="text-sm font-bold text-slate-900 truncate">{stripHtml(item.title) || 'Untitled Content'}</h5>
                                   <div className="flex items-center gap-4 mt-2">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                         <Clock size={12} /> {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                         <ThumbsUp size={12} /> {item.likes_count} Likes
                                      </div>
                                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{item.type}</span>
                                   </div>
                                </div>
                                <button className="p-2 text-slate-300 group-hover:text-pastel-orange group-hover:bg-white rounded-xl transition-all self-center shadow-none group-hover:shadow-sm">
                                   <ChevronRight size={18} />
                                </button>
                             </div>
                          )) : (
                            <div className="text-center py-10 text-slate-400 font-medium">Chưa có bài viết nào.</div>
                          )}
                       </div>
                    </div>
                 )}

                 {/* ── Danh hiệu tab ── */}
                 {activeTab === 'badges' && (
                    <div className="space-y-8">
                       {/* Header */}
                       <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                             <Trophy size={20} className="text-amber-500" />
                             Quản lý Danh hiệu
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">Hệ thống tự động cập nhật theo bài đăng</span>
                       </div>

                       {/* Current badge status card */}
                       <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-md border border-slate-100">
                            {badgeTitle ? (
                              [...BLOG_BADGES, ...GROUP_BADGES].find(b => b.title === badgeTitle)?.icon || '🏅'
                            ) : '⬜'}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Danh hiệu hiện tại</p>
                            {badgeTitle ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-black text-slate-900">{badgeTitle}</span>
                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50 uppercase tracking-widest">Active</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium italic">Chưa có danh hiệu</span>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {totalBlogPosts} blog · {totalGroupPosts} bài nhóm
                            </p>
                          </div>
                          {badgeTitle && (
                            <button
                              onClick={handleRemoveBadge}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 text-xs font-bold hover:bg-rose-100 transition-all"
                            >
                              <X size={13} /> Xóa danh hiệu
                            </button>
                          )}
                       </div>

                       {/* VIP Section */}
                       <div className="p-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                         <div className={clsx(
                           "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0",
                           isVerified ? "bg-[#1877F2]" : "bg-slate-200"
                         )}>
                           <CheckCircle2 size={28} />
                         </div>
                         <div className="flex-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tích Xanh VIP</p>
                           <p className="text-base font-black text-slate-900">
                             {isVerified ? 'Đã được xác minh VIP' : 'Chưa có tích xanh VIP'}
                           </p>
                           <p className="text-xs text-slate-400 mt-1">
                             {isVerified ? 'Bài viết của tài khoản này được ưu tiên hiển thị đầu danh sách' : 'Cấp tích xanh để ưu tiên hiển thị bài viết'}
                           </p>
                         </div>
                         <button
                           onClick={handleToggleVerify}
                           disabled={verifyLoading}
                           className={clsx(
                             "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
                             isVerified
                               ? "bg-white border-rose-200 text-rose-500 hover:bg-rose-50"
                               : "bg-[#1877F2] border-blue-500 text-white hover:bg-blue-600"
                           )}
                         >
                           {verifyLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                           {isVerified ? 'Thu hồi VIP' : 'Cấp tích xanh'}
                         </button>
                       </div>

                       {/* Blog Badges */}
                       <div>
                         <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                           <Star size={15} className="text-amber-500" />
                           Danh hiệu Blog
                         </h5>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {BLOG_BADGES.map(badge => {
                             const earned = totalBlogPosts >= badge.minPosts;
                             const isCurrent = badge.title === badgeTitle;
                             return (
                               <div key={badge.title} className={clsx(
                                 "p-4 rounded-2xl border transition-all relative",
                                 isCurrent ? "border-indigo-200 bg-indigo-50/50 shadow-sm" :
                                 earned ? "border-slate-100 bg-white hover:border-orange-200" :
                                 "border-slate-50 bg-slate-50/50 opacity-50"
                               )}>
                                 {isCurrent && (
                                   <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-widest">Đang dùng</span>
                                 )}
                                 <div className="flex items-center gap-3 mb-2">
                                   <div className={clsx(
                                     "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm",
                                     earned ? `bg-gradient-to-br ${badge.color} text-white` : "bg-slate-100 grayscale"
                                   )}>
                                     {badge.icon}
                                   </div>
                                   <div>
                                     <p className="text-sm font-bold text-slate-900">{badge.title}</p>
                                     <p className="text-[10px] text-slate-400">{badge.desc}</p>
                                   </div>
                                 </div>
                                 {earned && !isCurrent && (
                                   <button
                                     onClick={() => handleGrantBadge(badge.title)}
                                     className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all"
                                   >
                                     Gán danh hiệu này
                                   </button>
                                 )}
                                 {!earned && (
                                   <div className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-400 text-center">
                                     Cần {badge.minPosts} bài · Hiện có {totalBlogPosts}
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       </div>

                       {/* Group Badges */}
                       <div>
                         <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                           <Sparkles size={15} className="text-teal-500" />
                           Danh hiệu Hội nhóm
                         </h5>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {GROUP_BADGES.map(badge => {
                             const earned = totalGroupPosts >= badge.minPosts;
                             const isCurrent = badge.title === badgeTitle;
                             return (
                               <div key={badge.title} className={clsx(
                                 "p-4 rounded-2xl border transition-all relative",
                                 isCurrent ? "border-indigo-200 bg-indigo-50/50 shadow-sm" :
                                 earned ? "border-slate-100 bg-white hover:border-orange-200" :
                                 "border-slate-50 bg-slate-50/50 opacity-50"
                               )}>
                                 {isCurrent && (
                                   <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-widest">Đang dùng</span>
                                 )}
                                 <div className="flex items-center gap-3 mb-2">
                                   <div className={clsx(
                                     "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm",
                                     earned ? `bg-gradient-to-br ${badge.color} text-white` : "bg-slate-100 grayscale"
                                   )}>
                                     {badge.icon}
                                   </div>
                                   <div>
                                     <p className="text-sm font-bold text-slate-900">{badge.title}</p>
                                     <p className="text-[10px] text-slate-400">{badge.desc}</p>
                                   </div>
                                 </div>
                                 {earned && !isCurrent && (
                                   <button
                                     onClick={() => handleGrantBadge(badge.title)}
                                     className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all"
                                   >
                                     Gán danh hiệu này
                                   </button>
                                 )}
                                 {!earned && (
                                   <div className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-400 text-center">
                                     Cần {badge.minPosts} bài · Hiện có {totalGroupPosts}
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       </div>
                    </div>
                 )}

                 {/* ── Vi phạm tab ── */}
                 {activeTab === 'violations' && (
                    <div className="space-y-6">
                       {userReports.length > 0 ? (
                          <>
                             <div className="flex items-center justify-between mb-4">
                               <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                  <AlertOctagon size={18} className="text-rose-500" />
                                  Lịch sử vi phạm & Báo cáo
                               </h4>
                               <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase ring-1 ring-rose-100">Cần chú ý</span>
                             </div>
                             <div className="grid grid-cols-1 gap-4">
                                {userReports.map(v => (
                                   <div key={v.id} className="p-5 rounded-3xl border border-rose-50 bg-rose-50/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                                            <AlertOctagon size={24} />
                                         </div>
                                         <div>
                                            <p className="text-sm font-bold text-slate-900">{v.reason}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Người báo cáo: {v.reporter_name} - {new Date(v.created_at).toLocaleDateString('vi-VN')}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Trạng thái</p>
                                            <p className="text-sm font-bold text-rose-600 mt-1">{v.status.toUpperCase()}</p>
                                         </div>
                                         <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition-all">Chi tiết</button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                             <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                   Tham chiếu quy định cộng đồng: Người dùng có trên 3 lần vi phạm mức độ "Cảnh báo" sẽ tự động bị khóa tài khoản trong 7 ngày để kiểm duyệt.
                                </p>
                             </div>
                          </>
                       ) : (
                          <div className="flex flex-col items-center justify-center h-[400px] text-center">
                             <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                                <ShieldCheck size={32} />
                             </div>
                             <h5 className="text-lg font-bold text-slate-900">Người dùng uy tín</h5>
                             <p className="text-sm text-slate-500 max-w-[250px] mt-2">Chưa ghi nhận bất kỳ hành vi vi phạm nào trong hệ thống.</p>
                          </div>
                       )}
                    </div>
                 )}
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
