import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.resulthubnsut.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/dtu', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/result', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/analytics', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/compare', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/battle', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/subjects', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/bulk', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/wrapped', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/twin', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/tools/cgpa-calculator', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
