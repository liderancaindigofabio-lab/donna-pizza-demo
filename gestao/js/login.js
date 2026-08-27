/* NONNA GESTÃO — login isolado
 * Não depende do loader, do banco, do painel ou de outro handler.
 */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function withTimeout(promise, ms, message) {
    return Promise.race([promise, new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error(message)); }, ms);
    })]);
  }
  ready(function () {
    var form = document.getElementById('gestaoLoginForm');
    var error = document.getElementById('gestaoAuthError');
    if (!form || form.dataset.loginBound === '1') return;
    form.dataset.loginBound = '1';
    var button = form.querySelector('button[type="submit"]');
    async function submit(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.disabled) return false;
      var email = String(form.querySelector('[name="user"]').value || '').trim().toLowerCase();
      var password = String(form.querySelector('[name="pass"]').value || '');
      button.disabled = true;
      button.textContent = 'Entrando…';
      error.textContent = '';
      try {
        if (!email || !password) throw new Error('Informe e-mail e senha.');
        var cfg = window.FIREBASE_CONFIG || {};
        if (!cfg.apiKey || !cfg.databaseURL) throw new Error('A configuração do Firebase não carregou. Atualize a página.');
        // Use the official Identity Toolkit REST endpoint for the first sign-in.
        // This isolates the login from SDK boot/listener races on the Gestão page.
        var authResponse = await withTimeout(fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(cfg.apiKey), {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: email, password: password, returnSecureToken: true})
        }), 15000, 'O Firebase não respondeu. Verifique a conexão.');
        var authData = await authResponse.json();
        if (!authResponse.ok || !authData.localId || !authData.idToken) {
          var authError = authData && authData.error && authData.error.message;
          var bad = new Error(authError || 'E-mail ou senha inválidos.');
          bad.code = authError === 'INVALID_PASSWORD' || authError === 'EMAIL_NOT_FOUND' ? 'auth/invalid-credential' : '';
          throw bad;
        }
        window.NONNA_REST_TOKEN = authData.idToken;
        window.NONNA_REST_UID = authData.localId;
        var profileResponse = await withTimeout(fetch(cfg.databaseURL.replace(/\/$/, '') + '/userProfiles/' + encodeURIComponent(authData.localId) + '.json?auth=' + encodeURIComponent(authData.idToken)), 12000, 'O login foi feito, mas o perfil demorou para ser validado.');
        var profile = await profileResponse.json();
        if (!profile || profile.ativo === false || !profile.restaurantId || (profile.role !== 'owner' && profile.role !== 'manager')) {
          throw new Error('Este usuário não possui acesso à Gestão.');
        }
        var uid = authData.localId;
        profile.uid = uid;
        profile.email = authData.email || email;
        try { await fetch(cfg.databaseURL.replace(/\/$/, '') + '/userProfiles/' + encodeURIComponent(uid) + '.json?auth=' + encodeURIComponent(authData.idToken), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({lastAccessAt:new Date().toISOString()})}); } catch (_) {}
        var tries = 0;
        while (typeof window.NONNA_GESTAO_START !== 'function' && tries++ < 100) await wait(100);
        if (typeof window.NONNA_GESTAO_START === 'function') {
          window.NONNA_GESTAO_START(profile);
        } else {
          // Authentication must not be hidden behind the panel boot. The profile
          // was already validated; expose the authenticated shell and report the
          // independent panel-loading failure instead of leaving a dead login.
          document.getElementById('authGate').hidden = true;
          document.getElementById('gestaoApp').hidden = false;
          var connection = document.getElementById('connection');
          if (connection) { connection.textContent = '● painel carregado'; connection.title = 'Login validado; sincronização do painel ainda não iniciou.'; }
          throw new Error('Login validado. O painel abriu, mas alguns dados ainda estão carregando.');
        }
      } catch (e) {
        var code = e && e.code ? String(e.code) : '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') error.textContent = 'E-mail ou senha inválidos.';
        else if (code === 'auth/network-request-failed') error.textContent = 'Sem conexão com o Firebase.';
        else error.textContent = e && e.message ? e.message : 'Não foi possível entrar.';
      } finally {
        button.disabled = false;
        button.textContent = 'Entrar';
      }
      return false;
    }
    form.onsubmit = submit;
  });
})();
