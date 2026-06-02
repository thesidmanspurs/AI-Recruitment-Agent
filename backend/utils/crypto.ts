import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * AES-256-GCM encryption for at-rest secrets (per-user email credentials).
 *
 * Format of the stored string: base64(iv).base64(authTag).base64(ciphertext)
 * — three dot-separated parts. GCM gives us authenticated encryption so a
 * tampered ciphertext fails to decrypt rather than returning garbage.
 *
 * Key: derived from env.ENCRYPTION_KEY (any length) via SHA-256 to get a
 * stable 32-byte key. ENCRYPTION_KEY MUST be set in production and MUST NOT
 * change once data is encrypted, or existing credentials become unreadable.
 */

function getKey(): Buffer {
  const raw = env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY is not configured — cannot encrypt/decrypt credentials.');
  }
  // Normalise any-length secret to a 32-byte key.
  return crypto.createHash('sha256').update(raw).digest();
}

export function isEncryptionAvailable(): boolean {
  return !!env.ENCRYPTION_KEY;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptSecret(encoded: string): string {
  const key = getKey();
  const parts = encoded.split('.');
  if (parts.length !== 3) throw new Error('Malformed encrypted secret.');
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
