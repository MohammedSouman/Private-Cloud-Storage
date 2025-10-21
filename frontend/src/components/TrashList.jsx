import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useModal } from '../context/ModalContext';
import { FileText, RotateCcw, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const TrashList = ({ onFileRestored }) => {
  const [trashedFiles, setTrashedFiles] = useState([]);
  const { showConfirmation } = useModal();
  const [loadingActionId, setLoadingActionId] = useState(null);

  const fetchTrashedFiles = async () => {
    try {
      const res = await api.get('/files/trash');
      setTrashedFiles(res.data);
    } catch (error) {
      console.error('Failed to fetch trashed files:', error);
    }
  };

  useEffect(() => {
    fetchTrashedFiles();
  }, []);

  const handleRestore = async (fileId) => {
    setLoadingActionId(fileId);
    try {
      await api.post(`/files/restore/${fileId}`);
      setTrashedFiles(prevFiles => prevFiles.filter(f => f && f._id !== fileId));
      onFileRestored();
    } catch (error) {
      console.error('Failed to restore file:', error);
      alert('Could not restore the file.');
    } finally {
        setLoadingActionId(null);
    }
  };
  
  const handlePermanentDelete = async (fileId) => {
    const confirmed = await showConfirmation(
      'This action is irreversible. The file will be permanently deleted and cannot be recovered.',
      'Delete Permanently?'
    );
    if (!confirmed) return;

    setLoadingActionId(fileId);
    try {
        await api.delete(`/files/permanent/${fileId}`);
        setTrashedFiles(prevFiles => prevFiles.filter(f => f && f._id !== fileId));
    } catch (error) {
        console.error('Failed to permanently delete file:', error);
        alert('Could not permanently delete the file.');
    } finally {
        setLoadingActionId(null);
    }
  };
  
  const daysUntilDeletion = (deleteDate) => {
      if (!deleteDate) return 'N/A';
      const deletionTime = new Date(deleteDate).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const timeRemaining = deletionTime + thirtyDays - new Date().getTime();
      return Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Trash</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Files in the trash will be permanently deleted after 30 days.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {/* --- THIS IS THE FIX --- */}
                {trashedFiles && trashedFiles.filter(Boolean).map((file) => (
                    <tr key={file._id}>
                        <td className="px-6 py-4">
                            <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <span className="ml-3 font-medium text-gray-900">{file.originalFilename || 'Unnamed File'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatBytes(file.size)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{daysUntilDeletion(file.deletedAt)} days</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                            {loadingActionId === file._id ? (
                                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                            ) : (
                                <div className="flex items-center justify-end space-x-4">
                                    <button onClick={() => handleRestore(file._id)} className="text-green-600 hover:text-green-900" title="Restore">
                                        <RotateCcw className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handlePermanentDelete(file._id)} className="text-red-600 hover:text-red-900" title="Delete Permanently">
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
      {trashedFiles.length === 0 && <p className="text-center text-gray-500 mt-6">Your trash is empty.</p>}
    </div>
  );
};

export default TrashList;