import { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, Terminal, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/endpoints';

import { useToast } from '../context/ToastContext';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Initial check: If already logged in, skip to app
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && onLogin) onLogin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      addToast('Authorization successful. Access granted.', 'success');
      
      // Token is now in localStorage — signal App.jsx to mount the full shell
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid credentials');
        addToast('Access denied: Invalid credentials.', 'error');
      } else if (err.response?.status === 500) {
        setError('Server error');
        addToast('Server encountered a critical fault.', 'error');
      } else {
        setError('Cannot connect to server');
        addToast('Telemetry sync failed. Server unreachable.', 'error');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', background: 'radial-gradient(circle at center, #111118 0%, #0A0A0F 100%)' 
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel"
        style={{ 
          width: '400px', padding: '48px', borderRadius: '32px', 
          border: '1px solid var(--border)', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', height: '64px', margin: '0 auto 24px', 
            background: 'var(--primary)', 
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            <Terminal size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>Command Access</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>INTERNAL OPS AUTHORIZATION REQUIRED</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ 
                background: 'rgba(255, 71, 87, 0.1)', 
                border: '1px solid var(--accent-red)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}
            >
              <AlertTriangle size={16} color="var(--accent-red)" />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: '700' }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>OPERATOR EMAIL</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                required
                placeholder="admin or admin@trackhive.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 14px 14px 44px', background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--border)', borderRadius: '12px', color: 'white', 
                  fontSize: '15px', outline: 'none'
                }} 
              />
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>ACCESS KEY</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                required
                placeholder="••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 14px 14px 44px', background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--border)', borderRadius: '12px', color: 'white', 
                  fontSize: '15px', outline: 'none'
                }} 
              />
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--primary-glow)' }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', background: 'var(--primary)', border: 'none', 
              borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '15px', 
              cursor: 'pointer', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} className="pulsing-dot" />
                <span>AUTHENTICATING...</span>
              </div>
            ) : (
              <><LogIn size={20} /> INITIALIZE SESSION</>
            )}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '32px', fontWeight: '700' }}>
           SYSTEM CLUSTER: BENGALURU-MAIN-01<br/>
           AUTHORIZED PERSONNEL ONLY
        </p>
      </motion.div>
    </div>
  );
};


export default Login;
