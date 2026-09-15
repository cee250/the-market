/**
 * Phase 7 — subscriptions and renewal history.
 *
 * Subscription timestamps are authoritative in the database. The browser only
 * displays the remaining time returned by the API.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('subscriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().unique().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('package_id').notNullable().references('id').inTable('packages').onDelete('RESTRICT');
    t.uuid('payment_id').references('id').inTable('vendor_payments').onDelete('SET NULL');
    t.integer('amount').notNullable();
    t.string('currency').notNullable();
    t.timestamp('start_date').notNullable();
    t.timestamp('end_date').notNullable();
    t.specificType('status', 'subscription_status').notNullable().defaultTo('ACTIVE');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['status', 'end_date'], 'subscriptions_status_end_idx');
  });

  await knex.schema.createTable('subscription_renewals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('subscriptions').onDelete('CASCADE');
    t.uuid('vendor_profile_id').notNullable().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('package_id').notNullable().references('id').inTable('packages').onDelete('RESTRICT');
    t.uuid('payment_id').references('id').inTable('vendor_payments').onDelete('SET NULL');
    t.integer('amount').notNullable();
    t.string('currency').notNullable();
    t.timestamp('start_date').notNullable();
    t.timestamp('end_date').notNullable();
    t.timestamp('approved_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    t.index(['vendor_profile_id', 'approved_at'], 'subscription_renewals_vendor_approved_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('subscription_renewals');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.raw('DROP TYPE IF EXISTS subscription_status;');
};
