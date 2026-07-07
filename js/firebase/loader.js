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
    const appName = (location.pathname.match(/\/(cliente|motoboy|pizzaria)\//) || [])[1];
    const extras = APPS[appName] || [];

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => cb && cb();
        s.onerror = () => console.error('Falha ao carregar', src);
        document.head.appendChild(s);
    }

    function startApp() {
        extras.forEach(src => loadScript(src));
    }

    function bootLocal() {
        loadScript('/donna-pizza-demo/js/firebase/db-adapter.js', () => {
            DB.init().then(startApp);
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
