export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  fullName?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  phone?: string;
  joiningDate?: string;
  mutuals?: number;
  savedDestinations: string[];
  following: string[];
  isPartner?: boolean;
  role?: string;
  role_id?: number;
  role_level?: number;
  hometown?: string;
  current_city?: string;
  birth_date?: string;
  education_school?: string;
  workplace?: string;
  permissions?: string[];
  username?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    avatar: string;
  };
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password?: string;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  comments: any[];
  destinations?: string[];
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  location: {
    lat: number;
    lng: number;
  };
}
