// src/utils/jwt.js
const jwt = require('jsonwebtoken');

class JWTUtils {
  constructor(secret, refreshSecret) {
    this.accessTokenSecret = secret;
    this.refreshTokenSecret = refreshSecret;
  }

  generateAccessToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, this.accessTokenSecret, { expiresIn });
  }

  generateRefreshToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, this.refreshTokenSecret, { expiresIn });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtils;