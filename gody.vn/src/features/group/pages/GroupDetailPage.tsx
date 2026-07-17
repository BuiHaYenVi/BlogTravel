import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Globe, ChevronDown, Heart, MessageCircle, MapPin, Compass, Navigation,
  Camera, Smile, ShieldCheck, UserPlus, Clock, Search, BookOpen, Star,
  MoreHorizontal, Share2, Info, CheckCircle2, TrendingUp, Filter, LogOut, X,
  Settings, Edit2, MailOpen
} from 'lucide-react';
import { useGroupStore, CommunityGroup } from '../store/useGroupStore';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { useDestinationStore } from '../../../features/destination/store/useDestinationStore';
import BackButton from '../../../shared/components/common/BackButton';
import CommentSection from '../../../shared/components/common/CommentSection';
import LikeButton from '../../../shared/components/common/LikeButton';
import Modal from '../../../shared/components/common/Modal';
import { Mail, Send, Copy, Check } from 'lucide-react';
import ActionDropdown from '../../../shared/components/common/ActionDropdown';
import ReportModal from '../../../components/modals/ReportModal';
import DeleteConfirmContent from '../../../shared/components/common/DeleteConfirmContent';
import api from '../../../shared/services/api';
import ShareButtons from '../../blog/components/ShareButtons';
import PostCommentModal from '../../../shared/components/common/PostCommentModal';
import ImageGalleryGrid from '../../../shared/components/common/ImageGalleryGrid';
import GroupPostCreateModal from '../components/GroupPostCreateModal';
import { getImageUrl } from '../../../shared/utils/imageHelper';

type TabType = 'discussion' | 'about' | 'pending' | 'requests' | 'guides' | 'members' | 'media';

interface PendingPostCardProps {
  post: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PendingPostCard: React.FC<PendingPostCardProps> = ({ post, onApprove, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = post.content || '';
  const shouldTruncate = content.length > 250;
  const displayText = isExpanded ? content : (shouldTruncate ? content.slice(0, 250) + '...' : content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface rounded-[2rem] shadow-premium border border-theme overflow-hidden"
    >
      <div className="p-8">
        {/* Author header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.user_id}`} className="hover:opacity-80 transition-opacity">
              <img 
                src={post.avatar || `https://i.pravatar.cc/150?u=u${post.user_id}`} 
                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-theme" 
                alt="author" 
              />
            </Link>
            <div>
              <Link 
                to={`/profile/${post.user_id}`} 
                className="font-black text-base-color text-lg hover:text-pastel-orange transition-colors"
              >
                {post.full_name || post.username || 'Thành viên'}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-faint-color font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} /> {new Date(post.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
          
          <button className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-faint-color hover:bg-slate-100 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Content */}
        {post.title && <h5 className="text-xl font-black text-base-color mb-3">{post.title}</h5>}
        <p className="text-muted-color leading-relaxed font-medium mb-6 whitespace-pre-wrap text-[15px]">
          {displayText}
          {shouldTruncate && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-pastel-orange hover:text-orange-600 font-black ml-2 text-xs focus:outline-none uppercase tracking-widest"
            >
              {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
            </button>
          )}
        </p>

        {/* Image Grid */}
        {post.images && post.images.length > 0 && (
          <div className="mb-6">
            <ImageGalleryGrid images={post.images} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-theme">
          <button
            onClick={() => onApprove(post.id)}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            <CheckCircle2 size={18} /> Đăng bài viết
          </button>
          <button
            onClick={() => onReject(post.id)}
            className="flex-1 py-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:scale-98 text-muted-color font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            <X size={18} /> Từ chối
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentGroup = useGroupStore(state => state.currentGroup);
  const loadGroupDetail = useGroupStore(state => state.loadGroupDetail);
  const acceptGroupInvite = useGroupStore(state => state.acceptGroupInvite);
  const rejectGroupInvite = useGroupStore(state => state.rejectGroupInvite);
  const toggleJoin = useGroupStore(state => state.toggleJoin);
  const createPost = useGroupStore(state => state.createPost);
  const likePost = useGroupStore(state => state.likePost);
  const addComment = useGroupStore(state => state.addComment);
  const deletePost = useGroupStore(state => state.deletePost);
  const reportPost = useGroupStore(state => state.reportPost);
  const disbandGroup = useGroupStore(state => state.disbandGroup);
  const updateGroup = useGroupStore(state => state.updateGroup);
  const updateCover = useGroupStore(state => state.updateCover);
  const loadGroups = useGroupStore(state => state.loadGroups);
  const groups = useGroupStore(state => state.groups);
  const sharePost = useGroupStore(state => state.sharePost);
  const searchUsers = useGroupStore(state => state.searchUsers);
  const inviteToGroup = useGroupStore(state => state.inviteToGroup);
  const loadJoinRequests = useGroupStore(state => state.loadJoinRequests);
  const approveJoinRequest = useGroupStore(state => state.approveJoinRequest);
  const rejectJoinRequest = useGroupStore(state => state.rejectJoinRequest);
  const loading = useGroupStore(state => state.loading);
  const { user } = useAuthStore();
  const { destinations, fetchDestinations } = useDestinationStore();
  
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  
  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Report & Delete States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const [shareTargetGroup, setShareTargetGroup] = useState<string>('');
  const [shareContent, setShareContent] = useState('');
  
  // Invite & Request States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [searchUsersQuery, setSearchUsersQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>((location.state as any)?.activeTab || 'discussion');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSort, setPendingSort] = useState<'newest' | 'oldest'>('newest');
  const [memberSearch, setMemberSearch] = useState('');
  const [followedMemberIds, setFollowedMemberIds] = useState<string[]>([]);

  // Edit Group States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    is_private: false
  });

  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);

  const pendingPosts = currentGroup?.pendingPosts || [];
  const loadPendingPosts = useGroupStore(state => state.loadPendingPosts);
  const processPendingPost = useGroupStore(state => state.processPendingPost);
  const assignModerator = useGroupStore(state => state.assignModerator);
  const updateMemberRole = useGroupStore(state => state.updateMemberRole);
  const kickMember = useGroupStore(state => state.kickMember);

  const myRole = currentGroup?.members?.find(m => String(m.id) === String(user?.id))?.role || (String(currentGroup?.owner_id) === String(user?.id) ? 'owner' : 'member');
  const canManage = myRole === 'admin' || myRole === 'owner' || myRole === 'moderator';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Trưởng nhóm', className: 'bg-amber-500 text-white shadow-sm' };
      case 'admin':
        return { label: 'Quản trị viên', className: 'bg-rose-500 text-white' };
      case 'moderator':
        return { label: 'Kiểm duyệt viên', className: 'bg-blue-500 text-white' };
      default:
        return { label: 'Thành viên', className: 'bg-slate-200 text-slate-500' };
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!id) return;
    const roleInfo = getRoleBadge(newRole);
    if (window.confirm(`Bạn có chắc chắn muốn chuyển vai trò của thành viên này thành "${roleInfo.label}"?`)) {
      const success = await updateMemberRole(id, userId, newRole);
      if (success) {
        alert('Cập nhật vai trò thành công!');
        loadGroupDetail(id);
      }
    }
  };

