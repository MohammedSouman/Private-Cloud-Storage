// This is the key fix. It checks if `self` (worker) exists,
// otherwise it falls back to `window` (main thread).
const crypto = (self.crypto || window.crypto);

/**
 * Derives a 256-bit AES-GCM encryption key from a password and salt using PBKDF2.
 */
export const deriveKeyFromPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256', // THE FIX WAS HERE: Corrected from 'SHA-26'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
};

/**
 * Encrypts a file using AES-GCM.
 */
export const encryptFile = async (file, key) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    fileBuffer
  );
  
  const encryptedBlob = new Blob([encryptedContent], { type: file.type });

  return {
    encryptedBlob,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
};

/**
 * Decrypts a file using AES-GCM.
 */
export const decryptFile = async (encryptedData, key, ivB64) => {
  const iv = Buffer.from(ivB64, 'base64');
    
  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );

  return decryptedContent;
};

/**
 * Exports a CryptoKey to a storable Base64 string format.
 */
export const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

/**
 * Imports a CryptoKey from a Base64 string.
 */
export const importKey = async (keyB64) => {
  const keyBuffer = Buffer.from(keyB64, 'base64');
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};