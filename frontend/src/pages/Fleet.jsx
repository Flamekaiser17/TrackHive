import { Search, ShieldAlert, MapPin, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { resetAgentFatigue } from '../api/endpoints';

const Fleet = ({ agents = [], orders = [], onNavigate }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleResetFatigue = async () => {
    try {
      if (!window.confirm('Reset fatigue for all agents?')) return;
      await Promise.all(agents.map(a => resetAgentFatigue(a.id)));
      alert('Fatigue reset successfully. Data will refresh shortly.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset fatigue.');
    }
  };

  return (
    <div className="dashboard-grid" style={{ position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Fleet Management</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Monitoring {agents.length} field agents live
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Search by ID or Agent Name..." 
              style={{ padding: '10px 16px 10px 36px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '13px', width: '320px', outline: 'none' }} 
            />
          </div>
          <button onClick={handleResetFatigue} style={{ padding: '10px 16px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} /> RESET FATIGUE
          </button>
        </div>
      </header>

      {agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px', fontWeight: '700' }}>No agents found</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Start the simulator to deploy agents</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {agents.map((agent, i) => {
            const name = agent.username || agent.user?.username || agent.name || `Agent_${agent.id}`;
            const fatigue = agent.fatigue_score || 0;
            const ordersCount = agent.orders_last_4hrs || 0;
            const km = agent.total_km_today || 0;
            const hours = agent.hours_active || 0;
            const status = agent.status || 'offline';
            
            const color = fatigue >= 8 ? 'var(--accent-red)' 
                        : fatigue >= 6 ? '#FF8800' 
                        : fatigue >= 3 ? 'var(--accent-amber)' 
                        : 'var(--accent-green)';

            const statusColor = status === 'available' ? 'var(--accent-green)' 
                              : status === 'busy' ? 'var(--accent-blue)' 
                              : 'var(--text-muted)';

            return (
              <motion.div 
                key={agent.id || i}
                whileHover={{ y: -4, background: 'var(--surface-hover)' }}
                className="stat-card"
                style={{ padding: '0', overflow: 'hidden' }}
              >
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px' }}>{name}</h3>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: statusColor }}>
                          ● {status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {agent.id}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '800' }} className="mono">{ordersCount}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700' }}>ORDERS</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '800' }} className="mono">{km.toFixed(1)}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700' }}>KM TODAY</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '800' }} className="mono">{hours.toFixed(1)}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700' }}>HOURS</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>FATIGUE SCORE</span>
                      <span className="mono" style={{ fontSize: '11px', fontWeight: '700', color }}>{fatigue.toFixed(1)} / 10.0</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(fatigue * 10, 100)}%`, height: '100%', background: color }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                  <button 
                    onClick={() => onNavigate && onNavigate('live-map', agent.id)}
                    style={{ padding: '12px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <MapPin size={12} /> VIEW ON MAP
                  </button>
                  <button 
                    onClick={() => setSelectedAgent(agent)}
                    style={{ padding: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Package size={12} /> ORDER HISTORY
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', width: '500px', border: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Order History - {selectedAgent.user?.username || selectedAgent.name || `Agent_${selectedAgent.id}`}</h3>
                <button onClick={() => setSelectedAgent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {orders.filter(o => o.agent === selectedAgent.id).length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No active orders found for this agent.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'rgba(0,0,0,0.1)' }}>
                        <th style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>ORDER ID</th>
                        <th style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>STATUS</th>
                        <th style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.agent === selectedAgent.id).map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700' }} className="mono">#OR-{order.id}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>{order.status}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }} className="mono">{order.eta_minutes || '-'}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fleet;