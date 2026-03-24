import { useState, useMemo, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Users, Circle, Zap, AlertTriangle,
  ChevronDown, X, Activity, Navigation,
  LayoutGrid, Package
} from 'lucide-react';
import Map from '../components/Map';
import StatusBadge from '../components/StatusBadge';
import FatigueBar from '../components/FatigueBar';
import { FleetContext } from '../context/FleetContext';

/* ── Filter config ──────────────────────────────────────────── */
const FILTERS = [
  { id: 'all',       label: 'All Agents',  color: '#8B8BA7', grad: 'linear-gradient(135deg, #8B8BA7 0%, #55556A 100%)' },
  { id: 'available', label: 'Available',   color: '#00D4AA', grad: 'var(--gradient-teal)' },
  { id: 'busy',      label: 'Busy',        color: '#6C63FF', grad: 'var(--gradient-primary)' },
  { id: 'idle',      label: 'Idle',        color: '#FFA502', grad: 'linear-gradient(135deg, #FFA502 0%, #FF6400 100%)' },
  { id: 'anomaly',   label: 'Alerts',      color: '#FF4757', grad: 'var(--gradient-danger)' },
];

/* ── Selected agent panel ────────────────────────────────────── */
const AgentPanel = ({ agent, onClose }) => {
  if (!agent) return null;
  const statusFilter = FILTERS.find(f => f.id === (agent.status === 'available' ? 'available' : agent.status === 'busy' ? 'busy' : agent.status === 'idle' ? 'idle' : 'all'));
  const headerGrad = agent.hasAnomaly ? 'var(--gradient-danger)' : statusFilter?.grad || 'var(--gradient-primary)';

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'absolute', top: 24, right: 24, zIndex: 1100, width: 320,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(24px)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
      }}
    >
      {/* Dynamic Header */}
      <div style={{ height: 100, background: headerGrad, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 24px 16px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#fff" />
        </button>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1 }}>
          <Navigation size={80} color="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#000', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {(agent.username || 'A')[0].toUpperCase()}
          </div>
          <div style={{ color: '#fff' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{agent.username}</h3>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>Agent Orbital Position</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Speed', icon: Zap, value: `${Math.round(agent.speed_kmph || agent.speed || 0)} km/h` },
            { label: 'Battery', icon: Activity, value: `${Math.round(agent.battery_level || 0)}%` },
            { label: 'Deliveries', icon: Package, value: agent.orders_today ?? 0 },
            { label: 'Status', icon: Circle, value: agent.status }
          ].map(i => (
            <div key={i.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <i.icon size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{i.label}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800 }}>{i.value}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Physical Readiness</p>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>{agent.fatigue_score}/10</span>
          </div>
          <FatigueBar score={agent.fatigue_score || 0} height={8} />
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  LIVE MAP PAGE (TITAN UPGRADE)                                 */
/* ══════════════════════════════════════════════════════════════ */
const LiveMap = ({ focusedAgentId }) => {
  const { agents, anomalies, orders, connected } = useContext(FleetContext);
  const [filter, setFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  /* ── Effect to clear focus memory ── */
  useEffect(() => {
    return () => {
      localStorage.removeItem('focusAgent');
    };
  }, []);

  /* ── Calculations ── */
  const unresolvedAnomalies = useMemo(() => (anomalies || []).filter(a => !a.resolved), [anomalies]);
  const counts = useMemo(() => {
    const list = agents || [];
    return {
      total: list.length,
      available: list.filter(a => a.status === 'available').length,
      busy: list.filter(a => a.status === 'busy').length,
      idle: list.filter(a => a.status === 'idle').length,
      anomaly: unresolvedAnomalies.length
    };
  }, [agents, unresolvedAnomalies]);

  const activeFilter = FILTERS.find(f => f.id === filter) || FILTERS[0];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#050508', overflow: 'hidden' }}>
      <Map agents={agents} orders={orders} unresolvedAnomalies={unresolvedAnomalies} focusedAgentId={focusedAgentId} onAgentClick={setSelectedAgent} />

      {/* ── Frosted Glass Filters ── */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 1000 }}>
        <motion.button
          onClick={() => setFilterOpen(!filterOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
            background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(20px)',
            border: `1px solid ${activeFilter.color}40`, borderRadius: 'var(--radius-xl)',
            color: '#fff', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeFilter.color, boxShadow: `0 0 10px ${activeFilter.color}` }} />
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.02em' }}>{activeFilter.label.toUpperCase()}</span>
          <ChevronDown size={14} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </motion.button>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              style={{
                marginTop: 10, minWidth: 220, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(24px)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 6,
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
              }}
            >
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => { setFilter(f.id); setFilterOpen(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: filter === f.id ? `${f.color}15` : 'transparent', border: 'none', cursor: 'pointer', color: filter === f.id ? f.color : 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Circle size={8} fill={f.color} color={f.color} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 900 }}>{f.id === 'all' ? counts.total : counts[f.id] ?? counts.anomaly}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Mini Stats HUD ── */}
      <div style={{ 
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)',
        borderRadius: 99, padding: '8px 32px', display: 'flex', gap: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' 
      }}>
        {[
          { label: 'Fleet', count: counts.total, icon: LayoutGrid, color: 'var(--primary)' },
          { label: 'Ready', count: counts.available, icon: Activity, color: '#00D4AA' },
          { label: 'Active', count: counts.busy, icon: Navigation, color: '#6C63FF' },
          { label: 'Alerts', count: counts.anomaly, icon: AlertTriangle, color: '#FF4757' }
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <s.icon size={14} color={s.color} />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono' }}>{s.count}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Connectivity Indicator ── */}
      <div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 1000,
        padding: '8px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: 99, border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)'
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#2ED573' : '#FF4757', animation: 'blink-dot 2s infinite' }} />
        <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', opacity: 0.8 }}>{connected ? 'REAL-TIME DATA' : 'SYNCING...'}</span>
      </div>

      <AnimatePresence>{selectedAgent && <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}</AnimatePresence>
    </div>
  );
};

export default LiveMap;
