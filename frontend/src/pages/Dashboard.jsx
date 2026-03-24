import { useMemo, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Package, AlertTriangle, Activity,
  CheckCircle2, ChevronRight, MapPin, Zap,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useAgents from '../hooks/useAgents';
import useAnomalies from '../hooks/useAnomalies';
import { FleetContext } from '../context/FleetContext';
import { resolveAnomaly } from '../api/endpoints';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import FatigueBar from '../components/FatigueBar';

/* ── SpeedGraph Component ───────────────────────────────────── */
const SpeedGraph = ({ speed }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, {
        t: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        speed: Math.floor(speed || 0)
      }];
      return next.slice(-20); // last 20 points
    });
  }, [speed]);

  return (
    <div style={{
      background: 'transparent',
      border: '1px solid rgba(108,99,255,0.15)',
      borderRadius: 12,
      padding: '16px',
      marginBottom: 24,
      position: 'relative'
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Fleet Speed · Live
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={history}>
          <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ background: '#13131a', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, fontSize: 11, color: '#fff' }} labelStyle={{ color: 'rgba(255,255,255,0.4)' }} />
          <Line type="monotone" dataKey="speed" stroke="#6C63FF" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(/[_\s]/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

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

const getFatigueColor = (score) => {
  const s = Number(score) || 0;
  if (s <= 3) return '#2ED573';
  if (s <= 6) return '#FFA502';
  if (s <= 8) return '#FF6400';
  return '#FF4757';
};

/* ── Sparkline Component ─────────────────────────────────────── */
const Sparkline = ({ accent = 'primary', data = [30, 45, 35, 60, 50, 75, 70] }) => {
  const color = accent === 'primary' ? '#6C63FF' : accent === 'teal' ? '#00D4AA' : accent === 'danger' ? '#FF4757' : '#FFA502';
  const points = data.map((v, i) => `${(i * 100) / 6},${100 - v}`).join(' ');
  return (
    <div style={{ position: 'absolute', right: 0, bottom: 40, width: 100, height: 40, opacity: 0.4 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        <path
          d={`M ${points}`}
          fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ── Circular Progress Gauge ─────────────────────────────────── */
const CircularProgress = ({ score }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 80 ? '#2ED573' : score > 50 ? '#FFA502' : '#FF4757';

  return (
    <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={radius} stroke="var(--border)" strokeWidth="4.5" fill="transparent" strokeOpacity={0.4} />
        <motion.circle
          cx="40" cy="40" r={radius} stroke={color} strokeWidth="4.5" fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeLinecap: 'round' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{score}</span>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginTop: -2 }}>HEALTH</div>
      </div>
    </div>
  );
};

/* ── Section UI ──────────────────────────────────────────────── */
const Section = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
    style={{ position: 'relative' }}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ title, badge, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{title}</h2>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 900, padding: '3px 10px',
          background: 'rgba(108,99,255,0.08)', color: '#9B8FFF',
          borderRadius: 99, letterSpacing: '0.08em', border: '1px solid rgba(108,99,255,0.15)'
        }}>
          {badge}
        </span>
      )}
    </div>
    {action}
  </div>
);

