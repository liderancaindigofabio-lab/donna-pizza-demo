/* ============================================
   DONNA PIZZA — Cardápio
   Baseado no cardápio real que vimos em donnapizza.cardapio.top
   ============================================ */

const CARDAPIO = {
    categorias: [
        { id: 'pizzas', nome: '🍕 Pizzas Salgadas', icone: '🍕' },
        { id: 'doces', nome: '🍫 Pizzas Doces', icone: '🍫' },
        { id: 'calzones', nome: '🥟 Calzones', icone: '🥟' },
        { id: 'bebidas', nome: '🥤 Bebidas', icone: '🥤' },
    ],

    produtos: [
        // ===== PIZZAS SALGADAS =====
        {
            id: 1, cat: 'pizzas', nome: 'Pizza Mussarela',
            desc: 'Mussarela, orégano, azeitonas pretas e azeite. A clássica!',
            emoji: '🧀',
            tags: ['clássica', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 25.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 35.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 45.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 2, cat: 'pizzas', nome: 'Pizza Calabresa',
            desc: 'Calabresa fatiada, cebola roxa, mussarela e orégano.',
            emoji: '🍕',
            tags: ['popular', 'carne'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 28.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 38.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 48.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 3, cat: 'pizzas', nome: 'Pizza Portuguesa',
            desc: 'Presunto, ovos, cebola, pimentão, azeitona, mussarela e ervilha.',
            emoji: '🇵🇹',
            tags: ['popular'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 30.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 40.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 50.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 4, cat: 'pizzas', nome: 'Pizza Frango Catupiry',
            desc: 'Frango desfiado, catupiry original, milho e mussarela.',
            emoji: '🍗',
            tags: ['popular', 'top'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 55.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 5, cat: 'pizzas', nome: 'Pizza Quatro Queijos',
            desc: 'Mussarela, provolone, catupiry e parmesão ralado na hora.',
            emoji: '🧀',
            tags: ['premium', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 35.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 45.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 58.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 6, cat: 'pizzas', nome: 'Pizza Margherita',
            desc: 'Molho de tomate San Marzano, mussarela de búfala, manjericão fresco.',
            emoji: '🌿',
            tags: ['premium', 'vegetariana'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 33.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 43.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 56.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 7, cat: 'pizzas', nome: 'Pizza Pepperoni',
            desc: 'Pepperoni importado, mussarela e pimentão. Sabor intenso!',
            emoji: '🌶️',
            tags: ['premium', 'carne'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 38.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 48.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 60.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 8, cat: 'pizzas', nome: 'Pizza Bacon',
            desc: 'Bacon crocante, cebola caramelizada, mussarela e barbecue.',
            emoji: '🥓',
            tags: ['carne', 'premium'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 36.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 46.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 58.00, destaque: '🥤 Refri grátis' },
            ]
        },
        {
            id: 9, cat: 'pizzas', nome: 'Pizza Vegetariana',
            desc: 'Brócolis, palmito, ervilha, cebola, pimentão, tomate e mussarela.',
            emoji: '🥦',
            tags: ['vegetariana', 'saudável'],
            tipos: [
                { id: 't1', nome: 'Brotinho', detalhe: '4 fatias', preco: 32.00 },
                { id: 't2', nome: 'Média', detalhe: '6 fatias', preco: 42.00 },
                { id: 't3', nome: 'Grande', detalhe: '8 fatias', preco: 55.00, destaque: '🥤 Refri grátis' },
            ]
        },

        // ===== PIZZAS DOCES =====
        {
            id: 20, cat: 'doces', nome: 'Pizza de Chocolate',
            desc: 'Chocolate ao leite derretido com morangos frescos.',
            emoji: '🍫',
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
            emoji: '🍮',
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
            emoji: '🍌',
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
            emoji: '🍓',
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
            emoji: '🥟',
            tags: ['carne'],
            preco: 30.00
        },
        {
            id: 31, cat: 'calzones', nome: 'Calzone de Frango',
            desc: 'Frango desfiado, catupiry, milho e mussarela.',
            emoji: '🥟',
            tags: ['popular'],
            preco: 32.00
        },
        {
            id: 32, cat: 'calzones', nome: 'Calzone de Quatro Queijos',
            desc: 'Mussarela, provolone, catupiry e parmesão.',
            emoji: '🥟',
            tags: ['premium'],
            preco: 38.00
        },
        {
            id: 33, cat: 'calzones', nome: 'Calzone de Portuguesa',
            desc: 'Presunto, ovos, cebola, pimentão, azeitona e mussarela.',
            emoji: '🥟',
            tags: ['popular'],
            preco: 32.00
        },

        // ===== BEBIDAS =====
        {
            id: 40, cat: 'bebidas', nome: 'Coca-Cola 2L',
            desc: 'Gelada, perfeita pra pizza grande.',
            emoji: '🥤',
            tags: ['gelada'],
            preco: 14.00
        },
        {
            id: 41, cat: 'bebidas', nome: 'Coca-Cola 350ml',
            desc: 'Lata gelada.',
            emoji: '🥤',
            tags: ['gelada'],
            preco: 6.00
        },
        {
            id: 42, cat: 'bebidas', nome: 'Guaraná Antarctica 2L',
            desc: 'O clássico brasileiro.',
            emoji: '🥤',
            tags: ['gelada'],
            preco: 13.00
        },
        {
            id: 43, cat: 'bebidas', nome: 'Suco Natural 500ml',
            desc: 'Laranja, maracujá ou limão. Natural e gelado.',
            emoji: '🧃',
            tags: ['natural'],
            preco: 8.00
        },
        {
            id: 44, cat: 'bebidas', nome: 'Água Mineral 500ml',
            desc: 'Com ou sem gás.',
            emoji: '💧',
            tags: [],
            preco: 4.00
        },
        {
            id: 45, cat: 'bebidas', nome: 'Cerveja Heineken Long Neck',
            desc: 'Long neck 330ml, gelada.',
            emoji: '🍺',
            tags: ['gelada', 'adulto'],
            preco: 9.00
        },
    ],

    cupons: {
        'DONNA10': { tipo: 'percentual', valor: 10, desc: '🎁 10% de desconto' },
        'BEMVINDO': { tipo: 'percentual', valor: 15, desc: '🎁 15% de desconto' },
        'FOME10': { tipo: 'fixo', valor: 10, desc: '🎁 R$ 10 de desconto' },
    }
};
