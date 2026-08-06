import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Behavior from './pages/Behavior';
import AIChat from './pages/AIChat';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import Onboarding from './pages/Onboarding';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/watchlist" element={<Watchlist />} />
      <Route path="/behavior" element={<Behavior />} />
      <Route path="/ai-chat" element={<AIChat />} />
      <Route path="/recommendations" element={<Recommendations />} />
      <Route path="/analytics" element={<Analytics />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App;
