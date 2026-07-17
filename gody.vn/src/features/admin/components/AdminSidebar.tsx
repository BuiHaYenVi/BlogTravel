import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UsersRound, 
  Map, 
  MapPin,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  ShieldAlert,
  History,
  Tag,
  Compass,
  Home,
  Film
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarItem = ({ to, icon, label, collapsed }: SidebarItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        twMerge(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group mb-1",
          isActive 
            ? "bg-pastel-orange text-white shadow-md shadow-pastel-orange/20" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300">
          {label}
        </span>
      )}
    </NavLink>
  );
};

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { to: "/admin", icon: <LayoutDashboard size={20} />, label: "Tổng quan" },
    { to: "/admin/users", icon: <Users size={20} />, label: "Người dùng", perm: 'user.manage' },
    { to: "/admin/blogs", icon: <BookOpen size={20} />, label: "Quản lý Blog", perm: 'content.view' },
    { to: "/admin/locations", icon: <Map size={20} />, label: "Địa điểm", perm: 'content.location' },
    { to: "/admin/trips", icon: <MapPin size={20} />, label: "Lịch trình", perm: 'content.view' },
    { to: "/admin/hashtags", icon: <Tag size={20} />, label: "Hashtags", perm: 'content.hashtag' },
    { to: "/admin/groups", icon: <UsersRound size={20} />, label: "Hội nhóm", perm: 'group.manage' },
    { to: "/admin/roles", icon: <Shield size={20} />, label: "Phân quyền", perm: 'system.rbac' },
    { to: "/admin/stories", icon: <Film size={20} />, label: "Quản lý Story", perm: 'content.moderate' },
    { to: "/admin/reports", icon: <ShieldAlert size={20} />, label: "Báo cáo vi phạm", perm: 'report.view' },
    { to: "/admin/logs", icon: <History size={20} />, label: "Nhật ký", perm: 'system.logs' },
  ];

  const bottomItems = [
    { to: "/", icon: <Home size={20} />, label: "Trang chủ" },
  ];

  const canSee = (item: any) => {
    if (!item.perm) return true;
    if (user?.role === 'super-admin') return true;
    return user?.permissions?.includes(item.perm);
  };

  const filteredMenuItems = menuItems.filter(canSee);
  const filteredBottomItems = bottomItems.filter(canSee);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={twMerge(
          "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="p-2 bg-pastel-orange rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-pastel-orange/20">
                <Compass className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
                Blog<span className="text-pastel-orange">Travel</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div 
              className="p-2 bg-pastel-orange rounded-xl shadow-lg shadow-pastel-orange/20 mx-auto cursor-pointer hover:rotate-12 transition-transform duration-300"
              onClick={() => navigate('/')}
            >
              <Compass className="text-white h-5 w-5" />
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 hover:bg-slate-100 rounded-md text-slate-400"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 mt-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <p className={twMerge(
            "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3",
            collapsed && "text-center px-0"
          )}>
            {collapsed ? "..." : "Hệ thống"}
          </p>
          {filteredMenuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              collapsed={collapsed} 
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          {filteredBottomItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              collapsed={collapsed} 
            />
          ))}
          <button 
            onClick={handleLogout}
            className={twMerge(
            "flex items-center gap-3 w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all group",
            collapsed && "justify-center"
          )}>
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
