import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Mail,
  MapPin,
  Calendar,
  Shield,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Key,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../../../services/userService';
import { adminStoryService } from '../../../services/adminStoryService';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';


// Mock User Type
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  role: 'Admin' | 'User' | 'Moderator';
  status: 'Active' | 'Banned' | 'Pending';
  verified: boolean;
  posts: number;
  activity: number; // activity score
  createdAt: string;
}

// We map the backend data structure to this UI structure.
// In backend: id, username, email, full_name, avatar, status, created_at, role_name

const DEFAULT_ROLES = [
  { id: 1, name: 'Super Admin', slug: 'super-admin' },
  { id: 2, name: 'Admin', slug: 'admin' },
  { id: 3, name: 'Moderator', slug: 'moderator' },
  { id: 4, name: 'Verified Blogger', slug: 'verified-blogger' },
  { id: 5, name: 'User', slug: 'user' }
];

const UserListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [verifyFilter, setVerifyFilter] = useState('All');

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'delete' | 'lock' | 'unlock' | 'bulk_delete' | 'bulk_lock'; ids: string[] }>({
    isOpen: false,
    type: 'delete',
    ids: []
  });

  const [verifyModal, setVerifyModal] = useState<{ isOpen: boolean; user: any | null; action: 'grant' | 'revoke' }>({
    isOpen: false,
    user: null,
    action: 'grant'
  });

  const [verifyLoading, setVerifyLoading] = useState(false);

  const [userModal, setUserModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; user: any | null }>({
    isOpen: false,
    mode: 'add',
    user: null
  });

  const [roleConfirmModal, setRoleConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    newRoleId: number;
    newRoleName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    newRoleId: 0,
    newRoleName: ''
  });

  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res: any = await userService.getRoles();
        const data = res?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setRoles(data);
        } else {
          // Nếu API trống, dùng danh sách mặc định
          setRoles(DEFAULT_ROLES);
        }
      } catch (err) {
        console.error("Failed to fetch roles, using defaults", err);
        setRoles(DEFAULT_ROLES);
      }
    };
    fetchRoles();
  }, []);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response: any = await userService.getUsers(currentPage, itemsPerPage, searchTerm, statusFilter, roleFilter);
      console.log("User API Response:", response);
      if (response?.data?.data) {

        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace('/api', '');
        setUsers(response.data.data.map((u: any) => {
          // Logic for online status (e.g. active in last 15 minutes)
          const lastActive = u.last_login_at ? new Date(u.last_login_at) : null;
          const isOnline = lastActive ? (new Date().getTime() - lastActive.getTime()) < 15 * 60 * 1000 : false;

          return {
            id: u.id.toString(),
            name: u.full_name || u.username,
            email: u.email,
            avatar: u.avatar && u.avatar !== 'default-avatar.png' ? getImageUrl(u.avatar) : `https://ui-avatars.com/api/?name=${u.username}&background=random`,
            location: u.hometown || 'Chưa cập nhật',
            role: u.role_name,
            roleId: u.role_id,
            roleSlug: u.role_slug,
            status: u.status === 'active' ? 'Active' : u.status === 'banned' ? 'Banned' : 'Pending',
            isOnline: isOnline,
            verified: !!u.is_verified,
            posts: parseInt(u.content_count) || 0,

            activity: Math.min(100, (parseInt(u.content_count) || 0) * 10 + 20), // Mock activity score based on posts
            createdAt: new Date(u.created_at).toLocaleDateString('vi-VN')
          };
        }));
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error("Failed to fetch users", error);
      alert("Lỗi tải người dùng: " + (error.response?.data?.message || error.message));
    } finally {

      setLoading(false);
    }
  };




  // Handle search debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, statusFilter, roleFilter, sortField, sortOrder]); // refetch when these change

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const openConfirm = (type: any, ids: string[]) => {
    let targetIds = [...ids];
    if (currentUser) {
      const currentUserIdStr = currentUser.id.toString();
      if (targetIds.includes(currentUserIdStr)) {
        if (type === 'lock' || type === 'delete') {
          alert(type === 'lock' ? "Bạn không thể tự khóa tài khoản của chính mình!" : "Bạn không thể tự xóa tài khoản của chính mình!");
          return;
        } else if (type === 'bulk_lock' || type === 'bulk_delete') {
          targetIds = targetIds.filter(id => id !== currentUserIdStr);
          if (targetIds.length === 0) {
            alert(type === 'bulk_lock' ? "Bạn không thể tự khóa tài khoản của chính mình!" : "Bạn không thể tự xóa tài khoản của chính mình!");
            return;
          } else {
            alert(type === 'bulk_lock' 
              ? "Hệ thống sẽ khóa tất cả tài khoản đã chọn ngoại trừ tài khoản của chính bạn." 
              : "Hệ thống sẽ xóa tất cả tài khoản đã chọn ngoại trừ tài khoản của chính bạn."
            );
          }
        }
      }
    }
    setConfirmModal({ isOpen: true, type, ids: targetIds });
  };

  const handleVerifyClick = (user: any) => {
    setVerifyModal({
      isOpen: true,
      user,
      action: user.verified ? 'revoke' : 'grant'
    });
  };

  const confirmVerify = async () => {
    if (!verifyModal.user) return;
    setVerifyLoading(true);
    try {
      await adminStoryService.verifyUser(verifyModal.user.id, verifyModal.action === 'grant');
      fetchUsers();
      setVerifyModal({ isOpen: false, user: null, action: 'grant' });
    } catch (error) {
      console.error("Verification failed", error);
      alert(verifyModal.action === 'grant' ? "Cấp tích xanh thất bại!" : "Gỡ tích xanh thất bại!");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleActionConfirm = async () => {
    const { type, ids } = confirmModal;
    try {
      if (type === 'lock' || type === 'bulk_lock') {
        await Promise.all(ids.map(id => userService.banUser(id)));
      } else if (type === 'unlock') {
        await Promise.all(ids.map(id => userService.unbanUser(id)));
      } else if (type === 'delete' || type === 'bulk_delete') {
        await Promise.all(ids.map(id => userService.deleteUser(id)));
      }
      fetchUsers(); // Refresh
      setConfirmModal({ ...confirmModal, isOpen: false });
      setSelectedUsers([]);
    } catch (error) {
      console.error("Action failed", error);
    }
  };

  const handleRoleChangeRequest = (user: any, roleId: number) => {
    // Tìm thông tin vai trò mới từ danh sách roles
    const roleObj = roles.find(r => parseInt(r.id) === roleId);
    if (!roleObj) return;

    setRoleConfirmModal({
      isOpen: true,
      userId: user.id,
      userName: user.name,
      newRoleId: roleId,
      newRoleName: roleObj.name
    });
  };

  const confirmRoleChange = async () => {
    try {
      await userService.updateUser(roleConfirmModal.userId, { role_id: roleConfirmModal.newRoleId });
      setRoleConfirmModal({ ...roleConfirmModal, isOpen: false });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role", error);
      alert("Không thể cập nhật vai trò!");
    }
  };

  const openUserModal = (mode: 'add' | 'edit', user: any = null) => {
    setUserModal({ isOpen: true, mode, user });
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setLoading(true);
    try {
      if (userModal.mode === 'add') {
        await userService.createUser(data);
        alert("Thêm người dùng thành công!");
      } else {
        await userService.updateUser(userModal.user.id, data);
        alert("Cập nhật thành công!");
      }
      fetchUsers();
      setUserModal({ isOpen: false, mode: 'add', user: null });
    } catch (error: any) {
      console.error("Submit failed", error);
      alert("Lỗi: " + (error.response?.data?.message || "Không thể thực hiện thao tác"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return alert("Không có dữ liệu để xuất!");

    const headers = ["ID", "Username", "Họ tên", "Email", "Vai trò", "Trạng thái", "Ngày tham gia"];
    const rows = users.map(u => [
      u.id,
      u.username,
      u.name,
      u.email,
      u.role,
      u.status,
      u.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_sach_nguoi_dung_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý vai trò, trạng thái và hoạt động của người dùng.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-all font-medium text-sm"
          >
            Xuất báo cáo
          </button>
          <button
            onClick={() => openUserModal('add')}

            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-slate-900/20 font-medium text-sm"
          >
            <UserPlus size={18} />
            Thêm người dùng
          </button>
        </div>

      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700"
          >
            <div className="flex items-center gap-2 border-r border-slate-700 pr-6">
              <span className="bg-pastel-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedUsers.length}</span>
              <span className="text-sm font-medium">Đã chọn</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => openConfirm('bulk_lock', selectedUsers)} className="flex items-center gap-2 hover:text-amber-400 transition-colors text-sm font-bold">
                <Lock size={16} /> Khóa hàng loạt
              </button>
              <button className="flex items-center gap-2 hover:text-blue-400 transition-colors text-sm font-bold">
                <Shield size={16} /> Đổi vai trò
              </button>
              <button onClick={() => openConfirm('bulk_delete', selectedUsers)} className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm font-bold">
                <Trash2 size={16} /> Xóa
              </button>
            </div>
            <button onClick={() => setSelectedUsers([])} className="ml-4 text-xs text-slate-400 hover:text-white underline font-medium">Hủy</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm min-w-[150px] cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">🔍 Tất cả vai trò</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            <select
              className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm appearance-none min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Trạng thái: Tất cả</option>
              <option value="Active">Hoạt động</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Banned">Bị khóa</option>
            </select>
            <select
              className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm appearance-none min-w-[140px]"
              value={verifyFilter}
              onChange={(e) => setVerifyFilter(e.target.value)}
            >
              <option value="All">Xác thực: Tất cả</option>
              <option value="Verified">Đã xác thực</option>
              <option value="Unverified">Chưa xác thực</option>
            </select>
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('All'); setStatusFilter('All'); setVerifyFilter('All'); }}
              className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors"
              title="Xóa bộ lọc"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-pastel-orange transition-colors">
                    {selectedUsers.length === users.length && users.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Người dùng
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('posts')}
                >
                  <div className="flex items-center gap-1">
                    Bài viết

                    {sortField === 'posts' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1 text-right justify-end">
                    Ngày tham gia
                    {sortField === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className={clsx(
                      "hover:bg-slate-50/80 transition-all group cursor-pointer border-b border-slate-50 last:border-0",
                      selectedUsers.includes(user.id) && "bg-orange-50/30"
                    )}
                  >
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelectUser(user.id); }}>
                      <button className={clsx(
                        "transition-colors",
                        selectedUsers.includes(user.id) ? "text-pastel-orange" : "text-slate-300 hover:text-slate-400"
                      )}>
                        {selectedUsers.includes(user.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                          {user.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
                          )}
                          {user.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle2 size={12} className="text-blue-500 fill-blue-500 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {!user.verified && <span className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Chưa xác minh"></span>}
                          </p>
                          <p className="text-[11px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        onClick={(e) => e.stopPropagation()}
                        value={user.roleId}
                        onChange={(e) => handleRoleChangeRequest(user, parseInt(e.target.value))}
                        className={clsx(
                          "text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border-none outline-none focus:ring-2 focus:ring-pastel-orange/20 cursor-pointer transition-all min-w-[130px]",
                          user.roleSlug === 'super-admin' ? "bg-slate-900 text-white" :
                            user.roleSlug === 'admin' ? "bg-orange-50 text-orange-600" :
                              user.roleSlug === 'moderator' ? "bg-blue-50 text-blue-600" :
                                user.roleSlug === 'verified-blogger' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.id} className="bg-white text-slate-900">
                            {role.name}
                          </option>
                        ))}
                        {/* Failsafe: Nếu ID hiện tại chưa có trong danh sách roles nạp về, tự tạo 1 option dự phòng */}
                        {!roles.find(r => parseInt(r.id) === parseInt(user.roleId)) && (
                          <option value={user.roleId}>{user.role}</option>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'Banned' ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit border border-rose-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Đã khóa
                        </div>
                      ) : user.isOnline ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit border border-emerald-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Trực tuyến
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Ngoại tuyến
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                          <Edit2 size={10} className="text-slate-400" />
                          {user.posts} bài viết
                        </div>
                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pastel-orange rounded-full"
                            style={{ width: `${Math.min(user.activity, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-[11px] text-slate-500 font-medium inline-block">
                        {user.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVerifyClick(user); }}
                          className={clsx(
                            "p-2 rounded-lg transition-all",
                            user.verified ? "text-blue-500 bg-blue-50 hover:bg-blue-100 shadow-sm" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                          )}
                          title={user.verified ? 'Gỡ xác minh VIP' : 'Cấp tích xanh VIP'}
                        >
                          <UserCheck size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openConfirm(user.status === 'Banned' ? 'unlock' : 'lock', [user.id]); }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title={user.status === 'Banned' ? 'Mở khóa' : 'Khóa tài khoản'}
                        >
                          {user.status === 'Banned' ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openUserModal('edit', user); }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openConfirm('delete', [user.id]); }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Search size={32} />
                      </div>
                      <p className="font-bold text-slate-800">Không tìm thấy người dùng phù hợp</p>
                      <p className="text-xs text-slate-500 max-w-[200px]">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Hiển thị <strong>{users.length}</strong> kết quả trên trang này (Tổng <strong>{totalItems}</strong>)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1 px-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={clsx(
                    "w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm",
                    currentPage === page
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* User Add/Edit Modal */}
      <AnimatePresence>
        {userModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserModal({ ...userModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {userModal.mode === 'add' ? 'Thêm người dùng mới' : 'Cập nhật người dùng'}
                </h3>
                <button onClick={() => setUserModal({ ...userModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
                    <input
                      name="username"
                      defaultValue={userModal.user?.username || ''}
                      required
                      readOnly={userModal.mode === 'edit'}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm"
                      placeholder="Ví dụ: gody_user"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Họ tên</label>
                    <input
                      name="full_name"
                      defaultValue={userModal.user?.name || ''}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={userModal.user?.email || ''}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm"
                    placeholder="user@example.com"
                  />
                </div>

                {userModal.mode === 'add' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mật khẩu</label>
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vai trò</label>
                    <select
                      name="role_id"
                      defaultValue={roles.find(r => r.name === userModal.user?.role)?.id || 5}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm appearance-none"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Trạng thái</label>
                    <select
                      name="status"
                      defaultValue={userModal.user?.status?.toLowerCase() || 'active'}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="banned">Bị khóa</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUserModal({ ...userModal, isOpen: false })}
                    className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                  >
                    {userModal.mode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100"
            >
              <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto",
                confirmModal.type === 'unlock' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
              )}>
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận hành động</h3>
              <p className="text-sm text-slate-500 text-center mb-8">
                {confirmModal.type.includes('delete') ? (
                  <>Bạn có chắc chắn muốn <strong>XÓA</strong> <strong>{confirmModal.ids.length}</strong> người dùng đã chọn? Hành động này không thể hoàn tác.</>
                ) : confirmModal.type === 'unlock' ? (
                  <>Bạn có chắc chắn muốn <strong>MỞ KHÓA</strong> tài khoản của <strong>{confirmModal.ids.length}</strong> người dùng đã chọn?</>
                ) : (
                  <>Bạn có chắc chắn muốn <strong>KHÓA</strong> tài khoản của <strong>{confirmModal.ids.length}</strong> người dùng đã chọn? Bạn có thể mở khóa lại sau.</>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleActionConfirm}
                  className={clsx(
                    "flex-1 py-3 px-4 text-white rounded-2xl font-bold transition-colors shadow-lg",
                    confirmModal.type === 'unlock' 
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" 
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                  )}
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Change Confirmation Modal */}
      <AnimatePresence>
        {roleConfirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRoleConfirmModal({ ...roleConfirmModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận thay đổi vai trò</h3>
              <p className="text-sm text-slate-500 text-center mb-8 px-4">
                Bạn có chắc chắn muốn thay đổi vai trò của <strong>{roleConfirmModal.userName}</strong> thành <span className="text-blue-600 font-bold">{roleConfirmModal.newRoleName}</span> không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRoleConfirmModal({ ...roleConfirmModal, isOpen: false })}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmRoleChange}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* VIP Verification Confirmation Modal */}
      <AnimatePresence>
        {verifyModal.isOpen && verifyModal.user && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVerifyModal({ ...verifyModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100"
            >
              <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg",
                verifyModal.action === 'grant' ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-500"
              )}>
                <UserCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                {verifyModal.action === 'grant' ? 'Cấp tích xanh VIP' : 'Thu hồi tích xanh VIP'}
              </h3>
              <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">
                {verifyModal.action === 'grant' ? (
                  <>Bạn có chắc chắn muốn cấp <strong>tích xanh VIP</strong> cho người dùng <strong>{verifyModal.user.name}</strong>? Họ sẽ nhận được đặc quyền xác thực trên toàn hệ thống.</>
                ) : (
                  <>Bạn có chắc chắn muốn thu hồi <strong>tích xanh VIP</strong> của <strong>{verifyModal.user.name}</strong>? Các quyền lợi xác thực sẽ bị gỡ bỏ ngay lập tức.</>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setVerifyModal({ ...verifyModal, isOpen: false })}
                  disabled={verifyLoading}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmVerify}
                  disabled={verifyLoading}
                  className={clsx(
                    "flex-1 py-3 px-4 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]",
                    verifyModal.action === 'grant' ? "bg-blue-500 shadow-blue-500/20 hover:bg-blue-600" : "bg-slate-700 shadow-slate-700/20 hover:bg-slate-800"
                  )}
                >
                  {verifyLoading && <RefreshCw size={16} className="animate-spin" />}
                  {verifyModal.action === 'grant' ? 'Xác nhận cấp' : 'Xác nhận thu hồi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>


  );
};

export default UserListPage;

