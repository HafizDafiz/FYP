import React, { useState, useEffect } from 'react';

export const MobileToast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastClass = () => {
    const baseClass = 'mobile-toast';
    const typeClass = `mobile-toast-${type}`;
    const visibleClass = visible ? 'mobile-toast-visible' : 'mobile-toast-hidden';
    return `${baseClass} ${typeClass} ${visibleClass}`;
  };

  return (
    <div className={getToastClass()}>
      <div className="mobile-toast-content">
        <span className="mobile-toast-icon">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="mobile-toast-message">{message}</span>
      </div>
      <button 
        className="mobile-toast-close" 
        onClick={() => setVisible(false)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export const useMobileToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess: (message) => showToast(message, 'success'),
    showError: (message) => showToast(message, 'error'),
    showWarning: (message) => showToast(message, 'warning'),
    showInfo: (message) => showToast(message, 'info'),
  };
};
