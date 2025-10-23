import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { encryptFile } from '../services/cryptoService';
import api from '../services/api';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import CryptoJS from 'crypto-js'; // <-- Import the hashing library

const FileUpload = ({ onUploadSuccess }) => {
  const { encryptionKey } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!encryptionKey) {
      alert("Encryption key not available. Please log in again.");
      return;
    }
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const file = acceptedFiles[0];

    // --- NEW HASH CALCULATION LOGIC ---
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const binary = event.target.result;
        // Calculate the SHA-256 hash from the file's raw content
        const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(binary)).toString();

        // 1. Encrypt the file
        const { encryptedBlob, salt, iv } = await encryptFile(file, encryptionKey);

        // 2. Prepare data for upload, including the new hash
        const formData = new FormData();
        formData.append('file', encryptedBlob, file.name);
        formData.append('originalFilename', file.name);
        formData.append('salt', salt);
        formData.append('iv', iv);
        formData.append('contentHash', hash); // <-- Add hash to the form data

        // 3. Upload the file
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        });

        // 4. Notify parent component of success
        onUploadSuccess();

      } catch (error) {
        console.error('Upload failed:', error);
        alert('File upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    
    reader.onerror = () => {
        console.error("Failed to read file for hashing.");
        alert("Could not read the file. Please try again.");
        setUploading(false);
    };

    // Read the file as an ArrayBuffer to prepare for hashing
    reader.readAsArrayBuffer(file);
    
  }, [encryptionKey, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Upload a New File</h2>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
            <p className="text-gray-700">Uploading... {uploadProgress > 0 ? `${uploadProgress}%` : '(Hashing...)'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-indigo-700 font-semibold">Drop the file here ...</p>
            ) : (
              <p className="text-gray-500">Drag 'n' drop a file here, or click to select a file</p>
            )}
            <p className="text-xs text-gray-400 mt-2">Your file will be hashed and encrypted before upload.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;