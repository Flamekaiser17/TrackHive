import { useState, useEffect, useCallback, useRef } from 'react';

// Exponential backoff caps — mirrors production reconnect strategies
const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 10000;
const HEALTH_CHECK_URL = '/health/';

/**
 * Waits for the backend to be reachable before trying WebSocket.
 */
async function waitForBackend(maxAttempts = 8) {
  const apiBase =
    import.meta.env.VITE_API_URL ||
    window.location.origin;
  const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  const healthUrl = `${cleanBase}${HEALTH_CHECK_URL}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        console.log(`WS_GATE: Backend healthy on attempt ${attempt}. Proceeding.`);
        return true;
      }
    } catch (_) {
      // Network error — backend not awake yet
    }
    const delay = Math.min(BACKOFF_INITIAL_MS * attempt, BACKOFF_MAX_MS);
    console.warn(`WS_GATE: Backend not ready. Retrying in ${delay}ms... (${attempt}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, delay));
  }
  console.error('WS_GATE: Backend did not become healthy. Proceeding anyway.');
  return false;
}

/**
 * Production-grade WebSocket hook.
 * Exposes:
 *   connected   — true once WS handshake completes
 *   dataLoaded  — true once the first INITIAL_DATA snapshot arrives
 *   lastMessage — most recent parsed message (all types)
 */
const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const wsRef           = useRef(null);
  const retryCountRef   = useRef(0);
  const retryTimerRef   = useRef(null);
  const destroyedRef    = useRef(false); // guard against state updates after unmount

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const connect = useCallback(async () => {
    // --- GATE 1: Abort if component already unmounted ---
    if (destroyedRef.current) return;

    // --- GATE 2: Token must be available ---
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('WS_SKIP: No JWT token — WebSocket deferred.');
      return;
    }

    // --- GATE 3: Backend health check (prevents cold-start failures) ---
    await waitForBackend();
    if (destroyedRef.current) return; // May have unmounted during health probe

    // --- Build WSS URL ---
    let wsHost = import.meta.env.VITE_WS_URL;
    if (!wsHost) {
      const apiURL = import.meta.env.VITE_API_URL || window.location.origin;
      wsHost = apiURL.replace(/^http/, 'ws');
    }
    const cleanHost = wsHost.endsWith('/') ? wsHost.slice(0, -1) : wsHost;
    const url = `${cleanHost}/ws/admin/?token=${token}`;

    console.log(`WS_CONNECT: Initiating session (attempt ${retryCountRef.current + 1})`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (destroyedRef.current) { ws.close(); return; }
      console.log('WS_OPEN: Real-time session established.');
      
      // Explicitly request initial data snapshot to bypass REST latency
      ws.send(JSON.stringify({ type: 'INIT_FETCH' }));

      retryCountRef.current = 0; // Reset backoff on success
      setConnected(true);
      clearRetryTimer();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Flag dataLoaded the moment the initial snapshot arrives
        if (message.type === 'INITIAL_DATA') {
          setDataLoaded(true);
        }
        setLastMessage(message);
      } catch (err) {
        console.error('WS_PARSE_ERROR: Invalid JSON from telemetry stream.', err);
      }
    };

    ws.onclose = (e) => {
      if (destroyedRef.current) return;
      setConnected(false);

      // Don't reconnect on normal intentional close (code 1000)
      if (e.code === 1000) return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      retryCountRef.current += 1;
      const delay = Math.min(
        BACKOFF_INITIAL_MS * Math.pow(2, retryCountRef.current - 1),
        BACKOFF_MAX_MS
      );
      console.warn(
        `WS_DISCONNECTED: Retrying in ${delay}ms (attempt ${retryCountRef.current})`
      );
      retryTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will handle retry — just close cleanly
      ws.close();
    };

    wsRef.current = ws;
  }, []); // stable — no deps that change

  useEffect(() => {
    destroyedRef.current = false;
    connect();

    return () => {
      destroyedRef.current = true;
      clearRetryTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null; // Suppress reconnect on intentional teardown
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WS_SEND_SKIP: Connection not active.');
    }
  }, []);

  return { connected, dataLoaded, lastMessage, sendMessage };
};

export default useWebSocket;
