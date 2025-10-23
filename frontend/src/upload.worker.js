import CryptoJS from 'crypto-js';
import { encryptChunk } from './services/cryptoService';

self.onmessage = async (event) => {
  const { file, keyData } = event.data;

  try {
    const key = await self.crypto.subtle.importKey('raw', keyData.key, { name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = self.crypto.getRandomValues(new Uint8Array(12));

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks
    let offset = 0;
    const sha256 = CryptoJS.algo.SHA256.create();
    const encryptedChunks = [];

    // Process file chunk by chunk
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const chunkBuffer = await chunk.arrayBuffer();

      // Update hash progressively
      sha256.update(CryptoJS.lib.WordArray.create(chunkBuffer));

      // Encrypt the chunk
      // Note: A real-world streaming encryption (AES-CTR) is more complex.
      // AES-GCM is used here for simplicity, encrypting each chunk independently.
      // This is less secure than a proper stream cipher but demonstrates the performance concept.
      const encryptedChunk = await encryptChunk(chunkBuffer, key, iv);
      encryptedChunks.push(new Uint8Array(encryptedChunk));

      offset += CHUNK_SIZE;
      self.postMessage({ status: 'processing', progress: Math.round((offset / file.size) * 100) });
    }

    const finalHash = sha256.finalize().toString();
    
    // Combine encrypted chunks into a single blob
    const encryptedBlob = new Blob(encryptedChunks, { type: file.type });
    
    // Convert IV to Base64 using a reliable method
    const ivBase64 = btoa(String.fromCharCode.apply(null, iv));

    self.postMessage({
      status: 'complete',
      payload: {
        encryptedBlob,
        iv: ivBase64,
        hash: finalHash,
        salt: keyData.salt,
      },
    });

  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ status: 'error', message: error.message });
  }
};