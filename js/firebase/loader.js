/* ============================================
   LOADER — Carrega tudo na ordem certa
   v2 — CORREÇÕES:
   - Idempotente: não executa 2x se o script for carregado 2x
   - Firebase: checa se já tá carregado antes de carregar
   - Espera DB._ready antes de chamar init do app
   - Trata erros e continua
   ============================================ */

(function() {
    // Guard: se já rodou, sai
    if (window.__DONNA_LOADER_RAN__) {
        console.warn('⚠️ Loader já executou, saindo');
        return;
    }
    window.__DONNA_LOADER_RAN__ = true;

    // Quais scripts extras cada app precisa depois do DB estar pronto
    const APPS = {
        'cliente':    ['/donna-pizza-demo/cliente/js/app.js'],
        'motoboy':    ['/donna-pizza-demo/motoboy/js/motoboy.js'],
        'pizzaria':   ['/donna-pizza-demo/pizzaria/js/painel.js'],
    };
    const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria)(\/|$)/) || [])[1];
    const extras = APPS[appName] || [];

    function loadScript(src, cb) {
        // Evita carregar 2x o mesmo script
        const key = 'loaded_' + src;
        if (window[key]) {
            cb && cb();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { window[key] = true; cb && cb(); };
        s.onerror = () => { console.error('❌ Falha ao carregar', src); cb && cb(); };
        document.head.appendChild(s);
    }

    function startApp() {
        if (!appName) {
            console.warn('⚠️ appName não detectado, não vai iniciar app');
            return;
        }
        console.log('🚀 Iniciando app:', appName);
        extras.forEach(src => {
            console.log('  → carregando', src);
            loadScript(src, () => {
                if (typeof init === 'function') {
                    try { init(); }
                    catch (e) { console.error('❌ Erro em init():', e); }
                } else {
                    console.warn('⚠️ init() não definida após carregar ' + src);
                }
            });
        });
    }

    function bootLocal() {
        console.log('💾 Boot localStorage');
        loadScript('/donna-pizza-demo/js/firebase/db-adapter.js?v=20', () => {
            console.log('  adapter carregado, init DB...');
            const p = DB.init();
            console.log('  init() retornou:', p);
            if (p && p.then) {
                p.then(() => { console.log('  ✅ DB pronto!'); startApp(); });
            } else {
                startApp();
            }
        });
    }

    function bootFirebase() {
        // v2: checa se Firebase já tá carregado
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            console.log('🔥 Firebase já carregado, pulando CDN');
            _afterFirebaseInit();
            return;
        }

        loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js', () => {
            loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js', () => {
                try {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(FIREBASE_CONFIG);
                    }
                    _afterFirebaseInit();
                } catch (e) {
                    console.error('❌ Erro init Firebase:', e);
                    bootLocal();  // Fallback pra localStorage
                }
            });
        });
    }

    function _afterFirebaseInit() {
        loadScript('/donna-pizza-demo/js/firebase/firebase-storage.js?v=20', () => {
            loadScript('/donna-pizza-demo/js/firebase/db-adapter.js?v=20', () => {
                DB.init().then(() => {
                    console.log('  ✅ DB pronto (Firebase)!');
                    startApp();
                }).catch(e => {
                    console.error('❌ Erro DB.init:', e);
                    bootLocal();
                });
            });
        });
    }

    if (typeof FIREBASE_ATIVO === 'undefined' || !FIREBASE_ATIVO) {
        bootLocal();
    } else {
        bootFirebase();
    }
})();
