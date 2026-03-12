import { 
  Home, 
  MapPin, 
  Users, 
  Package, 
  AlertTriangle, 
  Play, 
  Settings,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ currentTab, onTabChange, anomalyCount = 0 }) => { // FIXED: default 3 → 0
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'live-map', label: 'Live Map', icon: MapPin },
    { id: 'fleet', label: 'Fleet', icon: Users },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, badge: anomalyCount },
    { id: 'simulator', label: 'Simulator', icon: Play },
  ];

  return (
    <aside className="sidebar-area glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '24px 12px',
      borderRight: '1px solid var(--border)',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(item.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: currentTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: currentTab === item.id ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
              border: currentTab === item.id ? '1px solid rgba(108, 99, 255, 0.2)' : '1px solid transparent',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <item.icon size={18} strokeWidth={currentTab === item.id ? 2.5 : 2} color={currentTab === item.id ? 'var(--primary)' : 'inherit'} />
            <span style={{ fontSize: '14px', fontWeight: currentTab === item.id ? '700' : '500' }}>{item.label}</span>
            
            {/* FIXED: Only show badge if count > 0 */}
            {item.badge > 0 && (
              <div 
                className="badge-red"
                style={{ 
                  position: 'absolute', right: '12px', 
                  width: '20px', height: '20px', 
                  borderRadius: '50%', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                }}
              >
                {item.badge}
              </div>
            )}

            {currentTab === item.id && (
              <motion.div 
                layoutId="active-indicator"
                style={{ position: 'absolute', left: '-12px', width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '0 4px 4px 0', boxShadow: '0 0 10px var(--primary-glow)' }} 
              />
            )}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* FIXED: Settings click handler added */}
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTabChange('settings')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: currentTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: currentTab === 'settings' ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
            border: currentTab === 'settings' ? '1px solid rgba(108, 99, 255, 0.2)' : '1px solid transparent',
            transition: 'all 0.3s ease',
          }}
        >
          <Settings size={18} color={currentTab === 'settings' ? 'var(--primary)' : 'inherit'} />
          <span style={{ fontSize: '14px', fontWeight: currentTab === 'settings' ? '700' : '500' }}>Settings</span>
        </motion.div>
        
        <div style={{ 
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '6px', background: 'rgba(0, 229, 160, 0.1)', borderRadius: '6px' }}>
              <ShieldCheck size={14} color="var(--accent-green)" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-green)', letterSpacing: '0.05em' }}>VERIFIED ADMIN</span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Internal Ops Portal v4.2.1-stable. Restricted access only.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;