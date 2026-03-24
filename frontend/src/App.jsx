import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Fleet from './pages/Fleet';
import Orders from './pages/Orders';
import Anomalies from './pages/Anomalies';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { FleetContext } from './context/FleetContext';
import useAgents from './hooks/useAgents';

// Authenticated shell — hooks only run when user is logged in
const AuthenticatedApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusedAgentId, setFocusedAgentId] = useState(null);

  const { agents } = useAgents();
  const { unresolvedCount, orders } = useContext(FleetContext);

  const handleNavigate = (tab, agentId = null) => {
    if (tab === 'live-map') setFocusedAgentId(agentId);
    setActiveTab(tab);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard onNavigate={handleNavigate} />;
      case 'live-map':   return <LiveMap agents={agents} orders={orders} focusedAgentId={focusedAgentId} />;
      case 'fleet':      return <Fleet agents={agents} orders={orders} onNavigate={handleNavigate} />;
      case 'orders':     return <Orders />;
      case 'anomalies':  return <Anomalies />;
      case 'simulator':  return <Simulator />;
      case 'settings':   return <Settings />;
      default:           return <Dashboard />;
    }
  };

  return (
    <MainLayout
      currentTab={activeTab}
      onTabChange={handleNavigate}
      anomalyCount={unresolvedCount}
    >
      {renderPage()}
    </MainLayout>
  );
};

const TrackHiveApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        const { getProfile } = await import('./api/endpoints');
        await getProfile();
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setIsVerifying(false);
      }
    };
    verifySession();

    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => window.removeEventListener('auth_logout', handleLogout);
  }, []);

  if (isVerifying) {
    return (
      <div style={{ height: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.2em' }}>AUTHENTICATING...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AuthenticatedApp />;
};

export default TrackHiveApp;