/**
 * Phase 11 — simple vendor inventory and stock movement ledger.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE inventory_status AS ENUM ('ACTIVE', 'ARCHIVED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE stock_movement_type AS ENUM ('OPENING', 'ADDITION', 'SALE', 'ADJUSTMENT');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('inventory_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
    t.uuid('variant_id').references('id').inTable('product_variants').onDelete('SET NULL');
    t.string('name').notNullable();
    t.string('sku');
    t.integer('opening_quantity').notNullable().defaultTo(0);
    t.integer('low_stock_threshold').notNullable().defaultTo(5);
    t.text('notes');
    t.specificType('status', 'inventory_status').notNullable().defaultTo('ACTIVE');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['vendor_profile_id', 'status'], 'inventory_items_vendor_status_idx');
  });

  await knex.schema.createTable('stock_movements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('inventory_item_id').notNullable().references('id').inTable('inventory_items').onDelete('CASCADE');
    t.specificType('type', 'stock_movement_type').notNullable();
    t.integer('quantity_delta').notNullable();
    t.text('note');
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['inventory_item_id', 'created_at'], 'stock_movements_item_created_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('inventory_items');
  await knex.raw('DROP TYPE IF EXISTS stock_movement_type;');
  await knex.raw('DROP TYPE IF EXISTS inventory_status;');
};
