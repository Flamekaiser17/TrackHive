import { useMemo, useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, MoreHorizontal,
  MapPin, Phone, MessageSquare, History,
  Trash2, X, ChevronRight, Activity, Map as MapIcon,
} from 'lucide-react';
import useAgents from '../hooks/useAgents';
import { FleetContext } from '../context/FleetContext';
import FatigueBar from '../components/FatigueBar';
import StatusBadge from '../components/StatusBadge';

const FILTERS = [
  { id: 'all',       label: 'All Agents', color: 'var(--text-muted)' },
  { id: 'available', label: 'Available',  color: '#00D4AA' },
  { id: 'busy',      label: 'Busy',       color: '#6C63FF' },
  { id: 'idle',      label: 'Idle',       color: '#FFA502' },
  { id: 'anomaly',   label: 'Critical',   color: '#FF4757' },
];

const getStatusGrad = (status) => {
  if (status === 'available') return 'var(--gradient-teal)';
  if (status === 'busy')      return 'var(--gradient-primary)';
  if (status === 'idle')      return 'linear-gradient(135deg, #FFA502 0%, #FF6400 100%)';
  return                      'var(--gradient-danger)';
};

const getFatigueGrad = (score) => {
  if (score <= 4) return 'var(--gradient-teal)';
  if (score <= 8) return 'linear-gradient(90deg, #FFA502, #FF6400)';
  return                'var(--gradient-danger)';
};

/* ── Agent Card (Titan Upgrade) ────────────────────────────────── */
const AgentCard = ({ agent, onClick }) => {
  const statusGrad = getStatusGrad(agent.status);
  const fatigueGrad = getFatigueGrad(agent.fatigue_score);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick(agent)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        padding: '24px', cursor: 'pointer', transition: 'var(--transition-smooth)',
        position: 'relative', overflow: 'hidden'
      }}
      className="agent-card-titan"
    >
      {/* ── Gradient Top Border ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: fatigueGrad }} />

      {/* Avatar Container with Gradient Ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{
          position: 'relative', padding: 2, borderRadius: 18,
          background: statusGrad, boxShadow: `0 0 15px ${statusGrad.split('(')[1]?.split(')')[0]?.split('0%')[0] || 'rgba(0,0,0,0.1)'}`
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, background: '#12121A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#fff'
          }}>
            {(agent.username || 'A')[0].toUpperCase()}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.2px' }}>{agent.username}</h3>
          <StatusBadge value={agent.status} size="xs" />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <FatigueBar score={agent.fatigue_score || 0} height={6} />
      </div>

      <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Daily Dist.</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{Number(agent.km_today || 0).toFixed(1)} km</p>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Orders</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{agent.orders_today || 0}</p>
        </div>
      </div>

      <style>{`
        .agent-card-titan:hover {
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(108,99,255,0.05);
        }
      `}</style>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  FLEET PAGE (TITAN UPGRADE)                                    */
/* ══════════════════════════════════════════════════════════════ */
const Fleet = () => {
  const { agents, loading } = useContext(FleetContext);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const selectedAgent = useMemo(() => 
    (agents || []).find(a => a.id === selectedAgentId),
  [agents, selectedAgentId]);

  const filtered = useMemo(() => {
    let list = agents || [];
    if (filter !== 'all') list = list.filter(a => a.status === filter);
    if (search) list = list.filter(a => a.username?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [agents, search, filter]);

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      
      {/* ── Header HUD ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', color: '#fff' }}>Fleet command</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Operational overview for {(agents || []).length} active units</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 20px', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: 'var(--glow-primary)' }}>
            NEW ENROLLMENT
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-card)', padding: '8px 8px 8px 16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <Search size={18} color="var(--text-faint)" />
          <input
            type="text"
            placeholder="Search by agent sig..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, width: '100%', outline: 'none' }}
          />
        </div>
        <div style={{ height: 24, width: 1, background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-lg)', border: 'none',
                background: filter === f.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: filter === f.id ? '#fff' : 'var(--text-faint)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Users size={60} color="var(--text-faint)" />
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-faint)' }}>NO UNITS MATCHING SPECS</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map(agent => <AgentCard key={agent.id} agent={agent} onClick={(a) => setSelectedAgentId(a.id)} />)}
        </div>
      )}

      {/* ── Right Panel (Details Placeholder) ── */}
      <AnimatePresence>
        {selectedAgent && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAgentId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
             <motion.div
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 440, background: '#12121A', borderLeft: '1px solid var(--border)', padding: '32px' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                   <h2 style={{ fontSize: 24, fontWeight: 900 }}>Unit detail</h2>
                   <button onClick={() => setSelectedAgentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><X size={24} /></button>
                </div>
                {/* Simplified Titan Detail View */}
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 20 }}>{(selectedAgent.username || 'A')[0].toUpperCase()}</div>
                <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{selectedAgent.username}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>Active operational entity since Mar 2024</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                   <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>Speed rating</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{Number(selectedAgent.speed || 0).toFixed(1)} km/h</p>
                   </div>
                   <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>Orders handled</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{selectedAgent.orders_today}</p>
                   </div>
                </div>

                <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                   <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 12 }}>SYSTEM INTEGRITY (FATIGUE)</p>
                   <FatigueBar score={selectedAgent.fatigue_score} height={10} />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fleet;