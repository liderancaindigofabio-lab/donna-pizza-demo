/* ============================================
   LOADER — Carrega tudo na ordem certa
   ============================================ */

(function() {
    // Quais scripts extras cada app precisa depois do DB estar pronto
    const APPS = {
        'cliente':    ['/donna-pizza-demo/cliente/js/app.js'],
        'motoboy':    ['/donna-pizza-demo/motoboy/js/motoboy.js'],
        'pizzaria':   ['/donna-pizza-demo/pizzaria/js/painel.js'],
        'garcom':     ['/donna-pizza-demo/garcom/js/garcom.js?v=2'],
        'cozinha':    ['/donna-pizza-demo/cozinha/js/cozinha.js'],
    };
    const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria|garcom|caixa|cozinha)(\/|$)/) || [])[1];
    const extras = APPS[appName] || [];

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => cb && cb();
        s.onerror = () => { console.error('Falha ao carregar', src); cb && cb(); };
        document.head.appendChild(s);
    }

    function startApp() {
        if (window.__NONNA_APP_STARTED) return;
        window.__NONNA_APP_STARTED = true;
        console.log('🚀 Iniciando app:', appName);
        extras.forEach(src => {
            console.log('  → carregando', src);
            loadScript(src, () => {
                if (typeof init === 'function') {
                    try { init(); }
                    catch (e) { console.error('Erro em init():', e); }
                }
            });
        });
    }

    function bootLocal() {
        console.log('💾 Boot localStorage');
        loadScript('/donna-pizza-demo/js/firebase/db-adapter.js', () => {
            console.log('  adapter carregado, init DB...');
            const p = DB.init();
            console.log('  init() retornou:', p);
            if (p && p.then) {
                p.then(() => { console.log('  DB pronto!'); startApp(); });
            } else {
                startApp();
            }
        });
    }

    function bootFirebase() {
        loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js', () => {
            loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js', () => {
                loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js', () => {
                firebase.initializeApp(FIREBASE_CONFIG);
                loadScript('/donna-pizza-demo/js/firebase/auth.js', () => {
                loadScript('/donna-pizza-demo/js/firebase/firebase-storage.js', () => {
                    loadScript('/donna-pizza-demo/js/firebase/db-adapter.js', () => {
                        const firebaseBoot = DB.init();
                        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
                        Promise.race([firebaseBoot, timeout]).then(startApp).catch(err => {
                            console.warn('Firebase indisponível; iniciando modo local de contingência.', err);
                            DB._backend = 'local'; DB._ready = false;
                            Promise.resolve(DB.init()).then(startApp);
                        });
                    });
                });
                });
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
