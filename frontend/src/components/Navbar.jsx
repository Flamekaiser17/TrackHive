import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import useAgents from '../hooks/useAgents';

const Navbar = () => {
  const [time, setTime] = useState(new Date());
  const { agents, connected } = useAgents();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineCount = (agents || []).filter(a => a.status !== 'offline').length;

  const formatTime = (d) => d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <header
      className="navbar-area"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 100,
        position: 'relative',
        minHeight: '60px' // Added minHeight to ensure header maintains its structure without the 36px avatar
      }}
    >
      {/* Left: WS status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* WebSocket badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 12px',
          borderRadius: 99,
          background: connected ? 'rgba(46,213,115,0.08)' : 'rgba(255,71,87,0.08)',
          border: `1px solid ${connected ? 'rgba(46,213,115,0.25)' : 'rgba(255,71,87,0.25)'}`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#2ED573' : '#FF4757',
            flexShrink: 0,
            animation: connected ? 'blink-dot 2s ease infinite' : 'none',
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: connected ? '#2ED573' : '#FF4757',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {connected ? `LIVE · ${onlineCount} online` : 'RECONNECTING…'}
          </span>
        </div>
      </div>

      {/* Centre: Clock */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)',
      }}>
        <Clock size={14} />
        <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
          {formatTime(time)} IST
        </span>
      </div>
    </header>
  );
};

export default Navbar;
