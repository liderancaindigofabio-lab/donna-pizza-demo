/* ============================================
   LOADER — Carrega tudo na ordem certa
   ============================================ */

(function() {
    // Quais scripts extras cada app precisa depois do DB estar pronto
    const APPS = {
        'cliente':    ['/donna-pizza-demo/cliente/js/app.js'],
        'motoboy':    ['/donna-pizza-demo/motoboy/js/motoboy.js'],
        'pizzaria':   ['/donna-pizza-demo/pizzaria/js/painel.js'],
    };
    const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria)(\/|$)/) || [])[1];
    const extras = APPS[appName] || [];

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => cb && cb();
        s.onerror = () => console.error('Falha ao carregar', src);
        document.head.appendChild(s);
    }

    function startApp() {
        console.log('🚀 Iniciando app:', appName);
        // DEBUG: mostra no DOM
        try {
            const dbg = document.createElement('div');
            dbg.id = 'loader-debug';
            dbg.style.cssText = 'position:fixed;top:0;left:0;background:lime;color:black;padding:4px;z-index:99999;font-size:11px;';
            dbg.textContent = '🚀 startApp: ' + appName;
            (document.body || document.documentElement).appendChild(dbg);
        } catch (e) {}
        extras.forEach(src => {
            console.log('  → carregando', src);
            loadScript(src, () => {
                try {
                    const dbg2 = document.getElementById('loader-debug');
                    if (dbg2) dbg2.textContent += ' | ' + src.split('/').pop() + ' OK';
                } catch (e) {}
                if (typeof init === 'function') {
                    try { init(); }
                    catch (e) { console.error('Erro em init():', e); }
                } else {
                    try {
                        const dbg3 = document.getElementById('loader-debug');
                        if (dbg3) dbg3.textContent += ' | ❌ init não é função';
                    } catch (e) {}
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
                firebase.initializeApp(FIREBASE_CONFIG);
                loadScript('/donna-pizza-demo/js/firebase/firebase-storage.js', () => {
                    loadScript('/donna-pizza-demo/js/firebase/db-adapter.js', () => {
                        DB.init().then(startApp);
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
