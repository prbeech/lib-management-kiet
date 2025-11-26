export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  status: 'In Stock' | 'Out of Stock';
  coverUrl: string;
  rating: number; // 1-5
}

export interface RecommendationResponse {
  recommendedBookIds: string[];
  reasoning: string;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export type ViewState = 'CATALOG' | 'DETAILS' | 'ADMIN_DASHBOARD' | 'WISHLIST' | 'SEAT_MAP';