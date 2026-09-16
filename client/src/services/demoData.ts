import type { Category, Product } from '../types';

export const demoCategories: Category[] = [
  { slug: 'womens-fashion', name: "Women's Fashion", shortName: "Women's Fashion", description: 'Everyday looks and statement pieces.', image: '/images/categories/womens-fashion.jpg' },
  { slug: 'mens-fashion', name: "Men's Fashion", shortName: "Men's Fashion", description: 'Modern essentials for every day.', image: '/images/categories/mens-fashion.jpg' },
  { slug: 'mobiles-computers', name: 'Mobiles & Computers', shortName: 'Tech', description: 'Smart devices and useful accessories.', image: '/images/categories/mobiles-computers.jpg' },
  { slug: 'tv-electronics', name: 'TV & Electronics', shortName: 'Electronics', description: 'Upgrade your home entertainment.', image: '/images/categories/tv-electronics.jpg' },
  { slug: 'home-kitchen', name: 'Home & Kitchen', shortName: 'Home & Kitchen', description: 'Thoughtful pieces for your space.', image: '/images/categories/home-kitchen.jpg' },
  { slug: 'beauty-health', name: 'Beauty & Health', shortName: 'Beauty & Health', description: 'Small rituals, big difference.', image: '/images/categories/beauty-health.jpg' },
  { slug: 'outdoor-travel', name: 'Outdoor & Travel', shortName: 'Outdoor & Travel', description: 'Gear for weekends away and everyday adventures.', image: '/images/categories/home-kitchen.jpg' },
  { slug: 'gifts-stationery', name: 'Gifts & Stationery', shortName: 'Gifts & Stationery', description: 'Thoughtful finds for desks, homes and special moments.', image: '/images/categories/mobiles-computers.jpg' },
];

export const demoSubcategories: Record<string, { name: string; slug: string }[]> = {
  'womens-fashion': ['Dresses', 'Bags & Accessories', 'Shoes'].map((name) => ({ name, slug: name.toLowerCase().replaceAll(' ', '-') })),
  'mens-fashion': ['Shirts', 'Shoes', 'Accessories'].map((name) => ({ name, slug: name.toLowerCase() })),
  'mobiles-computers': ['Phones', 'Computers', 'Accessories'].map((name) => ({ name, slug: name.toLowerCase() })),
  'tv-electronics': ['Televisions', 'Audio', 'Smart Home'].map((name) => ({ name, slug: name.toLowerCase().replaceAll(' ', '-') })),
  'home-kitchen': ['Kitchen', 'Decor', 'Furniture'].map((name) => ({ name, slug: name.toLowerCase() })),
  'beauty-health': ['Skincare', 'Haircare', 'Wellness'].map((name) => ({ name, slug: name.toLowerCase() })),
  'outdoor-travel': ['Travel Gear', 'Camping', 'Fitness'].map((name) => ({ name, slug: name.toLowerCase().replaceAll(' ', '-') })),
  'gifts-stationery': ['Stationery', 'Gifts', 'Desk Accessories'].map((name) => ({ name, slug: name.toLowerCase().replaceAll(' ', '-') })),
};

const imageByCategory: Record<string, string> = Object.fromEntries(demoCategories.map((category) => [category.slug, category.image]));
const make = (id: string, name: string, categorySlug: string, price: number, originalPrice: number | undefined, rating: number, reviewCount: number, tags: Product['tags'], description: string, specs: Product['specs'], daysAgo: number): Product => ({
  id, slug: id, name, categorySlug, categoryName: demoCategories.find((c) => c.slug === categorySlug)?.name ?? 'Market', price, originalPrice, rating, reviewCount, description, specs, image: imageByCategory[categorySlug], stock: 8 + (Number(id.replace(/\D/g, '')) % 18), tags, createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
});

