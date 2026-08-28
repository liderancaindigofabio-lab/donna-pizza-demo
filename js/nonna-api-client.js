/* Nonna API compatibility client. Firebase remains available as rollback until migration coverage is complete. */
(function (root) {
  const API = String(root.NONNA_API_BASE || 'https://nonna-pizzaria-api.onrender.com').replace(/\/$/, '');
  const TOKEN_KEY = 'nonna_api_token';
  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs) || 12000);
    const fetchOptions = { ...options, headers, signal: controller.signal };
    delete fetchOptions.timeoutMs;
    let response;
    try { response = await fetch(API + path, fetchOptions); }
    catch (cause) {
      const error = new Error(cause && cause.name === 'AbortError' ? 'Tempo limite da API' : 'Não foi possível conectar à API');
      error.cause = cause; throw error;
    } finally { clearTimeout(timeout); }
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
    createProduct: data => request('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => request('/api/products/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: id => request('/api/products/' + encodeURIComponent(id), { method: 'DELETE' }),
    orders: () => request('/api/orders'),
    createOrder: order => request('/api/orders', { method: 'POST', body: JSON.stringify(order) }),
    // Public checkout uses the authenticated API order endpoint when available;
    // never silently persist a failed order in local storage.
    publicOrder: (order, options = {}) => {
      const idempotencyKey = typeof options === 'string' ? options : options.idempotencyKey;
      const headers = idempotencyKey ? { 'Idempotency-Key': String(idempotencyKey) } : {};
      return request('/api/public/orders', { method: 'POST', headers, body: JSON.stringify(order) });
    },
    updateOrderStatus: (id, status) => request('/api/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: JSON.stringify({ status }) }),
    config: () => request('/api/config/restaurant'),
    updateConfig: data => request('/api/config', { method: 'PUT', body: JSON.stringify({ data }) }),
    list: resource => request('/api/' + encodeURIComponent(resource)),
    update: (resource, id, data) => request('/api/' + encodeURIComponent(resource) + '/' + encodeURIComponent(id), { method: resource === 'users' ? 'PATCH' : 'PUT', body: JSON.stringify(data) }),
    cash: () => request('/api/cash/register'),
    openCash: data => request('/api/cash/registers/open', { method: 'POST', body: JSON.stringify(data) }),
    movement: (id, data) => request('/api/cash/registers/' + encodeURIComponent(id) + '/movements', { method: 'POST', body: JSON.stringify(data) }),
    closeCash: (id, data) => request('/api/cash/registers/' + encodeURIComponent(id) + '/close', { method: 'POST', body: JSON.stringify(data) })
  });
})(window);
