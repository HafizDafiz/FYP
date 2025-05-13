import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <nav>
      <h1>Stock Tracker</h1>
      {user ? (
        <>
          <span>Welcome, {user.email}</span>
          {user.role === 'admin' && <button>Admin Dashboard</button>}
          {user.role === 'user' && <button>User Dashboard</button>}
        </>
      ) : (
        <span>Please log in</span>
      )}
    </nav>
  );
};

export default Navbar;