/* NONNA AUTH — camada de identidade em modo de compatibilidade
 * Não concede acesso por si só. As regras do Firebase continuam sendo a autoridade.
 * Durante a migração, os módulos antigos ainda podem usar seus gates legados.
 */
(function (root) {
  const listeners = [];
  let user = null;
  let unsubscribe = null;

  function claims() {
    return user && user._claims ? user._claims : {};
  }

  // These are UI/migration metadata only. They do not enforce access and must
  // never be used as a substitute for Firebase Security Rules or a trusted API.
  const ROLES = Object.freeze([
    'owner', 'manager', 'kitchen', 'cashier', 'waiter', 'courier', 'customer'
  ]);
  const PAGE_POLICIES = Object.freeze({
    cliente: Object.freeze({ roles: Object.freeze(['customer']) }),
    pizzaria: Object.freeze({ roles: Object.freeze(['owner', 'manager']) }),
    cozinha: Object.freeze({ roles: Object.freeze(['owner', 'manager', 'kitchen']) }),
    caixa: Object.freeze({ roles: Object.freeze(['owner', 'manager', 'cashier']) }),
    garcom: Object.freeze({ roles: Object.freeze(['owner', 'manager', 'waiter']) }),
    motoboy: Object.freeze({ roles: Object.freeze(['owner', 'manager', 'courier']) })
  });
  const POLICY = Object.freeze({
    roles: ROLES,
    pages: PAGE_POLICIES,
    enforcement: 'server-rules-only'
  });

  function diagnostic(page) {
    const requestedPage = typeof page === 'string' ? page : null;
    const policy = requestedPage ? PAGE_POLICIES[requestedPage] || null : null;
    return Object.freeze({
      requestedPage,
      knownPage: !!policy,
      authenticated: !!user,
      uidPresent: !!(user && user.uid),
      role: api.role,
      roleKnown: ROLES.includes(api.role),
      restaurantIdPresent: !!api.restaurantId,
      allowedRoles: policy ? policy.roles.slice() : [],
      // Deliberately null: diagnostics never make an access decision.
      accessDecision: null,
      authorizationSource: 'firebase-auth-claims-and-server-rules',
      storageAuthorization: false
    });
  }

  const api = {
    mode: 'compatibility',
    policy: POLICY,
    get currentUser() { return user; },
    get uid() { return user && user.uid || null; },
    get role() { return claims().role || null; },
    get restaurantId() { return claims().restaurantId || null; },
    get claims() { return { ...claims() }; },
    diagnostics: Object.freeze({ snapshot: diagnostic }),
    onChange(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.push(fn);
      fn({ user, role: api.role, restaurantId: api.restaurantId });
      return () => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    async refreshClaims() {
      if (!user || typeof user.getIdTokenResult !== 'function') return {};
      const result = await user.getIdTokenResult(true);
      user._claims = result.claims || {};
      notify();
      return api.claims;
    },
    async signOut() {
      if (root.firebase && firebase.auth) await firebase.auth().signOut();
    },
    isAuthenticated() { return !!user; },
    hasRole(...roles) { return !!api.role && roles.includes(api.role); }
  };

  function notify() {
    const snapshot = { user, role: api.role, restaurantId: api.restaurantId };
    listeners.slice().forEach(fn => { try { fn(snapshot); } catch (e) { console.warn('NONNA_AUTH listener', e); } });
  }

  if (root.firebase && typeof firebase.auth === 'function') {
    try {
      unsubscribe = firebase.auth().onAuthStateChanged(async next => {
        user = next || null;
        if (user && typeof user.getIdTokenResult === 'function') {
          try { user._claims = (await user.getIdTokenResult()).claims || {}; } catch (_) { user._claims = {}; }
        }
        notify();
      });
    } catch (e) { console.warn('NONNA_AUTH indisponível', e); }
  }

  // Explicitly separate policy/diagnostics globals for migration tooling. These
  // exports are descriptive only; no export below is an authorization gate.
  root.NONNA_AUTH_POLICY = POLICY;
  root.NONNA_AUTH_DIAGNOSTICS = api.diagnostics;
  root.NONNA_AUTH = api;
})(window);
