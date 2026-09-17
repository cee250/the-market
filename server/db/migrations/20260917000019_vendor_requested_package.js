exports.up = async (knex) => {
  await knex.schema.alterTable('vendor_profiles', (t) => { t.string('requested_package_name').notNullable().defaultTo('Basic'); });
  await knex('packages').insert([{ name: 'Growth', description: 'Growth package: 30 published products, 30 days of marketplace access.', price: 100000, currency: 'RWF', product_limit: 30, duration_days: 30, is_active: true }, { name: 'Unlimited', description: 'Unlimited package: unlimited published products, 30 days of marketplace access.', price: 20000, currency: 'RWF', product_limit: 1000000, duration_days: 30, is_active: true }]).onConflict('name').ignore();
};
exports.down = async (knex) => { await knex.schema.alterTable('vendor_profiles', (t) => { t.dropColumn('requested_package_name'); }); };
