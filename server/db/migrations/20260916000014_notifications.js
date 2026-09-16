/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('type').notNullable();
    t.string('title').notNullable();
    t.text('message').notNullable();
    t.jsonb('metadata').notNullable().defaultTo('{}');
    t.timestamp('read_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'read_at', 'created_at'], 'notifications_user_read_created_idx');
  });
};
exports.down = async (knex) => { await knex.schema.dropTableIfExists('notifications'); };
