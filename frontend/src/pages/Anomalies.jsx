import { ShieldAlert, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getAnomalies, resolveAnomaly } from '../api/endpoints';

const Anomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const data = await getAnomalies();
        setAnomalies(data?.results || data || []);
      } catch (err) {
        console.error('Failed to load anomalies:', err);
        setError('Failed to sync anomaly telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAnomaly(id);
      setAnomalies(prev =>
        (prev || []).map(a =>
          a.id === id ? { ...a, resolved: true, status: 'RESOLVED' } : a
        )
      );
    } catch (err) {
      console.error('Resolve failed:', err.response?.data);
      alert('Failed to resolve: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  // FIXED: handleResolveAll added
  const handleResolveAll = async () => {
    try {
      const unresolved = (anomalies || []).filter(a => !a.resolved && a.status !== 'RESOLVED');
      await Promise.all(unresolved.map(a => resolveAnomaly(a.id)));
      setAnomalies(prev => prev.map(a => ({ ...a, resolved: true, status: 'RESOLVED' })));
    } catch (err) {
      console.error('Resolve all failed:', err.response?.data);
      alert('Failed to resolve all: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const activeCount = (anomalies || []).filter(a => !a.resolved && a.status !== 'RESOLVED').length || 0;

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-row" style={{ height: '80px', background: 'var(--surface)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  return (
    <div className="dashboard-grid">
      <AnimatePresence>
        {activeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="anomaly-alert-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)',
              borderRadius: '16px',
              border: '2px solid var(--accent-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(255, 71, 87, 0.2)', border: '1px solid var(--accent-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldAlert size={32} color="var(--accent-red)" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                  {activeCount} ACTIVE ANOMALIES DETECTED
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Immediate intervention required. System integrity at 94%.
                </p>
              </div>
            </div>
            {/* FIXED: onClick added */}
            <button
              onClick={handleResolveAll}
              className="hover-scale"
              style={{
                padding: '12px 24px',
                background: 'var(--accent-red)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(255, 71, 87, 0.3)'
              }}
            >
              RESOLVE ALL
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px' }}>Detailed Anomaly Log</h3>
        </header>

        {error && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}>{error}</div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.1)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)' }}>TIME</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)' }}>TYPE / SEVERITY</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)' }}>AFFECTED ENTITY</th>
              <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {(anomalies || []).map((log, i) => (
              <tr
                key={log.id || i}
                style={{
                  borderBottom: '1px solid var(--border)',
                  opacity: (log.resolved || log.status === 'RESOLVED') ? 0.4 : 1
                }}
              >
                <td className="mono" style={{ padding: '18px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(log.detected_at || log.created_at || Date.now()).toLocaleTimeString()}
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'capitalize' }}>
                      {(log.anomaly_type || '').replace(/_/g, ' ')}
                    </span>
                    <span className="badge" style={{
                      fontSize: '9px',
                      background: 'rgba(255, 71, 87, 0.1)',
                      color: 'var(--accent-red)',
                      width: 'fit-content',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>CRITICAL</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} color="var(--primary)" />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>
                      Agent_{log.agent_id || log.agent || 'UNK'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  {(log.resolved || log.status === 'RESOLVED') ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ARCHIVED</span>
                  ) : (
                    <button
                      onClick={() => handleResolve(log.id)}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '11px', fontWeight: '800',
                        color: 'white', cursor: 'pointer'
                      }}
                    >
                      INTERVENE
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(!loading && !error && (anomalies || []).length === 0) && (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ✅ All Clear — No anomalies detected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Anomalies;   