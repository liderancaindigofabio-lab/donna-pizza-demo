/* ============================================
   FIREBASE CONFIG — Nonna Pizzaria
   ============================================ */

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyDpASBZl0V_nzZ4mYshshMI_ytvkIKQ0rw",
    authDomain:        "nonna-pizzaria.firebaseapp.com",
    databaseURL:       "https://nonna-pizzaria-default-rtdb.firebaseio.com",
    projectId:         "nonna-pizzaria",
    storageBucket:     "nonna-pizzaria.firebasestorage.app",
    messagingSenderId: "253306608475",
    appId:             "1:253306608475:web:47723afc27a862adf2987e"
};

const FIREBASE_ATIVO = !FIREBASE_CONFIG.apiKey.startsWith('COLE_SUA');
// Produção não mascara falhas do Firebase com dados locais. Ative somente para demo/desenvolvimento.
const FIREBASE_ALLOW_LOCAL_FALLBACK = false;
const NONNA_ENV = 'production';

console.log('🔥 Firebase config carregado. Ativo:', FIREBASE_ATIVO);
