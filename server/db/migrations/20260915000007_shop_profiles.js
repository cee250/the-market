/**
 * Phase 8 — shop profile metadata and social links.
 *
 * Product content is intentionally left for Phase 9; public shops expose an
 * empty product list until product CRUD exists.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('vendor_profiles', (t) => {
    t.text('description');
    t.string('logo_url');
  });

  await knex.schema.createTable('vendor_social_links', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('vendor_profile_id').notNullable().references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.string('platform').notNullable();
    t.string('url').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['vendor_profile_id', 'platform']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('vendor_social_links');
  await knex.schema.alterTable('vendor_profiles', (t) => {
    t.dropColumn('description');
    t.dropColumn('logo_url');
  });
};
