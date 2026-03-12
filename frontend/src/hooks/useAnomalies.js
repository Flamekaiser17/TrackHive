import { useState, useEffect } from 'react';
import { getAnomalies } from '../api/endpoints';

/**
 * Custom hook for real-time anomaly monitoring and resolution tracking.
 * Syncs the intelligence engine pulses with the terminal view.
 */
const useAnomalies = (lastMessage) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial synchronization for the Anomaly Intelligence Center
  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const data = await getAnomalies();
        setAnomalies(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('API_SYNC_ERROR: Failed to retrieve anomaly logs.', err);
        setError('Failed to fetch initial anomaly data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  // Sync real-time intelligence pulses from WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    setAnomalies((prevAnomalies) => {
      const updatedAnomalies = [...prevAnomalies];

      // Handle new critical anomaly detection
      if (lastMessage.type === 'anomaly_detected') {
        const index = updatedAnomalies.findIndex(a => a.id === lastMessage.anomaly.id);
        if (index === -1) {
          // Prepend for real-time awareness in the Command Center
          updatedAnomalies.unshift(lastMessage.anomaly);
        }
      }

      // Handle anomaly resolution events
      if (lastMessage.type === 'anomaly_resolved') {
        const index = updatedAnomalies.findIndex(a => a.id === lastMessage.anomaly_id);
        if (index !== -1) {
          updatedAnomalies[index] = {
            ...updatedAnomalies[index],
            status: 'RESOLVED',
            resolved_at: new Date().toISOString()
          };
        }
      }

      return updatedAnomalies;
    });
  }, [lastMessage]);

  const unresolvedCount = (anomalies || []).filter(a => a.status === 'UNRESOLVED').length;

  return { anomalies, unresolvedCount, loading, error };
};

export default useAnomalies;
