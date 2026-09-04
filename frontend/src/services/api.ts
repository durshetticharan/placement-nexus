import axios from 'axios';

const api = axios.create({
  // Use relative URL — Vite proxies /api → localhost:5000
  // This keeps cookies same-origin and fixes sameSite: strict issues
  baseURL: '/api/v1',
  withCredentials: true, // send httpOnly cookies
});

export default api;
