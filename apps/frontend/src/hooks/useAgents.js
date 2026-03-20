import { useContext } from 'react';
import { FleetContext } from '../context/FleetContext';

/**
 * Custom hook for live fleet management and agent telemetry tracking.
 * Consumes the global FleetContext for a unified state across the app.
 */
const useAgents = () => {
  const context = useContext(FleetContext);
  
  if (!context) {
    throw new Error('useAgents must be used within a FleetProvider');
  }

  return {
    agents: context.agents,
    loading: context.loading,
    error: context.error,
    connected: context.connected,
    refreshAgents: context.refreshFleet
  };
};

export default useAgents;
