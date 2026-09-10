import { MetadataRoute } from "next";
import { getAllProducts, getAllCategories } from "@/lib/products";
import { STORE_INFO } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = STORE_INFO.siteUrl;
  const products = await getAllProducts();
  const categories = getAllCategories();
  const currentDate = new Date();

  const staticRoutes = [
    "",
    "/products",
    "/about",
    "/contact",
    "/privacy",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages for TR and EN
  staticRoutes.forEach((route) => {
    sitemapEntries.push({
      url: `${siteUrl}/tr${route}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: route === "" ? 1.0 : 0.8,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr${route}`,
          en: `${siteUrl}/en${route}`,
          "x-default": `${siteUrl}/tr${route}`,
        },
      },
    });

    sitemapEntries.push({
      url: `${siteUrl}/en${route}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: route === "" ? 1.0 : 0.8,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr${route}`,
          en: `${siteUrl}/en${route}`,
          "x-default": `${siteUrl}/tr${route}`,
        },
      },
    });
  });

  // Dynamic category pages
  categories.forEach((category) => {
    sitemapEntries.push({
      url: `${siteUrl}/tr/kategori/${category.id}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr/kategori/${category.id}`,
          en: `${siteUrl}/en/kategori/${category.id}`,
          "x-default": `${siteUrl}/tr/kategori/${category.id}`,
        },
      },
    });

    sitemapEntries.push({
      url: `${siteUrl}/en/kategori/${category.id}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr/kategori/${category.id}`,
          en: `${siteUrl}/en/kategori/${category.id}`,
          "x-default": `${siteUrl}/tr/kategori/${category.id}`,
        },
      },
    });
  });

  // Dynamic product pages
  products.forEach((product) => {
    const slugTr = product.slug_tr || product.id;
    const slugEn = product.slug_en || product.id;

    sitemapEntries.push({
      url: `${siteUrl}/tr/products/${slugTr}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr/products/${slugTr}`,
          en: `${siteUrl}/en/products/${slugEn}`,
          "x-default": `${siteUrl}/tr/products/${slugTr}`,
        },
      },
    });

    sitemapEntries.push({
      url: `${siteUrl}/en/products/${slugEn}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: {
          tr: `${siteUrl}/tr/products/${slugTr}`,
          en: `${siteUrl}/en/products/${slugEn}`,
          "x-default": `${siteUrl}/tr/products/${slugTr}`,
        },
      },
    });
  });

  return sitemapEntries;
}
