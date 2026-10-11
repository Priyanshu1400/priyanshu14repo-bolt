import type { MetadataRoute } from 'next';

const BASE = 'https://300mltea.com';

const PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/product', priority: 0.9 },
  { path: '/about', priority: 0.7 },
  { path: '/game', priority: 0.6 },
  { path: '/contact', priority: 0.5 },
  { path: '/track-order', priority: 0.5 },
  { path: '/shipping-policy', priority: 0.3 },
  { path: '/refund-policy', priority: 0.3 },
  { path: '/privacy-policy', priority: 0.3 },
  { path: '/terms-of-service', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, priority }) => ({ url: `${BASE}${path}`, lastModified, priority }));
}
