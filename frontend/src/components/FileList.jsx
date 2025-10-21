// frontend/src/components/FileList.jsx
import React, { useState } from 'react';
import { Download, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileList = ({ files, onDelete }) => {
  const { encryptionKey } = useAuth();
  const [loadingFileId, setLoadingFileId] = useState(null);

  const handleView = async (file) => {
    if (!encryptionKey) { alert("Encryption key not available."); return; }
    if (!file.mimetype) { alert("Cannot preview file due to unknown type."); return; }
    setLoadingFileId(file._id);
    const newTab = window.open('', '_blank');
    if (!newTab) { alert('Please allow pop-ups for this site.'); setLoadingFileId(null); return; }
    newTab.document.write('Downloading and decrypting file...');
    try {
      const api = (await import('../services/api')).default;
      const response = await api.get(`/files/download/${file._id}`, { responseType: 'arraybuffer' });
      const encryptedData = response.data;
      const iv = response.headers['x-file-iv'];
      const worker = new Worker(new URL('../decrypt.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (event) => {
        const { status, decryptedData, message } = event.data;
        if (status === 'success') {
          const blob = new Blob([decryptedData], { type: file.mimetype });
          const fileUrl = URL.createObjectURL(blob);
          newTab.location.href = fileUrl;
        } else {
          console.error('Decryption failed in worker:', message);
          newTab.document.write('Failed to decrypt file.');
        }
        worker.terminate();
        setLoadingFileId(null);
      };
      const rawKey = await window.crypto.subtle.exportKey('raw', encryptionKey);
      worker.postMessage({ encryptedData, rawKey, iv }, [encryptedData, rawKey]);
    } catch (error) {
      console.error("Failed to fetch or process file:", error);
      newTab.document.write('Error fetching the file.');
      setLoadingFileId(null);
    }
  };

  const handleDownload = async (file) => {
    setLoadingFileId(file._id);
     try {
       const api = (await import('../services/api')).default;
       const { saveAs } = await import('file-saver');
       const response = await api.get(`/files/download/${file._id}`, { responseType: 'arraybuffer' });
       const { decryptFile } = await import('../services/cryptoService');
       const decryptedArrayBuffer = await decryptFile(response.data, encryptionKey, response.headers['x-file-iv']);
       if (decryptedArrayBuffer) {
         const blob = new Blob([decryptedArrayBuffer], { type: file.mimetype });
         saveAs(blob, file.originalFilename);
       }
     } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download file.");
     } finally {
        setLoadingFileId(null);
     }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Your Files</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files && files.filter(Boolean).map((file) => (
              <tr key={file._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="ml-3 font-medium text-gray-900">{file.originalFilename || 'Unnamed File'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(file.size)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.uploadDate ? new Date(file.uploadDate).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {loadingFileId === file._id ? (
                     <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  ) : (
                    <div className="flex items-center justify-end space-x-4">
                      <button onClick={() => handleView(file)} className="text-blue-600 hover:text-blue-900" title="View File">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDownload(file)} className="text-indigo-600 hover:text-indigo-900" title="Download File">
                        <Download className="h-5 w-5" />
                      </button>
                      <button onClick={() => onDelete(file._id)} className="text-red-600 hover:text-red-900" title="Delete File">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {files.length === 0 && <p className="text-center text-gray-500 mt-6">You haven't uploaded any files yet.</p>}
    </div>
  );
};

export default FileList;