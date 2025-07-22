import React from 'react';

// Mobile-optimized loading component
export const MobileLoading = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: { spinner: '24px', fontSize: '14px' },
    medium: { spinner: '32px', fontSize: '16px' },
    large: { spinner: '40px', fontSize: '18px' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className="mobile-loading">
      <div 
        className="mobile-loading-spinner"
        style={{
          width: currentSize.spinner,
          height: currentSize.spinner,
          border: `3px solid #e5e7eb`,
          borderTop: `3px solid #312F56`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div style={{ 
        fontSize: currentSize.fontSize, 
        color: '#6b7280',
        textAlign: 'center' 
      }}>
        {message}
      </div>
    </div>
  );
};

// Mobile-optimized error component
export const MobileError = ({ title = 'Error', message, onRetry }) => (
  <div className="mobile-error">
    <h3>{title}</h3>
    <p>{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          marginTop: '12px',
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          minHeight: '44px'
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

// Mobile-optimized search input
export const MobileSearchInput = ({ value, onChange, placeholder = 'Search...', onClear }) => (
  <div className="mobile-search-container">
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mobile-search-input mobile-focus"
        style={{
          width: '100%',
          padding: '12px 16px 12px 45px',
          border: '2px solid #e0e0e0',
          borderRadius: '25px',
          fontSize: '16px',
          background: '#f8f9fa'
        }}
      />
      <div style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9ca3af',
        fontSize: '18px'
      }}>
        🔍
      </div>
      {value && onClear && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            minHeight: '36px',
            minWidth: '36px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  </div>
);

// Mobile-optimized button
export const MobileButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false
}) => {
  const variants = {
    primary: { bg: '#312F56', color: 'white' },
    secondary: { bg: '#f3f4f6', color: '#374151' },
    danger: { bg: '#ef4444', color: 'white' },
    success: { bg: '#10b981', color: 'white' }
  };

  const sizes = {
    small: { padding: '10px 16px', fontSize: '14px' },
    medium: { padding: '12px 20px', fontSize: '16px' },
    large: { padding: '14px 24px', fontSize: '18px' }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-mobile ${fullWidth ? 'mobile-full-width' : ''}`}
      style={{
        backgroundColor: disabled ? '#d1d5db' : variants[variant].bg,
        color: disabled ? '#9ca3af' : variants[variant].color,
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: '48px',
        transition: 'all 0.2s ease',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...sizes[size],
        ...(fullWidth && { width: '100%' })
      }}
    >
      {children}
    </button>
  );
};

// Mobile-optimized table wrapper
export const MobileTable = ({ children, minWidth = '800px' }) => (
  <div className="table-container mobile-scroll no-bounce" style={{
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    background: 'white',
    marginBottom: '20px'
  }}>
    <div style={{ minWidth }}>
      {children}
    </div>
  </div>
);

// Mobile-optimized card
export const MobileCard = ({ children, title, padding = 'medium' }) => {
  const paddingMap = {
    small: 'clamp(12px, 2vw, 16px)',
    medium: 'clamp(16px, 3vw, 24px)',
    large: 'clamp(20px, 4vw, 32px)'
  };

  return (
    <div className="mobile-slide-in" style={{
      background: 'white',
      borderRadius: '12px',
      padding: paddingMap[padding],
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    }}>
      {title && (
        <h3 style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default {
  MobileLoading,
  MobileError,
  MobileSearchInput,
  MobileButton,
  MobileTable,
  MobileCard
};
