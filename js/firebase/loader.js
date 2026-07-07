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

    function loadScript(src, cb, errCb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => cb && cb();
        s.onerror = () => {
            console.error('Falha ao carregar', src);
            if (errCb) errCb();
        };
        document.head.appendChild(s);
    }

    function startApp() {
        const m = document.createElement('div');
        m.id = 'app-marker';
        m.setAttribute('data-marker', 'app-' + appName);
        m.style.cssText = 'position:fixed;top:24px;left:0;background:green;color:white;padding:4px;z-index:99999;font-size:12px;';
        m.textContent = 'app-' + appName;
        (document.body || document.documentElement).appendChild(m);
        console.log('🚀 Iniciando app:', appName);
        extras.forEach(src => {
            const tag = document.createElement('div');
            tag.textContent = 'load: ' + src;
            tag.style.cssText = 'position:fixed;top:48px;left:0;background:blue;color:white;padding:2px;z-index:99999;font-size:10px;';
            (document.body || document.documentElement).appendChild(tag);
            loadScript(src);
        });
    }

    function bootLocal() {
        const m = document.createElement('div');
        m.id = 'boot-marker';
        m.textContent = 'bootLocal';
        m.style.cssText = 'position:fixed;top:60px;left:0;background:orange;color:white;padding:2px;z-index:99999;font-size:10px;';
        (document.body || document.documentElement).appendChild(m);
        loadScript('/donna-pizza-demo/js/firebase/db-adapter.js', () => {
            const m2 = document.createElement('div');
            m2.textContent = 'adapter-loaded';
            m2.style.cssText = 'position:fixed;top:72px;left:0;background:purple;color:white;padding:2px;z-index:99999;font-size:10px;';
            (document.body || document.documentElement).appendChild(m2);
            const p = DB.init();
            if (p && p.then) {
                p.then(() => startApp());
            } else {
                startApp();
            }
        }, (e) => {
            const m3 = document.createElement('div');
            m3.textContent = 'ADAPTER FAIL';
            m3.style.cssText = 'position:fixed;top:84px;left:0;background:red;color:white;padding:2px;z-index:99999;font-size:10px;';
            (document.body || document.documentElement).appendChild(m3);
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
        // Marca visual que começou
        const mark = (txt) => {
            const d = document.createElement('div');
            d.id = 'loader-marker';
            d.setAttribute('data-marker', txt);
            d.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;padding:4px;z-index:99999;font-size:12px;';
            d.textContent = txt;
            (document.body || document.documentElement).appendChild(d);
        };
        mark('loader-rodou');
        bootLocal();
    } else {
        bootFirebase();
    }
})();
