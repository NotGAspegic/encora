// lib/crypto/keys.ts

const DB_NAME = 'encora-keystore'
const DB_VERSION = 1
const STORE_NAME = 'keypairs'
const PRIVATE_KEY_ID = 'ecdh-private-key'

// ─── IndexedDB helpers ──────────────────────────────────────────────────────

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error?.message}`))
  })
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(new Error(`IndexedDB get failed: ${req.error?.message}`))
  })
}

function idbSet(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new Error(`IndexedDB set failed: ${req.error?.message}`))
  })
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new Error(`IndexedDB delete failed: ${req.error?.message}`))
  })
}

// ─── Key generation ─────────────────────────────────────────────────────────

/**
 * Generates an ECDH P-256 key pair.
 * - Private key: stored in IndexedDB, non-extractable
 * - Public key: exported as JWK string, uploaded to Supabase profiles table
 *
 * Returns the public key JWK string so the caller can upload it.
 * Safe to call multiple times — skips generation if a key already exists.
 */
export async function generateAndStoreKeyPair(): Promise<string> {
  const db = await openKeyDB()

  // Don't overwrite an existing key pair
  const existingPrivateKey = await idbGet<CryptoKey>(db, PRIVATE_KEY_ID)
  if (existingPrivateKey) {
    const existingPublicJwk = await idbGet<string>(db, 'ecdh-public-jwk')
    if (existingPublicJwk) {
      console.info('[Encora Crypto] Key pair already exists, reusing.')
      return existingPublicJwk
    }
  }

  console.info('[Encora Crypto] Generating new ECDH P-256 key pair...')

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false, // private key is NON-extractable — cannot be read back as raw bytes
    ['deriveKey', 'deriveBits']
  )

  // Export public key as JWK — safe to transmit and store on server
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  const publicKeyJwkString = JSON.stringify(publicKeyJwk)

  // Store both in IndexedDB
  // Private key stored as CryptoKey object — never leaves the device
  await idbSet(db, PRIVATE_KEY_ID, keyPair.privateKey)
  // Public JWK cached locally to avoid re-exporting
  await idbSet(db, 'ecdh-public-jwk', publicKeyJwkString)

  console.info('[Encora Crypto] Key pair generated and stored.')
  return publicKeyJwkString
}

// ─── Key retrieval ───────────────────────────────────────────────────────────

/**
 * Returns the stored private key, or null if not found.
 * null means the user needs to re-generate keys (e.g. new device / cleared storage).
 */
export async function getPrivateKey(): Promise<CryptoKey | null> {
  const db = await openKeyDB()
  return idbGet<CryptoKey>(db, PRIVATE_KEY_ID)
}

export async function getPublicKeyJwk(): Promise<string | null> {
  const db = await openKeyDB()
  return idbGet<string>(db, 'ecdh-public-jwk')
}

/**
 * Returns true if the user has a key pair stored on this device.
 */
export async function hasKeyPair(): Promise<boolean> {
  const db = await openKeyDB()
  const key = await idbGet<CryptoKey>(db, PRIVATE_KEY_ID)
  return key !== null
}

// ─── Key deletion (for sign-out / key rotation) ──────────────────────────────

/**
 * Deletes both keys from IndexedDB.
 * Call on sign-out so the private key doesn't persist on shared devices.
 */
export async function clearKeyPair(): Promise<void> {
  const db = await openKeyDB()
  await idbDelete(db, PRIVATE_KEY_ID)
  await idbDelete(db, 'ecdh-public-jwk')
  console.info('[Encora Crypto] Key pair cleared from IndexedDB.')
}

// ─── Public key import (for deriving shared key with another user) ────────────

/**
 * Imports another user's public key JWK string into a CryptoKey object
 * suitable for ECDH key agreement.
 */
export async function importPublicKey(publicKeyJwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(publicKeyJwkString) as JsonWebKey
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false, // doesn't need to be extractable
    []     // no usages — ECDH public keys have no direct operations
  )
}