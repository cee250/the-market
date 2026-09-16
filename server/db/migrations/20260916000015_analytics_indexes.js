/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.alterTable('vendor_orders', (t) => {
    t.index(['vendor_profile_id', 'status', 'created_at'], 'vendor_orders_vendor_status_created_idx');
  });
  await knex.schema.alterTable('order_items', (t) => {
    t.index(['product_id', 'vendor_order_id'], 'order_items_product_vendor_order_idx');
  });
};
exports.down = async (knex) => {
  await knex.schema.alterTable('order_items', (t) => { t.dropIndex(['product_id', 'vendor_order_id'], 'order_items_product_vendor_order_idx'); });
  await knex.schema.alterTable('vendor_orders', (t) => { t.dropIndex(['vendor_profile_id', 'status', 'created_at'], 'vendor_orders_vendor_status_created_idx'); });
};
