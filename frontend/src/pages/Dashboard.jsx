import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Clock, AlertTriangle, 
  TrendingUp, Activity, Zap, CheckCircle2
} from 'lucide-react';
import Map from '../components/Map';
import { useState, useEffect, useMemo } from 'react';
import { getHealth, getOrders, resolveAnomaly } from '../api/endpoints';
import useWebSocket from '../hooks/useWebSocket';
import useAgents from '../hooks/useAgents';
import useAnomalies from '../hooks/useAnomalies';

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
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '100px' }}>
          <TrendingUp size={12} color="var(--accent-green)" style={{ opacity: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '700' }}></span>
        </div>
      )}
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
  const { connected, lastMessage } = useWebSocket();
  const { agents, loading: agentsLoading } = useAgents(lastMessage);
  const { anomalies, unresolvedCount, loading: anomaliesLoading, setAnomalies } = useAnomalies(lastMessage);
  
  // ✅ FIX 1: orders ko array initialize karo, paginated response handle karo
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [activity, setActivity] = useState([]);

  const fetchData = async () => {
    try {
      const [oData, hData] = await Promise.all([getOrders(), getHealth()]);
      // ✅ FIX 2: paginated response handle karo
      const ordersArray = Array.isArray(oData) ? oData : (oData?.results || []);
      setOrders(ordersArray);
      setHealthData(hData);
    } catch (err) {
      console.error('DASHBOARD_FETCH_ERROR:', err);
      setOrders([]); // ✅ error pe bhi array rakho
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    let event = null;
    if (lastMessage.type === 'agent_location_update') {
      event = {
        id: Date.now(),
        border: 'var(--accent-blue)',
        badge: 'LOCATION',
        badgeColor: 'var(--accent-blue)',
        title: `Agent_${lastMessage.agent_id}`,
        detail: `Moving @ ${lastMessage.speed_kmph || lastMessage.speed || 0} km/h`,
        time: 'just now'
      }
    }
    if (lastMessage.type === 'anomaly_detected') {
      event = {
        id: Date.now(),
        border: 'var(--accent-red)',
        badge: 'ANOMALY',
        badgeColor: 'var(--accent-red)',
        title: `Agent_${lastMessage.agent_id}`,
        detail: (lastMessage.anomaly_type || '').replace(/_/g, ' ').toUpperCase(),
        time: 'just now'
      }
    }
    if (lastMessage.type === 'order_status_change') {
      event = {
        id: Date.now(),
        border: 'var(--accent-green)',
        badge: 'ORDER',
        badgeColor: 'var(--accent-green)',
        title: `Order #${lastMessage.order_id}`,
        detail: `Status → ${lastMessage.status}`,
        time: 'just now'
      }
    }
    if (event) {
      setActivity(prev => [event, ...prev].slice(0, 20))
    }
  }, [lastMessage]);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // ✅ FIX 3: saare useMemo mein orders array guarantee hai ab
  const onlineAgents = useMemo(() => agents.filter(a => a.status !== 'offline').length, [agents]);
  const ordersInTransit = useMemo(() => orders.filter(o => o.status === 'in_transit').length, [orders]);
  const avgEta = useMemo(() => {
    const active = orders.filter(o => o.eta_minutes > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((acc, o) => acc + o.eta_minutes, 0) / active.length);
  }, [orders]);

  const fatigueGroups = useMemo(() => {
    const groups = { green: 0, yellow: 0, amber: 0, red: 0 };
    agents.forEach(a => {
      const s = a.fatigue_score || 0;
      if (s <= 3) groups.green++;
      else if (s <= 6) groups.yellow++;
      else if (s <= 8) groups.amber++;
      else groups.red++;
    });
    return groups;
  }, [agents]);

  // ✅ FIX 4: setAnomalies useAnomalies hook se aana chahiye
  const handleResolve = async (id) => {
    try {
      if (setAnomalies) {
        setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
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
        <StatCard label="Orders In Transit" value={ordersInTransit} subtext={`${ordersInTransit} moving fleet`} icon={Package} color="var(--accent-blue)" loading={ordersLoading} />
        <StatCard label="Avg ETA" value={`${avgEta} min`} subtext="±3 min confidence" icon={Clock} color="var(--primary)" loading={ordersLoading} />
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
            <Map agents={agents} orders={orders} />
          </div>
        </div>

        <aside style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--primary)" /> Activity Stream
            </h3>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <AnimatePresence initial={false}>
              {activity.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>Awaiting cluster telemetry...</p>
              ) : (
                activity.map((event) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ borderLeft: `3px solid ${event.border}`, padding: '10px 14px', background: 'var(--surface)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: event.badgeColor, background: `${event.badgeColor}15`, padding: '2px 6px', borderRadius: '4px' }}>{event.badge}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{event.time}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>{event.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{event.detail}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
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
            {agents.slice(0, 10).map((a) => {
              const s = a.fatigue_score || 0;
              const color = s <= 3 ? 'var(--accent-green)' : s <= 6 ? 'var(--accent-amber)' : s <= 8 ? '#FF8800' : 'var(--accent-red)';
              return (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', border: `1px solid ${color}` }}>
                    {a.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '60px' }}>{a.name}</p>
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
                    <td style={{ padding: '14px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{getTimeAgo(row.created_at)}</td>
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