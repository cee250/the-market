/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.alterTable('orders', (t) => {
    t.string('idempotency_key', 120).unique();
  });
};
exports.down = async (knex) => {
  await knex.schema.alterTable('orders', (t) => { t.dropColumn('idempotency_key'); });
};
