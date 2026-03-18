export type Book = {
  title: string;
  slug: string;
  author: string;
  genre: string;
  format: string;
  language: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  badge?: string;
  inventory: number;
  pages: number;
  publishedYear: number;
  isbn: string;
  palette: [string, string];
  description: string;
  longDescription: string[];
  highlights: string[];
  tags: string[];
};

export type CreateBookInput = {
  title: string;
  slug?: string;
  author: string;
  genre: string;
  format: string;
  language: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  featured?: boolean;
  badge?: string;
  inventory: number;
  pages: number;
  publishedYear: number;
  isbn: string;
  palette?: [string, string];
  description: string;
  longDescription?: string[];
  highlights?: string[];
  tags?: string[];
};

export type BookFilters = {
  query?: string;
  genre?: string;
  featured?: boolean;
  limit?: number;
  excludeSlug?: string;
};

export type ShelfFeature = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  note: string;
  gradient: string;
};

export type StoreStat = {
  value: string;
  label: string;
  copy: string;
};

export type ServiceHighlight = {
  title: string;
  description: string;
};
