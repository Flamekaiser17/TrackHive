import { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Fleet from './pages/Fleet';
import Orders from './pages/Orders';
import Anomalies from './pages/Anomalies';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { motion, AnimatePresence } from 'framer-motion';
import { FleetContext } from './context/FleetContext';
import useAgents from './hooks/useAgents';

// Authenticated shell — hooks only run when user is logged in
const AuthenticatedApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusedAgentId, setFocusedAgentId] = useState(null);

  const { agents } = useAgents();
  const { unresolvedCount, orders } = useContext(FleetContext);

  const handleNavigate = (tab, agentId = null) => {
    if (tab === 'live-map') {
      setFocusedAgentId(agentId);
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'live-map': return <LiveMap agents={agents} orders={orders} focusedAgentId={focusedAgentId} />;
      case 'fleet': return <Fleet agents={agents} orders={orders} onNavigate={handleNavigate} />;
      case 'orders': return <Orders />;
      case 'anomalies': return <Anomalies />;
      case 'simulator': return <Simulator />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <Sidebar
        currentTab={activeTab}
        onTabChange={setActiveTab}
        anomalyCount={unresolvedCount}
      />
      <main className="main-area" style={{ overflow: 'hidden', position: 'relative', background: 'var(--bg-primary)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.01, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const TrackHiveApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  );

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
      // No window.location.href — React state handles it (no full reload loop)
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => window.removeEventListener('auth_logout', handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AuthenticatedApp />;
};

export default TrackHiveApp;