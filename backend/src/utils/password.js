const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

module.exports = { hashPassword, SALT_ROUNDS };
