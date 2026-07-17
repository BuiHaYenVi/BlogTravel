import httpClient from '../../../services/api/httpClient';

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
  expires_at: string;
  like_count?: number;
  is_liked?: boolean;
}

export interface UserStoryFeed {
  user_id: string;
  username: string;
  full_name: string;
  avatar: string | null;
  stories: StoryItem[];
}

export const storyApi = {
  /**
   * Lấy bảng tin Story của chính mình và những người đang follow
   */
  getStoriesFeed: async (): Promise<UserStoryFeed[]> => {
    const response = await httpClient.get('/stories/feed');
    // httpClient tự động trả về response.data. Do đó, nếu cấu trúc backend trả về { success, data },
    // thì response ở đây sẽ là { success: true, message: '...', data: [...] }.
    // Ta bóc tách dữ liệu mảng an toàn.
    const resData = (response as any);
    return resData.data || resData || [];
  },

  /**
   * Đăng một story mới
   * 
   * @param file Tệp hình ảnh hoặc video ngắn
   * @param caption Mô tả ngắn (tùy chọn)
   */
  createStory: async (file: File, caption?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('media', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return httpClient.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Thả tim hoặc Bỏ thả tim cho tin ngắn
   */
  toggleLikeStory: async (id: string): Promise<{ is_liked: boolean; like_count: number }> => {
    const response = await httpClient.post(`/stories/${id}/like`);
    const resData = (response as any);
    return resData.data || resData;
  },

  /**
   * Lấy kho lưu trữ tin ngắn của chính mình
   */
  getStoriesArchive: async (): Promise<StoryItem[]> => {
    const response = await httpClient.get('/stories/archive');
    const resData = (response as any);
    return resData.data || resData || [];
  },

  /**
   * Xóa vĩnh viễn/mềm tin ngắn từ kho lưu trữ
   */
  deleteStory: async (id: string): Promise<any> => {
    return httpClient.delete(`/stories/${id}`);
  }
};
