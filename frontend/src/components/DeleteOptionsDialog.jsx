// frontend/src/components/DeleteOptionsDialog.jsx
import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DeleteOptionsDialog = ({ isOpen, onClose, onMoveToTrash, onDeletePermanently, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-yellow-100">
          <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row-reverse sm:justify-start gap-3">
        <button
          type="button"
          onClick={onDeletePermanently}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
        >
          Delete Permanently
        </button>
        <button
          type="button"
          onClick={onMoveToTrash}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Move to Trash
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default DeleteOptionsDialog;