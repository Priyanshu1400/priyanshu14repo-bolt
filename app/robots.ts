import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/account', '/login', '/cart', '/checkout', '/order-confirmation', '/order-success'],
    },
    sitemap: 'https://300mltea.com/sitemap.xml',
  };
}
