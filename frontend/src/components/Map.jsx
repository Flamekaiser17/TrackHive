import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

/**
 * High-fidelity agent marker with kinetic pulsing rings.
 * Color-coded based on real-time activity and anomaly states.
 */
const createAgentIcon = (status, hasAnomaly) => {
  let color = '#55556A'; // default offline
  let pulse = false;

  if (hasAnomaly) {
    color = '#FF4757';
    pulse = true;
  } else if (status === 'available') {
    color = '#00E5A0';
    pulse = true;
  } else if (status === 'busy' || status === 'in_transit') {
    color = '#00B4FF';
    pulse = true;
  }

  return L.divIcon({
    className: 'agent-marker-wrapper',
    html: `
      <div class="agent-marker-instance" style="position: relative; transition: all 500ms ease-out;">
        ${pulse ? `<div class="marker-pulse-ring" style="border-color: ${color}; position: absolute; top: -10px; left: -10px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid; animation: marker-expansion 2s infinite;"></div>` : ''}
        <div style="
          width: 14px; height: 14px; 
          background: ${color}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 10px ${color};
          position: relative;
          z-index: 2;
        "></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const orderIcon = L.divIcon({
  className: 'order-marker',
  html: `
    <div style="width: 12px; height: 12px; background: #6C63FF; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 0 10px rgba(108,99,255,0.4);"></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Resizes the map to fill its container dynamically
const MapResizer = () => {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
};

const CenterChanger = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
};

const Map = ({ agents = [], orders = [], unresolvedAnomalies = [], onAgentClick, focusedAgentId }) => {
  let center = [12.9716, 77.5946];
  if (focusedAgentId) {
    const focused = agents.find(a => a.id === focusedAgentId);
    if (focused && (focused.current_lat || focused.lat)) {
      center = [focused.current_lat || focused.lat, focused.current_lng || focused.lng];
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
      <style>{`
        @keyframes marker-expansion {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .leaflet-marker-icon { background: none; border: none; }
      `}</style>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '100%', background: '#0A0A0F' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapResizer />
        <CenterChanger center={center} />

        {agents.map((agent) => {
          const hasAnomaly = unresolvedAnomalies.some(a => a.agent_id === agent.id);
          const pos = [agent.lat || agent.current_lat || 12.97, agent.lng || agent.current_lng || 77.59];
          
          return (
            <Marker 
              key={agent.id} 
              position={pos} 
              icon={createAgentIcon(agent.status, hasAnomaly)}
              eventHandlers={{ click: () => onAgentClick && onAgentClick(agent) }}
            >
              <Popup className="glass-popup">
                <div style={{ padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: 'white' }}>{agent.name}</h4>
                  <p className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {agent.speed_kmph || agent.speed || 0} km/h • {agent.status || 'offline'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {orders.map((order) => {
           const pos = [order.lat || 12.97, order.lng || 77.59];
           return <Marker key={order.id} position={pos} icon={orderIcon} />;
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
