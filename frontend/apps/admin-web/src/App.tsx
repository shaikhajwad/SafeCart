import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VerificationsPage from './pages/VerificationsPage';
import OrdersPage from './pages/OrdersPage';
import DisputesPage from './pages/DisputesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import RiskHoldsPage from './pages/RiskHoldsPage';
import UsersPage from './pages/UsersPage';
import OrgsPage from './pages/OrgsPage';
import RefundsPage from './pages/RefundsPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">🔒</div>
          <h1 className="login-title">Access Denied</h1>
          <p className="login-subtitle" style={{ marginBottom: '20px' }}>
            Your account does not have admin access.
          </p>
          <button className="btn btn-danger btn-full" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/verifications" element={<ProtectedRoute><VerificationsPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/orgs" element={<ProtectedRoute><OrgsPage /></ProtectedRoute>} />
      <Route path="/refunds" element={<ProtectedRoute><RefundsPage /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/risk-holds" element={<ProtectedRoute><RiskHoldsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
