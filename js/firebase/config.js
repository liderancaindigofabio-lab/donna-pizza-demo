/* ============================================
   FIREBASE CONFIG — Nonna Pizzaria
   ============================================ */

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBYv6Rmd4uxApSnfZi84j92L15QOImqIJg",
    authDomain:        "nonna-pizzaria-2a167.firebaseapp.com",
    databaseURL:       "https://nonna-pizzaria-2a167-default-rtdb.firebaseio.com",
    projectId:         "nonna-pizzaria-2a167",
    storageBucket:     "nonna-pizzaria-2a167.firebasestorage.app",
    messagingSenderId: "885393863287",
    appId:             "1:885393863287:web:8b4ecba68605e59faa4c72"
};

// Expose the same immutable config to disposable secondary Auth apps. This contains no secret.
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
const FIREBASE_ATIVO = !FIREBASE_CONFIG.apiKey.startsWith('COLE_SUA');
// Produção não mascara falhas do Firebase com dados locais. Ative somente para demo/desenvolvimento.
const FIREBASE_ALLOW_LOCAL_FALLBACK = false;
const NONNA_ENV = 'production';

console.log('🔥 Firebase config carregado. Ativo:', FIREBASE_ATIVO);
