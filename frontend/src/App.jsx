import { useState, useEffect } from 'react';
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
import { getAgents, getOrders, getAnomalies } from './api/endpoints';

const TrackHiveApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusedAgentId, setFocusedAgentId] = useState(null);
  
  const handleNavigate = (tab, agentId = null) => {
    if (tab === 'live-map') {
      setFocusedAgentId(agentId);
    }
    setActiveTab(tab);
  };

  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0); // FIXED: real count
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  );

  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      window.location.href = '/login';
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => window.removeEventListener('auth_logout', handleLogout);
  }, []);

  // FIXED: Real API data instead of mock
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [agentsRes, ordersRes, anomaliesRes] = await Promise.all([
          getAgents(),
          getOrders(),
          getAnomalies(),
        ]);
        
        // Handle both paginated and non-paginated responses
        setAgents(agentsRes?.results || agentsRes || []);
        setOrders(ordersRes?.results || ordersRes || []);
        
        const anomalyList = anomaliesRes?.results || anomaliesRes || [];
        const unresolved = anomalyList.filter(a => !a.resolved);
        setAnomalyCount(unresolved.length);
      } catch (err) {
        console.error('Failed to fetch app data:', err);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard agents={agents} orders={orders} />;
      case 'live-map': return <LiveMap agents={agents} orders={orders} focusedAgentId={focusedAgentId} />;
      case 'fleet': return <Fleet agents={agents} orders={orders} onNavigate={handleNavigate} />;
      case 'orders': return <Orders />;
      case 'anomalies': return <Anomalies />;
      case 'simulator': return <Simulator />;
      case 'settings': return <Settings />;
      default: return <Dashboard agents={agents} orders={orders} />;
    }
  };

  return (
    <div className="app-layout">
      <Header agentCount={agents.length} />
      {/* FIXED: Real anomalyCount passed to Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onTabChange={setActiveTab}
        anomalyCount={anomalyCount}
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

export default TrackHiveApp;