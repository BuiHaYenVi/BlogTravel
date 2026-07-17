import { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Camera, 
  Save, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Globe,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { clsx } from 'clsx';

const AdminProfilePage = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const profileImage = user?.avatar?.startsWith('http') 
    ? user.avatar 
    : `${apiUrl.replace('/api', '')}/${user?.avatar || 'default-avatar.png'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Profile Card */}
      <div className="relative h-64 rounded-[40px] overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-pastel-orange via-orange-500 to-rose-500"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        
        <div className="absolute -bottom-16 left-12 flex items-end gap-8">
           <div className="relative group/avatar">
              <div className="w-44 h-44 rounded-[32px] border-[6px] border-white overflow-hidden bg-white shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                 <img src={profileImage} alt={user?.name} className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-4 right-4 bg-slate-900 text-white p-3 rounded-2xl shadow-xl opacity-0 translate-y-4 group-hover/avatar:opacity-100 group-hover/avatar:translate-y-0 transition-all duration-300 hover:bg-pastel-orange">
                 <Camera size={20} />
              </button>
           </div>
           <div className="mb-20 text-white">
              <h1 className="text-4xl font-black tracking-tight mb-1 drop-shadow-lg">{user?.name}</h1>
              <div className="flex items-center gap-3">
                 <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {user?.role === 'admin' ? 'Super Admin' : user?.role || 'Quản trị viên'}
                 </span>
                 <span className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                    <ShieldCheck size={14} className="text-emerald-300" />
                    Tài khoản đã xác minh
                 </span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 pt-12">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
           <div className="bg-white rounded-[32px] p-4 shadow-xl shadow-slate-200/50 border border-slate-100">
              <nav className="space-y-1">
                 {[
                   { id: 'info', icon: <User size={20} />, label: 'Thông tin cá nhân' },
                   { id: 'security', icon: <Lock size={20} />, label: 'Bảo mật & Mật khẩu' },
                   { id: 'activity', icon: <Bell size={20} />, label: 'Nhật ký hoạt động' },
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={clsx(
                       "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                       activeTab === tab.id 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                     )}
                   >
                      <div className="flex items-center gap-3 font-bold text-sm">
                         {tab.icon}
                         {tab.label}
                      </div>
                      <ChevronRight size={16} className={clsx("transition-transform", activeTab === tab.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                   </button>
                 ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-slate-100">
                 <button 
                   onClick={logout}
                   className="w-full flex items-center gap-3 p-4 text-rose-500 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all"
                 >
                    <LogOut size={20} />
                    Đăng xuất khỏi hệ thống
                 </button>
              </div>
           </div>

           {/* Stats Card */}
           <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-orange rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Thống kê quản trị</h4>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <p className="text-3xl font-black mb-1">1,204</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">User quản lý</p>
                 </div>
                 <div>
                    <p className="text-3xl font-black mb-1">856</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Post đã duyệt</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-8">
           <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]">
              {activeTab === 'info' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-1">Thông tin cá nhân</h2>
                      <p className="text-slate-400 text-sm">Cập nhật thông tin công khai và liên hệ của bạn.</p>
                   </div>

                   <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Họ và tên</label>
                            <div className="relative">
                               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                               <input 
                                 type="text" 
                                 defaultValue={user?.name}
                                 className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pastel-orange/30 focus:bg-white outline-none transition-all font-bold text-sm"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Email liên hệ</label>
                            <div className="relative">
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                               <input 
                                 type="email" 
                                 defaultValue={user?.email}
                                 className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pastel-orange/30 focus:bg-white outline-none transition-all font-bold text-sm"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Tiểu sử cá nhân</label>
                         <textarea 
                           className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:border-pastel-orange/30 focus:bg-white outline-none transition-all font-medium text-sm min-h-[120px]"
                           placeholder="Giới thiệu một chút về bản thân bạn..."
                           defaultValue={user?.bio}
                         />
                      </div>

                      <div className="flex justify-end pt-4">
                         <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-pastel-orange transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                            <Save size={18} />
                            Lưu thông tin
                         </button>
                      </div>
                   </form>

                   <div className="pt-10 mt-10 border-t border-slate-100">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 mb-6">Liên kết hệ thống</h4>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  <Smartphone size={20} className="text-slate-400" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-900">Thiết bị quản trị</p>
                                  <p className="text-[10px] text-slate-400">Windows 11 • Chrome 124.0.0</p>
                               </div>
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-md">Đang hoạt động</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'security' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-1">Bảo mật tài khoản</h2>
                      <p className="text-slate-400 text-sm">Quản lý mật khẩu và các phương thức xác thực.</p>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
                             <Shield size={24} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900 mb-1">Xác thực 2 lớp (2FA)</h4>
                             <p className="text-xs text-slate-500 mb-4">Tăng cường bảo mật cho tài khoản quản trị của bạn.</p>
                             <button className="text-[10px] font-black text-pastel-orange uppercase tracking-widest hover:underline">Kích hoạt ngay →</button>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Mật khẩu hiện tại</label>
                             <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pastel-orange/30 outline-none transition-all font-bold text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Mật khẩu mới</label>
                                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pastel-orange/30 outline-none transition-all font-bold text-sm" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Xác nhận lại</label>
                                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pastel-orange/30 outline-none transition-all font-bold text-sm" />
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex justify-end">
                          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-pastel-orange transition-all shadow-xl shadow-slate-900/10">
                             Cập nhật mật khẩu
                          </button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
