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
        if (!window.firebase || typeof firebase.auth !== 'function') throw new Error('O serviço de autenticação ainda não carregou. Atualize a página.');
        if (!email || !password) throw new Error('Informe e-mail e senha.');
        var result = await withTimeout(firebase.auth().signInWithEmailAndPassword(email, password), 15000, 'O Firebase não respondeu. Verifique a conexão.');
        var uid = result.user.uid;
        var snap = await withTimeout(firebase.database().ref('userProfiles/' + uid).once('value'), 12000, 'O login foi feito, mas o perfil demorou para ser validado.');
        var profile = snap.val();
        if (!profile || profile.ativo === false || !profile.restaurantId || (profile.role !== 'owner' && profile.role !== 'manager')) {
          await firebase.auth().signOut();
          throw new Error('Este usuário não possui acesso à Gestão.');
        }
        profile.uid = uid;
        profile.email = result.user.email || email;
        try { await firebase.database().ref('userProfiles/' + uid).update({ lastAccessAt: new Date().toISOString() }); } catch (_) {}
        var tries = 0;
        while (typeof window.NONNA_GESTAO_START !== 'function' && tries++ < 100) await wait(100);
        if (typeof window.NONNA_GESTAO_START !== 'function') throw new Error('O painel da Gestão não terminou de carregar. Atualize a página.');
        window.NONNA_GESTAO_START(profile);
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
