import { MetadataRoute } from 'next';
import { siteConfig } from '../config/site.config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.canonicalUrl || 'https://patchpilot.dev';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
