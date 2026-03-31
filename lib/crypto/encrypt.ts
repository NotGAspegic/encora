// lib/crypto/encrypt.ts

export interface EncryptedPayload {
  /** AES-GCM ciphertext encoded as base64 */
  ciphertext: string
  /** 96-bit random IV encoded as base64 — unique per message */
  iv: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer // ← explicit ArrayBuffer return type
}

// ─── Core operations ─────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string with AES-GCM-256.
 *
 * A new random 96-bit IV is generated for every call.
 * The IV must be stored alongside the ciphertext — it is not secret
 * but it must be unique. Reusing an IV with the same key breaks AES-GCM.
 *
 * @param plaintext  - The message text to encrypt
 * @param sharedKey  - AES-GCM CryptoKey derived via deriveSharedKey()
 * @returns { ciphertext, iv } — both base64 encoded, safe to store in Postgres
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<EncryptedPayload> {
  if (!plaintext) throw new Error('[Encora Crypto] Cannot encrypt empty plaintext.')

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encodedText = new TextEncoder().encode(plaintext)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer, // ← cast to satisfy strict DOM types
    },
    sharedKey,
    encodedText
  )

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer), // ← same here
  }
}

/**
 * Decrypts an AES-GCM-256 ciphertext back to plaintext.
 *
 * Throws if the ciphertext was tampered with — AES-GCM's authentication
 * tag will fail verification and crypto.subtle.decrypt rejects.
 *
 * @param payload   - { ciphertext, iv } as returned by encryptMessage()
 * @param sharedKey - The same AES-GCM CryptoKey used to encrypt
 * @returns The original plaintext string
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  sharedKey: CryptoKey
): Promise<string> {
  const ciphertextBytes = base64ToBuffer(payload.ciphertext)
  const ivBytes = base64ToBuffer(payload.iv)

  let decryptedBuffer: ArrayBuffer
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      sharedKey,
      ciphertextBytes
    )
  } catch {
    throw new Error(
      '[Encora Crypto] Decryption failed. The message may be corrupted or from an incompatible key.'
    )
  }

  return new TextDecoder().decode(decryptedBuffer)
}

/**
 * Quick smoke test — encrypt then immediately decrypt.
 * Call this after key generation to verify the derived key works.
 */
export async function verifyCryptoRoundTrip(sharedKey: CryptoKey): Promise<boolean> {
  const testMessage = 'encora-crypto-test-🔒'
  try {
    const encrypted = await encryptMessage(testMessage, sharedKey)
    const decrypted = await decryptMessage(encrypted, sharedKey)
    return decrypted === testMessage
  } catch {
    return false
  }
}