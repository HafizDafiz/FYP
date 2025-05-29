import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleClick = () => logout();

  const toggleDropdown = (section) => {
    setActiveDropdown(prev => (prev === section ? null : section));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-container">
        <Link to="/"><h1>Quantix</h1></Link>
        {user && (
          <nav className="user-info">
            <ul>
              <li><Link to="/admin-dashboard">Dashboard</Link></li>

              {/* Inventory Dropdown */}
              <li>
                <div className="dropdown-toggle" onClick={() => toggleDropdown('inventory')}>
                Inventory <span className={`dropdown-arrow ${activeDropdown === 'inventory' ? 'open' : ''}`}>▸</span>
                </div>
                <ul className={`dropdown-content ${activeDropdown === 'inventory' ? 'show' : ''}`}>
                  <li><Link to="/inventory/items">Items</Link></li>
                  <li><Link to="/inventory/stock-taking">Stock Taking</Link></li>
                  <li><Link to="/inventory/stock-level">Stock Level</Link></li>
                </ul>
              </li>

              {/* Sales Dropdown */}
              <li>
                <div className="dropdown-toggle" onClick={() => toggleDropdown('sales')}>
                Sales <span className={`dropdown-arrow ${activeDropdown === 'sales' ? 'open' : ''}`}>▸</span>
                </div>
                <ul className={`dropdown-content ${activeDropdown === 'sales' ? 'show' : ''}`}>
                  <li><Link to="/sales/orders">Sales Orders</Link></li>
                  <li><Link to="/sales/shipment">Shipment</Link></li>
                </ul>
              </li>

              {/* Purchases Dropdown */}
              <li>
                <div className="dropdown-toggle" onClick={() => toggleDropdown('purchases')}>
                Purchases <span className={`dropdown-arrow ${activeDropdown === 'purchases' ? 'open' : ''}`}>▸</span>
                </div>
                <ul className={`dropdown-content ${activeDropdown === 'purchases' ? 'show' : ''}`}>
                  <li><Link to="/purchases/orders">Purchase Orders</Link></li>
                  <li><Link to="/purchases/receives">Purchase Receives</Link></li>
                </ul>
              </li>

              <li><Link to="/reports">Reports</Link></li>
              <li><Link to="/documents">Documents</Link></li>
            </ul>
            <button onClick={handleClick}>Log out</button>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default Navbar;
