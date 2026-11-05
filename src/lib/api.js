import { clearSession, getSession } from './session';

export class ApiError extends Error {
  constructor(kind, status = null, body = null) {
    super(`Request failed: ${kind}${status ? ` ${status}` : ''}`);
    this.kind = kind; // 'http' | 'network' | 'parse'
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const token = getSession()?.token;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, { method, headers, body: body && JSON.stringify(body), signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('network');
  }

  // Any 401 outside the login call means the token is gone, so send the user back to sign in
  if (response.status === 401 && path !== '/api/login') {
    clearSession();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError('http', 401);
  }

  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(response.ok ? 'parse' : 'http', response.status);
  }

  if (!response.ok) throw new ApiError('http', response.status, data);
  return data;
}

export const api = {
  login: (email, password) => request('/api/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/logout', { method: 'POST' }),
  listOrders: (params, signal) => request(`/api/orders?${new URLSearchParams(params)}`, { signal }),
  getOrder: (id, signal) => request(`/api/orders/${encodeURIComponent(id)}`, { signal }),
  updateStatus: (id, status) => request(`/api/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } }),
  createOrder: (data) => request('/api/orders', { method: 'POST', body: data }),
  notifications: () => request('/api/notifications'),
};

export function describeError(err) {
  if (err.kind === 'network') return "We can't reach the server. Check your connection and try again.";
  if (err.kind === 'parse') return "The server sent a response we couldn't read. Please try again.";
  if (err.status === 503) return 'Orderly is down for maintenance. Please try again in a few minutes.';
  if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return 'Something went wrong on our side. Please try again.';
}
