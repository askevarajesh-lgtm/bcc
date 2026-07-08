const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Derive a 32-byte key from the JWT_SECRET or a dedicated ENCRYPTION_KEY
const _getKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback_secret_key_needs_to_be_32_bytes_at_least';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
};

exports.encrypt = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(_getKey()), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

exports.decrypt = (text) => {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(_getKey()), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
