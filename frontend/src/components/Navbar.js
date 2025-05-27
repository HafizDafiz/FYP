import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';

const Navbar = () => {
    const { logout } = useLogout();
    const { user } = useAuthContext();
    const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);

    const handleClick = () => logout();
    const toggleInventory = () => setShowInventoryDropdown(!showInventoryDropdown);

    return (
        <aside className="sidebar">
            <div className="sidebar-container">
                <Link to="/"><h1>Quantix</h1></Link>
                {user && (
                    <nav className="user-info">
                        <ul>
                            <li><Link to="/">Dashboard</Link></li>

                            <li>
                                <div className="dropdown-toggle" onClick={toggleInventory}>
                                    Inventory
                                </div>
                                <ul className={`dropdown-content ${showInventoryDropdown ? 'show' : ''}`}>
                                    <li><Link to="/inventory/items">Items</Link></li>
                                    <li><Link to="/inventory/stock-taking">Stock Taking</Link></li>
                                    <li><Link to="/inventory/stock-level">Stock Level</Link></li>
                                </ul>
                            </li>

                            <li><Link to="/sales">Sales</Link></li>
                            <li><Link to="/purchases">Purchases</Link></li>
                            <li><Link to="/reports">Reports</Link></li>
                            <li><Link to="/documents">Documents</Link></li>
                        </ul>
                        <button onClick={handleClick}><Link to="/login">Log out</Link></button>
                    </nav>
                )}
            </div>
        </aside>
    );
};

export default Navbar;
