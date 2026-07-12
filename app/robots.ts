import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/go/", "/api/"],
    },
    sitemap: "https://prebuilts.co/sitemap.xml",
  };
}
