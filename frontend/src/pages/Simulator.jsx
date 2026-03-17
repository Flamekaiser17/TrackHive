import { Play, Square, Terminal, Activity, Users, Zap, ShieldAlert, Cpu, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useContext } from 'react';
import { startSimulation, stopSimulation } from '../api/endpoints';
import { FleetContext } from '../context/FleetContext';

const Simulator = () => {
  const { 
    isSimulating, setIsSimulating, 
    simStats, setSimStats, 
    simLogs, addSimLog,
    connected, lastMessage 
  } = useContext(FleetContext);

  const [loading, setLoading] = useState(false);
  const logEndRef = useRef(null);
  

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simLogs]);

  // Log throttling for UI performance
  useEffect(() => {
    if (!lastMessage || !isSimulating) return;
    
    if (lastMessage.type === 'agent_location_update') {
      if (simStats.events % 20 === 0) {
        addSimLog(
          `Telemetry: Agent_${lastMessage.agent_id} @ ` +
          `${Math.round(lastMessage.speed_kmph || lastMessage.speed || 0)}km/h`,
          'info'
        );
      }
    }
  }, [lastMessage, isSimulating, simStats.events, addSimLog]);

  const startSim = async () => {
    if (loading || isSimulating) return;
    setLoading(true);
    addSimLog('DEPLOYING 50 SIMULATED AGENTS TO BENGALURU DISTRICT...', 'success');
    try {
      await startSimulation();
      setIsSimulating(true);
      addSimLog('Backend confirmed: 50 agents deployed', 'success');
      setSimStats({ agents: 50, events: 0, anomalies: 0 });
    } catch (err) {
      addSimLog('ERROR: Failed to deploy agents — ' + (err.response?.data?.detail || err.message), 'warning');
      console.error('Start simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopSim = async () => {
    if (loading || !isSimulating) return;
    setLoading(true);
    addSimLog('HALTING ALL SIMULATED AGENTS. Cleaning up threads...', 'warning');
    try {
      await stopSimulation();
      setIsSimulating(false);
      addSimLog('Simulation terminated. Cluster status: IDLE.', 'system');
    } catch (err) {
      addSimLog('ERROR: Failed to stop simulation — ' + (err.response?.data?.detail || err.message), 'warning');
      console.error('Stop simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Chaos Simulator <Zap size={24} color="var(--primary)" />
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Stress-testing fleet orchestration and anomaly detection engines</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '100px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? 'var(--accent-green)' : 'var(--accent-red)' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {loading ? 'PROCESSING...' : 
             !connected ? 'WS DISCONNECTED' :
             isSimulating ? 'AGENT SWARM ACTIVE' : 'SYSTEM IDLE'}
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* START */}
        <motion.div
          whileHover={{ scale: !isSimulating && !loading ? 1.02 : 1 }}
          onClick={!isSimulating && !loading ? startSim : undefined}
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)',
            borderRadius: '24px',
            border: '1px solid var(--primary)',
            cursor: !isSimulating && !loading ? 'pointer' : 'not-allowed',
            opacity: isSimulating || loading ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '32px',
            transition: 'opacity 0.3s'
          }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--primary-glow)' }}>
            <Play size={40} color="white" fill="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: '800' }}>START SIMULATION</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Deploy 50 simulated agents immediately</p>
          </div>
        </motion.div>

        {/* STOP */}
        <motion.div
          whileHover={{ scale: isSimulating && !loading ? 1.02 : 1 }}
          onClick={isSimulating && !loading ? stopSim : undefined}
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.05) 100%)',
            borderRadius: '24px',
            border: '1px solid var(--accent-red)',
            cursor: isSimulating && !loading ? 'pointer' : 'not-allowed',
            opacity: !isSimulating || loading ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '32px',
            transition: 'opacity 0.3s'
          }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255, 71, 87, 0.2)' }}>
            <Square size={40} color="white" fill="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: '800' }}>STOP SIMULATION</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Halt all active simulated agents</p>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '24px', flex: 1 }}>
        {/* CONSOLE */}
        <div style={{ background: '#050508', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
          <header style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
            <Terminal size={16} color="var(--text-muted)" />
            <h4 className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>CHAOS_KERNEL_STDOUT</h4>
            {isSimulating && <Activity size={12} color="var(--accent-green)" />}
          </header>
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {simLogs.map(log => (
              <div key={log.id} style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
                <span className="mono" style={{ color: 'var(--text-muted)', minWidth: '85px' }}>[{log.time}]</span>
                <span className="mono" style={{
                  color: log.type === 'system' ? 'var(--text-muted)' :
                    log.type === 'success' ? 'var(--accent-green)' :
                    log.type === 'warning' ? 'var(--accent-red)' : 'var(--text-primary)'
                }}>
                  {log.type === 'system' ? '>> ' : log.type === 'success' ? '✔ ' : log.type === 'warning' ? '⚠ ' : '$ '}
                  {log.msg}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.04em', marginBottom: '24px' }}>CLUSTER PERFORMANCE</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Agents Active', value: simStats.agents, icon: Users, color: 'var(--accent-green)', bg: 'rgba(0, 229, 160, 0.1)' },
                { label: 'Events Processed', value: simStats.events, icon: Cpu, color: 'var(--accent-blue)', bg: 'rgba(0, 180, 255, 0.1)' },
                { label: 'Anomalies Created', value: simStats.anomalies, icon: ShieldAlert, color: 'var(--accent-red)', bg: 'rgba(255, 71, 87, 0.1)' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={color} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>{label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: '20px', fontWeight: '800' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <Server size={64} color="var(--border)" strokeWidth={1} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>ORCHESTRATION ENGINE</p>
              <p style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
                Worker Status: {loading ? 'PROCESSING' : isSimulating ? 'HIGH_LOAD' : 'NOMINAL'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;