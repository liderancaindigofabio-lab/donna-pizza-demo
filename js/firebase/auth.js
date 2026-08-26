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

  const api = {
    mode: 'compatibility',
    get currentUser() { return user; },
    get uid() { return user && user.uid || null; },
    get role() { return claims().role || null; },
    get restaurantId() { return claims().restaurantId || null; },
    get claims() { return { ...claims() }; },
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

  root.NONNA_AUTH = api;
})(window);
