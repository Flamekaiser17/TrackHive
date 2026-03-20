import { motion } from 'framer-motion';

/**
 * Titan FatigueBar — high-fidelity progress bar with mount animations and glow
 */

const getColor = (score) => {
  const s = Number(score) || 0;
  if (s <= 3) return { color: '#00D4AA', label: 'Fresh',    glow: 'rgba(0,212,170,0.3)', grad: 'var(--gradient-teal)' };
  if (s <= 6) return { color: '#FFA502', label: 'Moderate', glow: 'rgba(255,165,2,0.3)', grad: 'linear-gradient(90deg, #FFA502, #FF6400)' };
  if (s <= 8) return { color: '#FF6400', label: 'Tired',    glow: 'rgba(255,100,0,0.3)', grad: 'linear-gradient(90deg, #FF6400, #FF4757)' };
  return           { color: '#FF4757', label: 'Critical', glow: 'rgba(255,71,87,0.4)', grad: 'var(--gradient-danger)' };
};

const FatigueBar = ({ score = 0, showLabel = true, showScore = true, height = 6 }) => {
  const { color, label, glow, grad } = getColor(score);
  const pct = Math.min((Number(score) / 10) * 100, 100);

  return (
    <div style={{ width: '100%' }}>
      {(showLabel || showScore) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {showLabel && (
            <span style={{ fontSize: '10px', fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {label}
            </span>
          )}
          {showScore && (
            <span style={{ fontSize: '11px', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
              {score}/10
            </span>
          )}
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 99,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: '100%',
            background: grad,
            borderRadius: 99,
            position: 'relative',
            boxShadow: pct > 70 ? `0 0 10px ${glow}` : 'none',
          }}
        >
          {/* Subtle moving shimmer inside bar */}
          {pct > 10 && (
            <motion.div
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FatigueBar;
