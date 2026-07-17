import { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Settings, 
  Shield, 
  FileText, 
  Trash2, 
  Edit, 
  Lock, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { auditLogService } from '../../../services/auditLogService';

interface AuditLog {
  id: string;
  adminName: string;
  adminAvatar: string;
  action: string;
  target: string;
  targetType: 'User' | 'Blog' | 'System' | 'Role';
  status: 'Success' | 'Warning' | 'Failed';
  ip: string;
  time: string;
}

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, success_rate: 98.5, risk_alerts: 0 });
  const itemsPerPage = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes]: any = await Promise.all([
        auditLogService.getLogs(currentPage, itemsPerPage, searchTerm, typeFilter),
        auditLogService.getLogStats()
      ]);

      if (logsRes?.data) {
        const mappedLogs = logsRes.data.data.map((l: any) => ({
          id: l.id.toString(),
          adminName: l.username || 'System',
          adminAvatar: l.avatar ? l.avatar : `https://ui-avatars.com/api/?name=${l.username || 'System'}`,
          action: l.action,
          target: l.target || '-',
          targetType: l.target_type || 'System',
          status: l.status || 'Success',
          ip: l.ip_address || '-',
          time: new Date(l.created_at).toLocaleString('vi-VN')
        }));
        setLogs(mappedLogs);
        setTotalPages(logsRes.data.last_page || 1);
      }

      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Warning': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Failed': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'User': return <User size={16} className="text-blue-500" />;
      case 'Blog': return <FileText size={16} className="text-emerald-500" />;
      case 'System': return <Settings size={16} className="text-amber-500" />;
      case 'Role': return <Shield size={16} className="text-purple-500" />;
      default: return <Database size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi tất cả các thao tác quản trị viên thực hiện trên hệ thống.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10">
          <Download size={18} />
          Xuất báo cáo (CSV)
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
               <History size={24} />
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tổng thao tác</p>
               <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.total.toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
               <CheckCircle size={24} />
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Thao tác an toàn</p>
               <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.success_rate}%</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
               <AlertTriangle size={24} />
            </div>
            <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cảnh báo rủi ro</p>
               <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.risk_alerts}</p>
            </div>
         </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
         <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
               <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Search size={18} />
               </span>
               <input 
                 type="text" 
                 placeholder="Tìm theo Admin, Thao tác, Đối tượng..." 
                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-medium"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <select 
              className="px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-bold appearance-none min-w-[180px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
               <option value="All">Loại: Tất cả</option>
               <option value="User">Người dùng</option>
               <option value="Blog">Nội dung</option>
               <option value="System">Hệ thống</option>
               <option value="Role">Phân quyền</option>
            </select>
            <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
               <Filter size={18} /> Lọc kết quả
            </button>
         </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Quản trị viên</th>
                     <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Hành động</th>
                     <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Đối tượng</th>
                     <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                     <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Thời gian</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw size={40} className="text-pastel-orange animate-spin" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải nhật ký...</p>
                          </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">Không tìm thấy nhật ký nào.</td>
                    </tr>
                  ) : logs.map((log) => (
                     <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <img src={log.adminAvatar} className="w-9 h-9 rounded-xl shadow-sm border border-slate-100" />
                              <div>
                                 <p className="text-sm font-bold text-slate-900">{log.adminName}</p>
                                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                    <Globe size={10} /> {log.ip}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-sm font-bold text-slate-700">{log.action}</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                 {getTypeIcon(log.targetType)}
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-slate-900">{log.target}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.targetType}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className={clsx(
                             "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border",
                             getStatusStyle(log.status)
                           )}>
                              {log.status === 'Success' && <CheckCircle size={12} />}
                              {log.status === 'Warning' && <AlertTriangle size={12} />}
                              {log.status === 'Failed' && <Clock size={12} />}
                              {log.status}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <p className="text-[11px] text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-xl inline-block">
                              {log.time}
                           </p>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         <div className="px-8 py-6 bg-slate-50/20 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Đang xem trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 disabled={currentPage === 1 || loading}
                 className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"
               >
                  <ChevronLeft size={20} />
               </button>
               <button 
                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                 disabled={currentPage === totalPages || loading}
                 className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"
               >
                  <ChevronRight size={20} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
