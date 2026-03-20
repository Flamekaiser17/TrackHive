import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  Zap, Play, Square, Terminal, Cpu,
  Users, AlertTriangle, RefreshCw, Activity,
  ChevronRight, Database, Globe
} from 'lucide-react';
import { startSimulation, stopSimulation } from '../api/endpoints';
import { FleetContext } from '../context/FleetContext';

/* ── Animated Number Component ───────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    const controls = animate(displayValue, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
};

/* ── Stat Card (Titan Upgrade) ───────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, grad }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      flex: 1, minWidth: 200, padding: '24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: 16,
      position: 'relative', overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: grad }} />
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}15`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 15px ${color}15`
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono' }}>
        <AnimatedNumber value={value} />
      </div>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════ */
/*  SIMULATOR (TITAN UPGRADE)                                     */
/* ══════════════════════════════════════════════════════════════ */
const Simulator = () => {
  const {
    isSimulating, setIsSimulating,
    simStats, setSimStats,
    simLogs, addSimLog,
    connected, lastMessage,
  } = useContext(FleetContext);

  const [loading, setLoading] = useState(false);
  const [agentCount, setAgentCount] = useState(50);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simLogs]);

  useEffect(() => {
    if (!lastMessage || !isSimulating) return;
    if (lastMessage.type === 'anomaly_detected') {
      addSimLog(`CRITICAL: Node Breach @ ${lastMessage.agent_id} | CODE: ${lastMessage.anomaly_type.toUpperCase()}`, 'error');
    }
  }, [lastMessage, isSimulating, addSimLog]);

  const handleStart = async () => {
    setLoading(true);
    addSimLog(`INITIATING CLUSTER OVERRIDE: ${agentCount} NODES...`, 'system');
    try {
      await startSimulation({ agent_count: agentCount });
      setIsSimulating(true);
      setSimStats({ agents: agentCount, events: 0, anomalies: 0 });
      addSimLog(`CLUSTER ACTIVE. DATA BROADCAST SYNCED.`, 'success');
    } catch (err) { addSimLog(`FAULT: ${err.message}`, 'error'); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    addSimLog(`SENDING TERMINATION SEQUENCE...`, 'warning');
    try {
      await stopSimulation();
      setIsSimulating(false);
      addSimLog(`CLUSTER OFFLINE. CORE IDLE.`, 'system');
    } catch (err) { addSimLog(`FAULT: ${err.message}`, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      
      {/* ── Top Bar HUD ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: 'var(--gradient-primary)', borderRadius: 10, boxShadow: 'var(--glow-primary)' }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>Chaos Hub v4.2</h1>
        </div>
        
        <div style={{ padding: '6px 14px', borderRadius: 99, background: isSimulating ? 'rgba(46,213,115,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSimulating ? '#2ED573' : 'var(--text-faint)', animation: isSimulating ? 'blink-dot 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: isSimulating ? '#2ED573' : 'var(--text-faint)', letterSpacing: '0.1em' }}>{isSimulating ? 'SIMULATION_ACTIVE' : 'IDLE_MODE'}</span>
        </div>
      </div>

      {/* ── Main Controls Card ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ 
          width: '100%', maxWidth: 640, padding: '40px', background: 'var(--bg-card)', 
          border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', position: 'relative',
          overflow: 'hidden', textAlign: 'center'
        }}>
           {/* Decorative BG element */}
           <div style={{ position: 'absolute', top: -100, left: -100, width: 200, height: 200, background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1 }} />

           <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span>Swarm density configuration</span>
                <span style={{ color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{agentCount} NODES</span>
              </div>
              <input type="range" min="10" max="100" value={agentCount} onChange={e => setAgentCount(parseInt(e.target.value))} disabled={isSimulating} style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 10, appearance: 'none', cursor: 'pointer', outline: 'none' }} />
           </div>

           {!isSimulating ? (
             <motion.button 
               onClick={handleStart} whileTap={{ scale: 0.95 }}
               style={{ width: '100%', padding: '18px', background: '#2ED573', borderRadius: 'var(--radius-md)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 0 30px rgba(46,213,115,0.2)' }}
             >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="#fff" />} BOOT CLUSTER
             </motion.button>
           ) : (
             <motion.button 
               onClick={handleStop} whileTap={{ scale: 0.95 }}
               style={{ width: '100%', padding: '18px', background: 'var(--danger)', borderRadius: 'var(--radius-md)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 0 30px rgba(255,71,87,0.2)' }}
             >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Square size={18} fill="#fff" />} SHUTDOWN SEQUENCE
             </motion.button>
           )}
        </div>
      </div>

      {/* ── Live HUD Stats ── */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ display: 'flex', gap: 20 }}>
            <StatCard label="Live units" value={simStats.agents} icon={Users} color="#00D4AA" grad="var(--gradient-teal)" />
            <StatCard label="Telemetry packets" value={simStats.events} icon={Globe} color="#6C63FF" grad="var(--gradient-primary)" />
            <StatCard label="Detected anomalies" value={simStats.anomalies} icon={AlertTriangle} color="#FF4757" grad="var(--gradient-danger)" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Terminal Console (High Fidelity) ── */}
      <div style={{ flex: 1, background: '#050508', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-overlay" />
        <div className="terminal-scan" />
        
        <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
           <Terminal size={14} color="var(--text-faint)" />
           <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>KERNAL_STDOUT_STREAM</span>
           {isSimulating && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
             <Activity size={12} color="#2ED573" /> <span style={{ fontSize: 9, fontWeight: 900, color: '#2ED573' }}>SYNCING</span>
           </motion.div>}
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
           {simLogs.slice(-50).map(log => (
             <div key={log.id} style={{ display: 'flex', gap: 12, fontSize: 12, lineHeight: 1.8, fontFamily: 'JetBrains Mono' }}>
               <span style={{ color: 'var(--text-faint)', minWidth: 80 }}>[{log.time}]</span>
               <span style={{ 
                 color: log.type === 'error' ? 'var(--danger)' : 
                        log.type === 'warning' ? '#FFA502' : 
                        log.type === 'success' ? '#00D4AA' : 
                        log.type === 'info' ? '#6C63FF' : '#55556A',
                 fontWeight: 500
               }}>
                 $ {log.msg}
               </span>
             </div>
           ))}
           <div ref={logEndRef} />
        </div>
      </div>

    </div>
  );
};

export default Simulator;