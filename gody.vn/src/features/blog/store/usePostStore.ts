import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BlogMeta {
  startDate: string;
  totalDays: string;
  cost: string;
  tags: string;
  provinceSlug?: string;
}

export interface Post {
  id: string;
  type: 'blog' | 'review';
  title: string;
  description?: string;
  content: string;
  image?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  meta?: BlogMeta;
  likes: number;
  comments: any[];
  createdAt: string;
}

interface PostState {
  posts: Post[];
  addPost: (postData: Partial<Post>) => string;
  getPostsByType: (type: 'blog' | 'review') => Post[];
}

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: [
        {
          id: 'p1',
          type: 'blog',
          title: 'Hành trình chinh phục Fansipan',
          content: 'Một trải nghiệm tuyệt vời khi đứng trên đỉnh cao nhất Đông Dương...',
          image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3',
          author: { id: 'u1', name: 'Thanh Vân', avatar: 'https://i.pravatar.cc/150?img=5' },
          likes: 124,
          comments: [],
          createdAt: new Date().toISOString()
        }
      ],
      
      addPost: (postData) => {
        const id = `p-${Math.random().toString(36).substring(2, 9)}`;
        const newPost = {
          ...postData,
          id,
          likes: postData.likes || 0,
          comments: postData.comments || [],
          createdAt: new Date().toISOString(),
        } as Post;
        
        set((state) => ({ posts: [newPost, ...state.posts] }));
        return id;
      },
      
      getPostsByType: (type) => {
        return get().posts.filter(p => p.type === type);
      }
    }),
    { name: 'travelbook-post-storage' }
  )
);
