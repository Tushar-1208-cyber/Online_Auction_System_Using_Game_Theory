import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import CreateAuction from './components/CreateAuction';
import NashCalculator from './components/NashCalculator';
import MyersonCalculator from './components/MyersonCalculator';
import WinnersCurseCalculator from './components/WinnersCurseCalculator';
import VerifyOtp from './components/VerifyOtp';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.is_verified === 0) return <Navigate to="/verify-otp" />;
  return children;
}

function SellerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.is_verified === 0) return <Navigate to="/verify-otp" />;
  if (user.role !== 'seller' && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AuctionList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
            <Route path="/create" element={<SellerRoute><CreateAuction /></SellerRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/calculator/nash" element={<ProtectedRoute><NashCalculator /></ProtectedRoute>} />
            <Route path="/calculator/myerson" element={<ProtectedRoute><MyersonCalculator /></ProtectedRoute>} />
            <Route path="/calculator/curse" element={<ProtectedRoute><WinnersCurseCalculator /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
