/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('order_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.integer('amount').notNullable();
    t.string('currency').notNullable().defaultTo('RWF');
    t.string('provider').notNullable();
    t.string('provider_reference');
    t.string('status').notNullable().defaultTo('PENDING');
    t.uuid('verified_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('verified_at');
    t.text('failure_reason');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['order_id', 'status'], 'order_payments_order_status_idx');
  });
};
exports.down = async (knex) => { await knex.schema.dropTableIfExists('order_payments'); };
