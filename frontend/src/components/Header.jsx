import { Hexagon, ChevronDown, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import useAgents from '../hooks/useAgents';

const Header = () => {
  const [time, setTime] = useState(new Date());
  const { connected, lastMessage } = useWebSocket();
  const { agents } = useAgents(lastMessage);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const onlineCount = (agents || []).filter(a => a.status !== 'offline').length;

  return (
    <header className="header-area glass-panel" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 24px',
      zIndex: 100,
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '32px', height: '32px', 
          background: 'var(--primary)', 
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px var(--primary-glow)'
        }}>
          <Hexagon size={18} color="white" fill="white" />
        </div>
        <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>TrackHive</span>
        
        <div style={{ 
          marginLeft: '24px', 
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px',
          background: connected ? 'rgba(0, 229, 160, 0.05)' : 'rgba(255, 71, 87, 0.05)',
          border: connected ? '1px solid rgba(0, 229, 160, 0.2)' : '1px solid rgba(255, 71, 87, 0.2)',
          borderRadius: '100px'
        }}>
          <div className={connected ? "pulsing-dot" : ""} style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: connected ? 'var(--accent-green)' : 'var(--accent-red)' 
          }} />
          <span style={{ 
            fontSize: '12px', fontWeight: '700', 
            color: connected ? 'var(--accent-green)' : 'var(--accent-red)', 
            textTransform: 'uppercase' 
          }}>
            {connected ? `LIVE — ${onlineCount} agents online` : 'RECONNECTING...'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
          <Clock size={16} />
          <span className="mono" style={{ fontSize: '14px', fontWeight: '600', minWidth: '85px' }}>
            {formatTime(time)} IST
          </span>
        </div>
        {/* ... Profile menu remains same ... */}


        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="hover-scale">
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: '700' }}>Admin Control</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Superuser</p>
          </div>
          <div style={{ 
            width: '36px', height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #1A1A24 0%, #111118 100%)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ChevronDown size={16} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
