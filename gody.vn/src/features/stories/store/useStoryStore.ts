import { create } from 'zustand';
import { storyApi, UserStoryFeed, StoryItem } from '../services/storyApi';

interface StoryState {
  feeds: UserStoryFeed[];
  playList: UserStoryFeed[]; // Danh sách thực sự đang được phát trong Player
  archive: StoryItem[];       // Kho lưu trữ tin của chính mình
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Trạng thái Trình phát Story (Player)
  activeUserIndex: number | null; // Vị trí user đang phát trong playList
  activeStoryIndex: number;       // Vị trí slide story của user đó đang phát
  isPlaying: boolean;            // Trạng thái tự động chạy slide
  
  // Hành động với API
  fetchStoriesFeed: () => Promise<void>;
  fetchStoriesArchive: () => Promise<void>;
  uploadStory: (file: File, caption?: string) => Promise<boolean>;
  deleteStory: (id: string) => Promise<boolean>;
  toggleLikeStory: (id: string) => Promise<void>;
  
  // Điều khiển Trình phát (Player Controls)
  openPlayer: (userIndex: number) => void;
  openPlayerWithFeed: (feed: UserStoryFeed, startStoryIndex?: number) => void;
  closePlayer: () => void;
  nextStory: () => void;
  prevStory: () => void;
  pausePlayer: () => void;
  resumePlayer: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  feeds: [],
  playList: [],
  archive: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  
  activeUserIndex: null,
  activeStoryIndex: 0,
  isPlaying: false,

  /**
   * Tải danh sách Story 24h từ Backend
   */
  fetchStoriesFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const feedData = await storyApi.getStoriesFeed();
      set({ feeds: feedData, playList: feedData, isLoading: false });
    } catch (err: any) {
      console.error("[useStoryStore] Lỗi tải feed:", err);
      set({ 
        error: err.response?.data?.message || 'Không thể tải bảng tin ngắn.', 
        isLoading: false 
      });
    }
  },

  /**
   * Tải danh sách tin ngắn lưu trữ
   */
  fetchStoriesArchive: async () => {
    try {
      const archiveData = await storyApi.getStoriesArchive();
      set({ archive: archiveData });
    } catch (err) {
      console.error("[useStoryStore] Lỗi tải archive:", err);
    }
  },

  /**
   * Đăng tin ngắn mới
   */
  uploadStory: async (file: File, caption?: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await storyApi.createStory(file, caption);
      const isSuccess = response.success || response.data?.success;
      if (isSuccess) {
        await get().fetchStoriesFeed(); // Tải lại feed sau khi đăng thành công
        set({ isSubmitting: false });
        return true;
      }
      set({ isSubmitting: false });
      return false;
    } catch (err: any) {
      console.error("[useStoryStore] Lỗi đăng story:", err);
      set({ 
        error: err.response?.data?.message || 'Lưu tin ngắn thất bại.', 
        isSubmitting: false 
      });
      return false;
    }
  },

  /**
   * Xóa vĩnh viễn/mềm tin ngắn
   */
  deleteStory: async (id: string) => {
    try {
      const response = await storyApi.deleteStory(id);
      const isSuccess = response.success || response.data?.success;
      if (isSuccess) {
        set(state => {
          const updatedArchive = state.archive.filter(s => s.id !== id);
          const updatedFeeds = state.feeds.map(feed => ({
            ...feed,
            stories: feed.stories.filter(s => s.id !== id)
          })).filter(feed => feed.stories.length > 0);
          
          const updatedPlayList = state.playList.map(feed => ({
            ...feed,
            stories: feed.stories.filter(s => s.id !== id)
          })).filter(feed => feed.stories.length > 0);

          return { archive: updatedArchive, feeds: updatedFeeds, playList: updatedPlayList };
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useStoryStore] Lỗi xóa story:", err);
      return false;
    }
  },

  /**
   * Thả tim / Bỏ thả tim cho tin ngắn
   */
  toggleLikeStory: async (id: string) => {
    try {
      const result = await storyApi.toggleLikeStory(id);
      set(state => {
        const updatedFeeds = state.feeds.map(feed => ({
          ...feed,
          stories: feed.stories.map(s => s.id === id ? { ...s, is_liked: result.is_liked, like_count: result.like_count } : s)
        }));
        
        const updatedPlayList = state.playList.map(feed => ({
          ...feed,
          stories: feed.stories.map(s => s.id === id ? { ...s, is_liked: result.is_liked, like_count: result.like_count } : s)
        }));

        const updatedArchive = state.archive.map(s => s.id === id ? { ...s, is_liked: result.is_liked, like_count: result.like_count } : s);

        return { feeds: updatedFeeds, playList: updatedPlayList, archive: updatedArchive };
      });
    } catch (err) {
      console.error("[useStoryStore] Lỗi thả tim story:", err);
    }
  },

  /**
   * Mở Trình phát Story toàn màn hình tại vị trí user được chọn trong feeds mặc định
   */
  openPlayer: (userIndex: number) => {
    const { feeds } = get();
    set({
      playList: feeds,
      activeUserIndex: userIndex,
      activeStoryIndex: 0,
      isPlaying: true
    });
  },

  /**
   * Mở Trình phát Story với feed tùy chỉnh (ví dụ: tin của 1 user cụ thể hoặc tin lưu trữ)
   */
  openPlayerWithFeed: (feed: UserStoryFeed, startStoryIndex = 0) => {
    set({
      playList: [feed],
      activeUserIndex: 0,
      activeStoryIndex: startStoryIndex,
      isPlaying: true
    });
  },

  /**
   * Đóng Trình phát Story
   */
  closePlayer: () => {
    set({
      activeUserIndex: null,
      activeStoryIndex: 0,
      isPlaying: false
    });
  },

  /**
   * Chuyển slide tiếp theo (Tự động chuyển User tiếp theo nếu hết slide của User hiện tại)
   */
  nextStory: () => {
    const { playList, activeUserIndex, activeStoryIndex } = get();
    if (activeUserIndex === null || playList.length === 0) return;

    const currentUserFeed = playList[activeUserIndex];
    const totalStories = currentUserFeed.stories.length;

    // Nếu còn slide trong user hiện tại
    if (activeStoryIndex < totalStories - 1) {
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
      // Nếu hết slide, chuyển sang User tiếp theo
      if (activeUserIndex < playList.length - 1) {
        set({
          activeUserIndex: activeUserIndex + 1,
          activeStoryIndex: 0
        });
      } else {
        // Nếu là User cuối cùng, tự động đóng player
        get().closePlayer();
      }
    }
  },

  /**
   * Quay lại slide phía trước (Tự động quay lại User trước đó nếu đang ở slide đầu tiên)
   */
  prevStory: () => {
    const { playList, activeUserIndex, activeStoryIndex } = get();
    if (activeUserIndex === null || playList.length === 0) return;

    // Nếu đang ở slide thứ 2 trở đi
    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    } else {
      // Nếu đang ở slide đầu tiên, quay lại User trước đó
      if (activeUserIndex > 0) {
        const prevUserFeed = playList[activeUserIndex - 1];
        set({
          activeUserIndex: activeUserIndex - 1,
          activeStoryIndex: prevUserFeed.stories.length - 1
        });
      }
      // Nếu là User đầu tiên và slide đầu tiên, giữ nguyên
    }
  },

  pausePlayer: () => set({ isPlaying: false }),
  resumePlayer: () => set({ isPlaying: true })
}));
