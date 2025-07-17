import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';

const Navbar = () => {

  const { logout } = useLogout();
  const { user } = useAuthContext();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleClick = () => logout();

  const toggleDropdown = (section) => {
    setActiveDropdown(prev => (prev === section ? null : section));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-toggle')) {
        closeMobileMenu();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const isDashboardRoute = () => {
    return location.pathname === '/admin-dashboard' || location.pathname === '/staff-dashboard';
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button 
        className="mobile-menu-toggle d-lg-none"
        onClick={toggleMobileMenu}
        style={{
          display: 'none'
        }}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: 'white',
              fontSize: '26px'
            }}>
              <span style={{ fontSize: '28px' }}>📊</span>
              Quantix
            </h1>
          </Link>
          {user && (
            <nav className="user-info">
              <ul>
                <li>
                  <Link 
                    to={user.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard'}
                    className={isDashboardRoute() ? 'active' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                    onClick={closeMobileMenu}
                  >
                    <span style={{ fontSize: '20px' }}>🏠</span>
                    Dashboard
                  </Link>
                </li>

                {/* Inventory Dropdown */}
                <li>
                  <div 
                    className={`dropdown-toggle ${activeDropdown === 'inventory' ? 'active' : ''}`}
                    onClick={() => toggleDropdown('inventory')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📦</span>
                    Inventory <span className={`dropdown-arrow ${activeDropdown === 'inventory' ? 'open' : ''}`}>▸</span>
                  </div>
                  <ul className={`dropdown-content ${activeDropdown === 'inventory' ? 'show' : ''}`}>
                    <li>
                      <Link 
                        to="/inventory/items" 
                        className={isActiveRoute('/inventory/items') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        📋 Items
                      </Link>
                    </li>
                    {user.role === 'admin' && (
                      <li>
                        <Link 
                          to="/inventory/stock-taking" 
                          className={isActiveRoute('/inventory/stock-taking') ? 'active' : ''}
                          onClick={closeMobileMenu}
                        >
                          📊 Stock Taking
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link 
                        to="/inventory/stock-level" 
                        className={isActiveRoute('/inventory/stock-level') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        📈 Stock Level
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Sales Dropdown */}
                <li>
                  <div 
                    className={`dropdown-toggle ${activeDropdown === 'sales' ? 'active' : ''}`}
                    onClick={() => toggleDropdown('sales')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>💰</span>
                    Sales <span className={`dropdown-arrow ${activeDropdown === 'sales' ? 'open' : ''}`}>▸</span>
                  </div>
                  <ul className={`dropdown-content ${activeDropdown === 'sales' ? 'show' : ''}`}>
                    <li>
                      <Link 
                        to="/sales" 
                        className={isActiveRoute('/sales') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        🛒 Sales Orders
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/sales/shipment" 
                        className={isActiveRoute('/sales/shipment') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        🚚 Shipment
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Purchases Dropdown */}
                <li>
                  <div 
                    className={`dropdown-toggle ${activeDropdown === 'purchases' ? 'active' : ''}`}
                    onClick={() => toggleDropdown('purchases')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🛍️</span>
                    Purchases <span className={`dropdown-arrow ${activeDropdown === 'purchases' ? 'open' : ''}`}>▸</span>
                  </div>
                  <ul className={`dropdown-content ${activeDropdown === 'purchases' ? 'show' : ''}`}>
                    <li>
                      <Link 
                        to="/purchase-orders" 
                        className={isActiveRoute('/purchase-orders') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        🛒 Purchase Orders
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/purchases/receives" 
                        className={isActiveRoute('/purchases/receives') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        📥 Purchase Receives
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/purchases/receives-history" 
                        className={isActiveRoute('/purchases/receives-history') ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        📋 Receives History
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <Link 
                    to="/reports" 
                    className={isActiveRoute('/reports') ? 'active' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                    onClick={closeMobileMenu}
                  >
                    <span style={{ fontSize: '20px' }}>📊</span>
                    Reports
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/documents" 
                    className={isActiveRoute('/documents') ? 'active' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                    onClick={closeMobileMenu}
                  >
                    <span style={{ fontSize: '20px' }}>📄</span>
                    Documents
                  </Link>
                </li>
              </ul>
              <button 
                onClick={() => {
                  handleClick();
                  closeMobileMenu();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '18px' }}>🚪</span>
                Log out
              </button>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;