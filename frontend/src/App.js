import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <Navbar />
      {!user ? (
        <LoginPage />
      ) : (
        <h2>Welcome to the system, {user.role}!</h2>
      )}
    </div>
  );
}

export default App;