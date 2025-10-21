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
  const { showDeleteOptions } = useModal();

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

  const handleDeleteFile = async (file) => {
    const choice = await showDeleteOptions(
      `What would you like to do with "${file.originalFilename || 'this file'}"?`,
      'Delete Options'
    );

    switch (choice) {
      case 'trash':
        try {
          await api.delete(`/files/${file._id}`);
          setFiles(prevFiles => prevFiles.filter(f => f._id !== file._id));
        } catch (error) {
          console.error('Failed to move to trash:', error);
          alert('Could not move the file to trash.');
        }
        break;
      
      case 'permanent':
        try {
          await api.delete(`/files/permanent/${file._id}`);
          setFiles(prevFiles => prevFiles.filter(f => f._id !== file._id));
        } catch (error) {
          console.error('Failed to permanently delete:', error);
          alert('Could not permanently delete the file.');
        }
        break;
      
      default:
        // User cancelled, do nothing
        break;
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
            <h1 className="text-3xl font-bold leading-tight text-gray-900">My Files</h1>
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