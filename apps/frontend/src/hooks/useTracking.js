import { useState, useEffect, useCallback } from 'react';

const useTracking = (onMessage) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    // Note: Auth to WebSocket via subprotocol or query param usually, 
    // but Channels AuthMiddlewareStack uses session cookies if present.
    // For local testing, we'll assume the browser has the session or we 
    // can add a ticket-based system.
    const ws = new WebSocket('ws://localhost:8000/ws/tracking/');

    ws.onopen = () => {
      console.log('--- WebSocket Connected ---');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onclose = () => {
      console.log('--- WebSocket Disconnected ---');
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    setSocket(ws);
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) socket.close();
    };
  }, []);

  const send = (data) => {
    if (socket && connected) {
      socket.send(json.stringify(data));
    }
  };

  return { connected, send };
};

export default useTracking;
