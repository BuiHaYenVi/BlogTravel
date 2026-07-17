import { useState, useEffect } from 'react';
import {
   Settings,
   Globe,
   Bell,
   Lock,
   Database,
   Save,
   RefreshCw,
   Palette,
   Mail,
   Smartphone,
   Shield,
   Clock,
   Key,
   Trash2,
   Download,
   Eye,
   Type,
   Layout,
   Upload,
   CheckCircle2,
   Server,
   HardDrive,
   EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';
import { systemService } from '../../../services/systemService';

const AdminSettingsPage = () => {
   const [activeTab, setActiveTab] = useState('general');
   const [isSaving, setIsSaving] = useState(false);
   const [settings, setSettings] = useState<any>(null);
   const [serverInfo, setServerInfo] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [showApiKey, setShowApiKey] = useState(false);

   const fetchData = async () => {
      setLoading(true);
      try {
         const [settingsRes, infoRes]: any = await Promise.all([
            systemService.getSettings(),
            systemService.getServerInfo()
         ]);
         if (settingsRes?.data) setSettings(settingsRes.data);
         if (infoRes?.data) setServerInfo(infoRes.data);
      } catch (error) {
         console.error("Failed to fetch settings", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleSave = async () => {
      if (!settings) return;
      setIsSaving(true);
      try {
         // Logic: Save settings for the active category
         await systemService.updateSettings(activeTab, settings[activeTab] || settings);
         alert(`Đã cập nhật cấu hình ${activeTab} thành công!`);
      } catch (error) {
         alert("Lưu thất bại! Vui lòng kiểm tra lại kết nối.");
      } finally {
         setIsSaving(false);
      }
   };

   const updateField = (category: string, field: string, value: any) => {
      setSettings((prev: any) => ({
         ...prev,
         [category]: {
            ...(prev[category] || {}),
            [field]: value
         }
      }));
   };

   const handleMaintenance = async (action: 'cache' | 'backup') => {
      try {
         if (action === 'cache') {
            await systemService.clearCache();
            alert("Đã xóa cache hệ thống!");
         } else {
            const response = await systemService.backupDatabase();
            const url = window.URL.createObjectURL(new Blob([response as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup_${new Date().getTime()}.sql`);
            document.body.appendChild(link);
            link.click();
            alert("Đã tạo và tải xuống bản sao lưu dữ liệu!");
         }
      } catch (error) {
         alert("Thao tác thất bại!");
      }
   };

   const tabs = [
      { id: 'general', label: 'Tổng quan', icon: <Globe size={18} /> },
      { id: 'appearance', label: 'Giao diện', icon: <Palette size={18} /> },
      { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} /> },
      { id: 'security', label: 'Bảo mật', icon: <Lock size={18} /> },
      { id: 'system', label: 'Hệ thống', icon: <Database size={18} /> },
   ];

   if (loading) return (
      <div className="flex items-center justify-center h-[500px]">
         <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
   );

   const getS = (cat: string, field: string, def: any = '') => {
      return settings?.[cat]?.[field] ?? def;
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Cấu hình Hệ thống</h1>
               <p className="text-slate-500 text-sm mt-1">Quản lý các cài đặt chung cho toàn bộ website Gody.vn.</p>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => fetchData()}
                  className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
               >
                  Hủy bỏ & Reload
               </button>
               <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={clsx(
                     "flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20 disabled:opacity-70",
                     isSaving && "animate-pulse"
                  )}
               >
                  {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
               </button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
               <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm space-y-1 sticky top-24">
                  {tabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                           "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                           activeTab === tab.id
                              ? "bg-pastel-orange text-white shadow-md shadow-pastel-orange/20"
                              : "text-slate-500 hover:bg-slate-50"
                        )}
                     >
                        {tab.icon}
                        {tab.label}
                     </button>
                  ))}
               </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
               {/* Tab: General */}
               {activeTab === 'general' && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700">Tên Website</label>
                           <input
                              type="text"
                              value={getS('general', 'site_name', 'Gody.vn')}
                              onChange={(e) => updateField('general', 'site_name', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pastel-orange/20 outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700">Email liên hệ</label>
                           <input
                              type="email"
                              value={getS('general', 'site_email', 'contact@gody.vn')}
                              onChange={(e) => updateField('general', 'site_email', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pastel-orange/20 outline-none transition-all"
                           />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-sm font-bold text-slate-700">Mô tả Meta (SEO)</label>
                           <textarea
                              rows={3}
                              value={getS('general', 'site_description')}
                              onChange={(e) => updateField('general', 'site_description', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pastel-orange/20 outline-none transition-all"
                           />
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Trạng thái website</h3>
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                                 <Settings size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-900">Chế độ bảo trì</p>
                                 <p className="text-xs text-slate-500">Người dùng sẽ không thể truy cập vào web khi bật chế độ này.</p>
                              </div>
                           </div>
                           <div className="relative inline-flex items-center cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={getS('general', 'maintenance_mode', false)}
                                 onChange={(e) => updateField('general', 'maintenance_mode', e.target.checked)}
                                 className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pastel-orange"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Tab: Appearance */}
               {activeTab === 'appearance' && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                     <div className="space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                           <Layout size={18} className="text-pastel-orange" />
                           Logo & Branding
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3 group hover:border-pastel-orange/50 transition-colors">
                              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-pastel-orange/10 group-hover:text-pastel-orange transition-colors">
                                 <Upload size={24} />
                              </div>
                              <div className="text-center">
                                 <p className="text-sm font-bold text-slate-700">Logo chính (Sáng)</p>
                                 <p className="text-xs text-slate-400">Định dạng PNG, SVG, tối đa 2MB</p>
                              </div>
                              <button className="text-xs font-bold text-pastel-orange hover:underline">Tải ảnh lên</button>
                           </div>
                           <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3 group hover:border-pastel-orange/50 transition-colors bg-slate-900/5">
                              <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center group-hover:bg-pastel-orange/10 group-hover:text-pastel-orange transition-colors">
                                 <Upload size={24} />
                              </div>
                              <div className="text-center">
                                 <p className="text-sm font-bold text-slate-700">Logo chính (Tối)</p>
                                 <p className="text-xs text-slate-500 text-slate-400">Dùng cho nền tối</p>
                              </div>
                              <button className="text-xs font-bold text-pastel-orange hover:underline">Tải ảnh lên</button>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50 space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                           <Palette size={18} className="text-pastel-orange" />
                           Màu sắc & Typography
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700">Màu chủ đạo (Primary)</label>
                              <div className="flex gap-3">
                                 {['#FFB060', '#FF7E67', '#6BCB77', '#4D96FF', '#6C4AB6'].map(color => (
                                    <button
                                       key={color}
                                       onClick={() => updateField('appearance', 'primary_color', color)}
                                       className={clsx(
                                          "w-10 h-10 rounded-full border-2 border-transparent transition-all hover:scale-110",
                                          getS('appearance', 'primary_color', '#FFB060') === color && "ring-2 ring-pastel-orange ring-offset-2"
                                       )}
                                       style={{ backgroundColor: color }}
                                    />
                                 ))}
                                 <button className="w-10 h-10 rounded-full border-2 border-slate-200 border-dashed flex items-center justify-center text-slate-400 hover:border-pastel-orange transition-colors">
                                    +
                                 </button>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700">Phông chữ hệ thống</label>
                              <select
                                 value={getS('appearance', 'font_family', 'Inter')}
                                 onChange={(e) => updateField('appearance', 'font_family', e.target.value)}
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              >
                                 <option value="Inter">Inter (Mặc định)</option>
                                 <option value="Roboto">Roboto</option>
                                 <option value="Outfit">Outfit</option>
                                 <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Tab: Notifications */}
               {activeTab === 'notifications' && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                     <div className="space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                           <Mail size={18} className="text-pastel-orange" />
                           Cấu hình Email (SMTP)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">SMTP Host</label>
                              <input
                                 type="text"
                                 value={getS('notifications', 'smtp_host')}
                                 onChange={(e) => updateField('notifications', 'smtp_host', e.target.value)}
                                 placeholder="smtp.gmail.com"
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">SMTP Port</label>
                              <input
                                 type="text"
                                 value={getS('notifications', 'smtp_port')}
                                 onChange={(e) => updateField('notifications', 'smtp_port', e.target.value)}
                                 placeholder="587"
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Tài khoản</label>
                              <input
                                 type="text"
                                 value={getS('notifications', 'smtp_user')}
                                 onChange={(e) => updateField('notifications', 'smtp_user', e.target.value)}
                                 placeholder="notification@gody.vn"
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                              <input
                                 type="password"
                                 value={getS('notifications', 'smtp_pass')}
                                 onChange={(e) => updateField('notifications', 'smtp_pass', e.target.value)}
                                 placeholder="••••••••••••"
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-sm font-bold">
                           <RefreshCw size={14} /> Kiểm tra kết nối
                        </button>
                     </div>

                     <div className="pt-6 border-t border-slate-50 space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                           <Bell size={18} className="text-pastel-orange" />
                           Thông báo hệ thống
                        </h3>
                        <div className="space-y-3">
                           {[
                              { key: 'notify_reg', title: 'Đăng ký mới', desc: 'Thông báo qua email khi có người dùng mới đăng ký.' },
                              { key: 'notify_post', title: 'Bài viết mới', desc: 'Thông báo khi có bài blog mới chờ kiểm duyệt.' },
                              { key: 'notify_report', title: 'Báo cáo vi phạm', desc: 'Thông báo khẩn cấp khi có nội dung bị báo cáo.' },
                              { key: 'notify_update', title: 'Cập nhật hệ thống', desc: 'Thông báo khi có các bản cập nhật phần mềm mới.' },
                           ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div className="flex gap-3">
                                    <div className={clsx(
                                       "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                       getS('notifications', item.key, true) ? "bg-white text-pastel-orange" : "bg-white text-slate-300"
                                    )}>
                                       <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                       <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                 </div>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                       type="checkbox"
                                       checked={getS('notifications', item.key, true)}
                                       onChange={(e) => updateField('notifications', item.key, e.target.checked)}
                                       className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pastel-orange"></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {/* Tab: Security */}
               {activeTab === 'security' && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              <Shield size={18} className="text-pastel-orange" />
                              Chính sách mật khẩu
                           </h3>
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">Độ dài tối thiểu</label>
                                 <input
                                    type="number"
                                    value={getS('security', 'min_password_length', 8)}
                                    onChange={(e) => updateField('security', 'min_password_length', parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                                 />
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-sm text-slate-600 font-medium">Yêu cầu ký tự đặc biệt</span>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                       type="checkbox"
                                       checked={getS('security', 'require_special_chars', true)}
                                       onChange={(e) => updateField('security', 'require_special_chars', e.target.checked)}
                                       className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pastel-orange"></div>
                                 </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-sm text-slate-600 font-medium">Bắt buộc đổi sau 90 ngày</span>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                       type="checkbox"
                                       checked={getS('security', 'force_password_change', false)}
                                       onChange={(e) => updateField('security', 'force_password_change', e.target.checked)}
                                       className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pastel-orange"></div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              <Key size={18} className="text-pastel-orange" />
                              Xác thực & Truy cập
                           </h3>
                           <div className="space-y-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                 <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900">Xác thực 2 lớp (2FA)</p>
                                    <span className="px-2 py-0.5 bg-pastel-orange/10 text-pastel-orange text-[10px] font-bold rounded uppercase tracking-wider">Khuyên dùng</span>
                                 </div>
                                 <p className="text-xs text-slate-500">Bắt buộc tất cả tài khoản Admin phải sử dụng 2FA qua Google Authenticator hoặc Email.</p>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                       type="checkbox"
                                       checked={getS('security', 'two_factor_auth', false)}
                                       onChange={(e) => updateField('security', 'two_factor_auth', e.target.checked)}
                                       className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pastel-orange"></div>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">Thời gian hết hạn phiên (phút)</label>
                                 <input
                                    type="number"
                                    value={getS('security', 'session_timeout', 120)}
                                    onChange={(e) => updateField('security', 'session_timeout', parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              <Shield size={18} className="text-red-500" />
                              Kiểm soát IP & Bảo mật khác
                           </h3>
                           <button className="text-xs font-bold text-pastel-orange hover:underline">Xem danh sách đen</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Giới hạn đăng nhập sai</label>
                              <input
                                 type="number"
                                 value={getS('security', 'max_login_attempts', 5)}
                                 onChange={(e) => updateField('security', 'max_login_attempts', parseInt(e.target.value))}
                                 placeholder="Số lần cho phép trước khi khóa"
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Thời gian khóa IP (phút)</label>
                              <input
                                 type="number"
                                 value={getS('security', 'ip_lockout_duration', 30)}
                                 onChange={(e) => updateField('security', 'ip_lockout_duration', parseInt(e.target.value))}
                                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Tab: System */}
               {activeTab === 'system' && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pastel-orange shadow-sm">
                              <Trash2 size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">Bộ nhớ đệm</p>
                              <p className="text-xs text-slate-500 mt-1">Xóa toàn bộ cache ứng dụng và file tạm.</p>
                           </div>
                           <button
                              onClick={() => handleMaintenance('cache')}
                              className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                           >
                              Dọn dẹp Cache
                           </button>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                              <Download size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">Sao lưu dữ liệu</p>
                              <p className="text-xs text-slate-500 mt-1">Tạo bản sao lưu cho toàn bộ Database.</p>
                           </div>
                           <button
                              onClick={() => handleMaintenance('backup')}
                              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
                           >
                              Tạo bản Backup
                           </button>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm">
                              <RefreshCw size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">Cập nhật</p>
                              <p className="text-xs text-slate-500 mt-1">Phiên bản hiện tại: v2.4.0</p>
                           </div>
                           <button className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                              Kiểm tra cập nhật
                           </button>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50 space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                           <Database size={18} className="text-pastel-orange" />
                           API Keys & Kết nối
                        </h3>
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                 Google Maps API Key
                                 <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Đã kết nối</span>
                              </label>
                              <div className="relative">
                                 <input
                                    type={showApiKey ? "text" : "password"}
                                    value={getS('system', 'google_maps_key')}
                                    onChange={(e) => updateField('system', 'google_maps_key', e.target.value)}
                                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20 transition-all font-mono text-xs"
                                 />
                                 <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                 >
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                 </button>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">Facebook App ID</label>
                                 <input
                                    type="text"
                                    value={getS('system', 'facebook_app_id')}
                                    onChange={(e) => updateField('system', 'facebook_app_id', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20 font-mono text-sm"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">Facebook App Secret</label>
                                 <input
                                    type="password"
                                    value={getS('system', 'facebook_app_secret')}
                                    onChange={(e) => updateField('system', 'facebook_app_secret', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pastel-orange/20 font-mono text-sm"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Thông tin máy chủ</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {serverInfo?.map((item: any, i: number) => (
                              <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                                 <p className="text-sm font-bold text-slate-700 mt-0.5">{item.value}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default AdminSettingsPage;
