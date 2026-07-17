import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboardService';
import { 
  Users, 
  BookOpen, 
  UsersRound, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert,
  Download,
  Zap,
  Flame,
  MapPin
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const StatCard = ({ title, value, icon, trend, trendValue }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
  >
    <div className="flex items-start justify-between">
      <div className={`p-4 rounded-2xl ${icon.color} bg-opacity-10 text-opacity-100`}>
        {icon.element}
      </div>
      <div className={clsx(
        "flex items-center gap-1 text-[11px] font-black py-1.5 px-3 rounded-xl uppercase tracking-wider",
        trend === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'
      )}>
        {trend === 'up' ? <ArrowUpRight size={14} className="stroke-[3]" /> : <ArrowDownRight size={14} className="stroke-[3]" />}
        {trendValue}%
      </div>
    </div>
    <div className="mt-5">
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</h3>
      <div className="text-3xl font-black mt-2 tracking-tight text-slate-900 tabular-nums">{value}</div>
    </div>
  </motion.div>
);

const QuickAction = ({ icon, label, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-pastel-orange hover:shadow-lg hover:shadow-pastel-orange/10 transition-all group gap-2"
  >
    <div className={clsx("p-3 rounded-2xl transition-colors", color)}>
       {icon}
    </div>
    <span className="text-[11px] font-black text-slate-600 group-hover:text-slate-900 uppercase tracking-tighter">{label}</span>
  </button>
);

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response: any = await dashboardService.getStats();
      if (response?.data) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { title: "Người dùng", value: dashboardStats?.users || 0, icon: { element: <Users size={24} />, color: "text-blue-500 bg-blue-50" }, trend: "up", trendValue: "12" },
    { title: "Bài viết", value: dashboardStats?.posts || 0, icon: { element: <BookOpen size={24} />, color: "text-orange-500 bg-orange-50" }, trend: "up", trendValue: "8" },
    { title: "Lịch trình", value: dashboardStats?.trips || 0, icon: { element: <Calendar size={24} />, color: "text-purple-500 bg-purple-50" }, trend: "up", trendValue: "3" },
    { title: "Hội nhóm", value: dashboardStats?.active_groups?.length || 0, icon: { element: <UsersRound size={24} />, color: "text-emerald-500 bg-emerald-50" }, trend: "up", trendValue: "15" },
  ];

  const chartData = dashboardStats?.chart_data?.length > 0 ? dashboardStats.chart_data : [
    { name: 'Khởi tạo', users: 0, trips: 0 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chào admin</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-all">Hệ thống đang hoạt động ổn định với dữ liệu thời gian thực.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <button className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 dark:bg-slate-700 text-white shadow-lg">
                 6 Tháng qua
              </button>
              <div className="h-6 w-px bg-slate-100 dark:bg-slate-700 mx-1"></div>
              <button onClick={() => fetchStats()} className="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <Clock size={18} className={loading ? "animate-spin" : ""} />
              </button>
           </div>
           
           <button onClick={() => window.print()} className="flex items-center gap-2 bg-pastel-orange text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-pastel-orange/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Download size={18} />
              Xuất báo cáo
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <TrendingUp size={24} className="text-pastel-orange" />
                  Biểu đồ tăng trưởng
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Lượng người dùng và lịch trình mới hàng tháng</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full mt-4" style={{ minHeight: '350px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFA16C" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFA16C" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: '800'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      name="Người dùng"
                      stroke="#FFA16C" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      animationDuration={1000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="trips" 
                      name="Lịch trình"
                      stroke="#3B82F6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorTrips)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Lối tắt tác vụ</h3>
                <div className="grid grid-cols-2 gap-4">
                   <QuickAction onClick={() => navigate('/admin/groups')} icon={<Clock className="text-blue-500" />} label="Hội nhóm" color="bg-blue-50" />
                   <QuickAction onClick={() => navigate('/admin/blogs')} icon={<ShieldAlert className="text-rose-500" />} label="Quản lý Blog" color="bg-rose-50" />
                   <QuickAction icon={<Zap className="text-amber-500" />} label="Gửi Global NoTi" color="bg-amber-50" />
                   <QuickAction onClick={() => navigate('/admin/users')} icon={<Download className="text-emerald-500" />} label="Quản lý User" color="bg-emerald-50" />
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   <ShieldAlert size={18} /> Cảnh báo ưu tiên
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                      <div className="w-10 h-10 bg-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center font-black">
                         {dashboardStats?.reports_count || 0}
                      </div>
                      <div>
                         <p className="text-xs font-bold">Báo cáo vi phạm mới</p>
                         <p className="text-[10px] text-white/40 font-medium">Cần xử lý ngay</p>
                      </div>
                      <ArrowRight size={14} className="ml-auto text-white/20" />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Flame size={18} className="text-rose-500" /> Tóp Xu Hướng
              </h3>
              <div className="space-y-6">
                 {dashboardStats?.popular_locations?.map((loc: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-12 h-12 rounded-[1.2rem] bg-orange-50 flex items-center justify-center text-pastel-orange font-black text-xl">
                          {i + 1}
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 group-hover:text-pastel-orange transition-colors">{loc.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-500">Địa điểm</span>
                             <span className="text-[10px] text-slate-400 font-bold">{loc.checkins} lượt tới</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 
                 {dashboardStats?.active_groups?.map((group: any, i: number) => (
                    <div key={`g-${i}`} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 font-black text-xl">
                          <UsersRound size={20} />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 group-hover:text-pastel-orange transition-colors">{group.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-500">Hội nhóm</span>
                             <span className="text-[10px] text-slate-400 font-bold">{group.members} thành viên</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <Clock size={18} className="text-indigo-500" /> Hệ thống
                </h2>
              </div>
              <div className="space-y-6">
                 {[
                   { user: "Admin", action: "vừa cập nhật cấu hình hệ thống", time: "Vừa xong" },
                   { user: "System", action: "Dữ liệu đã được đồng bộ", time: "10p trước" }
                 ].map((act, i) => (
                    <div key={i} className="flex gap-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{act.user} <span className="font-medium text-slate-500">{act.action}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