/* ── Agent Fatigue Card ───────────────────────────────────────── */
const AgentFatigueCard = ({ agent, onViewMap }) => {
  const color = getFatigueColor(agent.fatigue_score);
  const initials = getInitials(agent.username);

  return (
    <motion.div
      whileHover={{
        y: -6,
        borderColor: 'rgba(108,99,255,0.5)',
        boxShadow: '0 0 24px rgba(108,99,255,0.08)'
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        background: 'transparent', border: '1px solid rgba(108,99,255,0.18)', borderRadius: 'var(--radius-lg)',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
        transition: 'var(--transition-smooth)',
        animation: agent.fatigue_score >= 8 ? 'critical-pulse 2s infinite' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--bg-primary)', border: `1px solid var(--border)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, color: 'var(--primary)'
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.username}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.status === 'offline' ? 'var(--text-faint)' : agent.status === 'busy' ? 'var(--warning)' : 'var(--success)' }} />
             <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{agent.status}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PREPAREDNESS</p>
        <motion.span 
          key={agent.fatigue_score}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 11, fontWeight: 900, color: color }}
        >
          {agent.fatigue_score || 0}/10
        </motion.span>
      </div>
      <FatigueBar score={agent.fatigue_score || 0} height={6} />

      <div style={{ 
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr', 
        gap: 8, padding: '12px 0', 
        borderTop: '1px solid rgba(255,255,255,0.03)', 
        borderBottom: '1px solid rgba(255,255,255,0.03)' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <motion.p 
            key={agent.speed}
            initial={{ opacity: 0, y: -8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}
          >
            {Math.floor(agent.speed || 0)}
          </motion.p>
          <p style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase' }}>km/h</p>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ textAlign: 'center' }}>
          <motion.p 
            key={agent.km_today}
            initial={{ opacity: 0, y: -8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}
          >
            {typeof agent.km_today === 'number' ? agent.km_today.toFixed(1) : '0.0'}
          </motion.p>
          <p style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase' }}>km</p>
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.setItem('focusAgent', JSON.stringify({ id: agent.id, lat: agent.lat, lng: agent.lng }));
          onViewMap(agent.id);
        }}
        style={{
          width: '100%', padding: '10px 0',
          background: 'var(--surface-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-glass)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <MapPin size={13} color="var(--primary)" /> TRACK AGENT
      </button>
    </motion.div>
  );
};

/* ── Anomaly Row ─────────────────────────────────────────────── */
const AnomalyRow = ({ row, onResolve, resolving }) => {
  const isResolved = row.resolved || row.status === 'RESOLVED';
  const color = row.severity === 'high' ? '#FF4757' : row.severity === 'medium' ? '#FFA502' : '#2ED573';

  return (
    <tr style={{
      borderBottom: '1px solid rgba(42,42,58,0.4)',
      background: !isResolved ? 'rgba(255,255,255,0.01)' : 'transparent',
      opacity: isResolved ? 0.4 : 1, transition: 'all 0.3s',
      position: 'relative'
    }}>
      {/* Severity color border */}
      <td style={{ width: 4, padding: 0, background: !isResolved ? color : 'transparent' }} />
      
      <td style={{ padding: '16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${color}10`
          }}>
            <AlertTriangle size={14} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {(row.type || row.anomaly_type || 'Error').replace(/_/g, ' ')}
          </span>
        </div>
      </td>
      <td style={{ padding: '16px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{row.agent_name || `Agent ${row.agent_id}`}</td>
      <td style={{ padding: '16px 12px' }}><StatusBadge value={row.severity || 'low'} size="xs" /></td>
      <td style={{ padding: '16px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{timeAgo(row.detected_at)}</td>
      <td style={{ padding: '16px 12px' }}>
        {!isResolved && (
          <button
            onClick={() => onResolve(row.id)}
            disabled={resolving === row.id}
            style={{
              padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {resolving === row.id ? '…' : 'RESOLVE'}
          </button>
        )}
      </td>
    </tr>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  DASHBOARD (TITAN UPGRADE)                                     */
/* ══════════════════════════════════════════════════════════════ */
const Dashboard = ({ onNavigate }) => {
  const { 
    agents,
    anomalies,
    setAnomalies,
    orders,
    loading
  } = useContext(FleetContext);
  const [resolving, setResolving] = useState(null);
  const audioCtx = useRef(null);

  /* ── Sound Helper ── */
  const playAlert = useCallback((type = 'anomaly') => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'critical') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    const unresolved = anomalies.filter(a => !a.resolved);
    if (unresolved.length > 0) {
      const latest = unresolved[0];
      if (latest.severity === 'high') playAlert('critical');
      else playAlert('anomaly');
    }
  }, [anomalies.length, playAlert]);

  /* ── Derived Stats ──────────────────────────────────── */
  const permanentAgents = useMemo(() => 
    (agents || []).filter(a => a.is_permanent), 
  [agents]);

  const counts = useMemo(() => {
    const list = agents || [];
    return {
      active: list.filter(a => a.is_permanent).length,
      swarm: list.filter(a => !a.is_permanent).length,
      unresolved: (anomalies || []).filter(a => !a.resolved).length,
      orders: (orders || []).length,
      avgFatigue: list.length ? (list.reduce((s, a) => s + (a.fatigue_score || 0), 0) / list.length).toFixed(1) : 0
    };
  }, [agents, anomalies, orders]);

  /* ── Fleet Health Heatmap computation ──────────────── */
  const fleetHealthScore = useMemo(() => {
    const f = Number(counts.avgFatigue);
    return Math.floor(Math.max(0, (10 - f) * 10)); // 10 fatigue = 0 health, 0 fatigue = 100 health
  }, [counts.avgFatigue]);

  const avgSpeed = useMemo(() =>
    permanentAgents.length
      ? Math.floor(permanentAgents.reduce((s, a) => s + (a.speed || 0), 0) / permanentAgents.length)
      : 0,
  [permanentAgents]);


  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      
      {/* ── KPI Grid ──────────────────────────────────────── */}
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="kpi-grid">
          <KPICard title="Active Agents" value={counts.active} accent="teal" icon={Users} trend="up" trendValue="94%" loading={loading} />
          <KPICard title="Total Orders" value={counts.orders} accent="primary" icon={Package} trend="up" trendValue="+12" loading={loading} />
          <KPICard title="Live Anomalies" value={counts.unresolved} accent="danger" icon={AlertTriangle} trend="down" trendValue="Action Required" loading={loading} />
          
          {/* Custom Score Card */}
          <div className="stat-card-base" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <CircularProgress score={fleetHealthScore} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fleet Health</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Optimal</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#2ED573', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                <TrendingUp size={12} strokeWidth={3} /> Stability +4%
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Fatigue HUD (Refined) ───────────────────────────── */}
      <Section delay={0.1}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
          <SectionHeader title="Fleet Fatigue HUD" badge={`${counts.swarm} Swarm Members Active`} action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {[
                { label: 'Fresh', color: '#2ED573' },
                { label: 'Tired', color: '#FFA502' },
                { label: 'Critical', color: '#FF4757' }
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: i.color }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{i.label}</span>
                </div>
              ))}
            </div>
          } />

          <SpeedGraph speed={avgSpeed} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {loading ? (
              [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)
            ) : (
              permanentAgents.map(a => (
                <AgentFatigueCard key={a.id} agent={a} onViewMap={() => onNavigate('live-map')} />
              ))
            )}
          </div>
        </div>
      </Section>

      {/* ── Recent Anomalies HUD ───────────────────────────── */}
      <Section delay={0.2}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Recent Incident Logs</h2>
            <button onClick={() => onNavigate('anomalies')} style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', background: 'none', border: 'none' }}>
              VIEW CENTER <ChevronRight size={14} />
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
                <th style={{ width: 4 }}></th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Issue</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Entity</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Severity</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Detection</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Protocol</th>
              </tr>
            </thead>
            <tbody>
              {(anomalies || []).slice(0, 5).map(a => (
                <AnomalyRow key={a.id} row={a} resolving={resolving} onResolve={async (id) => {
                  setResolving(id);
                  await resolveAnomaly(id);
                  setAnomalies(prev => prev.map(x => x.id === id ? {...x, resolved: true} : x));
                  setResolving(null);
                }} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

export default Dashboard;