export const demoProducts: Product[] = [
  make('p-101', 'Linen Ease Co-ord Set', 'womens-fashion', 38900, 45900, 4.8, 124, ['featured', 'best-seller'], 'A breathable linen-blend set with an easy, polished silhouette for warm days and late dinners.', [{ label: 'Material', value: 'Linen blend' }, { label: 'Fit', value: 'Relaxed' }, { label: 'Care', value: 'Machine wash cold' }], 2),
  make('p-102', 'Minimal Leather Crossbody', 'womens-fashion', 27900, undefined, 4.7, 86, ['latest'], 'A compact everyday crossbody with a clean profile and room for the essentials.', [{ label: 'Material', value: 'Vegan leather' }, { label: 'Strap', value: 'Adjustable' }, { label: 'Closure', value: 'Zip top' }], 5),
  make('p-103', 'Everyday Oxford Shirt', 'mens-fashion', 24500, 29900, 4.6, 73, ['best-seller'], 'A crisp cotton Oxford that works just as well with denim as it does under a blazer.', [{ label: 'Material', value: '100% cotton' }, { label: 'Fit', value: 'Regular' }, { label: 'Sizes', value: 'S–XXL' }], 12),
  make('p-104', 'Trail Runner Sneakers', 'mens-fashion', 64900, undefined, 4.9, 211, ['featured', 'best-seller'], 'Lightweight everyday runners with a supportive sole for city miles and weekend trails.', [{ label: 'Upper', value: 'Breathable mesh' }, { label: 'Sole', value: 'EVA foam' }, { label: 'Weight', value: '280 g' }], 8),
  make('p-105', 'Pocket Pro Smartphone', 'mobiles-computers', 329900, 359900, 4.8, 98, ['featured', 'latest'], 'A fast, bright smartphone with all-day battery life and a camera ready for every moment.', [{ label: 'Display', value: '6.5-inch AMOLED' }, { label: 'Storage', value: '256 GB' }, { label: 'Battery', value: '5000 mAh' }], 1),
  make('p-106', 'Workday Wireless Keyboard', 'mobiles-computers', 54900, undefined, 4.5, 47, ['latest'], 'Quiet, comfortable typing with multi-device switching for a smoother workday.', [{ label: 'Layout', value: 'Compact full-size' }, { label: 'Connection', value: 'Bluetooth 5.2' }, { label: 'Battery', value: 'Up to 12 months' }], 4),
  make('p-107', 'Immersive 4K Smart TV', 'tv-electronics', 749900, 829900, 4.7, 62, ['featured'], 'Cinematic colour, clear dialogue and simple streaming in a slim modern frame.', [{ label: 'Resolution', value: '4K UHD' }, { label: 'Size', value: '55 inch' }, { label: 'Platform', value: 'Smart TV' }], 15),
  make('p-108', 'Portable Sound Capsule', 'tv-electronics', 79900, undefined, 4.6, 119, ['best-seller'], 'Room-filling sound in a splash-resistant speaker that travels anywhere.', [{ label: 'Playtime', value: '18 hours' }, { label: 'Connection', value: 'Bluetooth' }, { label: 'Water rating', value: 'IPX6' }], 20),
  make('p-109', 'Stoneware Breakfast Set', 'home-kitchen', 69900, undefined, 4.8, 54, ['latest'], 'A warm, tactile stoneware set for slower mornings and shared tables.', [{ label: 'Pieces', value: '12' }, { label: 'Material', value: 'Stoneware' }, { label: 'Care', value: 'Dishwasher safe' }], 6),
  make('p-110', 'Brew-at-Home Coffee Press', 'home-kitchen', 42900, 49900, 4.7, 88, ['best-seller'], 'A beautifully simple press for rich, balanced coffee without the fuss.', [{ label: 'Capacity', value: '1 litre' }, { label: 'Glass', value: 'Heat resistant' }, { label: 'Filter', value: 'Stainless steel' }], 10),
  make('p-111', 'Daily Glow Skincare Trio', 'beauty-health', 58900, undefined, 4.9, 167, ['featured', 'best-seller'], 'A gentle three-step routine for a fresh, hydrated everyday glow.', [{ label: 'Steps', value: 'Cleanse, tone, moisturise' }, { label: 'Skin type', value: 'All skin types' }, { label: 'Vegan', value: 'Yes' }], 3),
  make('p-112', 'Soft Touch Wellness Candle', 'beauty-health', 19900, undefined, 4.5, 39, ['new'], 'A calming botanical scent designed to make your evening routine feel special.', [{ label: 'Burn time', value: '40 hours' }, { label: 'Wax', value: 'Soy wax' }, { label: 'Scent', value: 'Cedar and fig' }], 1),
  make('p-113', 'Weekend Canvas Duffel', 'outdoor-travel', 74900, 89900, 4.8, 71, ['featured', 'latest'], 'A sturdy soft-sided duffel with thoughtful pockets for quick getaways and gym days.', [{ label: 'Capacity', value: '38 litres' }, { label: 'Material', value: 'Waxed canvas' }, { label: 'Strap', value: 'Padded shoulder strap' }], 2),
  make('p-114', 'Insulated Trail Bottle', 'outdoor-travel', 32900, undefined, 4.7, 105, ['best-seller'], 'Keeps cold drinks cold and hot drinks hot from the first mile to the last.', [{ label: 'Capacity', value: '750 ml' }, { label: 'Material', value: 'Stainless steel' }, { label: 'Insulation', value: 'Double wall' }], 7),
  make('p-115', 'Foldaway Picnic Blanket', 'outdoor-travel', 45900, undefined, 4.6, 48, ['new'], 'A water-resistant, easy-fold blanket for parks, beaches and slow afternoons outdoors.', [{ label: 'Size', value: '150 × 200 cm' }, { label: 'Top', value: 'Soft fleece' }, { label: 'Base', value: 'Water resistant' }], 4),
  make('p-116', 'Pocket Travel Adapter', 'outdoor-travel', 39900, 47900, 4.5, 63, ['latest'], 'One compact adapter for charging your essentials wherever the trip takes you.', [{ label: 'Ports', value: 'USB-C + USB-A' }, { label: 'Input', value: '100–240 V' }, { label: 'Design', value: 'Universal plug' }], 11),
  make('p-117', 'Undated Focus Planner', 'gifts-stationery', 18900, undefined, 4.9, 92, ['featured', 'best-seller'], 'A flexible planner with space for priorities, notes and the ideas worth keeping.', [{ label: 'Pages', value: '192' }, { label: 'Format', value: 'A5 hardcover' }, { label: 'Paper', value: '120 gsm' }], 3),
  make('p-118', 'Hand-thrown Desk Mug', 'gifts-stationery', 22900, undefined, 4.7, 36, ['new'], 'A tactile ceramic mug that brings a little character to your desk or breakfast table.', [{ label: 'Capacity', value: '350 ml' }, { label: 'Finish', value: 'Speckled glaze' }, { label: 'Care', value: 'Dishwasher safe' }], 6),
  make('p-119', 'Desk Bloom Mini Vase', 'gifts-stationery', 15900, undefined, 4.6, 27, ['latest'], 'A small sculptural vase for a single stem, a bedside bloom or a cheerful desk.', [{ label: 'Material', value: 'Ceramic' }, { label: 'Height', value: '14 cm' }, { label: 'Finish', value: 'Matte cream' }], 9),
  make('p-120', 'Maker’s Colour Pencil Set', 'gifts-stationery', 26900, 31900, 4.8, 58, ['best-seller'], 'Rich, blendable colour for notes, sketches and slow creative afternoons.', [{ label: 'Colours', value: '36' }, { label: 'Core', value: 'Soft wax' }, { label: 'Case', value: 'Reusable tin' }], 14),
];

export function findDemoProduct(id: string): Product | undefined {
  return demoProducts.find((product) => product.id === id || product.slug === id);
}
