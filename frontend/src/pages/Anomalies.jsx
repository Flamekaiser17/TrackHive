import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Zap, MapPin, Navigation,
  WifiOff, CheckCircle2, Clock, User,
  Trash2, RefreshCw, X, AlertTriangle,
  Package, ChevronRight,
} from 'lucide-react';
import useAnomalies from '../hooks/useAnomalies';
import { resolveAnomaly } from '../api/endpoints';
import StatusBadge from '../components/StatusBadge';

const timeAgo = (ts) => {
  if (!ts) return '—';
  try {
    const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (isNaN(secs) || secs < 0) return '—';
    if (secs < 60)  return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  } catch { return '—'; }
};

const ICON_MAP = {
  speed_anomaly:   { icon: Zap,        label: 'Speed Breach',    color: '#FF6B81', grad: 'var(--gradient-danger)' },
  agent_stuck:     { icon: MapPin,     label: 'Unit Stationary', color: '#FFA502', grad: 'linear-gradient(135deg, #FFA502 0%, #FF6400 100%)' },
  route_deviation: { icon: Navigation, label: 'Path Deviation',  color: '#6C63FF', grad: 'var(--gradient-primary)' },
  unreachable:     { icon: WifiOff,    label: 'Signal Loss',     color: '#8B8BA7', grad: 'linear-gradient(135deg, #8B8BA7 0%, #55556A 100%)' },
};

const getAnomalyMeta = (type) => {
  const key = (type || '').toLowerCase().replace(/ /g, '_');
  return ICON_MAP[key] || { icon: AlertTriangle, label: 'Anomalous Activity', color: '#FF4757', grad: 'var(--gradient-danger)' };
};

const TABS = [
  { id: 'all',             label: 'All events' },
  { id: 'speed_anomaly',   label: 'Velocity' },
  { id: 'agent_stuck',     label: 'Stasis' },
  { id: 'route_deviation', label: 'Tactical' },
  { id: 'unreachable',     label: 'Comm-Loss' },
];

/* ══════════════════════════════════════════════════════════════ */
/*  ANOMALIES (TITAN UPGRADE)                                     */
/* ══════════════════════════════════════════════════════════════ */
const Anomalies = () => {
  const { anomalies, loading, setAnomalies } = useAnomalies();
  const [filter, setFilter] = useState('all');
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const [resolvingAll, setResolvingAll] = useState(false);

  const unresolved = useMemo(() => (anomalies || []).filter(a => !a.resolved), [anomalies]);
  const filtered = useMemo(() => (filter === 'all' ? (anomalies || []) : (anomalies || []).filter(a => (a.anomaly_type || '').toLowerCase().replace(/ /g, '_') === filter)), [anomalies, filter]);

  const handleResolve = useCallback(async (id) => {
    setResolvingIds(prev => new Set(prev).add(id));
    try {
      await resolveAnomaly(id);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch (err) { console.error('Resolve failed:', err); }
    finally { setResolvingIds(prev => { const next = new Set(prev); next.delete(id); return next; }); }
  }, [setAnomalies]);

  const handleResolveAll = useCallback(async () => {
    if (unresolved.length === 0) return;
    setResolvingAll(true);
    try {
      // Resolve all unresolved anomalies in parallel
      await Promise.all(unresolved.map(a => resolveAnomaly(a.id)));
      setAnomalies(prev => prev.map(a => ({ ...a, resolved: true })));
    } catch (err) {
      console.error('Resolve All failed:', err);
    } finally {
      setResolvingAll(false);
    }
  }, [unresolved, setAnomalies]);

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      
      {/* ── Dynamic Gradient Sweep Banner ── */}
      <AnimatePresence>
        {unresolved.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ 
              borderRadius: 'var(--radius-xl)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 16,
              overflow: 'hidden', position: 'relative', background: '#FF4757', border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', zIndex: 1 }} />
            <ShieldAlert size={24} color="#fff" style={{ position: 'relative', zIndex: 2 }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
               <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>STATUS: CRITICAL OPS BREACH</h2>
               <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{unresolved.length} UNRESOLVED ANOMALIES REQUIRE IMMEDIATE TACTICAL RESPONSE</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.4px' }}>Incident command center</h1>
        <button 
          onClick={handleResolveAll}
          disabled={unresolved.length === 0 || resolvingAll} 
          style={{ 
            padding: '10px 24px', background: 'transparent', border: '1.5px solid var(--danger)', 
            borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: 11, fontWeight: 900, 
            cursor: (unresolved.length === 0 || resolvingAll) ? 'default' : 'pointer', 
            transition: 'all 0.2s', opacity: (unresolved.length === 0 || resolvingAll) ? 0.3 : 1 
          }}
        >
          {resolvingAll ? 'NEUTRALIZING...' : 'RESOLVE ALL INCIDENTS'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: filter === tab.id ? 'var(--gradient-primary)' : 'transparent', color: filter === tab.id ? '#fff' : 'var(--text-faint)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}>{tab.label.toUpperCase()}</button>
        ))}
      </div>

      {/* ── Card Grid with Staggered Animations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 20 }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((anomaly, idx) => {
            const { icon: Icon, label, color, grad } = getAnomalyMeta(anomaly.anomaly_type);
            const isResolved = anomaly.resolved;
            const isResolving = resolvingIds.has(anomaly.id);

            return (
              <motion.div
                key={anomaly.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
                  padding: '24px', display: 'flex', gap: 20, position: 'relative'
                }}
              >
                {/* Severity Left Border */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: isResolved ? 'var(--text-faint)' : grad, borderRadius: '24px 0 0 24px' }} />

                <div style={{ 
                  width: 54, height: 54, borderRadius: 'var(--radius-lg)', background: `${color}15`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${color}15`
                }}>
                  <Icon size={24} color={color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{label}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{anomaly.agent_name || `Agent ${anomaly.agent_id}`}</p>
                    </div>
                    <StatusBadge value={anomaly.severity || 'high'} size="xs" />
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', fontSize: 11, fontWeight: 700 }}>
                        <Clock size={12} /> {timeAgo(anomaly.detected_at)}
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', fontSize: 11, fontWeight: 700 }}>
                        <Package size={12} /> #{anomaly.order || 'N/A'}
                     </div>
                  </div>

                  {/* Morphing Resolve Button */}
                  <button
                    onClick={() => !isResolved && handleResolve(anomaly.id)}
                    disabled={isResolving || isResolved}
                    style={{
                      width: '100%', padding: '12px', background: isResolved ? 'rgba(46,213,115,0.1)' : 'var(--surface-glass)',
                      border: isResolved ? '1.5px solid rgba(46,213,115,0.4)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      color: isResolved ? '#2ED573' : 'var(--text-primary)', fontSize: 11, fontWeight: 900,
                      cursor: isResolved || isResolving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all 0.3s'
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isResolved ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={16} /></motion.div>
                      ) : isResolving ? (
                        <motion.div key="spin" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={16} /></motion.div>
                      ) : (
                        <motion.div key="text">RESOLVE THREAT</motion.div>
                      )}
                    </AnimatePresence>
                    {isResolved && "THREAT NEUTRALIZED"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Anomalies;