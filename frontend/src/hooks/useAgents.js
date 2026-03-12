import { useState, useEffect } from 'react';
import { getAgents } from '../api/endpoints';

/**
 * Custom hook for live fleet management and agent telemetry tracking.
 * Syncs REST state with WebSocket pulse updates.
 */
const useAgents = (lastMessage) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch for the Operations Terminal
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await getAgents();
        setAgents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('API_SYNC_ERROR: Failed to retrieve fleet telemetry.', err);
        setError('Failed to fetch initial agent data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Sync real-time telemetry updates from WebSocket cluster messages
  useEffect(() => {
    if (!lastMessage) return;

    setAgents((prevAgents) => {
      const updatedAgents = [...prevAgents];

      // Handle GPS telemetry updates
      if (lastMessage.type === 'agent_location_update') {
        const index = updatedAgents.findIndex(a => a.id === lastMessage.agent_id);
        if (index !== -1) {
          updatedAgents[index] = {
            ...updatedAgents[index],
            lat: lastMessage.lat,
            lng: lastMessage.lng,
            speed: lastMessage.speed || updatedAgents[index].speed,
            last_ping: new Date().toISOString()
          };
        }
      }

      // Handle fleet availability state changes
      if (lastMessage.type === 'agent_status_change') {
        const index = updatedAgents.findIndex(a => a.id === lastMessage.agent_id);
        if (index !== -1) {
          updatedAgents[index] = {
            ...updatedAgents[index],
            status: lastMessage.status
          };
        }
      }

      return updatedAgents;
    });
  }, [lastMessage]);

  return { agents, loading, error };
};

export default useAgents;
