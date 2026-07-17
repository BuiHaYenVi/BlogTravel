import httpClient from './httpClient';

export interface AdminReport {
  id: number;
  reporter_id: number;
  reportable_type: 'post' | 'comment' | 'user' | 'group_post';
  reportable_id: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  admin_id: number | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  reporter_name: string;
  reporter_email: string;
  admin_name: string | null;
  target_info: {
    id: number;
    title?: string;
    content?: string;
    username?: string;
    type: string;
    label: string;
    [key: string]: any;
  } | null;
}

export interface ReportsResponse {
  status: string;
  message: string;
  data: {
    data: AdminReport[];
    pagination: {
      total: number;
      per_page?: number;
      current_page?: number;
      page?: number;
      limit?: number;
      total_pages: number;
      has_next?: boolean;
      has_prev?: boolean;
    };
  };
}

export const adminReportService = {
  /**
   * Lấy danh sách báo cáo cho admin
   */
  fetchReports: async (params: { page?: number; limit?: number; status?: string; type?: string }) => {
    return httpClient.get<any, ReportsResponse>('/admin/reports', { params });
  },

  /**
   * Xử lý báo cáo
   */
  processReport: async (id: number, action: 'resolve' | 'reject', note?: string) => {
    return httpClient.put(`/admin/reports/${id}/process`, { action, note });
  }
};
