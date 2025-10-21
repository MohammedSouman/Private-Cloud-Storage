// frontend/src/components/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { encryptFile } from '../services/cryptoService';
import api from '../services/api';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';

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

    try {
      // 1. Encrypt the file
      const { encryptedBlob, salt, iv } = await encryptFile(file, encryptionKey);

      // 2. Prepare data for upload
      const formData = new FormData();
      formData.append('file', encryptedBlob, file.name);
      formData.append('originalFilename', file.name);
      formData.append('salt', salt);
      formData.append('iv', iv);

      // 3. Upload the file
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      // 4. Notify parent component
      onUploadSuccess();

    } catch (error) {
      console.error('Upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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
            <p className="text-gray-700">Uploading... {uploadProgress}%</p>
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
            <p className="text-xs text-gray-400 mt-2">Your file will be encrypted before upload.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;