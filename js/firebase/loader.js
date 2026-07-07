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
        const m = document.createElement('div');
        m.id = 'app-marker';
        m.textContent = 'app:' + appName;
        m.style.cssText = 'position:fixed;top:0;left:0;background:green;color:white;padding:4px;z-index:99999;font-size:14px;';
        (document.body || document.documentElement).appendChild(m);
        console.log('🚀 Iniciando app:', appName);
        extras.forEach(src => {
            const tag = document.createElement('div');
            tag.textContent = 'load: ' + src.split('/').pop();
            tag.style.cssText = 'position:fixed;top:'+(24+extras.indexOf(src)*16)+'px;left:0;background:blue;color:white;padding:2px;z-index:99999;font-size:10px;';
            (document.body || document.documentElement).appendChild(tag);
            loadScript(src, () => {
                // Espera o app definir suas funções
                setTimeout(() => {
                    if (typeof init === 'function') {
                        const r = document.createElement('div');
                        r.textContent = 'init() exists, calling...';
                        r.style.cssText = 'position:fixed;top:80px;left:0;background:yellow;color:black;padding:2px;z-index:99999;font-size:10px;';
                        (document.body || document.documentElement).appendChild(r);
                        try { init(); 
                            const r2 = document.createElement('div');
                            r2.textContent = 'init() OK!';
                            r2.style.cssText = 'position:fixed;top:96px;left:0;background:green;color:white;padding:2px;z-index:99999;font-size:10px;';
                            (document.body || document.documentElement).appendChild(r2);
                        } catch (e) { 
                            const r2 = document.createElement('div');
                            r2.textContent = 'init() ERRO: ' + e.message;
                            r2.style.cssText = 'position:fixed;top:96px;left:0;background:red;color:white;padding:2px;z-index:99999;font-size:10px;';
                            (document.body || document.documentElement).appendChild(r2);
                        }
                    } else {
                        const r = document.createElement('div');
                        r.textContent = 'init() NÃO EXISTE';
                        r.style.cssText = 'position:fixed;top:80px;left:0;background:red;color:white;padding:2px;z-index:99999;font-size:10px;';
                        (document.body || document.documentElement).appendChild(r);
                    }
                }, 100);
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
