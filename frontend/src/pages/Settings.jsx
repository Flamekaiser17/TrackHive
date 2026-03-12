import React from 'react';
import { Settings as SettingsIcon, Shield, Server, AlertOctagon, LogOut, Terminal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {

  const handleClearSession = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>System Configuration</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Advanced operations and environment controls</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Admin Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> ADMIN INFO
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>EMAIL</span>
              <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>admin@trackhive.com</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ROLE</span>
              <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', color: 'var(--primary)' }}>Superuser</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CLUSTER</span>
              <p className="mono" style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>Bengaluru-Main-01</p>
            </div>
          </div>
        </motion.div>

        {/* Section 2: System Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel"
          style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={16} /> SYSTEM INFO
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>BACKEND</span>
              <p className="mono" style={{ fontSize: '13px', color: 'var(--accent-green)', marginTop: '4px' }}>http://localhost:8000</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>WEBSOCKET</span>
              <p className="mono" style={{ fontSize: '13px', color: 'var(--accent-blue)', marginTop: '4px' }}>ws://localhost:8000</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>VERSION</span>
              <p className="mono" style={{ fontSize: '13px', marginTop: '4px' }}>v4.2.1-stable</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ENVIRONMENT</span>
              <p style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px', color: 'var(--accent-amber)' }}>Development</p>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-red)', background: 'rgba(255, 71, 87, 0.05)' }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} /> DANGER ZONE
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Irreversible actions that affect your current administrative session.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,71,87,0.2)' }}>
            <div>
              <h4 style={{ fontSize: '15px', color: 'white', fontWeight: '600', marginBottom: '4px' }}>Clear Session</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Purges local credentials and disconnects telemetry.</p>
            </div>
            <button 
              onClick={handleClearSession}
              style={{ padding: '10px 20px', background: 'var(--accent-red)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255,71,87,0.3)' }}
            >
              <LogOut size={16} /> FORGE SIGNOUT
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Settings;
