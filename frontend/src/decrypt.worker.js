// frontend/src/decrypt.worker.js

import { decryptFile } from './services/cryptoService';
import { Buffer } from 'buffer';
self.Buffer = Buffer;

self.onmessage = async (event) => {
  // The 'key' received here is now a raw ArrayBuffer, not a CryptoKey object
  const { encryptedData, rawKey, iv } = event.data;

  try {
    // 1. Rebuild (import) the CryptoKey from the raw data
    const key = await self.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );

    // 2. Perform decryption with the now valid key
    const decryptedArrayBuffer = await decryptFile(encryptedData, key, iv);

    // 3. Send the successful result back
    self.postMessage({ status: 'success', decryptedData: decryptedArrayBuffer }, [decryptedArrayBuffer]);

  } catch (error) {
    console.error('Decryption failed in worker:', error);
    self.postMessage({ status: 'error', message: error.message });
  }
};