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
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="stat-card-base fade-up"
      style={{
        padding: '24px',
        cursor: 'default',
        background: 'var(--bg-card)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* ── Hover Gradient Border ── */}
      <motion.div
        className="hover-border"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          position: 'absolute', inset: 0, padding: 1,
          background: acc.grad,
          borderRadius: 'inherit',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {title}
          </span>
          {Icon && (
            <motion.div 
              whileHover={{ scale: 1.1 }}
              style={{
                width: 38, height: 38,
                borderRadius: 'var(--radius-md)',
                background: acc.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Shimmer effect inside icon bg */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`,
                }}
              />
              <Icon size={18} color={acc.base} strokeWidth={2.5} />
            </motion.div>
          )}
        </div>

        {/* Value with Radial Glow */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100, height: 60,
            background: acc.glow,
            filter: 'blur(30px)',
            borderRadius: '50%',
            zIndex: -1,
          }} />
          <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>
            <AnimatedNumber value={value} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {subtitle && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</span>
          )}
          {trendValue && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6,
              background: `${trendColor}10`, padding: '4px 8px', borderRadius: 99
            }}>
              <TrendIcon size={12} color={trendColor} strokeWidth={3} />
              <span style={{ fontSize: 11, fontWeight: 800, color: trendColor }}>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Trend Bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3,
        background: acc.grad,
        opacity: 0.8,
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
