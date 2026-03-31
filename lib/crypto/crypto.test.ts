// lib/crypto/crypto.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { encryptMessage, decryptMessage, verifyCryptoRoundTrip } from './encrypt'
import { deriveSharedKey } from './keyDerivation'

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Generate a raw ECDH key pair for testing (bypasses IndexedDB) */
async function generateTestKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  )
}

async function exportPublicKeyJwk(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', key)
  return JSON.stringify(jwk)
}

/** Derive a shared AES-GCM key directly (test version — skips IndexedDB) */
async function deriveTestSharedKey(
  myPrivate: CryptoKey,
  theirPublicJwk: string
): Promise<CryptoKey> {
  const { importPublicKey } = await import('./keys')
  const theirPublic = await importPublicKey(theirPublicJwk)

  const ecdhSecret = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublic },
    myPrivate,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('encora-v1-aes-gcm'),
    },
    ecdhSecret,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ─── Shared state ─────────────────────────────────────────────────────────────

let aliceKeyPair: CryptoKeyPair
let bobKeyPair: CryptoKeyPair
let aliceSharedKey: CryptoKey
let bobSharedKey: CryptoKey

beforeAll(async () => {
  aliceKeyPair = await generateTestKeyPair()
  bobKeyPair = await generateTestKeyPair()

  const alicePublicJwk = await exportPublicKeyJwk(aliceKeyPair.publicKey)
  const bobPublicJwk = await exportPublicKeyJwk(bobKeyPair.publicKey)

  // Derive from each side
  aliceSharedKey = await deriveTestSharedKey(aliceKeyPair.privateKey, bobPublicJwk)
  bobSharedKey = await deriveTestSharedKey(bobKeyPair.privateKey, alicePublicJwk)
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ECDH key exchange', () => {
  it('alice and bob derive the same AES-GCM key', async () => {
    // If the keys are equal, encrypting with one and decrypting with the other should work
    const payload = await encryptMessage('ecdh-symmetry-test', aliceSharedKey)
    const decrypted = await decryptMessage(payload, bobSharedKey)
    expect(decrypted).toBe('ecdh-symmetry-test')
  })
})

describe('encryptMessage', () => {
  it('returns ciphertext and iv as base64 strings', async () => {
    const payload = await encryptMessage('hello encora', aliceSharedKey)
    expect(payload.ciphertext).toBeTypeOf('string')
    expect(payload.iv).toBeTypeOf('string')
    // base64 check — should only contain valid chars
    expect(payload.ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(payload.iv).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('produces different ciphertext each call (IV randomness)', async () => {
    const a = await encryptMessage('same plaintext', aliceSharedKey)
    const b = await encryptMessage('same plaintext', aliceSharedKey)
    expect(a.ciphertext).not.toBe(b.ciphertext)
    expect(a.iv).not.toBe(b.iv)
  })

  it('ciphertext is longer than the plaintext (includes auth tag)', async () => {
    const plaintext = 'hi'
    const payload = await encryptMessage(plaintext, aliceSharedKey)
    const ciphertextBytes = atob(payload.ciphertext).length
    expect(ciphertextBytes).toBeGreaterThan(plaintext.length)
  })

  it('throws on empty plaintext', async () => {
    await expect(encryptMessage('', aliceSharedKey)).rejects.toThrow()
  })
})

describe('decryptMessage', () => {
  it('round-trips a simple message', async () => {
    const original = 'Hello, Encora!'
    const payload = await encryptMessage(original, aliceSharedKey)
    const decrypted = await decryptMessage(payload, aliceSharedKey)
    expect(decrypted).toBe(original)
  })

  it('round-trips unicode and emoji', async () => {
    const original = 'Marhba bik 🔒 مرحبا بك'
    const payload = await encryptMessage(original, aliceSharedKey)
    const decrypted = await decryptMessage(payload, aliceSharedKey)
    expect(decrypted).toBe(original)
  })

  it('round-trips a long message', async () => {
    const original = 'a'.repeat(5000)
    const payload = await encryptMessage(original, aliceSharedKey)
    const decrypted = await decryptMessage(payload, aliceSharedKey)
    expect(decrypted).toBe(original)
  })

  it('throws when ciphertext is tampered with', async () => {
    const payload = await encryptMessage('tamper test', aliceSharedKey)
    // Flip a character in the middle of the ciphertext
    const tampered = payload.ciphertext.split('')
    tampered[10] = tampered[10] === 'A' ? 'B' : 'A'
    await expect(
      decryptMessage({ ...payload, ciphertext: tampered.join('') }, aliceSharedKey)
    ).rejects.toThrow()
  })

  it('throws when IV is wrong', async () => {
    const payload = await encryptMessage('iv test', aliceSharedKey)
    const wrongIv = await encryptMessage('other', aliceSharedKey)
    await expect(
      decryptMessage({ ...payload, iv: wrongIv.iv }, aliceSharedKey)
    ).rejects.toThrow()
  })

  it('throws when decrypting with the wrong key', async () => {
    const payload = await encryptMessage('wrong key test', aliceSharedKey)
    // Bob's key is different from Alice's (wrong pair)
    const wrongKeyPair = await generateTestKeyPair()
    const wrongKey = await deriveTestSharedKey(
      wrongKeyPair.privateKey,
      await exportPublicKeyJwk(aliceKeyPair.publicKey)
    )
    await expect(decryptMessage(payload, wrongKey)).rejects.toThrow()
  })
})

describe('verifyCryptoRoundTrip', () => {
  it('returns true for a valid key', async () => {
    const result = await verifyCryptoRoundTrip(aliceSharedKey)
    expect(result).toBe(true)
  })
})