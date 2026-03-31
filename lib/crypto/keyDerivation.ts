// lib/crypto/keyDerivation.ts
import { getPrivateKey, importPublicKey } from './keys'

/**
 * In-memory cache of derived shared keys.
 * Key: the other user's ID (or any stable identifier).
 * We don't want to re-run ECDH + HKDF on every single message.
 */
const sharedKeyCache = new Map<string, CryptoKey>()

/**
 * Derives a shared AES-GCM-256 key from:
 *   - Our ECDH private key (from IndexedDB)
 *   - The other user's ECDH public key (from Supabase profiles)
 *
 * The derivation is:
 *   1. ECDH(myPrivate, theirPublic) → raw shared secret (non-uniform)
 *   2. HKDF(sharedSecret, salt, info) → AES-GCM key (uniform, safe to use)
 *
 * Result is cached in memory for the duration of the session.
 *
 * @param theirUserId      - Used as cache key only (not part of derivation)
 * @param theirPublicKeyJwk - JWK string from profiles.public_key
 */
export async function deriveSharedKey(
  theirUserId: string,
  theirPublicKeyJwk: string
): Promise<CryptoKey> {
  // Return cached key if available
  const cached = sharedKeyCache.get(theirUserId)
  if (cached) return cached

  const myPrivateKey = await getPrivateKey()
  if (!myPrivateKey) {
    throw new Error(
      '[Encora Crypto] No private key found on this device. ' +
      'This can happen after clearing browser storage. Please sign out and back in.'
    )
  }

  const theirPublicKey = await importPublicKey(theirPublicKeyJwk)

  // Step 1: ECDH — produces a shared secret as raw bits
  // We use deriveKey with HKDF as the target algorithm so the browser
  // handles the raw bits internally and never exposes them to JS
  const ecdhSharedSecret = await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    myPrivateKey,
    // We ask for an HKDF key as output so we can then run HKDF
    { name: 'HKDF' },
    false,        // not extractable
    ['deriveKey'] // only used for the next HKDF step
  )

  // Step 2: HKDF — produces the final AES-GCM key
  // salt: a fixed zero-filled buffer (in a production app, use a per-conversation
  //       salt stored alongside the conversation record)
  // info: context string that binds this key to the Encora protocol version
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // 256-bit zero salt
      info: new TextEncoder().encode('encora-v1-aes-gcm'),
    },
    ecdhSharedSecret,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,                    // not extractable
    ['encrypt', 'decrypt']
  )

  sharedKeyCache.set(theirUserId, aesKey)
  return aesKey
}

/**
 * Clears the in-memory shared key cache.
 * Call on sign-out alongside clearKeyPair().
 */
export function clearSharedKeyCache(): void {
  sharedKeyCache.clear()
}