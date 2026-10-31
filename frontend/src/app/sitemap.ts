import { MetadataRoute } from 'next';
import { siteConfig } from '../config/site.config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.canonicalUrl || 'https://patchpilot.dev';
  const routes = ['', '/dashboard', '/docs', '/domain', '/install', '/privacy', '/terms'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.8,
  }));
}
