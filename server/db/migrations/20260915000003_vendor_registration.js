/**
 * Phase 3 — vendor registration and terms acceptance.
 *
 * Vendor registration creates a VENDOR account in PENDING_PAYMENT state. It
 * does not activate the account or start any subscription.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE vendor_status AS ENUM (
        'PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRING_SOON',
        'EXPIRED', 'SUSPENDED', 'DEACTIVATED'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('vendor_profiles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    t.string('business_name').notNullable();
    t.string('slug').notNullable().unique();
    t.string('phone').notNullable();
    t.string('location').notNullable();
    t.specificType('status', 'vendor_status').notNullable().defaultTo('PENDING_PAYMENT');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('terms_acceptances', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('terms_version').notNullable();
    t.timestamp('accepted_at').notNullable().defaultTo(knex.fn.now());
    t.string('ip_address');
    t.text('user_agent');
    t.index(['user_id', 'terms_version'], 'terms_acceptances_user_version_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('terms_acceptances');
  await knex.schema.dropTableIfExists('vendor_profiles');
  await knex.raw('DROP TYPE IF EXISTS vendor_status;');
};
