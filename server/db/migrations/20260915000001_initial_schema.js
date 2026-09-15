/**
 * Phase 1 — initial schema (foundational entities only).
 *
 * Tables: users, categories, subcategories, packages, audit_logs
 * Naming: snake_case (matches the eventual entity list in the spec, §41).
 *
 * @param {import('knex').Knex} knex
 */

exports.up = async (knex) => {
  // Postgres enum for user roles (spec §2: CUSTOMER / VENDOR / ADMIN)
  await knex.raw(
    `DO $$ BEGIN
       CREATE TYPE user_role AS ENUM ('CUSTOMER', 'VENDOR', 'ADMIN');
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`,
  );

  // ── users ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('phone');
    t.text('password_hash'); // bcrypt — never plaintext (spec §42)
    t.specificType('role', 'user_role').notNullable().defaultTo('CUSTOMER');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // ── categories ─────────────────────────────────────────────────────────
  await knex.schema.createTable('categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable().unique();
    t.string('slug').notNullable().unique();
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // ── subcategories ──────────────────────────────────────────────────────
  await knex.schema.createTable('subcategories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('slug').notNullable();
    t.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['category_id', 'slug']);
  });

  // ── packages (vendor subscription packages — spec §5/§6) ──────────────
  await knex.schema.createTable('packages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable().unique();
    t.text('description');
    t.integer('price').notNullable(); // RWF, integer
    t.string('currency').notNullable().defaultTo('RWF');
    t.integer('product_limit').notNullable(); // never hard-coded in app code
    t.integer('duration_days').notNullable().defaultTo(30);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // ── audit_logs (append-only trail — spec §44) ─────────────────────────
  await knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('actor_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('action').notNullable();
    t.string('entity');
    t.string('entity_id');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['actor_id', 'created_at'], 'audit_logs_actor_created_idx');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('packages');
  await knex.schema.dropTableIfExists('subcategories');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
  await knex.raw(`DROP TYPE IF EXISTS user_role;`);
};
