import api from '../../shared/services/api';

export interface ReportPayload {
  reportable_type: 'blog' | 'post' | 'comment' | 'user' | 'group';
  reportable_id: string | number;
  reason: string;
  content?: string;
}

export const reportApi = {
  /**
   * Gửi báo cáo vi phạm
   * @param payload Dữ liệu báo cáo
   */
  sendReport: async (payload: ReportPayload) => {
    console.log("[User Report Debug] Payload gửi đi:", payload);
    try {
      const response = await api.post('/reports', payload);
      return response.data;
    } catch (error) {
      console.error("[User Report Debug] Lỗi khi gửi báo cáo:", error);
      throw error;
    }
  }
};
