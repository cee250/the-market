/** @param {import('knex').Knex} knex */
exports.up = async (knex) => { await knex.schema.alterTable('orders', (t) => { t.string('province'); t.string('district'); t.string('sector'); t.text('delivery_instructions'); }); };
exports.down = async (knex) => { await knex.schema.alterTable('orders', (t) => { t.dropColumn('province'); t.dropColumn('district'); t.dropColumn('sector'); t.dropColumn('delivery_instructions'); }); };