  const handleKickMember = async (userId: string) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn trục xuất thành viên này khỏi nhóm?')) {
      const success = await kickMember(id, userId);
      if (success) {
        alert('Đã trục xuất thành viên khỏi nhóm.');
        loadGroupDetail(id);
      }
    }
  };

  const toggleFollowMember = (memberId: string) => {
    setFollowedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  useEffect(() => {
    if (id) {
      setIsFirstLoad(true);
      loadGroupDetail(id).then(() => {
        const detail = useGroupStore.getState().currentGroup;
        if (detail) {
          setEditFormData({
            name: detail.name || '',
            category: detail.category || 'General',
            description: detail.description || '',
            is_private: detail.is_private || false
          });
        }
        setIsFirstLoad(false);
      });
      loadGroups();

      // Kiểm tra tab từ state nếu có
      if ((location.state as any)?.activeTab) {
        setActiveTab((location.state as any).activeTab);
      }

      if (canManage) {
        loadPendingPosts(id);
        loadJoinRequests(id).then(reqs => setJoinRequests(reqs));
      }
    }
    fetchDestinations();
  }, [id, loadGroupDetail, loadGroups, fetchDestinations, user, loadJoinRequests, loadPendingPosts, canManage, location.state]);

  const handleProcessPost = async (postId: string, action: 'approved' | 'rejected') => {
    if (!id) return;
    const success = await processPendingPost(id, postId, action);
    if (success) {
      // success toast or message already handled in store or can add here
    }
  };

  const handleAssignModerator = async (userId: string) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn bổ nhiệm thành viên này làm Kiểm duyệt viên?')) {
      const success = await assignModerator(id, userId);
      if (success) {
        alert('Đã bổ nhiệm thành công!');
      }
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchUsersQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchUsers(q);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleInvite = async (userId: string) => {
    if (!id) return;
    try {
      // Gọi trực tiếp api từ shared service để lấy được response error
      const response = await api.post(`groups/${id}/invite`, { user_id: userId });
      if (response.data.success) {
        alert('Đã mời bạn thành công!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Lỗi khi gửi lời mời.';
      alert(message);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPostId) return;
    setIsSubmitting(true);
    const success = await deletePost(selectedPostId);
    if (success) {
      alert('Đã xóa bài viết thành công!');
      setShowDeleteModal(false);
    }
    setIsSubmitting(false);
  };

  const handleAcceptSelf = async () => {
    if (!id) return;
    const result = await acceptGroupInvite(id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleRejectSelf = async () => {
    if (!id) return;
    const result = await rejectGroupInvite(id);
    if (result.success) {
      alert(result.message);
      navigate('/group');
    } else {
      alert(result.message);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!id) return;
    const success = await approveJoinRequest(id, userId);
    if (success) {
      setJoinRequests(prev => prev.filter(r => r.id !== userId));
      loadGroupDetail(id);
    }
  };

  const handleReject = async (userId: string) => {
    if (!id) return;
    const success = await rejectJoinRequest(id, userId);
    if (success) {
      setJoinRequests(prev => prev.filter(r => r.id !== userId));
    }
  };

  const handleShare = async () => {
    if (!sharingPostId || !shareTargetGroup) {
      alert('Vui lòng chọn nhóm để chia sẻ');
      return;
    }
    const result = await sharePost(sharingPostId, shareTargetGroup, shareContent);
    if (result.success) {
      setShowShareModal(false);
      setShareContent('');
      setShareTargetGroup('');
      alert('Chia sẻ bài viết thành công!');
      if (shareTargetGroup === id) loadGroupDetail(id);
    } else {
      alert('Lỗi: ' + (result.message || 'Có lỗi xảy ra khi chia sẻ bài viết.'));
    }
  };

  const handleDisband = async () => {
    if (!id) return;
    if (window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn giải tán nhóm này? Tất cả dữ liệu bài viết và thành viên sẽ bị xóa vĩnh viễn.')) {
      const success = await disbandGroup(id);
      if (success) {
        navigate('/group');
      } else {
        alert('Có lỗi xảy ra khi giải tán nhóm.');
      }
    }
  };

  const handleEditGroupSubmit = async () => {
    if (!id) return;
    if (!editFormData.name.trim()) {
      alert('Tên nhóm không được để trống!');
      return;
    }
    setIsEditingGroup(true);
    const success = await updateGroup(id, editFormData);
    if (success) {
      setIsEditModalOpen(false);
      alert('Cập nhật thông tin nhóm thành công!');
    }
    setIsEditingGroup(false);
  };

  const handleUpdateCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) {
      setIsUpdatingCover(true);
      try {
        const result = await updateCover(id, file);
        if (result.success) {
          alert('Cập nhật ảnh bìa thành công!');
        } else {
          alert('Thất bại: ' + (result.message || 'Không thể cập nhật ảnh bìa'));
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối';
        alert('Lỗi: ' + errorMsg);
      } finally {
        setIsUpdatingCover(false);
      }
    }
  };

  if (isFirstLoad || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface-2">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-surface-2 p-6 text-center">
        <Users className="text-slate-200 mb-6" size={80} />
        <h2 className="text-2xl font-black text-base-color mb-2">Không tìm thấy nhóm</h2>
        <p className="text-muted-color mb-8 max-w-md">Nhóm bạn đang tìm kiếm không tồn tại hoặc đã bị giải tán khỏi bản đồ du lịch.</p>
        <Link to="/group" className="px-10 py-4 bg-pastel-orange text-white font-black rounded-xl shadow-lg">Khám phá các nhóm khác</Link>
      </div>
    );
  }

  const group: CommunityGroup = currentGroup;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'discussion', label: 'Thảo luận' },
    { id: 'about', label: 'Giới thiệu' },
    ...(canManage ? [{ id: 'pending' as const, label: `Duyệt bài viết (${pendingPosts.length})` }] : []),
    ...(canManage && group.is_private ? [{ id: 'requests' as const, label: `Duyệt thành viên (${joinRequests.length})` }] : []),
    { id: 'guides', label: 'Hướng dẫn' },
    { id: 'members', label: 'Thành viên' },
    { id: 'media', label: 'Ảnh/Video' },
  ];

  const filteredPendingPosts = pendingPosts
    .filter(post => 
      (post.full_name || post.username || post.author_name || '')
        .toLowerCase()
        .includes(pendingSearch.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return pendingSort === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const filteredJoinRequests = joinRequests.filter(req => 
    (req.username || req.full_name || '')
      .toLowerCase()
      .includes(memberSearch.toLowerCase())
  );

  return (
    <div className="pt-20 min-h-screen bg-app pb-20 font-sans transition-colors duration-300">
      {/* FACEBOOK STYLE HEADER */}
      <div className="bg-surface shadow-premium">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Invitation Banner */}
          {group.isInvited && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-6 rounded-t-2xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <MailOpen size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg leading-tight">
                    {group.inviter_name ? `${group.inviter_name} đã mời bạn gia nhập nhóm này` : 'Bạn có một lời mời gia nhập nhóm này'}
                  </h4>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Hãy xác nhận để bắt đầu thảo luận cùng mọi người</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleAcceptSelf}
                  className="flex-1 md:flex-none px-8 py-3 bg-surface text-orange-500 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 shadow-lg"
                >
                  Chấp nhận ngay
                </button>
                <button 
                  onClick={handleRejectSelf}
                  className="px-6 py-3 bg-surface/10 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-surface/20 transition-all border border-white/20"
                >
                  Từ chối
                </button>
              </div>
            </motion.div>
          )}

          {/* Cover Photo */}
          <div className="relative h-[250px] md:h-[400px] w-full rounded-b-2xl overflow-hidden shadow-lg group">
            <img
              src={group.cover || 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=2000'}
              alt={group.name}
              className="w-full h-full object-cover transition-transform duration-[3000ms]"
            />
            <div className="absolute inset-0 bg-black/10"></div>
            
            <div className="absolute top-6 left-6 z-10">
              <BackButton className="bg-surface/20 backdrop-blur-md text-white border-white/30 hover:bg-surface/40" />
            </div>

            {String(user?.id) === String(group.owner_id) && (
              <div className="absolute bottom-6 right-6 z-10">
                <label className="cursor-pointer px-6 py-3 bg-surface/90 backdrop-blur-md text-base-color font-black rounded-xl text-xs uppercase tracking-widest shadow-xl hover:bg-surface transition-all flex items-center gap-2">
                  <Camera size={16} /> 
                  {isUpdatingCover ? 'Đang cập nhật...' : 'Đổi ảnh bìa'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpdateCover}
                    disabled={isUpdatingCover}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Info Bar */}
          <div className="pt-8 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-slate-100 text-muted-color text-[10px] font-black px-4 py-1.5 rounded-md uppercase tracking-widest border border-theme">
                    {group.category}
                  </span>
                  <div className="flex items-center gap-2 text-muted-color">
                    {group.is_private ? <ShieldCheck size={14} className="text-pastel-orange" /> : <Globe size={14} />}
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                      {group.is_private ? 'Nhóm riêng tư' : 'Nhóm công khai'}
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-base-color mb-4 tracking-tight leading-tight">
                  {group.name}
                </h1>
                <div className="flex items-center gap-4 text-muted-color font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {group.members?.slice(0, 3).map((m, i) => (
                        <img key={i} src={m.avatar} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" alt="member" />
                      ))}
                    </div>
                    <span>{group.memberCount?.toLocaleString()} thành viên</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span>{group.posts?.length || 0} bài viết</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                {String(user?.id) === String(group.owner_id) ? (
                  <button
                    onClick={handleDisband}
                    className="flex-1 md:flex-none px-10 py-4 bg-rose-500 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200 active:scale-95 text-sm hover:bg-rose-600"
                  >
                    Giải tán nhóm
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!id) return;
                      if (group.isPending) {
                        // Cancel pending request
                        if (window.confirm('Bạn có muốn rút lại yêu cầu tham gia không?')) {
                          toggleJoin(id);
                        }
                      } else if (!group.isJoined) {
                        toggleJoin(id);
                      } else {
                        if (window.confirm('Bạn có chắc chắn muốn rời nhóm này?')) {
                          toggleJoin(id);
                        }
                      }
                    }}
                    className={`flex-1 md:flex-none px-10 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 text-sm group/btn
                      ${group.isJoined
                        ? 'bg-surface text-muted-color hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-theme'
                        : group.isPending
                        ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        : 'bg-pastel-orange text-white hover:bg-orange-600 shadow-orange-500/20'}`}
                  >
                    {group.isJoined ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="group-hover/btn:hidden" />
                        <LogOut size={20} className="hidden group-hover/btn:block" />
                        <span className="group-hover/btn:hidden">Đã tham gia</span>
                        <span className="hidden group-hover/btn:block">Rời nhóm</span>
                      </span>
                    ) : group.isPending ? (
                      <span className="flex items-center gap-2">
                        <Clock size={20} className="group-hover/btn:hidden animate-pulse" />
                        <X size={20} className="hidden group-hover/btn:block" />
                        <span className="group-hover/btn:hidden">Đang chờ xem xét</span>
                        <span className="hidden group-hover/btn:block">Rút yêu cầu</span>
                      </span>
                    ) : (
                      <><UserPlus size={20} /> {group.is_private ? 'Yêu cầu tham gia' : 'Tham gia nhóm'}</>
                    )}
                  </button>
                )}
                
                {/* Invite & Requests management */}
                <div className="flex items-center gap-3">
                  {String(user?.id) === String(group.owner_id) && (
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-surface-2 text-slate-700 font-black rounded-xl hover:bg-surface hover:shadow-xl transition-all text-sm border border-theme"
                    >
                      <Settings size={20} className="text-muted-color" />
                      Chỉnh sửa
                    </button>
                  )}
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-surface-2 text-slate-700 font-black rounded-xl hover:bg-surface hover:shadow-xl transition-all text-sm border border-theme"
                  >
                    <UserPlus size={20} className="text-pastel-orange" />
                    Mời bạn
                  </button>

                  {canManage && joinRequests.length > 0 && (
                    <button 
                      onClick={() => setIsRequestsModalOpen(true)} 
                      className="relative flex items-center justify-center gap-2 px-8 py-4 bg-orange-50 text-pastel-orange font-black rounded-xl hover:bg-orange-100 transition-all text-sm border border-orange-100"
                    >
                      <ShieldCheck size={20} />
                      Duyệt ({joinRequests.length})
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {joinRequests.length}
                      </span>
                    </button>
                  )}
                </div>
                <button className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Quick Join Requests for Managers */}
            {canManage && joinRequests.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pastel-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-base-color leading-tight">Yêu cầu tham gia mới</h4>
                    <p className="text-[11px] text-muted-color font-bold uppercase tracking-widest mt-1">Đang có {joinRequests.length} người chờ duyệt</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-full">
                  {joinRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="flex items-center gap-3 bg-surface p-2 pr-4 rounded-2xl shadow-sm border border-theme shrink-0">
                      <img src={req.avatar || `https://i.pravatar.cc/150?u=${req.id}`} className="w-10 h-10 rounded-xl object-cover" alt="req" />
                      <span className="text-xs font-black text-slate-700">{req.username}</span>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleApprove(req.id)} className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-all shadow-sm">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => handleReject(req.id)} className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center hover:bg-rose-600 transition-all shadow-sm">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {joinRequests.length > 3 && (
                    <button 
                      onClick={() => setIsRequestsModalOpen(true)}
                      className="text-[10px] font-black text-pastel-orange uppercase tracking-widest px-4 hover:underline"
                    >
                      Xem tất cả ({joinRequests.length})
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Nav Tabs */}
            <div className="flex items-center border-t border-theme">
              <div className="flex overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-6 py-5 font-black text-[13px] whitespace-nowrap transition-all relative
                      ${activeTab === tab.id ? 'text-pastel-orange' : 'text-muted-color hover:bg-surface-2'}
                    `}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-pastel-orange rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* LEFT COLUMN: Main Feed */}
        <div className="flex-1 lg:max-w-3xl space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'discussion' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Create Post Box - ONLY FOR MEMBERS */}
                {group.isJoined ? (
                  <div 
                    onClick={() => setIsCreatePostModalOpen(true)}
                    className="bg-surface rounded-[3rem] p-10 shadow-premium border border-theme hover:shadow-2xl transition-all cursor-pointer"
                  >
                    <div className="flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-[1.8rem] overflow-hidden shadow-xl border-2 border-white shrink-0">
                        <img
                          src={getImageUrl(user?.avatar)}
                          alt="Me"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-surface-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-[2rem] px-8 py-5 text-slate-400 dark:text-slate-300 font-medium text-lg select-none transition-all">
                        Bạn muốn chia sẻ điều gì với nhóm, {user?.name || 'Traveler'}?
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-8 mt-6 border-t border-theme">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all bg-surface-2 text-muted-color hover:bg-slate-100 pointer-events-none"
                        >
                          <MapPin size={20} className="text-rose-500" />
                          Check-in địa điểm
                        </button>
                        <button 
                          type="button"
                          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface-2 text-muted-color hover:bg-slate-100 font-black text-[11px] uppercase tracking-widest transition-all pointer-events-none"
                        >
                          <Camera size={20} className="text-blue-500" />
                          Ảnh / Video
                        </button>
                      </div>
                      <button 
                        type="button"
                        className="px-14 py-4.5 bg-pastel-orange text-white font-black rounded-[2rem] text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all pointer-events-none"
                      >
                        Đăng bài
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-2 rounded-[3rem] p-10 border border-theme text-center">
                    <Users className="mx-auto text-muted-color mb-4" size={40} />
                    <p className="text-muted-color font-bold">Chỉ thành viên mới có thể đăng bài trong nhóm này.</p>
                  </div>
                )}

                {/* Feed Posts */}
                {group.is_private && !group.isJoined ? (
                  <div className="bg-surface rounded-[3.5rem] p-20 text-center border border-theme shadow-sm">
                    <ShieldCheck size={64} className="mx-auto text-pastel-orange mb-6 opacity-20" />
                    <h3 className="text-2xl font-black text-base-color mb-4 tracking-tight">Đây là nhóm riêng tư</h3>
                    <p className="text-muted-color font-medium max-w-md mx-auto leading-relaxed">
                      Hãy tham gia cộng đồng để xem các bài viết, thảo luận và những chia sẻ độc quyền từ các thành viên khác.
                    </p>
                    <button 
                      onClick={() => !group.isJoined && id && toggleJoin(id)}
                      className="mt-8 px-10 py-4 bg-pastel-orange text-white rounded-xl font-black shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                    >
                      Yêu cầu tham gia ngay
                    </button>
                  </div>
                ) : group.posts && group.posts.length > 0 ? (
                  group.posts.map((post, i) => (
                    <article key={post.id} className="bg-surface rounded-[3.5rem] shadow-premium border border-theme overflow-hidden group hover:shadow-2xl transition-all duration-500">
                      {/* Post Header */}
                      <div className="p-10 flex justify-between items-center">
                        <div className="flex gap-5 items-center">
                          <Link 
                            to={`/profile/${post.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 h-16 rounded-[1.8rem] overflow-hidden shadow-lg border-2 border-theme group-hover:border-pastel-orange/20 transition-all hover:opacity-80 shrink-0"
                          >
                            <img src={post.avatar || `https://i.pravatar.cc/150?u=u${post.user_id}`} className="w-full h-full object-cover" alt="Avatar" />
                          </Link>
                          <div>
                            <Link 
                              to={`/profile/${post.user_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-black text-xl text-base-color flex items-center gap-2 hover:text-pastel-orange hover:underline transition-all"
                            >
                              {post.author_name || post.username || 'Thành viên'}
                              <CheckCircle2 size={16} className="text-blue-500" />
                            </Link>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[11px] text-faint-color font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}
                              </span>
                              {post.location_name && (
                                <>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <span className="text-[11px] text-pastel-orange font-black uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={12} /> {post.location_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const authorMember = group.members?.find(m => String(m.id) === String(post.user_id));
                          const canDeletePost = !!(user && (
                            String(user.id) === String(post.user_id) ||
                            myRole === 'owner' ||
                            myRole === 'admin' ||
                            (myRole === 'moderator' && (!authorMember || authorMember.role === 'member'))
                          ));
                          return (
                            <ActionDropdown 
                              isOwner={canDeletePost}
                              onReport={() => {
                                setSelectedPostId(post.id);
                                setShowReportModal(true);
                              }}
                              onDelete={() => {
                                setSelectedPostId(post.id);
                                setShowDeleteModal(true);
                              }}
                            />
                          );
                        })()}
                      </div>

                      {/* Post Content */}
                      <div className="px-10 pb-8">
                        <p className="text-slate-700 leading-relaxed text-xl font-medium mb-6">
                          {post.content}
                        </p>

                        {/* HIỂN THỊ BÀI GỐC NẾU LÀ BÀI SHARE */}
                        {post.is_share && post.original_post && (
                          <div className="mb-6 p-8 bg-surface-2 rounded-[2.5rem] border border-theme">
                            <div className="flex items-center gap-4 mb-4">
                              <img 
                                src={post.original_post.avatar} 
                                className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" 
                                alt="Original Author" 
                              />
                              <span className="font-bold text-slate-800">{post.original_post.username}</span>
                            </div>
                            <p className="text-muted-color mb-4 font-medium italic">
                              "{post.original_post.content}"
                            </p>
                            {post.original_post.images && post.original_post.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                                {post.original_post.images.slice(0, 2).map((img: string, idx: number) => (
                                  <img key={idx} src={img} className="w-full aspect-video object-cover" alt="Original content" />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!post.is_share && post.images && post.images.length > 0 && (
                          <div className="mb-4">
                            <ImageGalleryGrid images={post.images} />
                          </div>
                        )}
                      </div>

                      {/* Interaction Bar */}
                      <div className="px-12 py-10 bg-surface-2 flex items-center justify-between border-t border-theme">
                        <div className="flex items-center gap-10">
                          <LikeButton 
                            initialLikes={post.like_count || 0} 
                            isLiked={post.is_liked}
                            onLike={() => {
                              if (!group.isJoined) {
                                alert('Bạn cần tham gia nhóm để tương tác');
                                return;
                              }
                              if (id) likePost(id, post.id);
                            }}
                            size={26} 
                          />
                          <button
                            onClick={() => {
                              setActiveCommentPost(post);
                              setIsCommentModalOpen(true);
                            }}
                            className="flex items-center gap-3 font-black text-faint-color hover:text-pastel-orange transition-all group/btn"
                          >
                            <MessageCircle size={26} className="group-hover/btn:scale-110 transition-transform" />
                            <span className="text-sm">{post.comment_count || 0}</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            if (!group.isJoined) {
                              alert('Bạn cần tham gia nhóm để chia sẻ');
                              return;
                            }
                            setSharingPostId(post.id);
                            setShowShareModal(true);
                          }}
                          className="flex items-center gap-2.5 text-faint-color font-black hover:text-base-color transition-all uppercase text-[11px] tracking-widest"
                        >
                          <Share2 size={20} /> Chia sẻ
                        </button>
                      </div>

                      {/* REMOVED INLINE COMMENTS IN FAVOR OF MODAL */}
                    </article>
                  ))
                ) : (
                  <div className="bg-surface rounded-[3.5rem] p-20 text-center border border-dashed border-theme">
                    <p className="text-faint-color font-bold">Chưa có bài viết nào trong nhóm này.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="bg-surface rounded-[3.5rem] p-16 shadow-premium border border-theme relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pastel-orange/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  <h3 className="text-4xl font-black text-base-color mb-10 tracking-tighter">Về cộng đồng chúng tôi</h3>
                  <div className="prose prose-xl text-muted-color font-medium leading-relaxed mb-16 max-w-none">
                    <p>{group.description}</p>
                    <p>Chào mừng bạn đến với mái nhà chung của những tâm hồn tự do! Đây là nơi chúng tôi kết nối, chia sẻ những cung đường, những trải nghiệm thực tế và hỗ trợ nhau trong mọi hành trình khám phá Việt Nam và thế giới.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-10 bg-orange-50/50 rounded-[2.5rem] border border-orange-100/50">
                      <ShieldCheck className="text-pastel-orange mb-6" size={40} />
                      <h4 className="font-black text-base-color text-lg mb-3 uppercase tracking-wider">Nguyên tắc cộng đồng</h4>
                      <p className="text-muted-color font-medium leading-relaxed">Luôn tôn trọng sự khác biệt, chia sẻ thông tin chính xác và lan tỏa tinh thần du lịch văn minh.</p>
                    </div>
                    <div className="p-10 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50">
                      <Users className="text-blue-500 mb-6" size={40} />
                      <h4 className="font-black text-base-color text-lg mb-3 uppercase tracking-wider">Tương tác sôi nổi</h4>
                      <p className="text-muted-color font-medium leading-relaxed">Hơn 500 bài viết và hàng ngàn lượt thảo luận mỗi tuần từ các chuyên gia du lịch.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-[3.5rem] p-16 shadow-premium border border-theme">
                  <h3 className="text-2xl font-black text-base-color mb-12 flex items-center gap-4">
                    <div className="w-2 h-10 bg-pastel-orange rounded-full"></div>
                    Quy tắc tham gia ({group.rules?.length || 0})
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {group.rules?.map((rule, idx) => (
                      <div key={idx} className="flex gap-8 p-10 bg-surface-2 hover:bg-surface hover:shadow-2xl hover:border-transparent transition-all rounded-[2.5rem] border border-theme group">
                        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center font-black text-2xl text-pastel-orange shadow-xl group-hover:scale-110 transition-transform shrink-0">
                          {idx + 1}
                        </div>
                        <div className="pt-2">
                          <p className="text-slate-800 text-xl font-bold mb-3">Quy tắc số {idx + 1}</p>
                          <p className="text-muted-color font-medium leading-relaxed text-lg">{rule}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* Admins & Moderators Section */}
                <div className="bg-surface rounded-[3rem] p-12 shadow-premium border border-theme space-y-8">
                  <div className="flex justify-between items-center border-b border-theme pb-6">
                    <h3 className="text-xl font-black text-base-color">
                      Ban quản trị và người kiểm duyệt
                      <span className="ml-2 text-faint-color font-bold text-sm">
                        • ${group.members?.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)).length || 0}
                      </span>
                    </h3>
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-6 py-3 bg-pastel-orange text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/10 hover:bg-orange-600 transition-all"
                    >
                      Mời thành viên mới
                    </button>
                  </div>

                  <div className="flex flex-col">
                    {group.members?.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)).map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-6 border-b border-theme last:border-b-0 group">
                        <div className="flex items-center gap-5">
                          <Link to={`/profile/${m.id}`} className="hover:opacity-90 transition-opacity shrink-0">
                            <img 
                              src={m.avatar || `https://i.pravatar.cc/150?u=${m.id}`} 
                              className="w-16 h-16 rounded-full object-cover shadow-sm border border-theme" 
                              alt={m.name} 
                            />
                          </Link>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link 
                                to={`/profile/${m.id}`} 
                                className="font-black text-slate-950 text-[17px] hover:text-pastel-orange transition-colors"
                              >
                                {m.name}
                              </Link>
                              
                              {/* Verified Badge */}
                              <CheckCircle2 size={16} className="text-blue-500 fill-blue-500 text-white shrink-0" />

                              {/* Role Badge */}
                              {(() => {
                                const badge = getRoleBadge(m.role);
                                return (
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                                    m.role === 'owner' ? 'bg-amber-100 text-amber-600' :
                                    m.role === 'admin' ? 'bg-blue-50 text-blue-600 bg-blue-50' :
                                    'bg-indigo-50 text-indigo-600'
                                  }`}>
                                    {badge.label}
                                  </span>
                                );
                              })()}

                              {/* Top Contributor Badge */}
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-slate-100 text-muted-color rounded-md">
                                {m.role === 'owner' ? 'Người tạo nhóm' : 'Người đóng góp nổi bật'}
                              </span>
                            </div>
                            
                            <p className="text-xs text-faint-color font-semibold mt-1.5">
                              {m.role === 'owner' ? 'Hà Nội' : m.role === 'admin' ? 'Đà Nẵng' : 'Làm việc tại Gody'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Follow Button */}
                          {String(m.id) !== String(user?.id) && (
                            <button
                              onClick={() => toggleFollowMember(m.id)}
                              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0 border
                                ${followedMemberIds.includes(m.id)
                                  ? 'bg-surface-2 border-theme text-slate-700 hover:bg-slate-100'
                                  : 'bg-surface border-pastel-orange/20 text-pastel-orange hover:bg-pastel-orange hover:text-white'
                                }`}
                            >
                              {followedMemberIds.includes(m.id) ? (
                                <>
                                  <Check size={14} /> Đang theo dõi
                                </>
                              ) : (
                                <>
                                  <UserPlus size={14} /> Theo dõi
                                </>
                              )}
                            </button>
                          )}

                          {/* Member Menu */}
                          {canManage && (
                            <div className="relative">
                              {activeMemberMenuId === m.id && (
                                <div className="absolute right-0 top-12 z-50 w-56 bg-surface rounded-2xl shadow-2xl border border-theme py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  {myRole === 'owner' && String(m.id) !== String(user?.id) && (
                                    <>
                                      {m.role !== 'admin' && (
                                        <button
                                          onClick={() => {
                                            handleUpdateMemberRole(m.id, 'admin');
                                            setActiveMemberMenuId(null);
                                          }}
                                          className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-surface-2 transition-colors flex items-center gap-2"
                                        >
                                          Thăng cấp làm Quản trị viên
                                        </button>
                                      )}
                                      {m.role !== 'moderator' && m.role !== 'admin' && (
                                        <button
                                          onClick={() => {
                                            handleUpdateMemberRole(m.id, 'moderator');
                                            setActiveMemberMenuId(null);
                                          }}
                                          className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-surface-2 transition-colors flex items-center gap-2"
                                        >
                                          Bổ nhiệm Kiểm duyệt viên
                                        </button>
                                      )}
                                      {(m.role === 'admin' || m.role === 'moderator') && (
                                        <button
                                          onClick={() => {
                                            handleUpdateMemberRole(m.id, 'member');
                                            setActiveMemberMenuId(null);
                                          }}
                                          className="w-full px-5 py-3 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
                                        >
                                          Gỡ vai trò quản trị
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {String(m.id) !== String(user?.id) && (
                                    (myRole === 'owner') ||
                                    (myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin')
                                  ) && (
                                    <button
                                      onClick={() => {
                                        handleKickMember(m.id);
                                        setActiveMemberMenuId(null);
                                      }}
                                      className="w-full px-5 py-3 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-theme"
                                    >
                                      Mời khỏi nhóm (Trục xuất)
                                    </button>
                                  )}
                                </div>
                              )}
                              <button 
                                onClick={() => setActiveMemberMenuId(activeMemberMenuId === m.id ? null : m.id)}
                                className="w-10 h-10 flex items-center justify-center text-faint-color hover:bg-surface-2 hover:text-slate-700 rounded-xl transition-all"
                              >
                                <MoreHorizontal size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Members Section */}
                {group.members && group.members.filter(m => !['owner', 'admin', 'moderator'].includes(m.role)).length > 0 && (
                  <div className="bg-surface rounded-[3rem] p-12 shadow-premium border border-theme space-y-8">
                    <div className="border-b border-theme pb-6">
                      <h3 className="text-xl font-black text-base-color">
                        Thành viên khác
                        <span className="ml-2 text-faint-color font-bold text-sm">
                          • ${group.members?.filter(m => !['owner', 'admin', 'moderator'].includes(m.role)).length || 0}
                        </span>
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      {group.members?.filter(m => !['owner', 'admin', 'moderator'].includes(m.role)).map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-6 border-b border-theme last:border-b-0 group">
                          <div className="flex items-center gap-5">
                            <Link to={`/profile/${m.id}`} className="hover:opacity-90 transition-opacity shrink-0">
                              <img 
                                src={m.avatar || `https://i.pravatar.cc/150?u=${m.id}`} 
                                className="w-16 h-16 rounded-full object-cover shadow-sm border border-theme" 
                                alt={m.name} 
                              />
                            </Link>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link 
                                  to={`/profile/${m.id}`} 
                                  className="font-black text-slate-950 text-[17px] hover:text-pastel-orange transition-colors"
                                >
                                  {m.name}
                                </Link>
                              </div>
                              
                              <p className="text-xs text-faint-color font-semibold mt-1.5">
                                Thành viên nhóm • Hà Nội
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Follow Button */}
                            {String(m.id) !== String(user?.id) && (
                              <button
                                onClick={() => toggleFollowMember(m.id)}
                                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0 border
                                  ${followedMemberIds.includes(m.id)
                                    ? 'bg-surface-2 border-theme text-slate-700 hover:bg-slate-100'
                                    : 'bg-surface border-pastel-orange/20 text-pastel-orange hover:bg-pastel-orange hover:text-white'
                                  }`}
                              >
                                {followedMemberIds.includes(m.id) ? (
                                  <>
                                    <Check size={14} /> Đang theo dõi
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={14} /> Theo dõi
                                  </>
                                )}
                              </button>
                            )}

                            {/* Member Menu */}
                            {canManage && (
                              <div className="relative">
                                {activeMemberMenuId === m.id && (
                                  <div className="absolute right-0 top-12 z-50 w-56 bg-surface rounded-2xl shadow-2xl border border-theme py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {myRole === 'owner' && String(m.id) !== String(user?.id) && (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleUpdateMemberRole(m.id, 'admin');
                                            setActiveMemberMenuId(null);
                                          }}
                                          className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-surface-2 transition-colors flex items-center gap-2"
                                        >
                                          Thăng cấp làm Quản trị viên
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleUpdateMemberRole(m.id, 'moderator');
                                            setActiveMemberMenuId(null);
                                          }}
                                          className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-surface-2 transition-colors flex items-center gap-2"
                                        >
                                          Bổ nhiệm Kiểm duyệt viên
                                        </button>
                                      </>
                                    )}

                                    {String(m.id) !== String(user?.id) && (
                                      (myRole === 'owner') ||
                                      (myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin')
                                    ) && (
                                      <button
                                        onClick={() => {
                                          handleKickMember(m.id);
                                          setActiveMemberMenuId(null);
                                        }}
                                        className="w-full px-5 py-3 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-theme"
                                      >
                                        Mời khỏi nhóm (Trục xuất)
                                      </button>
                                    )}
                                  </div>
                                )}
                                <button 
                                  onClick={() => setActiveMemberMenuId(activeMemberMenuId === m.id ? null : m.id)}
                                  className="w-10 h-10 flex items-center justify-center text-faint-color hover:bg-surface-2 hover:text-slate-700 rounded-xl transition-all"
                                >
                                  <MoreHorizontal size={20} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            {/* Pending Posts Tab */}
            {activeTab === 'pending' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                  <div>
                    <h3 className="text-2xl font-black text-base-color flex items-center gap-3">
                      Bài viết chờ phê duyệt
                      <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-black rounded-full">
                        {pendingPosts.length}
                      </span>
                    </h3>
                    <p className="text-xs font-bold text-faint-color mt-1 uppercase tracking-wider">Xem và kiểm duyệt bài viết mới của thành viên</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-2xl text-pastel-orange self-start md:self-auto">
                    <Clock size={24} />
                  </div>
                </div>

                {/* Search & Sort Panel */}
                <div className="bg-surface rounded-3xl p-6 border border-theme shadow-sm flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint-color" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm bài đăng theo tên thành viên..."
                      className="w-full bg-surface-2 border border-theme rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-pastel-orange focus:bg-surface transition-all font-medium text-slate-700"
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <select
                      className="w-full md:w-auto bg-surface-2 border border-theme rounded-2xl px-6 py-3 font-bold text-xs text-muted-color outline-none cursor-pointer focus:border-pastel-orange transition-all"
                      value={pendingSort}
                      onChange={(e) => setPendingSort(e.target.value as 'newest' | 'oldest')}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                    </select>
                  </div>
                </div>

                {filteredPendingPosts.length === 0 ? (
                  <div className="bg-surface rounded-[3rem] p-20 text-center shadow-premium border border-theme">
                    <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} className="text-slate-300" />
                    </div>
                    <p className="text-muted-color font-bold text-lg">Không tìm thấy bài viết chờ duyệt nào.</p>
                    <p className="text-faint-color text-xs mt-1">Các bài viết đã được duyệt hoặc không trùng khớp với tìm kiếm của bạn.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    <AnimatePresence>
                      {filteredPendingPosts.map((post) => (
                        <PendingPostCard
                          key={post.id}
                          post={post}
                          onApprove={(postId) => handleProcessPost(postId, 'approved')}
                          onReject={(postId) => handleProcessPost(postId, 'rejected')}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Member Requests Tab */}
            {activeTab === 'requests' && group.is_private && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                  <div>
                    <h3 className="text-2xl font-black text-base-color flex items-center gap-3">
                      Yêu cầu tham gia nhóm
                      <span className="px-3 py-1 bg-pastel-orange/10 text-pastel-orange text-xs font-black rounded-full">
                        {joinRequests.length}
                      </span>
                    </h3>
                    <p className="text-xs font-bold text-faint-color mt-1 uppercase tracking-wider">Xem và phê duyệt người dùng muốn tham gia nhóm</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-2xl text-pastel-orange self-start md:self-auto">
                    <Users size={24} />
                  </div>
                </div>

                {/* Search Panel */}
                <div className="bg-surface rounded-3xl p-5 border border-theme shadow-sm flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint-color" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm người yêu cầu theo tên..."
                      className="w-full bg-surface-2 border border-theme rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-pastel-orange focus:bg-surface transition-all font-medium text-slate-700"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Member List-style layout */}
                {filteredJoinRequests.length === 0 ? (
                  <div className="bg-surface rounded-[3rem] p-20 text-center shadow-premium border border-theme">
                    <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users size={40} className="text-slate-300" />
                    </div>
                    <p className="text-muted-color font-bold text-lg">Không tìm thấy yêu cầu tham gia nào.</p>
                    <p className="text-faint-color text-xs mt-1">Chưa có ai yêu cầu tham gia hoặc không khớp với tên bạn tìm kiếm.</p>
                  </div>
                ) : (
                  <div className="bg-surface rounded-[3rem] p-12 shadow-premium border border-theme space-y-2">
                    <div className="border-b border-theme pb-6 mb-4">
                      <h4 className="text-lg font-black text-base-color">
                        Đang chờ duyệt
                        <span className="ml-2 text-faint-color font-bold text-sm">• {filteredJoinRequests.length}</span>
                      </h4>
                    </div>
                    <AnimatePresence>
                      {filteredJoinRequests.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center justify-between py-5 border-b border-theme last:border-b-0 group"
                        >
                          {/* Left: Avatar + Info */}
                          <div className="flex items-center gap-5">
                            <Link to={`/profile/${req.id}`} className="hover:opacity-90 transition-opacity shrink-0">
                              <img
                                src={req.avatar || `https://i.pravatar.cc/150?u=${req.id}`}
                                className="w-16 h-16 rounded-full object-cover shadow-sm border border-theme"
                                alt={req.username}
                              />
                            </Link>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  to={`/profile/${req.id}`}
                                  className="font-black text-slate-950 text-[17px] hover:text-pastel-orange transition-colors"
                                >
                                  {req.username}
                                </Link>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-md">
                                  Chờ duyệt
                                </span>
                              </div>
                              <p className="text-xs text-faint-color font-semibold mt-1.5 flex items-center gap-1">
                                <Clock size={11} />
                                Yêu cầu gửi lúc {new Date(req.created_at || req.requested_at || Date.now()).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-md text-xs uppercase tracking-widest active:scale-95 flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={15} /> Duyệt
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-6 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-muted-color font-black rounded-xl transition-all text-xs uppercase tracking-widest active:scale-95 flex items-center gap-1.5"
                            >
                              <X size={15} /> Từ chối
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-surface rounded-[3rem] shadow-premium border border-theme">
                <BookOpen size={64} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-base-color mb-4">Hướng dẫn cộng đồng</h3>
                <p className="text-muted-color font-medium">Các bài viết hướng dẫn chi tiết đang được biên soạn.</p>
              </motion.div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <div className="bg-surface rounded-[3rem] p-12 shadow-premium border border-theme">
                   <h3 className="text-2xl font-black text-base-color mb-10">Kho ảnh & Video ({group.posts?.reduce((acc, p) => acc + (p.images?.length || 0), 0)})</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {group.posts?.flatMap(p => p.images || []).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                          <img src={img} className="w-full h-full object-cover" alt="media" />
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <aside className="lg:w-80 xl:w-[400px] space-y-12 shrink-0">
          {/* Group Stats Card */}
          <div className="bg-surface rounded-[3.5rem] p-10 shadow-premium border border-theme relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-orange/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <h3 className="font-black text-2xl text-base-color mb-10 flex items-center gap-4">
              <Compass className="text-pastel-orange" size={32} /> Tổng quan
            </h3>
            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-orange-50 rounded-[1.8rem] flex items-center justify-center text-pastel-orange shadow-lg shadow-orange-500/10">
                  <Users size={28} />
                </div>
                <div>
                  <p className="font-black text-2xl text-base-color leading-none">{group.memberCount?.toLocaleString()}</p>
                  <p className="text-[11px] text-faint-color font-bold uppercase tracking-[0.2em] mt-2">Thành viên</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.8rem] flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
                  <Clock size={28} />
                </div>
                <div>
                  <p className="font-black text-2xl text-base-color leading-none">{group.posts?.length || 0}</p>
                  <p className="text-[11px] text-faint-color font-bold uppercase tracking-[0.2em] mt-2">Bài viết trong nhóm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Members Card */}
          <div className="bg-surface rounded-[3.5rem] p-10 shadow-premium border border-theme">
            <h3 className="font-black text-2xl text-base-color mb-10 flex items-center gap-4">
              <Star className="text-yellow-500" size={32} /> Thành viên mới
            </h3>
            <div className="space-y-8">
              {group.members?.slice(0, 5).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={m.avatar} className="w-14 h-14 rounded-2xl border-2 border-theme shadow-md" alt="m" />
                    </div>
                    <div>
                      <p className="font-black text-base-color group-hover:text-pastel-orange transition-colors">{m.name}</p>
                      <p className="text-[10px] text-faint-color font-bold uppercase tracking-widest mt-1">Gia nhập: {new Date(m.joinedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Focus Card */}
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-surface/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <h3 className="font-black text-2xl mb-10 flex items-center gap-4 relative z-10">
              <Navigation className="text-pastel-orange" size={32} /> Tiêu điểm du lịch
            </h3>
            <div className="space-y-10 relative z-10">
              {destinations.slice(0, 3).map((loc, idx) => (
                <div key={loc.id} className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="w-14 h-14 bg-surface/10 rounded-2xl flex items-center justify-center font-black text-xl text-pastel-orange group-hover/item:bg-pastel-orange group-hover/item:text-white transition-all shadow-inner">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg group-hover/item:text-pastel-orange transition-colors">{loc.name}</p>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mt-1">Khám phá ngay</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {/* INVITE MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời bạn bè tham gia nhóm"
      >
        <div className="p-4 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center text-pastel-orange mx-auto mb-6 shadow-inner">
              <Users size={36} />
            </div>
            <p className="text-muted-color font-medium leading-relaxed">
              Tìm kiếm và mời bạn bè tham gia <span className="font-black text-base-color">{group.name}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-faint-color group-focus-within:text-pastel-orange transition-colors" size={20} />
              <input
                type="text"
                placeholder="Nhập tên hoặc email bạn bè..."
                className="w-full bg-surface-2 border-2 border-theme focus:border-pastel-orange focus:bg-surface rounded-[1.5rem] pl-16 pr-6 py-5 outline-none font-bold text-slate-700 transition-all shadow-sm"
                value={searchUsersQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {isSearching ? (
                <div className="text-center py-10">
                  <div className="h-10 w-10 border-4 border-pastel-orange border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
                  <p className="text-faint-color font-bold uppercase tracking-widest text-[10px]">Đang tìm kiếm...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => {
                  const isCurrentUser = String(u.id) === String(user?.id);
                  const isAlreadyMember = group.members?.some(m => String(m.id) === String(u.id));
                  
                  return (
                    <div key={u.id} className="flex items-center justify-between p-5 bg-surface-2 rounded-2xl border border-theme group/item hover:bg-surface hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4">
                        <img src={u.avatar || `https://i.pravatar.cc/150?u=${u.id}`} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="Avatar" />
                        <div>
                          <p className="font-black text-base-color leading-tight">{u.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-faint-color font-bold uppercase tracking-widest">@{u.username}</p>
                            {u.email && (
                              <>
                                <span className="text-slate-300">•</span>
                                <p className="text-[11px] text-faint-color font-medium">{u.email}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isCurrentUser ? (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-lg">Bạn</span>
                      ) : isAlreadyMember ? (
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest px-3 py-1 bg-green-50 rounded-lg flex items-center gap-1">
                          <Check size={12} /> Thành viên
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleInvite(u.id)}
                          className="px-6 py-2.5 bg-surface text-pastel-orange border-2 border-pastel-orange/20 font-black rounded-xl hover:bg-pastel-orange hover:text-white transition-all text-[11px] uppercase tracking-widest shadow-sm active:scale-95"
                        >
                          Mời
                        </button>
                      )}
                    </div>
                  );
                })
              ) : searchUsersQuery.length >= 2 ? (
                <div className="text-center py-10 text-faint-color font-bold bg-surface-2 rounded-3xl border border-dashed border-theme">
                  Không tìm thấy thành viên nào
                </div>
              ) : (
                <div className="text-center py-10 opacity-30">
                  <UserPlus size={40} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-faint-color font-bold uppercase tracking-widest text-[10px]">Nhập ít nhất 2 ký tự</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* EDIT GROUP MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin nhóm"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Tên nhóm <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              placeholder="Nhập tên nhóm..."
              className="w-full bg-surface-2 border-2 border-theme focus:border-pastel-orange rounded-xl px-4 py-3 outline-none font-medium text-slate-700 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Danh mục</label>
            <select
              value={editFormData.category}
              onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
              className="w-full bg-surface-2 border-2 border-theme focus:border-pastel-orange rounded-xl px-4 py-3 outline-none font-medium text-slate-700 transition-all appearance-none"
            >
              <option value="General">Chung</option>
              <option value="Travel">Du lịch</option>
              <option value="Food">Ẩm thực</option>
              <option value="Photography">Nhiếp ảnh</option>
              <option value="Experience">Trải nghiệm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Mô tả nhóm</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              placeholder="Viết một vài dòng giới thiệu về nhóm..."
              className="w-full bg-surface-2 border-2 border-theme focus:border-pastel-orange rounded-xl px-4 py-3 outline-none font-medium text-slate-700 transition-all min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 bg-surface-2 p-4 rounded-xl border border-theme">
            <input
              type="checkbox"
              id="is_private"
              checked={editFormData.is_private}
              onChange={(e) => setEditFormData({...editFormData, is_private: e.target.checked})}
              className="w-5 h-5 accent-pastel-orange cursor-pointer"
            />
            <div>
              <label htmlFor="is_private" className="font-black text-slate-800 cursor-pointer block">Nhóm riêng tư</label>
              <p className="text-xs text-muted-color font-medium mt-0.5">Người khác phải được phê duyệt để xem bài viết và thành viên.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-theme">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-3 bg-slate-100 text-muted-color font-black rounded-xl hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleEditGroupSubmit}
              disabled={isEditingGroup}
              className="px-8 py-3 bg-pastel-orange text-white font-black rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isEditingGroup ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </Modal>

      {/* JOIN REQUESTS MODAL */}
      <Modal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        title={`Yêu cầu đang chờ (${joinRequests.length})`}
      >
        <div className="p-4">
          <p className="text-muted-color font-medium mb-8 px-4 text-sm leading-relaxed border-l-4 border-pastel-orange">
            Danh sách những người đang chờ bạn phê duyệt để tham gia cộng đồng.
          </p>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {joinRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-6 bg-surface-2 rounded-[2.5rem] border border-theme hover:bg-surface hover:shadow-2xl transition-all group">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={req.avatar || `https://i.pravatar.cc/150?u=${req.id}`} className="w-16 h-14 rounded-2xl object-cover shadow-md" alt="Req Avatar" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-black text-base-color text-lg group-hover:text-pastel-orange transition-colors">{req.username}</p>
                    <p className="text-[10px] text-faint-color font-black uppercase tracking-widest">
                      Gửi lúc: {new Date(req.requested_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(req.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReject(req.id)}
                    className="w-12 h-12 bg-surface text-slate-300 flex items-center justify-center rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-theme hover:border-rose-100"
                    title="Từ chối"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => handleApprove(req.id)}
                    className="px-8 py-3 bg-gradient-to-r from-pastel-orange to-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all text-[11px] uppercase tracking-widest flex items-center gap-2"
                  >
                    Chấp nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        title="Chia sẻ bài viết"
      >
        <div className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Chọn nhóm để chia sẻ</label>
            <select 
              value={shareTargetGroup} 
              onChange={(e) => setShareTargetGroup(e.target.value)}
              className="w-full p-5 bg-surface-2 border-2 border-theme rounded-2xl focus:border-pastel-orange outline-none font-bold text-slate-700 transition-all appearance-none"
            >
              <option value="">-- Chọn nhóm mục tiêu --</option>
              {groups && groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Cảm nghĩ của bạn (tùy chọn)</label>
            <textarea 
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì về bài viết này?..."
              className="w-full p-5 bg-surface-2 border-2 border-theme rounded-2xl focus:border-pastel-orange outline-none font-medium text-slate-700 h-32 transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleShare}
            disabled={!shareTargetGroup}
            className="w-full py-5 bg-gradient-to-r from-pastel-orange to-orange-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Share2 size={20} /> Chia sẻ ngay
          </button>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        reportableType="group"
        reportableId={selectedPostId || ''}
        title="Báo cáo bài viết"
      />
      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
      >
        <DeleteConfirmContent 
          isDeleting={isSubmitting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeletePost}
          title="Xóa bài viết"
          message="Bạn có chắc chắn muốn xóa bài viết này không? Bài viết sẽ biến mất vĩnh viễn khỏi nhóm này."
        />
      </Modal>
      {/* Post Comment Modal */}
      {activeCommentPost && (
        <PostCommentModal
          isOpen={isCommentModalOpen}
          onClose={() => {
            setIsCommentModalOpen(false);
            setActiveCommentPost(null);
          }}
          post={activeCommentPost}
          onLikeToggle={(postId) => {
            if (id) likePost(id, postId);
          }}
          onDelete={deletePost}
          isGroupMember={group?.isJoined}
        />
      )}
      <GroupPostCreateModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        groupId={id}
        destinations={destinations}
        user={user}
        currentGroup={group}
      />
    </div>
  );
};

export default GroupDetailPage;
