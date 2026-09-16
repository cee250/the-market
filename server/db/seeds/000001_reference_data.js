/**
 * Phase 1 seed — foundational reference data (idempotent, safe to re-run):
 *  - Basic package: 5,000 RWF / 20 products / 30 days (spec §5)
 *  - Categories + subcategories (spec §40)
 *  - Super admin (bcrypt-hashed password from env — spec §42)
 *
 * @param {import('knex').Knex} knex
 */
const bcrypt = require('bcryptjs');

const CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'TVs, appliances, audio and smart home devices.',
    subcategories: [
      { name: 'TVs & Appliances', slug: 'tvs-appliances' },
      { name: 'Audio', slug: 'audio' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Smart Home', slug: 'smart-home' },
    ],
  },
  {
    name: 'Phones',
    slug: 'phones',
    description: 'Smartphones, tablets and phone accessories.',
    subcategories: [
      { name: 'Smartphones', slug: 'smartphones' },
      { name: 'Tablets', slug: 'tablets' },
      { name: 'Accessories', slug: 'phone-accessories' },
    ],
  },
  {
    name: 'Computers',
    slug: 'computers',
    description: 'Laptops, desktops and components.',
    subcategories: [
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Desktops', slug: 'desktops' },
      { name: 'Components', slug: 'components' },
      { name: 'Peripherals', slug: 'peripherals' },
    ],
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, footwear and accessories for everyone.',
    subcategories: [
      { name: "Men's Clothing", slug: 'mens-clothing' },
      { name: "Women's Clothing", slug: 'womens-clothing' },
      { name: 'Footwear', slug: 'footwear' },
      { name: 'Accessories', slug: 'fashion-accessories' },
    ],
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Furniture, kitchen, decor and gardening.',
    subcategories: [
      { name: 'Kitchen & Dining', slug: 'kitchen-dining' },
      { name: 'Furniture', slug: 'furniture' },
      { name: 'Decor', slug: 'decor' },
      { name: 'Gardening', slug: 'gardening' },
    ],
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, fragrance, hair care and makeup.',
    subcategories: [
      { name: 'Skincare', slug: 'skincare' },
      { name: 'Fragrance', slug: 'fragrance' },
      { name: 'Hair Care', slug: 'hair-care' },
      { name: 'Makeup', slug: 'makeup' },
    ],
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Cars, motorbikes and parts.',
    subcategories: [
      { name: 'Cars', slug: 'cars' },
      { name: 'Motorbikes', slug: 'motorbikes' },
      { name: 'Parts & Spares', slug: 'parts-spares' },
    ],
  },
  {
    name: 'Services',
    slug: 'services',
    description: 'Repairs, installation, delivery and more.',
    subcategories: [
      { name: 'Repairs', slug: 'repairs' },
      { name: 'Installation', slug: 'installation' },
      { name: 'Delivery', slug: 'delivery-services' },
    ],
  },
];

/** Upsert a single row (idempotent seed). */
async function upsert(knex, table, where, row) {
  const existing = await knex(table).where(where).first();
  if (existing) {
    await knex(table).where(where).update(row);
  } else {
    await knex(table).insert(row);
  }
}

exports.seed = async (knex) => {
  // ── Packages ───────────────────────────────────────────────────────────
  await upsert(knex, 'packages', { name: 'Basic' }, {
    name: 'Basic',
    description: 'Launch package: 20 published products, 30 days of marketplace access.',
    price: 5000,
    currency: 'RWF',
    product_limit: 20,
    duration_days: 30,
    is_active: true,
  });
  console.log('✓ package: Basic — 5,000 RWF, 20 products, 30 days');

  // ── Categories + subcategories ─────────────────────────────────────────
  for (const [index, cat] of CATEGORIES.entries()) {
    const row = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      is_active: true,
      sort_order: index,
    };
    await upsert(knex, 'categories', { slug: cat.slug }, row);

    const category = await knex('categories').where({ slug: cat.slug }).first();
    for (const [subIndex, sub] of cat.subcategories.entries()) {
      await upsert(knex, 'subcategories', { category_id: category.id, slug: sub.slug }, {
        name: sub.name,
        slug: sub.slug,
        category_id: category.id,
        is_active: true,
        sort_order: subIndex,
      });
    }
  }
  console.log(`✓ categories: ${CATEGORIES.length} (with subcategories)`);

  // ── Super admin (bcrypt-hashed) ────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL ?? 'admin@market.rw';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  if (process.env.NODE_ENV === 'production' && (password === 'ChangeMe123!' || password.length < 12)) {
    throw new Error('ADMIN_PASSWORD must be explicitly configured with at least 12 characters in production.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await upsert(knex, 'users', { email }, {
    name: 'Super Admin',
    email,
    password_hash: passwordHash,
    role: 'ADMIN',
    is_active: true,
  });
  console.log(`✓ admin user: ${email}`);
};
