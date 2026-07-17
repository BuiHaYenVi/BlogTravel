import travelData from './vietnam_travel_db.json';

export interface Attraction {
  id: string;
  name: string;
  address: string;
  image: string;
  description?: string;
  rating?: number;
  reviews: number;
  category?: string;
  highlightReview?: {
    user: string;
    avatar: string;
    comment: string;
  };
}

export interface Experience {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  loves: number;
  comments: any[];
  slug?: string;
}

export interface Province {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  introduction: string;
  travelTips: {
    di_chuyen: string;
    an_uong: string;
    luu_tru: string;
    luu_y: string;
  };
  stats: {
    visited: number;
  };
  attractions: Attraction[];
  experiences: Experience[];
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const IMAGES = [
  'https://images.unsplash.com/photo-1496372412473-e8548ffd82bc',
  'https://images.unsplash.com/photo-1528127269322-539801943592',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
  'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482',
];

const REGION_MAPPING: Record<string, string[]> = {
  'Miền Bắc': [
    'Lào Cai', 'Yên Bái', 'Điện Biên', 'Hòa Bình', 'Lai Châu', 'Sơn La',
    'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ',
    'Bắc Giang', 'Quảng Ninh', 'Bắc Ninh', 'Hà Nam', 'Hà Nội', 'Hải Dương', 'Hải Phòng',
    'Hưng Yên', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Vĩnh Phúc'
  ],
  'Miền Trung': [
    'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế',
    'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận'
  ],
  'Tây Nguyên': [
    'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
  ],
  'Miền Nam': [
    'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa – Vũng Tàu', 'TP. Hồ Chí Minh'
  ],
  'Miền Tây': [
    'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp',
    'An Giang', 'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
  ]
};

const getRegion = (provinceName: string) => {
  for (const [region, provinces] of Object.entries(REGION_MAPPING)) {
    if (provinces.some(p => provinceName.includes(p) || p.includes(provinceName))) {
      return region;
    }
  }
  return 'Khác';
};

const TARGET_34 = [
  'Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Thừa Thiên Huế', 'TP. Huế', 'TP. Hồ Chí Minh', 
  'An Giang', 'Bắc Ninh', 'Cao Bằng', 'Cà Mau', 'Đắk Lắk', 'Đồng Nai', 'Đồng Tháp', 
  'Điện Biên', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 
  'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ninh', 'Quảng Ngãi', 
  'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long'
];

export const PROVINCES: Province[] = travelData
  .filter(item => TARGET_34.includes(item.tinh_thanh))
  .map((item, index) => {
  const provinceName = item.tinh_thanh;
  const data = item.data;
  
  return {
    id: String(index + 1),
    name: provinceName,
    slug: slugify(provinceName),
    description: data.gioi_thieu.substring(0, 100) + '...',
    introduction: data.gioi_thieu,
    coverImage: IMAGES[index % IMAGES.length] + '?auto=format&fit=crop&w=1200&q=80',
    region: getRegion(provinceName), // <--- Added region
    travelTips: {
      di_chuyen: data.kinh_nghiem.di_chuyen,
      an_uong: data.kinh_nghiem.an_uong,
      luu_tru: data.kinh_nghiem.luu_tru,
      luu_y: data.kinh_nghiem.luu_y
    },
    stats: {
      visited: Math.floor(Math.random() * 100000) + 10000
    },
    attractions: data.diem_du_lich.map((spot, sIdx) => ({
      id: `${slugify(provinceName)}-${sIdx + 1}`,
      name: spot.ten,
      address: provinceName,
      image: IMAGES[(index + sIdx + 1) % IMAGES.length] + '?auto=format&fit=crop&w=600&q=80',
      description: spot.mo_ta,
      rating: 4.5 + (Math.random() * 0.5),
      reviews: Math.floor(Math.random() * 1000) + 100,
      category: 'Điểm tham quan',
      highlightReview: {
        user: 'Traveler',
        avatar: `https://i.pravatar.cc/150?u=${sIdx}`,
        comment: spot.diem_noi_bat
      }
    })),
    experiences: [
      {
        id: `blog-${slugify(provinceName)}-1`,
        title: `Kinh nghiệm du lịch ${provinceName} tự túc chi tiết nhất`,
        excerpt: `Khám phá những góc nhìn mới lạ và trải nghiệm văn hóa đặc sắc tại ${provinceName} cùng cộng đồng Gody.`,
        image: IMAGES[(index + 2) % IMAGES.length] + '?auto=format&fit=crop&w=800&q=80',
        author: {
          name: 'Gody Editor',
          avatar: 'https://i.pravatar.cc/150?u=gody'
        },
        loves: Math.floor(Math.random() * 100),
        comments: []
      }
    ]
  };
});
