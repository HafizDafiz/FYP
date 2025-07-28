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
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import InventoryList from './components/InventoryList';
import PurchaseForm from './components/PurchaseForm';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseReceives from './pages/PurchaseReceives';
import PurchaseReceivesHistory from './pages/PurchaseReceivesHistory';
import Sales from './pages/Sales';
import Shipment from './pages/Shipment';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import UserManagement from './pages/UserManagement';

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
      {!hideNavbar && <div className="topbar"></div>}        <div className="pages">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff-dashboard" element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/inventory/items" element={
              <ProtectedRoute>
                <Item />
              </ProtectedRoute>
            } />
            <Route path="/inventory/add-item" element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            } />
            <Route path="/inventory/stock-taking" element={
              <ProtectedRoute>
                <StockTaking />
              </ProtectedRoute>
            } />
            <Route path="/inventory/stock-level" element={
              <ProtectedRoute>
                <StockLevel />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <InventoryList />
              </ProtectedRoute>
            } />
            <Route path="/purchase" element={
              <ProtectedRoute>
                <PurchaseForm />
              </ProtectedRoute>
            } />
            <Route path="/purchase-orders" element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/purchases/receives" element={
              <ProtectedRoute>
                <PurchaseReceives />
              </ProtectedRoute>
            } />
            <Route path="/purchases/receives-history" element={
              <ProtectedRoute>
                <PurchaseReceivesHistory />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="/sales/shipment" element={
              <ProtectedRoute>
                <Shipment />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute requiredRole="admin">
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
    </>
  );
}



export default App;
