/**
 * StatusBadge — unified badge component for agents, orders, and anomaly severities
 * Usage: <StatusBadge type="agent" value="available" />
 */

const CONFIGS = {
  // Agent statuses
  available:   { label: 'Available',   bg: 'rgba(46,213,115,0.12)',  color: '#2ED573', dot: true },
  busy:        { label: 'Busy',        bg: 'rgba(108,99,255,0.15)',  color: '#6C63FF', dot: true },
  idle:        { label: 'Idle',        bg: 'rgba(139,139,167,0.15)', color: '#8B8BA7', dot: true },
  offline:     { label: 'Offline',     bg: 'rgba(255,71,87,0.12)',   color: '#FF4757', dot: true },

  // Order statuses
  created:     { label: 'Created',     bg: 'rgba(139,139,167,0.15)', color: '#8B8BA7', dot: false },
  assigned:    { label: 'Assigned',    bg: 'rgba(0,180,255,0.12)',   color: '#00B4FF', dot: false },
  in_progress: { label: 'In Progress', bg: 'rgba(108,99,255,0.15)',  color: '#9B8FFF', dot: false },
  delivered:   { label: 'Delivered',   bg: 'rgba(46,213,115,0.12)',  color: '#2ED573', dot: false },
  failed:      { label: 'Failed',      bg: 'rgba(255,71,87,0.12)',   color: '#FF4757', dot: false },

  // Anomaly severities
  low:         { label: 'Low',         bg: 'rgba(46,213,115,0.12)',  color: '#2ED573', dot: false },
  medium:      { label: 'Medium',      bg: 'rgba(255,165,2,0.15)',   color: '#FFA502', dot: false },
  high:        { label: 'High',        bg: 'rgba(255,71,87,0.12)',   color: '#FF4757', dot: false },
  critical:    { label: 'Critical',    bg: 'rgba(255,71,87,0.2)',    color: '#FF4757', dot: false },

  // Fatigue levels
  fresh:    { label: 'Fresh',    bg: 'rgba(46,213,115,0.12)',  color: '#2ED573', dot: false },
  moderate: { label: 'Moderate', bg: 'rgba(255,165,2,0.15)',   color: '#FFA502', dot: false },
  tired:    { label: 'Tired',    bg: 'rgba(255,100,0,0.15)',   color: '#FF6400', dot: false },
  critical_fatigue: { label: 'Critical', bg: 'rgba(255,71,87,0.2)', color: '#FF4757', dot: false },
};

const StatusBadge = ({ value, size = 'sm' }) => {
  const raw = (value || '').toLowerCase().replace(/ /g, '_');
  const cfg = CONFIGS[raw] || {
    label: value || '—',
    bg: 'rgba(139,139,167,0.15)',
    color: '#8B8BA7',
    dot: false,
  };

  const fontSize = size === 'xs' ? '10px' : size === 'sm' ? '11px' : '12px';
  const padding  = size === 'xs' ? '2px 6px' : size === 'sm' ? '3px 8px' : '4px 10px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding,
      borderRadius: '99px',
      background: cfg.bg,
      color: cfg.color,
      fontSize,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      {cfg.dot && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: cfg.color, flexShrink: 0,
          animation: 'blink-dot 2s ease infinite',
        }} />
      )}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
