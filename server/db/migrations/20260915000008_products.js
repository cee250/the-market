/**
 * Phase 9 — vendor products and publishing state.
 *
 * Images are relational rows from the start; uploads/storage are added in a
 * later media phase.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE product_status AS ENUM ('DRAFT', 'PUBLISHED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    t.uuid('subcategory_id').references('id').inTable('subcategories').onDelete('SET NULL');
    t.string('name').notNullable();
    t.string('slug').notNullable();
    t.text('description');
    t.integer('price').notNullable();
    t.string('currency').notNullable().defaultTo('RWF');
    t.string('location').notNullable();
    t.string('condition').notNullable().defaultTo('new');
    t.string('availability').notNullable().defaultTo('in_stock');
    t.specificType('status', 'product_status').notNullable().defaultTo('DRAFT');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['vendor_profile_id', 'slug']);
    t.index(['vendor_profile_id', 'status'], 'products_vendor_status_idx');
    t.index(['category_id', 'status'], 'products_category_status_idx');
  });

  await knex.schema.createTable('product_images', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('url').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_cover').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['product_id', 'sort_order'], 'product_images_product_order_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('product_images');
  await knex.schema.dropTableIfExists('products');
  await knex.raw('DROP TYPE IF EXISTS product_status;');
};
