<!-- PURPOSE OF THIS FILE: JWT işlemleri — sign ve verify yardımcıları -->
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * JWT token oluşturur.
 * @param {object} payload — token içine gömülecek veri (örn: { id, email, role })
 * @param {string} [expiresIn='24h'] — süre
 * @returns {string} JWT token
 */
function signToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

/**
 * JWT token doğrular.
 * @param {string} token
 * @returns {object} decode edilmiş payload
 * @throws {Error} geçersiz veya süresi dolmuş token
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
