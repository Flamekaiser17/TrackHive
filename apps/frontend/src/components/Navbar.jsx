import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import useAgents from '../hooks/useAgents';

const Navbar = () => {
  const [time, setTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
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
        justifyContent: 'space-between',
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

      {/* Right: Manual Refresh */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => window.location.reload()}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
        
        {/* Tooltip */}
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          opacity: showTooltip ? 1 : 0,
          visibility: showTooltip ? 'visible' : 'hidden',
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 200,
          pointerEvents: 'none'
        }}>
          Click if data seems delayed
        </div>
      </div>
    </header>
  );
};

export default Navbar;
