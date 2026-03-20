import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MapPin, Users, Package,
  AlertTriangle, Play, Settings, ShieldCheck,
  Hexagon, User, LogOut, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'live-map',  label: 'Live Map',   icon: MapPin },
  { id: 'fleet',     label: 'Fleet',      icon: Users },
  { id: 'orders',    label: 'Orders',     icon: Package },
  { id: 'anomalies', label: 'Anomalies',  icon: AlertTriangle, badge: true },
  { id: 'simulator', label: 'Simulator',  icon: Play },
];

const NavItem = ({ item, isActive, onClick, anomalyCount }) => {
  const showBadge = item.badge && anomalyCount > 0;

  return (
    <motion.button
      onClick={() => onClick(item.id)}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'var(--transition-fast)',
        border: 'none',
        outline: 'none',
        textAlign: 'left',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--surface-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* ── Active Background (Ink-Slide) ── */}
      {isActive && (
        <motion.div
          layoutId="nav-bg"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'var(--gradient-primary)',
            opacity: 0.12,
            zIndex: 0,
          }}
        />
      )}

      {/* ── Active Glow Indicator ── */}
      {isActive && (
        <motion.div
          layoutId="nav-glow"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3,
            background: 'var(--primary)',
            boxShadow: '0 0 12px var(--primary)',
            borderRadius: '0 4px 4px 0',
            zIndex: 1,
          }}
        />
      )}

      <item.icon
        size={18}
        strokeWidth={isActive ? 2.5 : 2}
        color={isActive ? 'var(--primary)' : 'currentColor'}
        style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}
      />

      <span style={{ 
        position: 'relative', zIndex: 1,
        fontSize: 14, fontWeight: isActive ? 700 : 500, flex: 1 
      }}>
        {item.label}
      </span>

      {/* Anomaly Dot */}
      {showBadge && (
        <motion.div
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--danger)',
            boxShadow: '0 0 10px var(--danger)',
            position: 'relative', zIndex: 1
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

const UserCard = () => (
  <div style={{
    marginTop: 'auto',
    padding: '16px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative',
    transition: 'var(--transition-smooth)'
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
  >
    <div style={{ position: 'relative' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'var(--gradient-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        <User size={20} color="#fff" />
      </div>
      <div style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 10, height: 10, borderRadius: '50%',
        background: '#2ED573', border: '2px solid var(--bg-secondary)',
      }} />
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin User</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>System Operator</p>
    </div>

    <button style={{ 
      background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer',
      padding: '4px', borderRadius: 4, transition: 'all 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
    >
      <LogOut size={14} />
    </button>
  </div>
);

const Sidebar = ({ currentTab, onTabChange, anomalyCount = 0 }) => (
  <aside
    className="sidebar-area"
    style={{
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 12px 16px',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}
  >
    {/* Logo area */}
    <div style={{
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 4,
      borderBottom: '1px solid var(--border)',
      marginBottom: 20,
      flexShrink: 0,
    }}>
      <div style={{
        width: 34, height: 34,
        background: 'var(--gradient-primary)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(108,99,255,0.3)',
        flexShrink: 0,
      }}>
        <Hexagon size={18} color="#fff" fill="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>TrackHive</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>OPS COMMAND</div>
      </div>
    </div>

    {/* Nav items */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 14px', marginBottom: 8 }}>
        Systems
      </p>
      {NAV_ITEMS.map(item => (
        <NavItem
          key={item.id}
          item={item}
          isActive={currentTab === item.id}
          onClick={onTabChange}
          anomalyCount={anomalyCount}
        />
      ))}

      <div style={{ margin: '20px 0 10px', height: 1, background: 'var(--border)', opacity: 0.5 }} />
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 14px', marginBottom: 8 }}>
        Management
      </p>
      <NavItem
        item={{ id: 'settings', label: 'Settings', icon: Settings }}
        isActive={currentTab === 'settings'}
        onClick={onTabChange}
        anomalyCount={0}
      />
    </div>

    <UserCard />

    {/* Verified Badge */}
    <div style={{
      marginTop: 16,
      padding: '12px 14px',
      background: 'rgba(46,213,115,0.03)',
      border: '1px solid rgba(46,213,115,0.1)',
      borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <ShieldCheck size={14} color="#2ED573" />
      <p style={{ fontSize: 10, fontWeight: 900, color: '#2ED573', letterSpacing: '0.1em' }}>VERIFIED OPS</p>
    </div>
  </aside>
);

export default Sidebar;