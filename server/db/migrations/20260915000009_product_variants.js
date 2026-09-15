/**
 * Phase 10 — product SKUs, variants, and variant images.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('products', (t) => {
    t.string('sku');
    t.unique(['vendor_profile_id', 'sku']);
  });

  await knex.schema.createTable('product_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('sku').notNullable();
    t.string('color');
    t.string('size');
    t.string('storage');
    t.string('model');
    t.integer('price');
    t.integer('stock').notNullable().defaultTo(0);
    t.string('availability').notNullable().defaultTo('in_stock');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['product_id', 'sku']);
    t.index(['product_id', 'is_active'], 'product_variants_product_active_idx');
  });

  await knex.schema.createTable('variant_images', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('variant_id').notNullable().references('id').inTable('product_variants').onDelete('CASCADE');
    t.string('url').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('variant_images');
  await knex.schema.dropTableIfExists('product_variants');
  await knex.schema.alterTable('products', (t) => {
    t.dropUnique(['vendor_profile_id', 'sku']);
    t.dropColumn('sku');
  });
};
