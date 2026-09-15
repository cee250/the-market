/**
 * Phase 6 — package entitlements.
 *
 * An entitlement snapshots the package limits granted to a vendor. Package
 * edits affect future entitlements, not historical grants.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE entitlement_status AS ENUM ('ACTIVE', 'INACTIVE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('vendor_entitlements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().unique().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('package_id').notNullable().references('id').inTable('packages').onDelete('RESTRICT');
    t.integer('product_limit').notNullable();
    t.integer('duration_days').notNullable();
    t.integer('amount').notNullable();
    t.string('currency').notNullable();
    t.specificType('status', 'entitlement_status').notNullable().defaultTo('INACTIVE');
    t.timestamp('granted_at');
    t.timestamp('revoked_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['status', 'vendor_profile_id'], 'vendor_entitlements_status_vendor_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('vendor_entitlements');
  await knex.raw('DROP TYPE IF EXISTS entitlement_status;');
};
