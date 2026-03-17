import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Clock, AlertTriangle, 
  Activity, CheckCircle2
} from 'lucide-react';
import Map from '../components/Map';
import { useMemo } from 'react';
import { resolveAnomaly } from '../api/endpoints';
import useAgents from '../hooks/useAgents';
import useAnomalies from '../hooks/useAnomalies';
import { useContext } from 'react';
import { FleetContext } from '../context/FleetContext';

const StatCard = ({ label, value, subtext, icon: Icon, color, isAnomaly, loading }) => (
  <motion.div 
    whileHover={{ y: -4, background: 'var(--surface-hover)' }}
    className={`stat-card ${isAnomaly && value > 0 ? 'anomaly-alert-card' : ''}`}
    style={{ '--card-color': color }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ padding: '10px', background: `${color}10`, borderRadius: '12px', border: `1px solid ${color}20` }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
    {loading ? (
      <div style={{ height: '38px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
    ) : (
      <h3 className="mono" style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>{value}</h3>
    )}
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{subtext}</p>
  </motion.div>
);

const Dashboard = () => {
  const { agents, loading: agentsLoading, connected } = useAgents();
  const { anomalies, unresolvedCount, loading: anomaliesLoading, setAnomalies } = useAnomalies();
  const { orders, lastMessage } = useContext(FleetContext);
  
  const activity = useMemo(() => {
    if (!lastMessage) return [];
    // This could also be managed in Context, but for simple visualization we can keep it here
    // In a high-perf scenario, move this to FleetContext as well.
    return []; // For now, let's keep it simple to avoid state explosion
  }, [lastMessage]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '...';
    try {
      const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
      if (isNaN(seconds)) return '...';
      if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } catch {
      return '...';
    }
  };

  const onlineAgents = useMemo(() => (agents || []).filter(a => a.status !== 'offline').length, [agents]);
  const ordersInTransit = useMemo(() => (orders || []).filter(o => o.status === 'in_transit' || o.status === 'picked_up').length, [orders]);
  
  const avgEta = useMemo(() => {
    const active = (orders || []).filter(o => (o.eta_minutes || 0) > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((acc, o) => acc + (o.eta_minutes || 0), 0) / active.length);
  }, [orders]);

  const fatigueGroups = useMemo(() => {
    const groups = { green: 0, yellow: 0, amber: 0, red: 0 };
    (agents || []).forEach(a => {
      const s = a.fatigue_score || 0;
      if (s <= 3) groups.green++;
      else if (s <= 6) groups.yellow++;
      else if (s <= 8) groups.amber++;
      else groups.red++;
    });
    return groups;
  }, [agents]);

  const handleResolve = async (id) => {
    try {
      if (setAnomalies) {
        setAnomalies(prev => prev.map(a => a.id === id ? { ...a, resolved: true, resolved_at: new Date().toISOString() } : a));
      }
      await resolveAnomaly(id);
    } catch (err) {
      console.error('RESOLVE_ERROR:', err);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="kpi-row">
        <StatCard label="Active Agents" value={onlineAgents} subtext={`${onlineAgents} online now`} icon={Users} color="var(--accent-green)" loading={agentsLoading} />
        <StatCard label="Orders In Transit" value={ordersInTransit} subtext={`${ordersInTransit} moving fleet`} icon={Package} color="var(--accent-blue)" loading={agentsLoading} />
        <StatCard label="Avg ETA" value={`${avgEta} min`} subtext="±3 min confidence" icon={Clock} color="var(--primary)" loading={agentsLoading} />
        <StatCard label="Active Anomalies" value={unresolvedCount} subtext={`${unresolvedCount} require action`} icon={AlertTriangle} color="var(--accent-red)" isAnomaly={true} loading={anomaliesLoading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', height: '500px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '15px' }}>Live Fleet Map</h3>
              <span className="badge badge-green">{onlineAgents} ACTIVE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: connected ? 'var(--accent-green)' : 'var(--accent-red)', borderRadius: '50%' }} />
              <span style={{ fontSize: '10px', fontWeight: '700' }}>{connected ? 'SYNC_LINK_UP' : 'SYNC_LOST'}</span>
            </div>
          </header>
          <div style={{ flex: 1, position: 'relative' }}>
            <Map agents={agents} orders={orders} unresolvedAnomalies={anomalies.filter(a => !a.resolved)} />
          </div>
        </div>

        <aside style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--primary)" /> Activity Stream
            </h3>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>
              {connected ? 'Monitoring real-time telemetry...' : 'Reconnecting to cluster...'}
            </p>
          </div>
        </aside>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px' }}>Fleet Fatigue Overview</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL: {agents.length} AGENTS</span>
          </header>
          <div style={{ display: 'flex', gap: '4px', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ width: `${agents.length ? (fatigueGroups.green / agents.length) * 100 : 0}%`, background: 'var(--accent-green)' }} />
            <div style={{ width: `${agents.length ? (fatigueGroups.yellow / agents.length) * 100 : 0}%`, background: 'var(--accent-amber)' }} />
            <div style={{ width: `${agents.length ? (fatigueGroups.amber / agents.length) * 100 : 0}%`, background: '#FF8800' }} />
            <div style={{ width: `${agents.length ? (fatigueGroups.red / agents.length) * 100 : 0}%`, background: 'var(--accent-red)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {(agents || []).slice(0, 10).map((a) => {
              const s = a.fatigue_score || 0;
              const color = s <= 3 ? 'var(--accent-green)' : s <= 6 ? 'var(--accent-amber)' : s <= 8 ? '#FF8800' : 'var(--accent-red)';
              return (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', border: `1px solid ${color}` }}>
                    {a.username?.charAt(0) || '?'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '60px' }}>{a.username}</p>
                    <span style={{ fontSize: '9px', color: a.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)' }}>● {a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px' }}>Anomaly Response Log</h3>
            <div style={{ padding: '4px 12px', background: 'rgba(255, 71, 87, 0.1)', borderRadius: '100px', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
              <span style={{ color: 'var(--accent-red)', fontSize: '11px', fontWeight: '800' }}>{unresolvedCount} PENDING</span>
            </div>
          </header>
          {anomalies.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
              <div style={{ padding: '20px', background: 'rgba(0, 229, 160, 0.1)', borderRadius: '50%' }}>
                <CheckCircle2 size={48} color="var(--accent-green)" />
              </div>
              <p style={{ color: 'var(--accent-green)', fontWeight: '800', letterSpacing: '1px' }}>ALL SYSTEMS CLEAR</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>TYPE</th>
                  <th style={{ padding: '12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>AGENT</th>
                  <th style={{ padding: '12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>TIME</th>
                  <th style={{ padding: '12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 5).map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', background: row.status === 'UNRESOLVED' ? 'rgba(255, 71, 87, 0.03)' : 'transparent', opacity: row.status === 'RESOLVED' ? 0.5 : 1 }}>
                    <td style={{ padding: '14px 0', fontSize: '13px', fontWeight: '700', color: row.status === 'UNRESOLVED' ? 'var(--accent-red)' : 'var(--text-primary)' }}>{row.type}</td>
                    <td style={{ padding: '14px 0', fontSize: '13px' }}>{row.agent_name || `Agent_${row.agent_id}`}</td>
                    <td style={{ padding: '14px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{getTimeAgo(row.detected_at)}</td>
                    <td style={{ padding: '14px 0' }}>
                      {row.status === 'UNRESOLVED' ? (
                        <button onClick={() => handleResolve(row.id)} style={{ padding: '6px 14px', background: 'var(--primary)', border: 'none', borderRadius: '6px', fontSize: '11px', color: 'white', cursor: 'pointer', fontWeight: '700' }}>RESOLVE</button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '700' }}>DONE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;