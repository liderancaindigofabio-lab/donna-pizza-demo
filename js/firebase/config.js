/* ============================================
   FIREBASE CONFIG
   ============================================
   Substitua os valores abaixo pelos do SEU projeto Firebase.

   Como pegar esses valores (5 minutos):
   1. Acesse https://console.firebase.google.com/
   2. Clique em "Adicionar projeto" → dê um nome (ex: "nonna-pizzaria") → continua
   3. No menu lateral, clique em "Realtime Database" → "Criar banco de dados"
      → escolha "Iniciar em modo de teste" → escolha a região (us-central1)
   4. Ainda no menu lateral, clique em "Visão geral do projeto" (ícone de engrenagem)
      → "Configurações do projeto" → "Seus apps" → clique em "</>" (Web)
      → Dê um apelido (ex: "nonna-web") → "Registrar app"
   5. Copie o objeto "firebaseConfig" que aparece e cole abaixo

   Depois, na página da Realtime Database, vá em "Regras" e troque pra:
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   (isso libera leitura/escrita pra qualquer um — só pra demo; em produção
   você coloca autenticação)
   ============================================ */

const FIREBASE_CONFIG = {
    apiKey:            "COLE_SUA_API_KEY_AQUI",
    authDomain:        "nonna-pizzaria.firebaseapp.com",
    databaseURL:       "https://nonna-pizzaria-default-rtdb.firebaseio.com",
    projectId:         "nonna-pizzaria",
    storageBucket:     "nonna-pizzaria.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:abcdef1234567890"
};

// Detecta se a config foi preenchida (não é mais a string "COLE_SUA_API_KEY_AQUI")
const FIREBASE_ATIVO = !FIREBASE_CONFIG.apiKey.startsWith('COLE_SUA');
