import { create } from 'zustand';
import api from '../../../shared/services/api';
import { PROVINCES } from '../../../services/mock/provinces';
import { useAuthStore } from '../../auth/store/useAuthStore';

export interface Author {
  name: string;
  avatar: string;
  is_verified?: boolean;
  badge_title?: string;
}

export interface Blog {
  id: string;
  user_id: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  type: 'horizontal' | 'multi-image';
  images: string[];
  coverImage?: string;
  author: Author;
  likes: number;
  isLiked?: boolean;
  commentCount: number;
  category: string;
  createdAt: string;
}

interface BlogState {
  blogs: Blog[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  fetchBlogs: (page?: number, reset?: boolean) => Promise<void>;
  addBlog: (blogData: any) => Promise<any>;
  deleteBlog: (id: string) => Promise<boolean>;
  likeBlog: (id: string) => Promise<void>;
  unlikeBlog: (id: string) => Promise<void>;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';
const ASSETS_URL = BASE_URL.replace('/api', '');

const formatImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = ASSETS_URL.endsWith('/') ? ASSETS_URL : `${ASSETS_URL}/`;
  
  return `${cleanBase}${cleanPath}`;
};

export const useBlogStore = create<BlogState>((set, get) => ({
  blogs: [],
  loading: false,
  page: 1,
  hasMore: true,

  fetchBlogs: async (page = 1, reset = false) => {
    set({ loading: true });
    try {
      const response = await api.get(`/blogs?page=${page}&limit=5`);
      const blogsData = response.data.data?.blogs || response.data.data || [];
      const blogsList = Array.isArray(blogsData) ? blogsData : [];
      
      const mappedBlogs = blogsList.map((item: any) => {
        const gallery = Array.isArray(item.images)
          ? item.images.map((img: string) => formatImageUrl(img)).filter(Boolean)
          : [];
        const cover = item.cover_image ? formatImageUrl(item.cover_image) : (gallery[0] || formatImageUrl(null));

        return {
          id: String(item.id),
          user_id: String(item.user_id),
          title: item.title || 'Bài viết',
          slug: item.slug,
          excerpt: item.short_intro || item.content?.substring(0, 160) || '',
          content: item.content || '',
          type: ((item.tag_count > 0 || gallery.length > 1) ? 'multi-image' : 'horizontal') as 'multi-image' | 'horizontal',
          images: gallery.length > 0 ? gallery : [cover],
          coverImage: cover,
          author: {
            name: item.full_name || item.username || 'Thành viên',
            avatar: item.avatar 
              ? (item.avatar.startsWith('http') ? item.avatar : `${ASSETS_URL}${item.avatar}`)
              : 'https://i.pravatar.cc/150?u=default',
            is_verified: item.is_verified === true || item.is_verified === 't' || item.is_verified === '1' || item.is_verified === 1,
            badge_title: item.badge_title || null
          },
          likes: parseInt(item.like_count) || 0,
          isLiked: !!item.is_liked && (item.is_liked === true || item.is_liked === 1 || item.is_liked === '1' || item.is_liked === 't' || item.is_liked === 'true'),
          commentCount: parseInt(item.comment_count) || 0,
          category: item.location_name || 'HÀNH TRÌNH',
          createdAt: item.created_at || item.published_at || new Date().toISOString()
        };
      });
      
      set((state) => ({ 
        blogs: reset ? mappedBlogs : [...state.blogs, ...mappedBlogs], 
        loading: false,
        page: page,
        hasMore: mappedBlogs.length === 5 // 5 is the limit we passed
      }));
    } catch (error) {
      console.error('Fetch blogs failed:', error);
      set({ blogs: [], loading: false });
    }
  },

  addBlog: async (blogData) => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Vui lòng đăng nhập');

      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('title', blogData.title || 'Chia sẻ trải nghiệm');
      formData.append('content', blogData.content || '');
      formData.append('short_intro', blogData.short_intro || blogData.excerpt || '');
      formData.append('status', 'published');

      if (blogData.coverFile) {
        formData.append('cover_image', blogData.coverFile);
      }

      if (blogData.meta) {
        formData.append('start_date', blogData.meta.startDate || '');
        formData.append('end_date', blogData.meta.endDate || ''); // Đã đổi từ totalDays sang endDate
        formData.append('budget', blogData.meta.cost || '');
        formData.append('tags', blogData.meta.tags || '');

        if (blogData.meta.locationId) {
          formData.append('location_id', blogData.meta.locationId);
        } else if (blogData.meta.provinceSlug) {
          const province = PROVINCES.find(p => p.slug === blogData.meta.provinceSlug);
          if (province) {
            formData.append('location_id', province.id);
          }
        }
      }

      if (blogData.images && Array.isArray(blogData.images)) {
        blogData.images.forEach((file: File) => {
          formData.append('images[]', file);
        });
      }

      const response = await api.post('/blogs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Reload list in background
        get().fetchBlogs();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Không thể tạo bài viết');
    } catch (error: any) {
      console.error('Create blog failed:', error);
      throw error;
    }
  },

  deleteBlog: async (id: string) => {
    try {
      const response = await api.delete(`/blogs/${id}`);
      if (response.data.success) {
        set((state) => ({
          blogs: state.blogs.filter(b => b.id !== id)
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete blog failed:', error);
      return false;
    }
  },

  likeBlog: async (id) => {
    try {
      const response = await api.post(`/blogs/${id}/like`);
      if (response.data.success) {
        set((state) => ({
          blogs: state.blogs.map(b => 
            b.id === id ? { ...b, likes: b.likes + 1, isLiked: true } : b
          )
        }));
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        get().unlikeBlog(id);
      } else {
        console.error('Like blog failed:', error);
      }
    }
  },

  unlikeBlog: async (id) => {
    try {
      const response = await api.delete(`/blogs/${id}/like`);
      if (response.data.success) {
        set((state) => ({
          blogs: state.blogs.map(b => 
            b.id === id ? { ...b, likes: Math.max(0, b.likes - 1), isLiked: false } : b
          )
        }));
      }
    } catch (error) {
      console.error('Unlike blog failed:', error);
    }
  }
}));
