// frontend/src/context/ModalContext.jsx
import React, { createContext, useState, useContext } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';
import DeleteOptionsDialog from '../components/DeleteOptionsDialog'; // <-- Import new dialog

const ModalContext = createContext({});

export const ModalProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [deleteOptionsState, setDeleteOptionsState] = useState({ isOpen: false }); // <-- New state

  // This function is still useful for other binary confirmations
  const showConfirmation = (message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, message, title,
        onConfirm: () => { setConfirmState({ isOpen: false }); resolve(true); },
        onClose: () => { setConfirmState({ isOpen: false }); resolve(false); },
      });
    });
  };

  // --- THIS IS THE NEW LOGIC ---
  // It returns a promise that resolves to 'trash', 'permanent', or null
  const showDeleteOptions = (message, title = 'Delete File') => {
    return new Promise((resolve) => {
      setDeleteOptionsState({
        isOpen: true, message, title,
        onMoveToTrash: () => { setDeleteOptionsState({ isOpen: false }); resolve('trash'); },
        onDeletePermanently: () => { setDeleteOptionsState({ isOpen: false }); resolve('permanent'); },
        onClose: () => { setDeleteOptionsState({ isOpen: false }); resolve(null); },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showConfirmation, showDeleteOptions }}>
      {children}
      <ConfirmationDialog {...confirmState} />
      <DeleteOptionsDialog {...deleteOptionsState} /> {/* <-- Render the new dialog */}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);