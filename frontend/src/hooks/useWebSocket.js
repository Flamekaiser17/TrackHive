import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for real-time WebSocket orchestration in TrackHive.
 * Connects to the admin cluster with JWT token-based authentication.
 */
const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    
    // Safety check for token persistence in the Command Center
    if (!token) {
      console.warn('WS_ERROR: Authentication token missing for admin cluster connection.');
      return;
    }

    const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const url = `${WS_BASE}/ws/admin/?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WS_CONNECTED: Secure session initialized with admin cluster.');
      setConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (err) {
        console.error('WS_CORE_PARSING_ERROR: Invalid JSON received from telemetry stream.', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.warn('WS_DISCONNECTED: Session interrupted. Attempting reconnection in 3s...');
      // Retry after 3s only if token still exists - FIXED: BUG 1
      if (localStorage.getItem('access_token')) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WS_SOCKET_ERROR: Connection failed on the simulation cluster.', error);
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on explicit close
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WS_SEND_FAILURE: Cluster connection not active.');
    }
  }, []);

  return { connected, lastMessage, sendMessage };
};

export default useWebSocket;
