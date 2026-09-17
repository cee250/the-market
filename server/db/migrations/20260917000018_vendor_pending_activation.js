/** Keep vendor registrations inactive until an admin approves them. */
exports.up = async (knex) => { await knex('users').where({ role: 'VENDOR' }).update({ is_active: false }); };
exports.down = async () => {};
