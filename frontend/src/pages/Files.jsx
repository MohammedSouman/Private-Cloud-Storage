// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import TrashList from '../components/TrashList';
import Tabs from '../components/Tabs';
import api from '../services/api';
import { useModal } from '../context/ModalContext';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('My Files');
  const { showConfirmation } = useModal();

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'My Files') {
      fetchFiles();
    }
  }, [activeTab, fetchFiles]);

  const handleDeleteFile = async (fileId) => {
    const confirmed = await showConfirmation(
      'This will move the file to the trash. You can restore it later.',
      'Move to Trash?'
    );
    if (confirmed) {
      try {
        await api.delete(`/files/${fileId}`);
        setFiles(prevFiles => prevFiles.filter(f => f._id !== fileId));
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('Could not move the file to trash.');
      }
    }
  };

  const handleFileRestored = () => {
    fetchFiles();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Your Storage</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 mt-8">
            <FileUpload onUploadSuccess={fetchFiles} />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {activeTab === 'My Files' && (
              <FileList 
                files={files} 
                onDelete={handleDeleteFile}
              />
            )}
            {activeTab === 'Trash' && <TrashList onFileRestored={handleFileRestored} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Files;