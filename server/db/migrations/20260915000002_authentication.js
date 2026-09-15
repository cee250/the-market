/**
 * Phase 2 — authentication state.
 *
 * Passwords remain bcrypt hashes. Sessions and one-time tokens are stored as
 * SHA-256 digests so a database leak does not expose usable credentials.
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('users', (t) => {
    t.timestamp('email_verified_at');
  });

  await knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 64).notNullable().unique();
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_seen_at').notNullable().defaultTo(knex.fn.now());
    t.string('ip_address');
    t.text('user_agent');
    t.index(['user_id', 'expires_at'], 'sessions_user_expiry_idx');
  });

  await knex.schema.createTable('email_verification_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 64).notNullable().unique();
    t.timestamp('expires_at').notNullable();
    t.timestamp('used_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'expires_at'], 'email_verification_user_expiry_idx');
  });

  await knex.schema.createTable('password_reset_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 64).notNullable().unique();
    t.timestamp('expires_at').notNullable();
    t.timestamp('used_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'expires_at'], 'password_reset_user_expiry_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('email_verification_tokens');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('email_verified_at');
  });
};
