import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
// pages & components
import Item from './pages/Items';
import AddItem from './pages/AddItem';
import StockTaking from './pages/StockTaking';
import StockLevel from './pages/StockLevel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';


function App() {
  const { user } = useAuthContext();

  // Wrap your routing logic in a custom inner component so `useLocation()` works
  return (
    <div className="App">
      <BrowserRouter>
        <MainContent user={user} />
      </BrowserRouter>
    </div>
  );
}

function MainContent({ user }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <div className="topbar"></div>}        <div className="pages">          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/inventory/items" element={<Item />} />
            <Route path="/inventory/add-item" element={<AddItem />} />
            <Route path="/inventory/stock-taking" element={<StockTaking />} />
            <Route path="/inventory/stock-level" element={<StockLevel />} />
          </Routes>
        </div>
    </>
  );
}



export default App;
