import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Titan KPICard — high-fidelity metric card
 */

const ACCENTS = {
  primary: { 
    base: '#6C63FF', 
    grad: 'var(--gradient-primary)', 
    glow: 'rgba(108,99,255,0.15)',
    muted: 'rgba(108,99,255,0.1)' 
  },
  teal: { 
    base: '#00D4AA', 
    grad: 'var(--gradient-teal)', 
    glow: 'rgba(0,212,170,0.15)',
    muted: 'rgba(0,212,170,0.1)' 
  },
  danger: { 
    base: '#FF4757', 
    grad: 'var(--gradient-danger)', 
    glow: 'rgba(255,71,87,0.15)',
    muted: 'rgba(255,71,87,0.1)' 
  },
  warning: { 
    base: '#FFA502', 
    grad: 'linear-gradient(135deg, #FFA502 0%, #FF6400 100%)', 
    glow: 'rgba(255,165,2,0.15)',
    muted: 'rgba(255,165,2,0.1)' 
  },
  success: { 
    base: '#2ED573', 
    grad: 'linear-gradient(135deg, #2ED573 0%, #00D4AA 100%)', 
    glow: 'rgba(46,213,115,0.15)',
    muted: 'rgba(46,213,115,0.1)' 
  },
};

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
};

const KPICard = ({
  title, value, subtitle, icon: Icon,
  accent = 'primary', trend = 'neutral', trendValue,
  loading = false,
}) => {
  const acc = ACCENTS[accent] || ACCENTS.primary;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#2ED573' : trend === 'down' ? '#FF4757' : '#8B8BA7';

  if (loading) {
    return (
      <div className="stat-card-base" style={{ minHeight: 140, padding: '24px' }}>
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: acc.base }}
      className="stat-card-base fade-up"
      style={{
        padding: '24px',
        cursor: 'default',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'var(--transition-smooth)'
      }}
    >
      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {title}
          </span>
          {Icon && (
            <div style={{
              width: 32, height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={14} color={acc.base} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Value */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: '#fff', letterSpacing: '-1px' }}>
            <AnimatedNumber value={value} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {trendValue && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 4,
              color: trendColor
            }}>
              <TrendIcon size={12} color={trendColor} strokeWidth={3} />
              <span style={{ fontSize: 11, fontWeight: 800 }}>{trendValue}</span>
            </div>
          )}
          {subtitle && (
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700 }}>{subtitle}</span>
          )}
        </div>
      </div>

      {/* ── Minimal Accent Bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '24px', right: '24px',
        height: 1,
        background: acc.base,
        opacity: 0.3,
      }} />

      <style>{`
        .stat-card-base:hover {
          box-shadow: ${acc.glow.replace('0.15', '0.25')};
        }
      `}</style>
    </motion.div>
  );
};

export default KPICard;
