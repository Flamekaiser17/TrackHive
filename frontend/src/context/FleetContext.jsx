import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAgents, getOrders, getAnomalies } from '../api/endpoints';
import useWebSocket from '../hooks/useWebSocket';

export const FleetContext = createContext();

export const FleetProvider = ({ children }) => {
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Simulation State Persistence
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStats, setSimStats] = useState({ agents: 0, events: 0, anomalies: 0 });
  const [simLogs, setSimLogs] = useState([
    { id: 1, time: '12:45:01', msg: 'Simulator initialized. Awaiting user commands...', type: 'system' }
  ]);

  const { connected, lastMessage, sendMessage } = useWebSocket();

  // Unified Fetcher Logic (Production-Grade)
  const fetchData = useCallback(async () => {
    try {
      const [aData, oData, anData] = await Promise.all([
        getAgents(),
        getOrders(),
        getAnomalies()
      ]);

      // Normalize Agent Data (Always use lat/lng internally)
      const normalizedAgents = (Array.isArray(aData) ? aData : (aData.results || [])).map(a => ({
        ...a,
        lat: a.current_lat || a.lat,
        lng: a.current_lng || a.lng,
        speed: a.current_speed || a.speed || 0,
        battery_level: a.battery_level || 100,
        km_today: a.total_km_today || 0,
        orders_today: a.orders_last_4hrs || 0,
        username: a.username || a.user?.username || `Agent_${a.id}`
      }));

      setAgents(normalizedAgents);
      setOrders(Array.isArray(oData) ? oData : (oData.results || []));
      setAnomalies(Array.isArray(anData) ? anData : (anData.results || []));
      setError(null);
    } catch (err) {
      console.error('FLEET_SYNC_ERROR: Global fetch failed.', err);
      setError('Telemetry sync interrupted.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addSimLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setSimLogs(prev => [...prev.slice(-100), { id: Date.now(), time, msg, type }]);
  }, []);

  useEffect(() => {
    fetchData();
    // If we have no agents or orders, retry more aggressively (every 5s) initially
    const intervalTime = (agents.length === 0 && !loading) ? 5000 : 30000;
    const interval = setInterval(fetchData, intervalTime);
    return () => clearInterval(interval);
  }, [fetchData, agents.length, loading]);

  // Real-time Pulse Processor (WebSocket)
  useEffect(() => {
    if (!lastMessage) return;

    // 1. Handle Agent Updates
    if (lastMessage.type === 'agent_location_update' || lastMessage.type === 'tracking_message' || lastMessage.type === 'agent_status_change') {
       // DEBUG: Log telemetry arrival
       if (lastMessage.speed !== undefined) {
         console.log(`WS_UPDATE: Agent_${lastMessage.agent_id} @ ${lastMessage.speed} km/h`);
       }

       if (isSimulating) {
          setSimStats(prev => ({ ...prev, events: prev.events + 1 }));
       }

       setAgents(prev => prev.map(a => {
        const isMatch = String(a.id) === String(lastMessage.agent_id);
        if (!isMatch) return a;
        
        // Merge telemetry metrics accurately
        return {
          ...a,
          speed: lastMessage.speed !== undefined ? lastMessage.speed : a.speed,
          lat: lastMessage.lat || a.lat,
          lng: lastMessage.lng || a.lng,
          fatigue_score: lastMessage.fatigue_score !== undefined ? lastMessage.fatigue_score : (a.fatigue_score || 0),
          status: lastMessage.status || a.status,
          km_today: lastMessage.km_today !== undefined ? lastMessage.km_today : a.km_today,
          battery_level: lastMessage.battery !== undefined ? lastMessage.battery : a.battery_level,
          orders_today: lastMessage.orders_today !== undefined ? lastMessage.orders_today : a.orders_today
        };
      }));
    }

    // 2. Handle Anomalies
    if (lastMessage.type === 'anomaly_detected') {
      if (isSimulating) {
        setSimStats(prev => ({ ...prev, anomalies: prev.anomalies + 1 }));
        addSimLog(`ANOMALY: ${lastMessage.anomaly_type} on Agent_${lastMessage.agent_id}`, 'warning');
      }
      setAnomalies(prev => {
        // Prevent duplicate anomaly logs
        if (prev.some(a => a.id === lastMessage.id)) return prev;
        return [lastMessage, ...prev];
      });
    }

    // 3. Handle Order Updates
    if (lastMessage.type === 'order_status_change') {
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === lastMessage.order_id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: lastMessage.status };
        return updated;
      });
    }
  }, [lastMessage]);

  const unresolvedAnomalies = useMemo(() => 
    anomalies.filter(a => !a.resolved), 
  [anomalies]);

  const value = {
    agents,
    orders,
    anomalies,
    unresolvedAnomalies,
    unresolvedCount: unresolvedAnomalies.length,
    loading,
    error,
    connected,
    sendMessage,
    // Simulation Persistence
    isSimulating,
    setIsSimulating,
    simStats,
    setSimStats,
    simLogs,
    addSimLog,
    refreshFleet: fetchData,
    setAnomalies 
  };

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
};
