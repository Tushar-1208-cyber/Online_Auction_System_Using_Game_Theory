const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid server response');
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  verifyOtp: (body, token) => request('/auth/verify-otp', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  getMe: (token) => request('/auth/me', { headers: getHeaders(token) }),
  getDashboard: (token) => request('/user/dashboard', { headers: getHeaders(token) }),
  getAdminStats: (token) => request('/admin/stats', { headers: getHeaders(token) }),

  // Auctions
  getAuctions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/auctions?${qs}`);
  },
  getAuction: (id) => request(`/auctions/${encodeURIComponent(id)}`),
  createAuction: (body, token) => {
    if (body instanceof FormData) {
      const h = {};
      if (token) h['Authorization'] = `Bearer ${token}`;
      return request('/auctions', { method: 'POST', headers: h, body });
    }
    return request('/auctions', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) });
  },
  deleteAuction: (id, token) => request(`/auctions/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getHeaders(token) }),

  // Bids
  placeBid: (body, token) => request('/bids', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }),

  // Game theory  
  getNashCalculation: (body, token) => request('/bids/nash-calculator', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }),
  getStrategy: (auctionId) => request(`/auctions/${encodeURIComponent(auctionId)}/strategy`),
};
