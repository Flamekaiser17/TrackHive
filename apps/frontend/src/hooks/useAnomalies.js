import { useContext } from 'react';
import { FleetContext } from '../context/FleetContext';

/**
 * Custom hook for real-time anomaly monitoring and resolution tracking.
 * Consumes the global FleetContext for a unified state across the app.
 */
const useAnomalies = () => {
  const context = useContext(FleetContext);

  if (!context) {
    throw new Error('useAnomalies must be used within a FleetProvider');
  }

  // Defensive formatting for the dashboard consumption
  const anomaliesWithSafety = (context.anomalies || []).map(a => ({
    ...a,
    status: a.resolved ? 'RESOLVED' : 'UNRESOLVED', // Unified status field
    type: a.anomaly_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN ANOMALY'
  }));

  return {
    anomalies: anomaliesWithSafety,
    unresolvedCount: context.unresolvedCount,
    loading: context.loading,
    error: context.error,
    setAnomalies: context.setAnomalies
  };
};

export default useAnomalies;
