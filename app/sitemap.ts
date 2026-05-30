import { MetadataRoute } from 'next';
import getDb from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const db = getDb();
  const states = db.prepare('SELECT slug FROM states').all() as { slug: string }[];
  const cities = db.prepare('SELECT slug, state_slug FROM cities').all() as { slug: string; state_slug: string }[];
  const utilities = db.prepare('SELECT slug FROM utilities').all() as { slug: string }[];

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/solar-calculator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];

  const statePages: MetadataRoute.Sitemap = states.flatMap(s => [
    { url: `${SITE_URL}/solar-cost/${s.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/solar-incentives/${s.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]);

  const cityPages: MetadataRoute.Sitemap = cities.map(c => ({
    url: `${SITE_URL}/solar-cost/${c.state_slug}/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const utilityPages: MetadataRoute.Sitemap = utilities.map(u => ({
    url: `${SITE_URL}/net-metering/${u.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...statePages, ...cityPages, ...utilityPages];
}
