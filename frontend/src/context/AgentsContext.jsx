import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAgents } from '../api/endpoints';
import useWebSocket from '../hooks/useWebSocket';

export const AgentsContext = createContext();

export const AgentsProvider = ({ children }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { connected, lastMessage, sendMessage } = useWebSocket();

  const fetchAgents = useCallback(async () => {
    try {
      const data = await getAgents();
      setAgents(Array.isArray(data) ? data : (data.results || []));
      setError(null);
    } catch (err) {
      console.error('AGENTS_CONTEXT_FETCH_ERROR:', err);
      setError('Failed to fetch fleet data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Periodic sync
    return () => clearInterval(interval);
  }, [fetchAgents]);

  useEffect(() => {
    if (!lastMessage) return;

    setAgents((prev) => {
      const updated = [...prev];
      
      if (lastMessage.type === 'agent_location_update') {
        const idx = updated.findIndex(a => a.id === lastMessage.agent_id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            current_lat: lastMessage.lat,
            current_lng: lastMessage.lng,
            speed: lastMessage.speed || updated[idx].speed,
            last_ping: new Date().toISOString()
          };
        }
      }

      if (lastMessage.type === 'agent_status_change') {
        const idx = updated.findIndex(a => a.id === lastMessage.agent_id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            status: lastMessage.status
          };
        }
      }

      return updated;
    });
  }, [lastMessage]);

  const value = {
    agents,
    loading,
    error,
    connected,
    lastMessage,
    sendMessage,
    refreshAgents: fetchAgents
  };

  return (
    <AgentsContext.Provider value={value}>
      {children}
    </AgentsContext.Provider>
  );
};
