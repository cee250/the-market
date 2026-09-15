import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    slug: 'mobiles-computers',
    name: 'Mobiles, Computers',
    shortName: 'Mobiles & Computers',
    description: 'Phones, laptops, tablets and the accessories that keep you connected.',
    image: '/images/categories/mobiles-computers.jpg',
  },
  {
    slug: 'tv-electronics',
    name: 'TV, Appliances, Electronics',
    shortName: 'TV & Electronics',
    description: 'Smart TVs, kitchen appliances and everyday electronics for every home.',
    image: '/images/categories/tv-electronics.jpg',
  },
  {
    slug: 'mens-fashion',
    name: "Men's Fashion",
    shortName: "Men's Fashion",
    description: 'From everyday essentials to statement pieces, look sharp every day.',
    image: '/images/categories/mens-fashion.jpg',
  },
  {
    slug: 'womens-fashion',
    name: "Women's Fashion",
    shortName: "Women's Fashion",
    description: 'Dresses, bags and accessories that follow the season, not the crowd.',
    image: '/images/categories/womens-fashion.jpg',
  },
  {
    slug: 'home-kitchen-pets',
    name: 'Home, Kitchen, Pets',
    shortName: 'Home, Kitchen & Pets',
    description: 'Upgrade your space, your kitchen and your pet corner with curated picks.',
    image: '/images/categories/home-kitchen.jpg',
  },
  {
    slug: 'beauty-health-grocery',
    name: 'Beauty, Health, Grocery',
    shortName: 'Beauty & Grocery',
    description: 'Skincare, fragrance and pantry staples — self care made simple.',
    image: '/images/categories/beauty-health.jpg',
  },
];

export const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));
