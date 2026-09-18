import crypto from 'crypto';

/**
 * Computes SHA-256 hash of a raw device secret token.
 * Never store plain text device tokens in the database.
 */
export function hashDeviceSecret(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Safely compares two hashes to prevent timing attacks.
 */
export function verifySecretHash(token: string, expectedHash: string): boolean {
  const hash = hashDeviceSecret(token);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
  } catch {
    return false;
  }
}
