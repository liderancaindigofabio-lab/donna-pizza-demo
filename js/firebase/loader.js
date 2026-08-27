/*
 * NONNA BOOTLOADER
 * Inicializa Firebase/Auth/DB em ordem determinística e só libera os módulos
 * operacionais depois que o adapter estiver pronto.
 */
(function () {
  const scriptTag = document.currentScript;
  const BASE = new URL('../', scriptTag && scriptTag.src ? scriptTag.src : location.href).href;
  const APPS = {
    cliente: new URL('cliente/js/app.js?v=3', BASE).href,
    motoboy: new URL('motoboy/js/motoboy.js?v=3', BASE).href,
    pizzaria: new URL('pizzaria/js/painel.js?v=3', BASE).href,
    garcom: new URL('garcom/js/garcom.js?v=4', BASE).href,
    cozinha: new URL('cozinha/js/cozinha.js?v=5', BASE).href
  };
  const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria|garcom|caixa|cozinha)(\/|$)/) || [])[1] || null;
  const state = window.NONNA_BOOT = window.NONNA_BOOT || {
    status: 'starting',
    backend: null,
    error: null,
    promise: null
  };

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const target = new URL(src, location.href);
      const existing = [...document.scripts].find(s => {
        if(!s.src)return false;
        const u=new URL(s.src, location.href);
        return u.origin===target.origin && u.pathname===target.pathname;
      });
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }

  async function boot() {
    try {
      state.status = 'loading-firebase';
      emit('nonna_boot_status', state);

      const firebaseActive = typeof FIREBASE_ATIVO !== 'undefined' && FIREBASE_ATIVO;
      if (!firebaseActive) {
        await loadScript(BASE + 'js/firebase/operational-guards.js?v=1');
        await loadScript(BASE + 'js/firebase/db-adapter.js?v=34');
        await loadScript(BASE + 'js/branding.js?v=1');
        window.DB = DB;
        await DB.init();
        state.backend = DB.backend;
      } else {
        await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

        // Auth vem antes do adapter para que páginas futuras possam usar a identidade
        // no primeiro ciclo sem corrida entre scripts.
        await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');
        await loadScript(BASE + 'js/firebase/auth.js');
        await loadScript(BASE + 'js/firebase/staff-auth.js?v=6');
        await loadScript(BASE + 'js/firebase/firebase-storage.js');
        await loadScript(BASE + 'js/firebase/operational-guards.js?v=1');
        await loadScript(BASE + 'js/firebase/db-adapter.js?v=34');
        await loadScript(BASE + 'js/branding.js?v=1');
        window.DB = DB;
        window.DBRemote = DBRemote;

        state.status = 'loading-db';
        emit('nonna_boot_status', state);
        await DB.init();
        state.backend = DB.backend;
      }

      state.status = 'ready';
      state.error = null;
      window.NONNA_DB_READY = Promise.resolve(DB);
      emit('nonna_db_ready', { db: DB, backend: state.backend });
      emit('nonna_boot_status', state);

      // Gestão/caixa já carregam o JS no HTML; os demais módulos são carregados aqui.
      if (APPS[appName]) {
        await loadScript(APPS[appName]);
        // Alguns módulos registram DOMContentLoaded; como são carregados depois
        // desse evento, inicializamos explicitamente quando a função global existir.
        if (typeof init === 'function') {
          try { init(); } catch (appError) { console.error('[NONNA APP]', appName, appError); }
        }
        emit('nonna_app_ready', { app: appName, db: DB });
      }
      return DB;
    } catch (error) {
      console.error('[NONNA BOOT]', error);
      state.status = 'error';
      state.error = error && error.message ? error.message : String(error);
      emit('nonna_boot_status', state);

      // Páginas operacionais ainda precisam exibir o login quando uma leitura
      // protegida falha antes da autenticação; não bloquear a tela de acesso.
      // Após o login, o módulo recarrega os dados com a sessão autenticada.
      if (appName && typeof DB !== 'undefined') {
        try {
          DB._ready = true;
          if (typeof DB._setConnection === 'function') DB._setConnection('firebase', 'degraded');
          window.NONNA_DB_READY = Promise.resolve(DB);
          if (APPS[appName]) await loadScript(APPS[appName]);
          if (typeof init === 'function') { try { init(); } catch (appError) { console.error('[NONNA APP]', appName, appError); } }
          emit('nonna_app_ready', { app: appName, db: DB, degraded: true });
          return DB;
        } catch (degradedError) { console.error('[NONNA DEGRADED]', degradedError); }
      }

      // Fallback local só quando explicitamente permitido. Em produção, não
      // mascarar uma falha de Firebase como se os dados tivessem sido salvos.
      const allowFallback = typeof FIREBASE_ALLOW_LOCAL_FALLBACK !== 'undefined' && FIREBASE_ALLOW_LOCAL_FALLBACK;
      if (allowFallback && typeof DB !== 'undefined') {
        console.warn('[NONNA] Firebase indisponível; entrando em modo demo/local explícito.');
        DB._backend = 'local';
        await DB.init({ fallback: true });
        state.status = 'fallback';
        state.backend = 'local';
        emit('nonna_db_fallback', { db: DB, error });
        if (APPS[appName]) {
          await loadScript(APPS[appName]);
          if (typeof init === 'function') { try { init(); } catch (appError) { console.error('[NONNA APP]', appName, appError); } }
        }
        return DB;
      }

      window.NONNA_DB_READY = Promise.reject(error);
      window.NONNA_DB_READY.catch(() => {});
      emit('nonna_db_error', { error });
      throw error;
    }
  }

  state.promise = boot();
  window.NONNA_BOOT_PROMISE = state.promise;
  state.promise.catch(() => {});
})();
