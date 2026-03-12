import { useState, useEffect, useMemo } from 'react';
import Map from '../components/Map';
import { Filter, Users, Package, AlertTriangle } from 'lucide-react';
import useAgents from '../hooks/useAgents';
import useAnomalies from '../hooks/useAnomalies';
import useWebSocket from '../hooks/useWebSocket';

const LiveMap = ({ focusedAgentId }) => {
  const { lastMessage } = useWebSocket();
  const { agents } = useAgents(lastMessage);
  const { anomalies } = useAnomalies(lastMessage);
  
  const [filter, setFilter] = useState('all');

  // FIXED: BUG 4 - Filter logic connected to marker rendering
  const filteredAgents = useMemo(() => {
    if (filter === 'all') return agents || [];
    if (filter === 'available') return (agents || []).filter(a => a.status === 'available');
    if (filter === 'transit') return (agents || []).filter(a => a.status === 'busy');
    if (filter === 'anomaly') {
      return (agents || []).filter(a => 
        (anomalies || []).some(an => 
          (an.agent_id === a.id || an.agent === a.id) && (!an.resolved && an.status !== 'RESOLVED')
        )
      );
    }
    return agents || [];
  }, [agents, filter, anomalies]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* FIXED: BUG 4 - Render filteredAgents */}
      <Map 
        agents={filteredAgents || []} 
        unresolvedAnomalies={(anomalies || []).filter(a => !a.resolved && a.status !== 'RESOLVED')}
        focusedAgentId={focusedAgentId}
      />

      {/* TOP LEFT FILTERS - FIXED: BUG 4 */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 1000, display: 'flex', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <button 
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          style={{ padding: '8px 16px', background: filter === 'all' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
        >All</button>
        <button 
          onClick={() => setFilter('available')}
          className={filter === 'available' ? 'filter-btn active' : 'filter-btn'}
          style={{ padding: '8px 16px', background: filter === 'available' ? 'var(--accent-green)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
        >Available</button>
        <button 
          onClick={() => setFilter('transit')}
          className={filter === 'transit' ? 'filter-btn active' : 'filter-btn'}
          style={{ padding: '8px 16px', background: filter === 'transit' ? 'var(--accent-blue)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
        >In Transit</button>
        <button 
          onClick={() => setFilter('anomaly')}
          className={filter === 'anomaly' ? 'filter-btn active' : 'filter-btn'}
          style={{ padding: '8px 16px', background: filter === 'anomaly' ? 'var(--accent-red)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
        >Anomaly</button>
      </div>
    </div>
  );
};

export default LiveMap;
