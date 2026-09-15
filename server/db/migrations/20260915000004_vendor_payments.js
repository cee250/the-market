/**
 * Phase 4 — vendor payment/deal records and admin review.
 *
 * Amount/currency are snapshots from the selected package at submission time;
 * package edits must not rewrite historical payment records.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE vendor_payment_status AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('vendor_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().references('id').inTable('vendor_profiles').onDelete('RESTRICT');
    t.uuid('package_id').notNullable().references('id').inTable('packages').onDelete('RESTRICT');
    t.integer('amount').notNullable();
    t.string('currency').notNullable();
    t.string('payment_method').notNullable();
    t.string('reference');
    t.text('notes');
    t.specificType('status', 'vendor_payment_status').notNullable().defaultTo('PENDING_REVIEW');
    t.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('reviewed_at');
    t.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    t.text('review_note');
    t.index(['status', 'submitted_at'], 'vendor_payments_status_submitted_idx');
    t.index(['vendor_profile_id', 'submitted_at'], 'vendor_payments_vendor_submitted_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('vendor_payments');
  await knex.raw('DROP TYPE IF EXISTS vendor_payment_status;');
};
