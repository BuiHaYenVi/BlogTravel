import { create } from 'zustand';
import api from '../../../shared/services/api';

export interface Destination {
  id: string;
  name: string;
  slug: string;
  short_desc: string;
  image: string;
  region: string;
  postCount: number;
  reviewCount: number;
  avgRating: number;
}

export interface DestinationDetail extends Destination {
  description: string;
  introduction: string;
  coverImage: string;
  gallery: string[];
  attractions: any[];
  experiences: any[];
  travelTips?: {
    di_chuyen: string;
    an_uong: string;
    luu_tru: string;
    luu_y: string;
  };
}


interface DestinationState {
  destinations: Destination[];
  currentDestination: DestinationDetail | null;
  loading: boolean;
  fetchDestinations: () => Promise<void>;
  fetchDestinationDetail: (slug: string) => Promise<void>;
}

import { PROVINCES } from '../../../services/mock/provinces';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const ASSETS_URL = BASE_URL.replace('/api', '');

const formatImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&w=1920&q=80';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = ASSETS_URL.endsWith('/') ? ASSETS_URL : `${ASSETS_URL}/`;
  
  return `${cleanBase}${cleanPath}`;
};

export const useDestinationStore = create<DestinationState>((set) => ({
  destinations: [],
  currentDestination: null,
  loading: false,

  fetchDestinations: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/locations');
      const mapped = response.data.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        slug: item.slug,
        short_desc: item.short_desc || '',
        image: formatImageUrl(item.image),
        region: item.region || '',
        postCount: parseInt(item.post_count) || 0,
        reviewCount: parseInt(item.review_count) || 0,
        avgRating: parseFloat(item.avg_rating) || 0
      }));
      set({ destinations: mapped, loading: false });
    } catch (error) {
      console.error('Fetch destinations failed, using mock data:', error);
      const mapped = PROVINCES.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_desc: p.description,
        image: p.coverImage,
        region: '',
        postCount: p.experiences.length,
        reviewCount: p.attractions.length * 10,
        avgRating: 4.5
      }));
      set({ destinations: mapped, loading: false });
    }
  },

  fetchDestinationDetail: async (slug: string) => {
    set({ loading: true, currentDestination: null });
    try {
      const response = await api.get(`/locations/${slug}`);
      const item = response.data.data;
      
      const mapped: DestinationDetail = {
        id: String(item.id),
        name: item.name,
        slug: item.slug,
        short_desc: item.short_desc || '',
        image: formatImageUrl(item.image),
        coverImage: formatImageUrl(item.image),
        description: item.description || '',
        introduction: item.short_desc || '',
        region: item.region || '',
        gallery: (item.gallery || []).map((img: string) => formatImageUrl(img)),
        postCount: parseInt(item.post_count) || 0,
        reviewCount: parseInt(item.review_count) || 0,
        avgRating: parseFloat(item.avg_rating) || 0,
        attractions: (item.attractions || []).map((spot: any) => ({
          ...spot,
          id: String(spot.id),
          image: formatImageUrl(spot.image)
        })),
        experiences: (item.blogs || []).map((blog: any) => ({
          id: String(blog.id),
          title: blog.title,
          image: formatImageUrl(blog.cover_image),
          excerpt: blog.short_intro || (blog.content ? blog.content.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...' : ''),
          loves: parseInt(blog.like_count) || 0,
          commentCount: parseInt(blog.comment_count) || 0, // Thêm trường này
          author: {
            name: blog.username || 'Traveler',
            avatar: blog.avatar ? (blog.avatar.startsWith('http') ? blog.avatar : `${ASSETS_URL}${blog.avatar}`) : 'https://i.pravatar.cc/150?u=default'
          },
          date: blog.created_at
        })),
        travelTips: item.travel_tips || {
          di_chuyen: "Thông tin đang được cập nhật.",
          an_uong: "Nhiều món đặc sản hấp dẫn đang chờ bạn khám phá.",
          luu_tru: "Đa dạng lựa chọn từ homestay đến khách sạn cao cấp.",
          luu_y: "Nên xem dự báo thời tiết trước khi khởi hành."
        }
      };
      set({ currentDestination: mapped, loading: false });
    } catch (error) {
      console.error('Fetch destination detail failed, using mock data:', error);
      const province = PROVINCES.find(p => p.slug === slug);
      if (province) {
        set({
          currentDestination: {
            id: province.id,
            name: province.name,
            slug: province.slug,
            short_desc: province.description,
            image: province.coverImage,
            coverImage: province.coverImage,
            description: province.introduction,
            introduction: province.introduction,
            region: '',
            postCount: province.experiences.length,
            reviewCount: 100,
            avgRating: 4.8,
            attractions: province.attractions,
            experiences: province.experiences,
            travelTips: province.travelTips,
            gallery: []
          },
          loading: false
        });
      } else {
        set({ loading: false });
      }
    }
  }
}));
