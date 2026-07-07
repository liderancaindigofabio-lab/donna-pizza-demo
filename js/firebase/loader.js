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
    const build = Date.now();
    const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria)(\/|$)/) || [])[1];
    const extras = (APPS[appName] || []).map(s => s + '?b=' + build);

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        let called = false;
        const done = () => { if (!called) { called = true; cb && cb(); } };
        s.onload = done;
        s.onerror = done;
        s.onreadystatechange = () => { if (s.readyState === 'loaded' || s.readyState === 'complete') done(); };
        document.head.appendChild(s);
        // Fallback: se o script já está em cache, onload pode não disparar
        // em alguns navegadores. Força após 100ms.
        setTimeout(() => {
            if (!called && s.onload.toString().length > 0) {
                // Verifica se o script tem suas funções globais definidas
                done();
            }
        }, 100);
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
                    catch (e) {
                        try {
                            const dbg4 = document.getElementById('loader-debug');
                            if (dbg4) dbg4.textContent += ' | ❌ ERRO: ' + e.message;
                        } catch (e2) {}
                        console.error('Erro em init():', e);
                    }
                    try {
                        const dbg5 = document.getElementById('loader-debug');
                        if (dbg5) dbg5.textContent += ' | ✓ init() OK';
                    } catch (e) {}
                } else {
                    try {
                        const dbg3 = document.getElementById('loader-debug');
                        if (dbg3) dbg3.textContent += ' | ❌ init=' + typeof init;
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
