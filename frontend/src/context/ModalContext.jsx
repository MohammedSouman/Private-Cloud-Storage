// frontend/src/context/ModalContext.jsx
import React, { createContext, useState, useContext } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ModalContext = createContext({});

export const ModalProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  // This function returns a Promise that resolves to true or false
  const showConfirmation = (message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        title,
        onConfirm: () => {
          setConfirmState({ isOpen: false });
          resolve(true);
        },
        onClose: () => {
          setConfirmState({ isOpen: false });
          resolve(false);
        },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationDialog {...confirmState} />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);