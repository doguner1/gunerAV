import { MetadataRoute } from "next";
import { STORE_INFO } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${STORE_INFO.siteUrl}/sitemap.xml`,
  };
}
