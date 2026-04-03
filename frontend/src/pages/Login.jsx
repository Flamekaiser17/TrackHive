import { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, AlertTriangle, Hexagon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, exploreDemo } from '../api/endpoints';

/* ── Animated grid background dots ─────────────────────────── */
const GridBg = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {/* Grid lines */}
    <div className="login-grid-overlay" />

    {/* Radial glow blobs */}
    <div style={{
      position: 'absolute', top: '-20%', left: '-10%',
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
      filter: 'blur(40px)',
    }} />
    <div style={{
      position: 'absolute', bottom: '-20%', right: '-10%',
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
      filter: 'blur(40px)',
    }} />

    {/* Floating particles */}
    {[...Array(18)].map((_, i) => (
      <motion.div
        key={i}
        style={{
          position: 'absolute',
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(108,99,255,0.5)' : 'rgba(0,212,170,0.4)',
          left: `${(i * 17 + 5) % 95}%`,
          top: `${(i * 23 + 10) % 90}%`,
        }}
        animate={{
          y: [-10, 10, -10],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3 + (i % 4),
          repeat: Infinity,
          delay: i * 0.3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

/* ── Floating label input ───────────────────────────────────── */
const FloatingInput = ({ id, type, label, icon: Icon, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloated = focused || hasValue;

  return (
    <div style={{ position: 'relative', marginBottom: 4 }}>
      {/* Icon */}
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: focused ? '#6C63FF' : '#8B8BA7',
        transition: 'color 0.2s', zIndex: 2, pointerEvents: 'none',
      }}>
        <Icon size={16} />
      </div>

      {/* Floating label */}
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          left: 44,
          top: isFloated ? 8 : '50%',
          transform: isFloated ? 'none' : 'translateY(-50%)',
          fontSize: isFloated ? 10 : 14,
          fontWeight: isFloated ? 700 : 400,
          color: focused ? '#6C63FF' : '#8B8BA7',
          textTransform: isFloated ? 'uppercase' : 'none',
          letterSpacing: isFloated ? '0.08em' : 'normal',
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {label}
      </label>

      {/* Input */}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          height: 56,
          paddingTop: hasValue || focused ? 20 : 0,
          paddingBottom: 8,
          paddingLeft: 44,
          paddingRight: 16,
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${focused ? '#6C63FF' : '#2A2A3A'}`,
          borderRadius: 'var(--radius-md)',
          color: '#fff',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(108,99,255,0.12)' : 'none',
        }}
      />
    </div>
  );
};

/* ── Main Login component ───────────────────────────────────── */
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('access_token') && onLogin) onLogin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      if (onLogin) onLogin();
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 401 ? 'Invalid credentials. Access denied.' :
        status === 500 ? 'Server error. Try again later.' :
        'Cannot connect to server.'
      );
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await exploreDemo();
      if (onLogin) onLogin();
    } catch (err) {
      setError('Demo login failed. Cannot connect to server.');
      setDemoLoading(false);
    }
  };

  return (
    <div
      className="login-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <GridBg />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="login-card"
        style={{ width: 420, padding: '40px 36px', position: 'relative', zIndex: 10 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(108,99,255,0.3)', '0 0 40px rgba(108,99,255,0.6)', '0 0 20px rgba(108,99,255,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, #6C63FF, #9B8FFF)',
              borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Hexagon size={30} color="#fff" fill="#fff" />
          </motion.div>

          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
            TrackHive
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Operations Command Center
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 14, padding: '4px 12px',
            background: 'rgba(46,213,115,0.08)',
            border: '1px solid rgba(46,213,115,0.2)',
            borderRadius: 99,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ED573', animation: 'blink-dot 2s ease infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2ED573', letterSpacing: '0.08em' }}>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                background: 'rgba(255,71,87,0.1)',
                border: '1px solid rgba(255,71,87,0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                overflow: 'hidden',
              }}
            >
              <AlertTriangle size={15} color="#FF4757" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FF4757' }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FloatingInput
            id="email"
            type="text"
            label="Email or Username"
            icon={Mail}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <FloatingInput
            id="password"
            type="password"
            label="Password"
            icon={Lock}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(108,99,255,0.45)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: '100%',
              height: 52,
              background: loading
                ? 'rgba(108,99,255,0.5)'
                : 'linear-gradient(135deg, #6C63FF 0%, #8B85FF 100%)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.04em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
                Authenticating…
              </>
            ) : (
              <>
                <LogIn size={17} />
                Sign In to TrackHive
              </>
            )}
          </motion.button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Demo Button */}
        <motion.button
          onClick={handleDemo}
          disabled={demoLoading || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            height: 52,
            background: 'rgba(255,165,2,0.1)',
            border: '1.5px solid rgba(255,165,2,0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFA502',
            fontSize: 14,
            fontWeight: 800,
            cursor: (demoLoading || loading) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '0.04em',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {demoLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,165,2,0.3)', borderTopColor: '#FFA502' }}
              />
              Loading Demo…
            </>
          ) : (
            <>
              <Zap size={17} />
              🚀 Explore Demo
            </>
          )}
        </motion.button>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 10, color: 'var(--text-faint)',
          marginTop: 28, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Restricted Access · Bengaluru-Main-01
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
