/* Nonna API compatibility client. Firebase remains available as rollback until migration coverage is complete. */
(function (root) {
  const API = root.NONNA_API_BASE || 'https://nonna-pizzaria-api.onrender.com';
  const TOKEN_KEY = 'nonna_api_token';
  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(API + path, { ...options, headers });
    let body = null; try { body = await response.json(); } catch (_) {}
    if (!response.ok) { const error = new Error(body?.error || `API ${response.status}`); error.status = response.status; throw error; }
    return body;
  }
  root.NONNA_API = Object.freeze({
    base: API, tokenKey: TOKEN_KEY,
    request,
    login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/api/me'),
    products: restaurantId => request('/api/products/public/' + encodeURIComponent(restaurantId)),
    orders: () => request('/api/orders'),
    createOrder: order => request('/api/orders', { method: 'POST', body: JSON.stringify(order) }),
    updateOrderStatus: (id, status) => request('/api/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: JSON.stringify({ status }) })
  });
})(window);
