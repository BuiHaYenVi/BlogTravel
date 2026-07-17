import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Calendar, 
  MessageSquare, 
  Edit2,
  Trash2,
  TrendingUp,
  UserPlus,
  Mail,
  AlertTriangle,
  History,
  BarChart3,
  CheckCircle,
  XCircle,
  Flag,
  ShieldAlert,
  Settings,
  UserMinus,
  UserCheck,
  Search,
  ThumbsUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGroupService } from '../../../services/adminGroupService';
import { postService } from '../../../services/postService';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const AdminGroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [searchPost, setSearchPost] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const requestConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmConfig({ title, message, action });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmExecute = async () => {
    if (confirmConfig) {
      await confirmConfig.action();
      setIsConfirmModalOpen(false);
      setConfirmConfig(null);
    }
  };

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

  const fetchGroup = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response: any = await adminGroupService.getGroupById(id);
      const g = response?.data?.data || response?.data;
      if (g) {
        setGroup({
          id: g.id.toString(),
          name: g.name || 'Hội nhóm chưa đặt tên',
          category: g.category || 'Du lịch',
          description: g.description || 'Không có mô tả.',
          memberCount: parseInt(g.member_count) || 0,
          postsCount: parseInt(g.posts_count) || 0,
          isPrivate: g.is_private === true || g.is_private === 't' || g.is_private === 1,
          status: (g.is_active === true || g.is_active === 't' || g.is_active === 1) ? 'active' : 'hidden',
          createdAt: new Date(g.created_at).toLocaleDateString('vi-VN'),
          coverImage: g.cover_image 
            ? getImageUrl(g.cover_image)
            : 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1200',
          creator: { 
            name: g.owner || g.username || 'Quản trị viên', 
            avatar: g.owner_avatar ? getImageUrl(g.owner_avatar) : `https://ui-avatars.com/api/?name=${g.owner || 'A'}&background=random` 
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch group', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!id) return;
    try {
      const response: any = await adminGroupService.getGroupPosts(id);
      const data = response?.data?.data?.data || response?.data?.data || [];
      if (Array.isArray(data)) {
        setPosts(data.map((p: any) => ({
          id: p.id.toString(),
          title: p.title || p.content?.substring(0, 60) + '...',
          author: p.username || 'Người dùng',
          authorAvatar: p.avatar ? getImageUrl(p.avatar) : `https://ui-avatars.com/api/?name=${p.username}&size=40`,
          likes: parseInt(p.likes_count) || 0,
          comments: parseInt(p.comments_count) || 0,
          status: p.status || 'published',
          createdAt: new Date(p.created_at).toLocaleDateString('vi-VN'),
          image: p.images && p.images[0] ? getImageUrl(p.images[0]) : p.image ? getImageUrl(p.image) : p.cover_image ? getImageUrl(p.cover_image) : null,
        })));
      }
    } catch (error) { console.error('Failed to fetch posts', error); }
  };

  const fetchMembers = async (page = 1, search = '') => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const response: any = await adminGroupService.getGroupMembers(id, page, 20, search);
      const data = response?.data?.data?.data || response?.data?.data || [];
      const pagination = response?.data?.data?.pagination || response?.data?.pagination;
      if (Array.isArray(data)) {
        setMembers(data.map((m: any) => ({
          id: m.id.toString(),
          name: m.username,
          email: m.email || '',
          avatar: m.avatar ? getImageUrl(m.avatar) : `https://ui-avatars.com/api/?name=${m.username}&size=40`,
          role: m.role || 'member',
          joinedAt: m.joined_at ? new Date(m.joined_at).toLocaleDateString('vi-VN') : 'Chưa rõ',
        })));
        setMemberTotalPages(pagination?.total_pages || 1);
      }
    } catch (error) { console.error('Failed to fetch members', error); }
    finally { setLoadingMembers(false); }
  };

  const fetchReports = async () => {
    if (!id) return;
    setLoadingReports(true);
    try {
      const response: any = await adminGroupService.getGroupReports(id);
      const data = response?.data?.data?.data || response?.data?.data || [];
      if (Array.isArray(data)) {
        setReports(data.map((r: any) => ({
          id: r.id.toString(),
          type: r.reason || 'Vi phạm nội quy',
          content: r.description || 'Nội dung không phù hợp',
          reporter: r.reporter_name || 'Người dùng ẩn danh',
          status: r.status || 'pending',
          date: new Date(r.created_at).toLocaleDateString('vi-VN'),
        })));
      }
    } catch (error) { console.error('Failed to fetch reports', error); }
    finally { setLoadingReports(false); }
  };

  const fetchAnalytics = async () => {
    if (!id) return;
    setLoadingAnalytics(true);
    try {
      const response: any = await adminGroupService.getGroupAnalytics(id);
      const data = response?.data?.data || response?.data;
      if (data) setAnalytics(data);
    } catch (error) { console.error('Failed to fetch analytics', error); }
    finally { setLoadingAnalytics(false); }
  };

  useEffect(() => { fetchGroup(); fetchPosts(); }, [id]);

  useEffect(() => {
    if (activeTab === 'Members') fetchMembers(memberPage, searchMember);
    if (activeTab === 'Moderation') fetchReports();
    if (activeTab === 'Analytics') fetchAnalytics();
  }, [activeTab, id]);

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    requestConfirm('Trục xuất thành viên', 'Bạn có chắc muốn xóa thành viên này khỏi nhóm?', async () => {
      try {
        await adminGroupService.removeMember(id, memberId);
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } catch { alert('Xóa thất bại!'); }
    });
  };

  const handlePromoteMember = async (memberId: string, currentRole: string) => {
    if (!id) return;
    const newRole = currentRole === 'moderator' ? 'member' : 'moderator';
    requestConfirm('Thay đổi vai trò', `Xác nhận chuyển vai trò thành ${newRole.toUpperCase()}?`, async () => {
      try {
        await adminGroupService.updateMemberRole(id, memberId, newRole);
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      } catch { alert('Cập nhật thất bại!'); }
    });
  };

  const handleProcessReport = async (reportId: string, action: string) => {
    if (!id) return;
    try {
      await adminGroupService.processGroupReport(id, reportId, action);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === 'resolve' ? 'resolved' : 'rejected' } : r));
    } catch { alert('Xử lý thất bại!'); }
  };

  const handleAction = async (type: string) => {
    if (!group) return;
    try {
      if (type === 'delete') {
        requestConfirm('Xóa nhóm vĩnh viễn', 'Bạn có chắc chắn muốn xóa vĩnh viễn nhóm này?', async () => {
          await adminGroupService.deleteGroup(group.id);
          navigate('/admin/groups');
        });
      } else if (type === 'hide') {
        requestConfirm('Ẩn nhóm', 'Bạn muốn ẩn nhóm này khỏi hệ thống?', async () => {
          await adminGroupService.updateGroupStatus(group.id, 'hidden');
          fetchGroup();
        });
      } else if (type === 'show') {
        requestConfirm('Hiện nhóm', 'Kích hoạt lại nhóm này?', async () => {
          await adminGroupService.updateGroupStatus(group.id, 'active');
          fetchGroup();
        });
      }
    } catch { alert('Thao tác thất bại!'); }
  };

  const handleDeletePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm('Xóa bài viết', 'Bạn có chắc chắn muốn xóa bài viết này?', async () => {
      try {
        await postService.deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (error) {
        alert('Xóa bài viết thất bại!');
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[500px]">
       <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!group) return (
    <div className="text-center py-20">
       <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy hội nhóm yêu cầu</h2>
       <button onClick={() => navigate('/admin/groups')} className="mt-4 text-pastel-orange font-bold hover:underline">Quay lại danh sách</button>
    </div>
  );

  const pendingReportsCount = reports.filter((r: any) => r.status === 'pending').length;

  const tabs = [
    { id: 'Overview', label: 'Tổng quan', icon: <Globe size={16} /> },
    { id: 'Posts', label: 'Bài viết', icon: <MessageSquare size={16} />, badge: posts.length },
    { id: 'Members', label: 'Thành viên', icon: <Users size={16} /> },
    { id: 'Moderation', label: 'Kiểm duyệt', icon: <ShieldAlert size={16} />, badge: pendingReportsCount || 0 },
    { id: 'Analytics', label: 'Thống kê', icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/admin/groups')} className="flex items-center gap-2 text-slate-500 hover:text-pastel-orange transition-colors font-medium group">
          <div className="p-2 rounded-lg group-hover:bg-orange-50 transition-colors"><ArrowLeft size={20} /></div>
          Quay lại danh sách
        </button>
        <div className="flex gap-3">
          <button onClick={() => handleAction(group.status === 'active' ? 'hide' : 'show')} className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-bold text-sm shadow-sm border", group.status === 'active' ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100")}>
            {group.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />} 
            {group.status === 'active' ? 'Ẩn nhóm' : 'Hiện nhóm'}
          </button>
          <button onClick={() => handleAction('delete')} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all font-bold text-sm shadow-sm">
            <Trash2 size={16} /> Xóa vĩnh viễn
          </button>
        </div>
      </div>

      <div className="relative h-72 rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-slate-200/50">
        <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-pastel-orange/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">{group.category}</span>
                <span className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-xl backdrop-blur-md text-white text-[10px] font-black tracking-widest border", group.isPrivate ? "bg-amber-500/80 border-amber-400/50" : "bg-emerald-500/80 border-emerald-400/50")}>
                  {group.isPrivate ? <Lock size={12} /> : <Globe size={12} />} {group.isPrivate ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                </span>
                <span className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[10px] font-black tracking-widest border uppercase", group.status === 'active' ? "text-emerald-400 border-emerald-400/30" : "text-rose-400 border-rose-400/30")}>
                  <CheckCircle size={12} /> {group.status === 'active' ? 'Hoạt động' : 'Đang ẩn'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{group.name}</h1>
              <div className="flex items-center gap-3 text-white/70 text-sm font-medium">
                 <div className="flex items-center gap-1.5"><Calendar size={14} /> Ngày lập {group.createdAt}</div>
                 <div className="w-1 h-1 rounded-full bg-white/30"></div>
                 <div className="flex items-center gap-1.5"><Users size={14} /> {group.memberCount} Thành viên</div>
              </div>
            </div>
            <div className="flex items-center gap-6 bg-black/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-xl">
              <div className="text-center px-4 border-r border-white/10">
                <p className="text-white font-black text-2xl tabular-nums">{analytics?.total_members || group.memberCount}</p>
                <p className="text-white/50 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Sĩ số</p>
              </div>
              <div className="text-center px-4">
                <p className="text-white font-black text-2xl tabular-nums">{analytics?.total_posts || group.postsCount}</p>
                <p className="text-white/50 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Bài viết</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
         {tabs.map((tab) => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("flex items-center gap-2.5 px-6 py-3 rounded-[1.25rem] text-sm font-bold transition-all relative whitespace-nowrap", activeTab === tab.id ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}>
              {tab.icon} {tab.label}
              {tab.badge ? <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">{tab.badge}</span> : null}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
              {activeTab === 'Overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                      <div>
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-pastel-orange pl-4">Thông tin giới thiệu</h3>
                         <p className="text-slate-600 font-medium leading-loose text-lg">{group.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-50">
                         <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-pastel-orange" /> Pháp lý & Quản trị</h3>
                            <div className="bg-slate-50 rounded-[1.5rem] p-6 space-y-4">
                               <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Người sáng lập</span><span className="text-sm font-bold text-slate-900 hover:text-pastel-orange cursor-pointer">{group.creator.name}</span></div>
                               <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Mức độ riêng tư</span><span className="text-sm font-bold text-slate-900">{group.isPrivate ? 'Riêng tư' : 'Công khai'}</span></div>
                               <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Báo cáo vi phạm</span><span className="text-sm font-bold text-rose-500">{reports.length} báo cáo</span></div>
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> Hoạt động tuần này</h3>
                            <div className="bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100 flex flex-col items-center justify-center text-center">
                               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mb-4"><TrendingUp size={28} /></div>
                               <h4 className="font-black text-emerald-900 text-xl">+{analytics?.new_members_week || 0} Thành viên</h4>
                               <p className="text-emerald-700/70 text-[10px] font-black mt-1 uppercase tracking-widest">Tăng trưởng trong 7 ngày</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'Posts' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <div><h2 className="text-xl font-bold text-slate-900">Nội dung tháo luận</h2><p className="text-xs text-slate-400 font-medium">Danh sách các bài đăng trong nhóm</p></div>
                      <div className="relative"><input type="text" placeholder="Tìm tiêu đề, nội dung..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-pastel-orange/20" value={searchPost} onChange={(e) => setSearchPost(e.target.value)} /><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
                   </div>
                   <div className="divide-y divide-slate-50">
                      {posts.length > 0 ? posts.filter(p => p.title.toLowerCase().includes(searchPost.toLowerCase())).map((post) => (
                        <div key={post.id} onClick={() => navigate(`/admin/groups/posts/${post.id}`)} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group/post cursor-pointer">
                           <div className="flex gap-4 items-center">
                              {post.image && (
                                 <img src={post.image} className="w-16 h-16 rounded-xl object-cover border border-slate-100" alt="Post thumbnail" />
                              )}
                              <div className="flex gap-4">
                                 <img src={post.authorAvatar} className="w-10 h-10 rounded-full border border-slate-100" />
                                 <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover/post:text-pastel-orange transition-colors">{post.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[11px] text-slate-500 font-bold">{post.author}</span>
                                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                       <span className="text-[11px] text-slate-400">{post.createdAt}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="flex items-center gap-4 text-slate-400">
                                 <span className="flex items-center gap-1 text-[11px] font-bold"><ThumbsUp size={12} /> {post.likes}</span>
                                 <span className="flex items-center gap-1 text-[11px] font-bold"><MessageSquare size={12} /> {post.comments}</span>
                              </div>
                              <button onClick={(e) => handleDeletePost(post.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/post:opacity-100"><Trash2 size={14} /></button>
                           </div>
                        </div>
                      )) : <div className="p-20 text-center text-slate-400 font-medium italic">Không tìm thấy bài viết phù hợp</div>}
                   </div>
                </motion.div>
              )}

              {activeTab === 'Members' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <div><h2 className="text-xl font-bold text-slate-900">Danh sách thành viên</h2><p className="text-xs text-slate-400 font-medium">Quản lý vai trò và quyền hạn tham gia</p></div>
                      <div className="relative"><input type="text" placeholder="Tìm theo tên, email..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-pastel-orange/20" value={searchMember} onChange={(e) => setSearchMember(e.target.value)} /><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead><tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thành viên</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày gia nhập</th>
                            <th className="px-8 py-5 text-right font-black text-[10px] uppercase tracking-widest pr-10">Thao tác</th>
                         </tr></thead>
                         <tbody className="divide-y divide-slate-50">
                            {loadingMembers ? (
                              <tr><td colSpan={4} className="p-20 text-center"><div className="w-8 h-8 border-2 border-pastel-orange border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : members.length > 0 ? members.map(member => (
                               <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-8 py-5">
                                     <div className="flex items-center gap-4"><img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover" /><div className="text-sm font-bold text-slate-900">{member.name}</div></div>
                                  </td>
                                  <td className="px-8 py-5">
                                     <span className={clsx("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", member.role === 'owner' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : member.role === 'moderator' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-500 border-slate-100")}>{member.role}</span>
                                  </td>
                                  <td className="px-8 py-5 text-sm text-slate-500">{member.joinedAt}</td>
                                  <td className="px-8 py-5 text-right flex justify-end gap-1 pr-8">
                                     {member.role !== 'owner' && <button onClick={() => handlePromoteMember(member.id, member.role)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Thay đổi vai trò"><UserCheck size={16} /></button>}
                                     {member.role !== 'owner' && <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Trục xuất"><UserMinus size={16} /></button>}
                                  </td>
                               </tr>
                            )) : <tr><td colSpan={4} className="p-20 text-center text-slate-400">Chưa có thành viên nào tham gia</td></tr>}
                         </tbody>
                      </table>
                      {memberTotalPages > 1 && (
                        <div className="flex justify-center gap-2 p-6 border-t border-slate-50">
                           {Array.from({length: memberTotalPages}, (_,i) => i+1).map(p => (
                             <button key={p} onClick={() => setMemberPage(p)} className={clsx("w-9 h-9 rounded-xl text-sm font-bold transition-all", memberPage === p ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100")}>{p}</button>
                           ))}
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'Moderation' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   {pendingReportsCount > 0 && (
                     <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-center gap-4 text-amber-900 shadow-sm">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0"><AlertTriangle size={24} /></div>
                        <div><p className="text-sm font-bold">Cần xử lý ngay!</p><p className="text-xs opacity-75 font-medium font-vietnam">Có {pendingReportsCount} báo cáo vi phạm đang chờ bạn xem xét.</p></div>
                     </div>
                   )}
                   <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Báo cáo vi phạm ({reports.length})</h2><div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">Trạng thái: Chờ duyệt</div></div>
                      <div className="divide-y divide-slate-50">
                         {loadingReports ? (
                           <div className="p-20 text-center"><div className="w-8 h-8 border-2 border-pastel-orange border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                         ) : reports.length > 0 ? reports.map((report) => (
                           <div key={report.id} className="p-8 hover:bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                              <div className="flex gap-4">
                                 <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", report.status === 'pending' ? "bg-rose-50 text-rose-500 shadow-rose-100" : "bg-emerald-50 text-emerald-500 shadow-emerald-100 shadow-inner")}><Flag size={20} /></div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{report.type}</span><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="text-[11px] text-slate-500 font-bold">{report.date}</span></div>
                                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{report.content}</p>
                                    <p className="text-[11px] text-slate-400 italic">Bởi thành viên: <span className="text-slate-600 font-bold">@{report.reporter}</span></p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 {report.status === 'pending' ? (
                                   <><button onClick={() => handleProcessReport(report.id, 'resolve')} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Duyệt vi phạm</button>
                                     <button onClick={() => handleProcessReport(report.id, 'reject')} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all">Bỏ qua</button></>
                                 ) : <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100"><CheckCircle size={14} /> Đã giải quyết</span>}
                              </div>
                           </div>
                         )) : <div className="p-20 text-center text-slate-400 font-medium italic">Hiện chưa có báo cáo vi phạm nào</div>}
                      </div>
                   </div>
                </motion.div>
              )}

               {activeTab === 'Analytics' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   {loadingAnalytics ? (
                     <div className="p-20 text-center"><div className="w-10 h-10 border-2 border-pastel-orange border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                   ) : (
                   <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                         <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={18} className="text-pastel-orange" /> Bài viết 14 ngày qua</h3><div className="px-3 py-1 bg-slate-50 text-[10px] font-black text-slate-400 uppercase rounded-lg">Tổng: {analytics?.total_posts || 0}</div></div>
                         <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
                            {analytics?.posts_by_day?.map((d: any, i: number) => {
                               const max = Math.max(...analytics.posts_by_day.map((x:any)=>x.count), 5);
                               const height = Math.max(4, Math.round((d.count / max) * 100));
                               return (
                                 <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                    <div className="relative w-full h-full flex items-end">
                                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black px-1 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">{d.count} bài</div>
                                       <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} className="w-full bg-orange-100 group-hover/bar:bg-pastel-orange rounded-t-md transition-colors" />
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold">{d.day}</span>
                                 </div>
                               );
                            }) || <div className="w-full text-center text-slate-300 italic text-xs">Chưa có dữ liệu bài viết</div>}
                         </div>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                         <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Phân bổ nhân sự</h3>
                         <div className="space-y-4 py-4">
                            {analytics?.role_distribution?.map((r: any, i: number) => (
                               <div key={i} className="space-y-2">
                                  <div className="flex justify-between items-end"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{r.role}</span><span className="text-sm font-black text-slate-900">{r.count}</span></div>
                                  <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${(r.count / analytics.total_members) * 100}%` }} className={clsx("h-full rounded-full", r.role === 'owner' ? "bg-indigo-500" : r.role === 'moderator' ? "bg-amber-500" : "bg-blue-500")} />
                                  </div>
                               </div>
                            )) || <div className="text-center py-10 text-slate-300">Đang tải dữ liệu phân bổ...</div>}
                         </div>
                      </div>
                   </div>
                   </>
                   )}
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8 sticky top-24">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Settings size={18} className="text-slate-400" /> Tác vụ quản trị</h3>
            <div className="space-y-3">
               <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:ring-1 hover:ring-pastel-orange transition-all group shadow-sm border border-transparent">
                  <div className="flex items-center gap-3"><Mail size={18} className="text-blue-500" /><span className="text-sm font-bold text-slate-700">Gửi Mail thông báo</span></div>
               </button>
               <button onClick={() => handleAction(group.status === 'active' ? 'hide' : 'show')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:ring-1 hover:ring-pastel-orange transition-all group shadow-sm border border-transparent">
                  <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-emerald-500" /><span className="text-sm font-bold text-slate-700">{group.status === 'active' ? 'Tạm ẩn nhóm này' : 'Kích hoạt lại nhóm'}</span></div>
               </button>
               <button onClick={() => handleAction('delete')} className="w-full flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl hover:bg-rose-50 transition-all group border border-rose-100/50">
                  <div className="flex items-center gap-3"><Trash2 size={18} className="text-rose-500" /><span className="text-sm font-bold text-rose-600">Giải tán vĩnh viễn</span></div>
               </button>
            </div>
            <div className="pt-8 border-t border-slate-50 space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sức khỏe nhóm</span><span className="text-[10px] font-black text-emerald-500 uppercase">Tốt</span></div>
                  <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100"><div className="w-4/5 h-full bg-emerald-500 rounded-full" /></div>
               </div>
               <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Tải báo cáo chi tiết (.PDF)</button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isConfirmModalOpen && confirmConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsConfirmModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{confirmConfig.title}</h3>
                <p className="text-slate-500 font-medium mb-8">
                  {confirmConfig.message}
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmExecute}
                    className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <XCircle size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGroupDetailPage;
