import productsData from "../../data/products.json";
import categoriesData from "../../data/categories.json";
import { Product, Category } from "@/types/product";

const products = productsData as unknown as Product[];
const categories = categoriesData as unknown as Category[];

export function getAllProducts(): Product[] {
  return products;
}

export function getAllCategories(): Category[] {
  return categories;
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}

export function getDealsProducts(): Product[] {
  return products.filter(
    (product) => product.discount_percent && product.discount_percent > 0
  );
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string, locale: string = "tr"): Product | undefined {
  return products.find((p) => {
    if (p.id === slug) return true;
    if (locale === "tr" && p.slug_tr === slug) return true;
    if (locale === "en" && p.slug_en === slug) return true;
    return p.slug_tr === slug || p.slug_en === slug;
  });
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getRelatedProducts(currentId: string, category: string, limit: number = 3): Product[] {
  return products
    .filter((p) => p.category === category && p.id !== currentId)
    .slice(0, limit);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug || c.id === slug);
}
