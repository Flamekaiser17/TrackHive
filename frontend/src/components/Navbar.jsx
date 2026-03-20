import { useState, useEffect, useRef } from 'react';
import { Hexagon, Clock, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import useAgents from '../hooks/useAgents';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar = () => {
  const [time, setTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { agents, connected } = useAgents();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onlineCount = (agents || []).filter(a => a.status !== 'offline').length;

  const formatTime = (d) => d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const handleLogout = () => {
    window.dispatchEvent(new Event('auth_logout'));
  };

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

      {/* Right: Avatar dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 12px 6px 6px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            outline: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6C63FF, #9B8FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>
            A
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Admin</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>Superuser</p>
          </div>
          <ChevronDown
            size={14}
            color="var(--text-muted)"
            style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 6,
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                zIndex: 200,
              }}
            >
              {[
                { icon: User, label: 'Profile' },
                { icon: Shield, label: 'Admin Panel' },
              ].map(({ icon: Ic, label }) => (
                <button
                  key={label}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    border: 'none', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Ic size={15} /> {label}
                </button>
              ))}

              <div style={{ margin: '4px 0', height: 1, background: 'var(--border)' }} />

              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  border: 'none', background: 'transparent',
                  color: '#FF4757', fontSize: 13, cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
