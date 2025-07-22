import React, { useEffect, useRef, useState } from 'react';

const ScrollableTableHint = ({ children }) => {
  const containerRef = useRef(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollable = () => {
      const isScrollable = container.scrollWidth > container.clientWidth;
      setShowHint(isScrollable);
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [children]);

  return (
    <div className="mobile-table-wrapper">
      <div 
        ref={containerRef}
        className="mobile-table-container"
        style={{
          position: 'relative'
        }}
      >
        {showHint && (
          <div 
            className="scroll-hint"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(49, 47, 86, 0.9)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              zIndex: 2,
              animation: 'slideHint 4s ease-in-out infinite',
              pointerEvents: 'none'
            }}
          >
            ← Swipe to scroll →
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ScrollableTableHint;
