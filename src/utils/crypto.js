//src/utils/crypto.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class CryptoUtils {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = CryptoUtils;