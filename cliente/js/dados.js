/* ============================================
   DONNA PIZZA — Dados do cardápio
   Com imagens SVG geradas (sem precisar de arquivo externo)
   ============================================ */

// Função pra gerar SVG de pizza estilizada
function pizzaSVG(cor1, cor2, emoji) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
            <radialGradient id="g" cx="50%" cy="50%">
                <stop offset="0%" stop-color="${cor1}"/>
                <stop offset="100%" stop-color="${cor2}"/>
            </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#g)" stroke="#d4a574" stroke-width="4"/>
        <circle cx="100" cy="100" r="85" fill="${cor1}" opacity="0.7"/>
        <text x="100" y="120" text-anchor="middle" font-size="80">${emoji}</text>
    </svg>
    `)}`;
}

const CARDAPIO = {
    categorias: [
        { id: 'mais-pedidos', nome: '🔥 Mais Pedidos', icone: '🔥' },
        { id: 'pizzas', nome: '🍕 Pizzas Salgadas', icone: '🍕' },
        { id: 'doces', nome: '🍫 Pizzas Doces', icone: '🍫' },
        { id: 'calzones', nome: '🥟 Calzones', icone: '🥟' },
        { id: 'bebidas', nome: '🥤 Bebidas', icone: '🥤' },
        { id: 'combos', nome: '🎁 Combos', icone: '🎁' },
    ],

    produtos: [
        // ===== MAIS PEDIDOS =====
        {
            id: 'mp1', cat: 'mais-pedidos', nome: 'Pizza Calabresa',
            desc: 'Calabresa fatiada, cebola roxa, mussarela e orégano.',
            emoji: '🍕', img: pizzaSVG('#8b1a1a', '#5a0f0f', '🍕'),
            tags: ['popular', '⭐ top vendas'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 28.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 38.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 48.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 'mp2', cat: 'mais-pedidos', nome: 'Pizza Frango Catupiry',
            desc: 'Frango desfiado, catupiry original, milho e mussarela.',
            emoji: '🍗', img: pizzaSVG('#e6c87a', '#a88a4a', '🍗'),
            tags: ['popular', '⭐ top vendas'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 55.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 'mp3', cat: 'mais-pedidos', nome: 'Pizza Portuguesa',
            desc: 'Presunto, ovos, cebola, pimentão, azeitona, mussarela e ervilha.',
            emoji: '🇵🇹', img: pizzaSVG('#c8a047', '#8b6a1f', '🥚'),
            tags: ['popular'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 30.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 40.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 50.00, bonus: '🥤 Refri grátis' },
            ]
        },

        // ===== PIZZAS SALGADAS =====
        {
            id: 1, cat: 'pizzas', nome: 'Pizza Mussarela',
            desc: 'Mussarela, orégano, azeitonas pretas e azeite. A clássica!',
            emoji: '🧀', img: pizzaSVG('#f4d27a', '#a88a4a', '🧀'),
            tags: ['clássica', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 25.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 35.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 45.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 2, cat: 'pizzas', nome: 'Pizza Calabresa',
            desc: 'Calabresa fatiada, cebola roxa, mussarela e orégano.',
            emoji: '🍕', img: pizzaSVG('#8b1a1a', '#5a0f0f', '🍕'),
            tags: ['popular', 'carne'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 28.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 38.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 48.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 3, cat: 'pizzas', nome: 'Pizza Portuguesa',
            desc: 'Presunto, ovos, cebola, pimentão, azeitona, mussarela e ervilha.',
            emoji: '🇵🇹', img: pizzaSVG('#c8a047', '#8b6a1f', '🥚'),
            tags: ['popular'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 30.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 40.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 50.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 4, cat: 'pizzas', nome: 'Pizza Frango Catupiry',
            desc: 'Frango desfiado, catupiry original, milho e mussarela.',
            emoji: '🍗', img: pizzaSVG('#e6c87a', '#a88a4a', '🍗'),
            tags: ['popular', 'top'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 55.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 5, cat: 'pizzas', nome: 'Pizza Quatro Queijos',
            desc: 'Mussarela, provolone, catupiry e parmesão ralado na hora.',
            emoji: '🧀', img: pizzaSVG('#fff5d0', '#a88a4a', '🧀'),
            tags: ['premium', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 35.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 45.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 58.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 6, cat: 'pizzas', nome: 'Pizza Margherita',
            desc: 'Molho de tomate San Marzano, mussarela de búfala, manjericão fresco.',
            emoji: '🌿', img: pizzaSVG('#c8202a', '#8b131a', '🌿'),
            tags: ['premium', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 33.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 43.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 56.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 7, cat: 'pizzas', nome: 'Pizza Pepperoni',
            desc: 'Pepperoni importado, mussarela e pimentão. Sabor intenso!',
            emoji: '🌶️', img: pizzaSVG('#c8202a', '#5a0f0f', '🌶️'),
            tags: ['premium', 'carne'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 38.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 48.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 60.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 8, cat: 'pizzas', nome: 'Pizza Bacon',
            desc: 'Bacon crocante, cebola caramelizada, mussarela e barbecue.',
            emoji: '🥓', img: pizzaSVG('#a05030', '#5a2a18', '🥓'),
            tags: ['carne', 'premium'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 36.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 46.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 58.00, bonus: '🥤 Refri grátis' },
            ]
        },
        {
            id: 9, cat: 'pizzas', nome: 'Pizza Vegetariana',
            desc: 'Brócolis, palmito, ervilha, cebola, pimentão, tomate e mussarela.',
            emoji: '🥦', img: pizzaSVG('#3a7a2a', '#1f4a18', '🥦'),
            tags: ['vegetariana', 'saudável'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 55.00, bonus: '🥤 Refri grátis' },
            ]
        },

        // ===== PIZZAS DOCES =====
        {
            id: 20, cat: 'doces', nome: 'Pizza de Chocolate',
            desc: 'Chocolate ao leite derretido com morangos frescos.',
            emoji: '🍫', img: pizzaSVG('#5a2a18', '#2a1208', '🍫'),
            tags: ['doce', 'kids'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 28.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 38.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 48.00 },
            ]
        },
        {
            id: 21, cat: 'doces', nome: 'Pizza Romeu e Julieta',
            desc: 'Mussarela com goiabada cremosa. A dupla perfeita!',
            emoji: '🍮', img: pizzaSVG('#c8506a', '#7a2838', '🍮'),
            tags: ['doce', 'tradicional'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 28.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 38.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 48.00 },
            ]
        },
        {
            id: 22, cat: 'doces', nome: 'Pizza de Banana',
            desc: 'Banana, canela, açúcar, leite condensado e mussarela.',
            emoji: '🍌', img: pizzaSVG('#f4d27a', '#a88a4a', '🍌'),
            tags: ['doce', 'cremosa'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 26.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 36.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 46.00 },
            ]
        },
        {
            id: 23, cat: 'doces', nome: 'Pizza Dois Amores',
            desc: 'Chocolate branco e chocolate ao leite com morangos.',
            emoji: '🍓', img: pizzaSVG('#f0d0d0', '#a85060', '🍓'),
            tags: ['doce', 'premium'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 52.00 },
            ]
        },

        // ===== CALZONES =====
        {
            id: 30, cat: 'calzones', nome: 'Calzone de Calabresa',
            desc: 'Calabresa, mussarela, cebola e orégano. Massa crocante!',
            emoji: '🥟', img: pizzaSVG('#c8a047', '#8b6a1f', '🥟'),
            tags: ['carne'],
            preco: 30.00
        },
        {
            id: 31, cat: 'calzones', nome: 'Calzone de Frango',
            desc: 'Frango desfiado, catupiry, milho e mussarela.',
            emoji: '🥟', img: pizzaSVG('#e6c87a', '#a88a4a', '🥟'),
            tags: ['popular'],
            preco: 32.00
        },
        {
            id: 32, cat: 'calzones', nome: 'Calzone Quatro Queijos',
            desc: 'Mussarela, provolone, catupiry e parmesão.',
            emoji: '🥟', img: pizzaSVG('#fff5d0', '#a88a4a', '🥟'),
            tags: ['premium'],
            preco: 38.00
        },
        {
            id: 33, cat: 'calzones', nome: 'Calzone Portuguesa',
            desc: 'Presunto, ovos, cebola, pimentão, azeitona e mussarela.',
            emoji: '🥟', img: pizzaSVG('#c8a047', '#8b6a1f', '🥟'),
            tags: ['popular'],
            preco: 32.00
        },

        // ===== BEBIDAS =====
        {
            id: 40, cat: 'bebidas', nome: 'Coca-Cola 2L',
            desc: 'Gelada, perfeita pra pizza grande.',
            emoji: '🥤', img: pizzaSVG('#c8202a', '#5a0f0f', '🥤'),
            tags: ['gelada'],
            preco: 14.00
        },
        {
            id: 41, cat: 'bebidas', nome: 'Coca-Cola Lata',
            desc: '350ml, bem gelada.',
            emoji: '🥤', img: pizzaSVG('#c8202a', '#5a0f0f', '🥤'),
            tags: ['gelada'],
            preco: 6.00
        },
        {
            id: 42, cat: 'bebidas', nome: 'Guaraná Antarctica 2L',
            desc: 'O clássico brasileiro.',
            emoji: '🥤', img: pizzaSVG('#2a8a4a', '#155a2a', '🥤'),
            tags: ['gelada'],
            preco: 13.00
        },
        {
            id: 43, cat: 'bebidas', nome: 'Suco Natural 500ml',
            desc: 'Laranja, maracujá ou limão. Natural e gelado.',
            emoji: '🧃', img: pizzaSVG('#f4a030', '#a86810', '🧃'),
            tags: ['natural'],
            preco: 8.00
        },
        {
            id: 44, cat: 'bebidas', nome: 'Água Mineral 500ml',
            desc: 'Com ou sem gás.',
            emoji: '💧', img: pizzaSVG('#5a8aaa', '#2a4a6a', '💧'),
            tags: [],
            preco: 4.00
        },
        {
            id: 45, cat: 'bebidas', nome: 'Cerveja Heineken',
            desc: 'Long neck 330ml, gelada.',
            emoji: '🍺', img: pizzaSVG('#3a8a3a', '#1a4a1a', '🍺'),
            tags: ['gelada', 'adulto'],
            preco: 9.00
        },

        // ===== COMBOS =====
        {
            id: 50, cat: 'combos', nome: 'Combo Família',
            desc: '2 pizzas grandes + 2 refris 2L. Perfeito pra família!',
            emoji: '🎁', img: pizzaSVG('#c8202a', '#d4a574', '🎁'),
            tags: ['economia', 'família'],
            preco: 99.90
        },
        {
            id: 51, cat: 'combos', nome: 'Combo Casal',
            desc: '1 pizza grande + 1 refri 2L + 1 pizza doce.',
            emoji: '💕', img: pizzaSVG('#c8506a', '#d4a574', '💕'),
            tags: ['economia', 'casal'],
            preco: 69.90
        },
        {
            id: 52, cat: 'combos', nome: 'Combo Individual',
            desc: '1 pizza brotinho + 1 refri lata.',
            emoji: '👤', img: pizzaSVG('#d4a574', '#a88a4a', '👤'),
            tags: ['individual'],
            preco: 32.90
        },
    ],

    cupons: {
        'DONNA10': { tipo: 'percentual', valor: 10, desc: '🎁 10% de desconto' },
        'BEMVINDO': { tipo: 'percentual', valor: 15, desc: '🎁 15% de desconto' },
        'FOME10': { tipo: 'fixo', valor: 10, desc: '🎁 R$ 10 de desconto' },
        'FAMILIA': { tipo: 'fixo', valor: 15, desc: '🎁 R$ 15 de desconto' },
    }
};
