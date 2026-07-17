import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  FileText,
  Users,
  MapPin
} from 'lucide-react';
import { adminReportService, AdminReport } from '../../../services/api/adminReportService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../../shared/hooks/useToast';

const ReportListPage: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'resolve' | 'reject' | null>(null);

  const fetchReports = async (page = 1, status = filterStatus) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (status !== 'all') params.status = status;
      
      const response = await adminReportService.fetchReports(params);
      if (response && response.data) {
        setReports(response.data.data);
        setPagination({
          currentPage: response.data.pagination.page || response.data.pagination.current_page || 1,
          totalPages: response.data.pagination.total_pages || 1,
          total: response.data.pagination.total || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (action: 'resolve' | 'reject') => {
    if (!selectedReport) return;
    setProcessing(true);
    try {
      await adminReportService.processReport(selectedReport.id, action, adminNote);
      useToastStore.getState().addToast(
        action === 'resolve' 
          ? 'Đã duyệt báo cáo và tự động ẩn/khóa nội dung vi phạm thành công!' 
          : 'Đã từ chối báo cáo vi phạm.',
        'success'
      );
      // Fetch lại dữ liệu
      // Nếu là báo cáo cuối cùng của trang hiện tại (và không phải trang 1), lùi lại 1 trang
      if (reports.length === 1 && pagination.currentPage > 1) {
        fetchReports(pagination.currentPage - 1);
      } else {
        fetchReports(pagination.currentPage);
      }
      
      setSelectedReport(null);
      setAdminNote('');
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to process report:', error);
      useToastStore.getState().addToast(
        'Có lỗi xảy ra khi xử lý báo cáo vi phạm.',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchReports(1, filterStatus);
  }, [filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={12} /> Chờ xử lý
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={12} /> Đã giải quyết
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
            <XCircle size={12} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'post':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600">
            <FileText size={10} /> Bài viết
          </span>
        );
      case 'comment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-600">
            <MessageSquare size={10} /> Bình luận
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600">
            <User size={10} /> Người dùng
          </span>
        );
      case 'group_post':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600">
            <Users size={10} /> Bài viết nhóm
          </span>
        );
      case 'trip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600">
            <MapPin size={10} /> Chuyến đi
          </span>
        );
      case 'story':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-50 text-pink-600">
            <Clock size={10} /> Tin ngắn 24h
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{type}</span>;
    }
  };

  const getReasonLabel = (report: AdminReport) => {
    if (report.description) {
      return report.description;
    }
    const reasons: Record<string, string> = {
      'spam': 'Spam / Rác',
      'inappropriate': 'Nội dung không phù hợp',
      'harassment': 'Quấy rối / Đả kích',
      'copyright': 'Vi phạm bản quyền',
      'fake': 'Thông tin giả mạo',
      'other': 'Lý do khác'
    };
    return reasons[report.reason] || report.reason;
  };

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: pagination.total },
    { id: 'pending', label: 'Chờ xử lý', icon: <Clock size={14} /> },
    { id: 'resolved', label: 'Đã giải quyết', icon: <CheckCircle2 size={14} /> },
    { id: 'rejected', label: 'Từ chối', icon: <XCircle size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-pastel-orange" size={28} />
            Quản lý Báo cáo Vi phạm
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Kiểm duyệt và xử lý các báo cáo từ người dùng về nội dung vi phạm tiêu chuẩn cộng đồng.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filterStatus === tab.id 
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

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu báo cáo...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-500" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Tuyệt vời!</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium">
              Hiện không có báo cáo vi phạm nào cần xử lý trong danh mục này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Người báo cáo</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Đối tượng & Lý do</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày gửi</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 tabular-nums">#{report.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{report.reporter_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{report.reporter_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(report.reportable_type)}
                          <span className="text-[10px] font-black text-slate-300">ID: {report.reportable_id}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 line-clamp-1">
                          {getReasonLabel(report)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        {format(new Date(report.created_at), 'dd MMM, yyyy HH:mm', { locale: vi })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="p-2 text-slate-400 hover:text-pastel-orange hover:bg-pastel-orange/10 rounded-xl transition-all inline-flex items-center gap-2 group/btn"
                        title="Xem chi tiết & Xử lý"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">Xử lý</span>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && reports.length > 0 && (
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Hiển thị {reports.length} trên tổng số {pagination.total} báo cáo
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination.currentPage === 1}
                onClick={() => fetchReports(pagination.currentPage - 1)}
                className="p-2 rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
              >
                <Filter size={16} className="rotate-90" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchReports(p)}
                    className={clsx(
                      "w-8 h-8 rounded-lg text-xs font-black transition-all",
                      pagination.currentPage === p 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                        : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchReports(pagination.currentPage + 1)}
                className="p-2 rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
              >
                <Filter size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xem chi tiết & Xử lý báo cáo vi phạm */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Chi tiết Báo cáo Vi phạm #{selectedReport.id}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Xử lý báo cáo nội dung tiêu chuẩn cộng đồng</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedReport(null); setAdminNote(''); setConfirmAction(null); }}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Người báo cáo</span>
                    <span className="text-sm font-black text-slate-900 block">{selectedReport.reporter_name}</span>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">{selectedReport.reporter_email}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Đối tượng & Lý do</span>
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(selectedReport.reportable_type)}
                      <span className="text-[10px] font-bold text-slate-400">ID: {selectedReport.reportable_id}</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 block">{getReasonLabel(selectedReport)}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mô tả từ người báo cáo</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600 min-h-[60px] italic">
                    {selectedReport.description || "Người báo cáo không cung cấp thêm mô tả chi tiết."}
                  </div>
                </div>

                {/* Reported Target Content */}
                {selectedReport.target_info && (
                  <div className="border border-red-100 rounded-3xl p-5 bg-red-50/20">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Nội dung bị báo cáo vi phạm</span>
                    
                    {/* Content Preview based on type */}
                    {selectedReport.reportable_type === 'post' || selectedReport.reportable_type === 'group_post' ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">Tiêu đề bài viết:</span>
                        <p className="text-sm font-black text-slate-800">{selectedReport.target_info.title}</p>
                      </div>
                    ) : selectedReport.reportable_type === 'comment' ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">Nội dung bình luận:</span>
                        <p className="text-sm font-semibold text-slate-700 italic">"{selectedReport.target_info.content}"</p>
                      </div>
                    ) : selectedReport.reportable_type === 'user' ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">Tài khoản người dùng:</span>
                        <p className="text-sm font-black text-slate-800">@{selectedReport.target_info.username}</p>
                      </div>
                    ) : selectedReport.reportable_type === 'trip' ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">Tiêu đề chuyến đi:</span>
                        <p className="text-sm font-black text-slate-800">{selectedReport.target_info.title}</p>
                        {selectedReport.target_info.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedReport.target_info.description}</p>
                        )}
                      </div>
                    ) : selectedReport.reportable_type === 'story' ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-400">Chú thích Story:</span>
                          <p className="text-sm font-semibold text-slate-800 italic">
                            {selectedReport.target_info.caption ? `"${selectedReport.target_info.caption}"` : "(Không có chú thích)"}
                          </p>
                        </div>
                        {selectedReport.target_info.media_url && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400">Tệp đa phương tiện:</span>
                            <div className="mt-1 w-32 aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                              {selectedReport.target_info.media_type === 'video' ? (
                                <video src={selectedReport.target_info.media_url} className="w-full h-full object-cover" controls muted />
                              ) : (
                                <img src={selectedReport.target_info.media_url} alt="story preview" className="w-full h-full object-cover" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Form Action */}
                {selectedReport.status === 'pending' ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ghi chú xử lý (Admin Note)</span>
                    <textarea 
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Nhập lý do duyệt ẩn/từ chối hoặc các thông tin xử phạt vi phạm..."
                      rows={3}
                      className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-pastel-orange focus:ring-1 focus:ring-pastel-orange/20"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kết quả xử lý từ Admin</span>
                    <div className="flex items-center gap-2 font-black text-slate-800">
                      <span>Trạng thái:</span>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    {selectedReport.admin_note && (
                      <p className="text-xs text-slate-500 mt-2 font-medium italic">Ghi chú: "{selectedReport.admin_note}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {selectedReport.status === 'pending' && (
                <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 bg-slate-50/50 transition-all">
                  {confirmAction ? (
                    <div className="flex items-center justify-between w-full bg-slate-100/80 p-3 rounded-2xl border border-slate-200 animate-in slide-in-from-right-4 duration-200">
                      <div className="flex items-center gap-2 px-2">
                        <AlertTriangle size={18} className={confirmAction === 'resolve' ? "text-red-500" : "text-amber-500"} />
                        <span className="text-xs font-bold text-slate-700">
                          {confirmAction === 'resolve' 
                            ? "Bạn chắc chắn muốn phạt và ẩn nội dung này?" 
                            : "Bạn chắc chắn muốn từ chối báo cáo này?"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={processing}
                          onClick={() => setConfirmAction(null)}
                          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          disabled={processing}
                          onClick={() => handleProcessReport(confirmAction)}
                          className={clsx(
                            "px-4 py-2 rounded-xl text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50",
                            confirmAction === 'resolve' ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20" : "bg-slate-800 hover:bg-slate-900 shadow-md shadow-slate-900/20"
                          )}
                        >
                          {processing ? (
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        disabled={processing}
                        onClick={() => setConfirmAction('reject')}
                        className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <XCircle size={14} /> Từ chối báo cáo
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => setConfirmAction('resolve')}
                        className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
                      >
                        <AlertTriangle size={14} /> Phạt & Ẩn nội dung
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportListPage;
