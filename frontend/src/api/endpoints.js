import client from './client';

/**
 * TrackHive API Endpoints
 * High-fidelity, data-dense logistics orchestration methods.
 */

// --- AUTHENTICATION ---
export const loginUser = async (email, password) => {
  // Now that backend is built specifically for email, send exactly { email, password }
  const response = await client.post('/api/auth/login/', { email, password });
  const { access, refresh } = response.data;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  return response.data;
};

export const getProfile = async () => {
  const response = await client.get('/api/auth/profile/');
  return response.data;
};

// --- AGENTS / FLEET ---
export const getAgents = async (params = {}) => {
  const response = await client.get('/api/agents/', { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results || []);
};

export const getAgentDetail = async (id) => {
  const response = await client.get(`/api/agents/${id}/`);
  return response.data;
};

export const resetAgentFatigue = async (id) => {
  const response = await client.patch(`/api/agents/${id}/reset_fatigue/`);
  return response.data;
};

// --- ORDERS ---
export const getOrders = async () => {
  const response = await client.get('/api/orders/');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results || []);
};

export const getOrderDetail = async (id) => {
  const response = await client.get(`/api/orders/${id}/`);
  return response.data;
};

// --- ANOMALIES ---
export const getAnomalies = async () => {
  const response = await client.get('/api/anomalies/');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results || []);
};

export const resolveAnomaly = async (id) => {
  const response = await client.patch(`/api/anomalies/${id}/resolve/`);
  return response.data;
};

// --- SIMULATOR ---
export const startSimulation = async (data) => {
  const response = await client.post('/api/simulate/start/', data);
  return response.data;
};

export const stopSimulation = async () => {
  const response = await client.post('/api/simulate/stop/');
  return response.data;
};

// --- SYSTEM HEALTH ---
export const getHealth = async () => {
  const response = await client.get('/api/health/');
  return response.data;
};
