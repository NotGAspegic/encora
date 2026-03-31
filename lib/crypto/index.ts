// lib/crypto/index.ts
export { generateAndStoreKeyPair, getPrivateKey, getPublicKeyJwk, hasKeyPair, clearKeyPair, importPublicKey } from './keys'
export { deriveSharedKey, clearSharedKeyCache } from './keyDerivation'
export { encryptMessage, decryptMessage, verifyCryptoRoundTrip } from './encrypt'
export type { EncryptedPayload } from './encrypt'