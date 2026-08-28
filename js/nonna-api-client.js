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
  const STATUS_TO_API = Object.freeze({ novo: 'pending', preparando: 'preparing', pronto: 'ready', em_entrega: 'out_for_delivery', entregue: 'delivered', cancelado: 'cancelled' });
  const STATUS_FROM_API = Object.freeze({ pending: 'novo', preparing: 'preparando', ready: 'pronto', out_for_delivery: 'em_entrega', delivered: 'entregue', cancelled: 'cancelado' });
  function apiOrderStatus(status) {
    const key = String(status || '').trim().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[-\\s]/g, '_');
    return STATUS_TO_API[key] || key;
  }
  function legacyCash(value) {
    if (!value || typeof value !== 'object') return value == null ? null : value;
    const c = { ...value };
    const status = String(c.status || '').toLowerCase();
    if (status === 'open') c.status = 'aberto';
    else if (status === 'closed') c.status = 'fechado';
    if (c.saldoInicial == null && c.opening != null) c.saldoInicial = Number(c.opening);
    if (c.valorContado == null && c.counted != null) c.valorContado = Number(c.counted);
    if (c.valorEsperado == null && c.expected != null) c.valorEsperado = Number(c.expected);
    if (c.abertoEm == null && c.opened_at != null) c.abertoEm = c.opened_at;
    if (c.fechadoEm == null && c.closed_at != null) c.fechadoEm = c.closed_at;
    if (Array.isArray(c.movimentos)) c.movimentos = c.movimentos.map(m => ({ ...m, tipo: m.tipo || (m.type === 'sale' ? 'venda' : m.type === 'in' ? 'suprimento' : m.type === 'out' ? 'sangria' : m.type), valor: m.valor ?? Number(m.amount), forma: m.forma || m.payment_method || null, pagamentos: m.pagamentos || m.payment_breakdown || null, observacao: m.observacao ?? m.description ?? '', em: m.em || m.created_at }));
    return c;
  }
  root.NONNA_API = Object.freeze({
    base: API, tokenKey: TOKEN_KEY,
    request,
    normalizeOrderStatus: status => STATUS_FROM_API[String(status || '').toLowerCase()] || status,
    normalizeCash: legacyCash,
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
    // UI keeps the legacy Portuguese state names; the API contract is English.
    updateOrderStatus: (id, status) => request('/api/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: JSON.stringify({ status: apiOrderStatus(status) }) }),
    config: () => request('/api/config/restaurant'),
    updateConfig: data => request('/api/config', { method: 'PUT', body: JSON.stringify({ data }) }),
    list: resource => request('/api/' + encodeURIComponent(resource)),
    update: (resource, id, data) => request('/api/' + encodeURIComponent(resource) + '/' + encodeURIComponent(id), { method: resource === 'users' ? 'PATCH' : 'PUT', body: JSON.stringify(data) }),
    cash: () => request('/api/cash/register').then(legacyCash),
    openCash: data => request('/api/cash/registers/open', { method: 'POST', body: JSON.stringify({ opening: Number(data?.opening ?? data?.saldoInicial ?? 0) }) }).then(legacyCash),
    movement: (id, data) => request('/api/cash/registers/' + encodeURIComponent(id) + '/movements', { method: 'POST', body: JSON.stringify({ type: data?.type, amount: Number(data?.amount ?? data?.valor ?? 0), description: data?.description ?? data?.observacao ?? '', payment_method: data?.payment_method ?? data?.forma ?? null, payment_breakdown: data?.payment_breakdown ?? data?.pagamentos ?? undefined }) }),
    closeCash: (id, data) => request('/api/cash/registers/' + encodeURIComponent(id) + '/close', { method: 'POST', body: JSON.stringify({ counted: Number(data?.counted ?? data?.valorContado ?? 0) }) }).then(legacyCash)
  });
})(window);
