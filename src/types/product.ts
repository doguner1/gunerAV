export interface Product {
  id: string;
  category: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  price: number | null;
  discount_percent: number | null;
  images: string[];
  featured: boolean;
  in_stock: boolean;
  requires_license: boolean;
  slug_tr?: string;
  slug_en?: string;
  specs_tr?: Record<string, string | undefined>;
  specs_en?: Record<string, string | undefined>;
}

export interface Category {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon?: string;
  image: string;
}
