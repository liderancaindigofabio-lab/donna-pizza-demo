/* ============================================
   DB ADAPTER — Wrapper transparente
   Se Firebase tá configurado, usa remoto.
   Se não, usa localStorage (modo atual).
   Os 3 apps (cliente/pizzaria/motoboy) continuam
   usando DB.xxx() como sempre usaram.
   ============================================ */

const DB = {
    KEY_PEDIDOS: 'donna_pedidos',
    KEY_MOTOBOYS: 'donna_motoboys',
    KEY_CONFIG: 'donna_config',
    KEY_CARDAPIO: 'donna_cardapio',
    KEY_CLIENTES: 'donna_clientes',
    KEY_CLIENTE_LOGADO: 'donna_cliente_logado',

    CARDAPIO_DEFAULT: { /* mesmo do storage.js — duplicado pra ficar standalone */
        tamanhos: [
            { id: 'P', nome: 'Pequena', qtdSabores: 1, fatias: 4 },
            { id: 'M', nome: 'Média',   qtdSabores: 2, fatias: 6 },
            { id: 'G', nome: 'Grande',  qtdSabores: 2, fatias: 8 },
        ],
        sabores: [
            { id: 'calabresa',    nome: 'Calabresa',        cat: 'salgada', desc: 'Mussarela, calabresa fatiada, cebola roxa', emoji: '🍕' },
            { id: 'margherita',   nome: 'Margherita',       cat: 'salgada', desc: 'Mussarela, tomate, manjericão fresco', emoji: '🍕' },
            { id: 'quatro_queijos', nome: 'Quatro Queijos', cat: 'salgada', desc: 'Mussarela, provolone, catupiry, parmesão', emoji: '🧀' },
            { id: 'frango_catupiry', nome: 'Frango c/ Catupiry', cat: 'salgada', desc: 'Frango desfiado, catupiry, milho', emoji: '🍗' },
            { id: 'portuguesa',   nome: 'Portuguesa',       cat: 'salgada', desc: 'Mussarela, presunto, ovo, ervilha, cebola', emoji: '🍳' },
            { id: 'pepperoni',    nome: 'Pepperoni',        cat: 'salgada', desc: 'Mussarela, pepperoni importado, orégano', emoji: '🌶️' },
            { id: 'bauru',        nome: 'Bauru',            cat: 'salgada', desc: 'Mussarela, presunto, tomate, oregano', emoji: '🥪' },
            { id: 'mineira',      nome: 'Mineira',          cat: 'salgada', desc: 'Mussarela, calabresa, bacon, milho', emoji: '🥓' },
            { id: 'chocolate',    nome: 'Chocolate',        cat: 'doce',    desc: 'Chocolate ao leite com morangos', emoji: '🍫' },
            { id: 'banana',       nome: 'Banana',           cat: 'doce',    desc: 'Banana, canela, açúcar, leite condensado', emoji: '🍌' },
            { id: 'romeu_julieta', nome: 'Romeu e Julieta', cat: 'doce',    desc: 'Mussarela, goiabada cremosa', emoji: '🍮' },
            { id: 'prestigio',    nome: 'Prestígio',        cat: 'doce',    desc: 'Chocolate, coco ralado, leite condensado', emoji: '🥥' },
        ],
        adicionais: [
            { id: 'borda_catupiry', nome: 'Borda Catupiry',   preco: { P: 5, M: 7, G: 9 } },
            { id: 'borda_chocolate', nome: 'Borda Chocolate', preco: { P: 5, M: 7, G: 9 } },
            { id: 'extra_queijo',    nome: 'Extra Queijo',     preco: { P: 4, M: 6, G: 8 } },
            { id: 'bacon',           nome: 'Bacon',            preco: { P: 4, M: 6, G: 8 } },
            { id: 'azeitona',        nome: 'Azeitona',         preco: { P: 3, M: 4, G: 5 } },
        ],
        precos_base: {
            calabresa:       { P: 25, M: 38, G: 48 },
            margherita:      { P: 28, M: 42, G: 52 },
            quatro_queijos:  { P: 32, M: 48, G: 58 },
            frango_catupiry: { P: 28, M: 42, G: 52 },
            portuguesa:      { P: 30, M: 45, G: 55 },
            pepperoni:       { P: 35, M: 50, G: 62 },
            bauru:           { P: 27, M: 40, G: 50 },
            mineira:         { P: 32, M: 46, G: 58 },
            chocolate:       { P: 26, M: 38, G: 48 },
            banana:          { P: 24, M: 35, G: 44 },
            romeu_julieta:   { P: 26, M: 38, G: 47 },
            prestigio:       { P: 28, M: 40, G: 50 },
        },
        calzones: [
            { id: 'calzone_calabresa',   nome: 'Calzone Calabresa',   preco: 28, desc: 'Calabresa, mussarela, cebola' },
            { id: 'calzone_frango',      nome: 'Calzone Frango',      preco: 28, desc: 'Frango, catupiry, milho' },
            { id: 'calzone_queijo',      nome: 'Calzone 4 Queijos',   preco: 32, desc: 'Mussarela, provolone, catupiry, parmesão' },
        ],
        bebidas: [
            { id: 'coca_2l',     nome: 'Coca-Cola 2L',       preco: 12, emoji: '🥤' },
            { id: 'coca_350',    nome: 'Coca-Cola Lata 350ml', preco: 6,  emoji: '🥤' },
            { id: 'guarana_2l',  nome: 'Guaraná Antarctica 2L', preco: 11, emoji: '🥤' },
            { id: 'agua',        nome: 'Água 500ml',         preco: 4,  emoji: '💧' },
            { id: 'suco_laranja', nome: 'Suco de Laranja 500ml', preco: 8, emoji: '🍊' },
            { id: 'cerveja',     nome: 'Cerveja Heineken 600ml', preco: 14, emoji: '🍺' },
        ],
        combos: [
            { id: 'combo_familia',  nome: 'Combo Família', desc: '2 pizzas G + 2 refris 2L', preco: 130, emoji: '👨‍👩‍👧‍👦' },
            { id: 'combo_casal',    nome: 'Combo Casal',   desc: '1 pizza G + 1 refri 2L',    preco: 65,  emoji: '💑' },
            { id: 'combo_individual', nome: 'Combo Individual', desc: '1 pizza M + 1 refri lata', preco: 50, emoji: '🧑' },
        ],
        cupons: [
            { codigo: 'NONNA10',    desc: '10% OFF na primeira compra',   tipo: 'percentual', valor: 10 },
            { codigo: 'BEMVINDO',   desc: 'R$ 5 OFF pra novos clientes',  tipo: 'fixo',       valor: 5 },
            { codigo: 'FOME10',     desc: '10% OFF em pedidos acima de R$ 50', tipo: 'percentual', valor: 10, minimo: 50 },
            { codigo: 'FAMILIA',    desc: 'R$ 15 OFF em combos',         tipo: 'fixo',       valor: 15, apenasCombos: true },
        ],
    },

    // ====== Detecção automática do backend ======
    _backend: null,
    get backend() {
        if (this._backend) return this._backend;
        if (typeof FIREBASE_ATIVO !== 'undefined' && FIREBASE_ATIVO && typeof firebase !== 'undefined') {
            this._backend = 'firebase';
        } else {
            this._backend = 'local';
        }
        return this._backend;
    },

    async init() {
        if (this.backend === 'firebase') {
            console.log('🔥 DB usando Firebase Realtime Database');
            // Carrega dados iniciais em cache
            this._cachePedidos = await DBRemote.getPedidosAsync();
            this._cacheMotoboys = await DBRemote.getMotoboysAsync();
            this._cacheConfig = await DBRemote.getConfigAsync();
            this._cacheCardapio = await DBRemote.getCardapioAsync() || this.CARDAPIO_DEFAULT;

            // Seed inicial no Firebase (só se a config não tiver)
            if (!this._cacheConfig.nome) {
                await firebase.database().ref('config').set({
                    nome: 'Nonna Pizzaria',
                    endereco: 'Av. Melício Machado, 1060 - Atalaia, Aracaju - SE, 49037-440',
                    whatsapp: '5500900000000',
                    taxaEntrega: 7.00,
                    tempoPreparo: 25,
                    cuponsAtivos: ['NONNA10', 'BEMVINDO', 'FOME10', 'FAMILIA']
                });
            }
            if (this._cacheMotoboys.length === 0) {
                const seed = [
                    { id: 1, nome: 'Carlos Silva', moto: 'Honda CB 500 - Placa ABC-1234', status: 'disponivel', telefone: '16991234567', foto: '👨🏾', lat: -10.9893597, lng: -37.0605839 },
                    { id: 2, nome: 'João Santos',  moto: 'Yamaha Fazer 250 - Placa XYZ-9876', status: 'disponivel', telefone: '16997654321', foto: '👨🏼', lat: -10.9893597, lng: -37.0605839 },
                    { id: 3, nome: 'Pedro Costa',  moto: 'Honda CG 160 - Placa DEF-5555', status: 'disponivel', telefone: '16996543210', foto: '🧔🏽', lat: -10.9893597, lng: -37.0605839 },
                    { id: 4, nome: 'Lucas Mendes', moto: 'Honda Titan 150 - Placa GHI-7777', status: 'disponivel', telefone: '16995432109', foto: '🧑🏾‍🦱', lat: -10.9893597, lng: -37.0605839 },
                ];
                seed.forEach(m => firebase.database().ref('motoboys/mb_' + m.id).set(m));
                this._cacheMotoboys = seed;
            }
            if (!this._cacheCardapio || !this._cacheCardapio.sabores) {
                await firebase.database().ref('cardapio').set(this.CARDAPIO_DEFAULT);
                this._cacheCardapio = this.CARDAPIO_DEFAULT;
            }
            this._ready = true;
            if (this._onReady) this._onReady();
            return true;
        } else {
            console.log('💾 DB usando localStorage (modo demo)');
            this._initLocal();
            this._ready = true;
            if (this._onReady) this._onReady();
            return true;
        }
    },

    onReady(cb) {
        if (this._ready) cb();
        else this._onReady = cb;
    },

    // ====== Inicialização local (igual storage.js original) ======
    _initLocal() {
        if (!localStorage.getItem(this.KEY_PEDIDOS)) {
            localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEY_MOTOBOYS)) {
            localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify([
                { id: 1, nome: 'Carlos Silva', moto: 'Honda CB 500 - Placa ABC-1234', status: 'disponivel', telefone: '16991234567', foto: '👨🏾', lat: -10.9893597, lng: -37.0605839 },
                { id: 2, nome: 'João Santos', moto: 'Yamaha Fazer 250 - Placa XYZ-9876', status: 'disponivel', telefone: '16997654321', foto: '👨🏼', lat: -10.9893597, lng: -37.0605839 },
                { id: 3, nome: 'Pedro Costa', moto: 'Honda CG 160 - Placa DEF-5555', status: 'disponivel', telefone: '16996543210', foto: '🧔🏽', lat: -10.9893597, lng: -37.0605839 },
            ]));
        } else {
            const motoboys = JSON.parse(localStorage.getItem(this.KEY_MOTOBOYS));
            let alterado = false;
            motoboys.forEach(m => {
                if (!m.lat || !m.lng) { m.lat = -10.9893597; m.lng = -37.0605839; alterado = true; }
            });
            if (alterado) localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify(motoboys));
        }
        if (!localStorage.getItem(this.KEY_CONFIG)) {
            localStorage.setItem(this.KEY_CONFIG, JSON.stringify({
                nome: 'Nonna Pizzaria',
                endereco: 'Av. Melício Machado, 1060 - Atalaia, Aracaju - SE, 49037-440',
                whatsapp: '5500900000000',
                taxaEntrega: 7.00,
                tempoPreparo: 25,
                cuponsAtivos: ['NONNA10', 'BEMVINDO', 'FOME10', 'FAMILIA']
            }));
        }
        if (!localStorage.getItem(this.KEY_CARDAPIO)) {
            localStorage.setItem(this.KEY_CARDAPIO, JSON.stringify(this.CARDAPIO_DEFAULT));
        }
        if (!localStorage.getItem(this.KEY_CLIENTES)) {
            localStorage.setItem(this.KEY_CLIENTES, JSON.stringify({}));
        }
    },

    // ====== PEDIDOS (síncrono, igual antes) ======
    getPedidos() {
        if (this.backend === 'firebase') {
            // Em modo Firebase, getPedidos() precisa ser async.
            // Pra manter compat, retorna cache local atualizado pelos listeners.
            return this._cachePedidos || [];
        }
        return JSON.parse(localStorage.getItem(this.KEY_PEDIDOS) || '[]');
    },

    addPedido(pedido) {
        if (this.backend === 'firebase') {
            return DBRemote.addPedido(pedido);
        }
        const pedidos = this.getPedidos();
        pedido.id = Date.now();
        pedido.criadoEm = new Date().toISOString();
        pedido.status = 'novo';
        pedido.motoboyId = null;
        pedido.rota = null;
        pedidos.unshift(pedido);
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_novo', pedido);
        return pedido;
    },

    updatePedido(id, updates) {
        if (this.backend === 'firebase') {
            return DBRemote.updatePedido(id, updates);
        }
        const pedidos = this.getPedidos();
        const idx = pedidos.findIndex(p => p.id === id);
        if (idx >= 0) {
            pedidos[idx] = { ...pedidos[idx], ...updates };
            localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
            this._notify('pedido_update', pedidos[idx]);
            return pedidos[idx];
        }
        return null;
    },

    getPedidosCliente(telefone) {
        if (this.backend === 'firebase') {
            // Modo Firebase: usa cache local (já está sincronizado pelo listener)
            const tel = (telefone || '').replace(/\D/g, '');
            return this.getPedidos().filter(p => p.cliente && p.cliente.tel && p.cliente.tel.replace(/\D/g, '') === tel);
        }
        const tel = (telefone || '').replace(/\D/g, '');
        return this.getPedidos().filter(p => p.cliente && p.cliente.tel && p.cliente.tel.replace(/\D/g, '') === tel);
    },

    getEstatisticasCliente(telefone) {
        const pedidos = this.getPedidosCliente(telefone) || [];
        const entregues = pedidos.filter(p => p.status === 'entregue');
        return {
            total: pedidos.length,
            entregues: entregues.length,
            cancelados: pedidos.filter(p => p.status === 'cancelado').length,
            gastoTotal: entregues.reduce((s, p) => s + (p.total || 0), 0),
            ticketMedio: entregues.length ? entregues.reduce((s, p) => s + (p.total || 0), 0) / entregues.length : 0,
            ultimoPedido: pedidos[0] || null,
        };
    },

    // ====== MOTOBOYS ======
    getMotoboys() {
        if (this.backend === 'firebase') {
            // Filtra motoboys sem nome (dados corrompidos) e ordena por ID
            return (this._cacheMotoboys || [])
                .filter(m => m && m.nome)
                .sort((a, b) => (a.id || 0) - (b.id || 0));
        }
        return JSON.parse(localStorage.getItem(this.KEY_MOTOBOYS) || '[]');
    },

    getMotoboy(id) {
        return this.getMotoboys().find(m => m.id === id);
    },

    getMotoboyPos(id) {
        const m = this.getMotoboy(id);
        return m && m.pos ? m.pos : (m && m.lat ? { lat: m.lat, lng: m.lng, t: 0 } : null);
    },

    getPedidosMotoboy(motoboyId) {
        return this.getPedidos().filter(p => p.motoboyId === motoboyId && p.status === 'em_entrega');
    },

    updateMotoboy(id, updates) {
        if (this.backend === 'firebase') {
            firebase.database().ref('motoboys/mb_' + id).update(updates);
            return;
        }
        const motoboys = this.getMotoboys();
        const idx = motoboys.findIndex(m => m.id === id);
        if (idx >= 0) {
            motoboys[idx] = { ...motoboys[idx], ...updates };
            localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify(motoboys));
            this._notify('motoboy_update', motoboys[idx]);
        }
    },

    updateMotoboyPos(id, lat, lng) {
        if (this.backend === 'firebase') {
            return DBRemote.updateMotoboyPos(id, lat, lng);
        }
        const motoboys = this.getMotoboys();
        const idx = motoboys.findIndex(m => m.id === id);
        if (idx >= 0) {
            motoboys[idx].lat = lat;
            motoboys[idx].lng = lng;
            motoboys[idx].pos = { lat, lng, t: Date.now() };
            localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify(motoboys));
        }
    },

    // ====== CONFIG ======
    getConfig() {
        if (this.backend === 'firebase') return this._cacheConfig || {};
        return JSON.parse(localStorage.getItem(this.KEY_CONFIG) || '{}');
    },

    updateConfig(updates) {
        if (this.backend === 'firebase') {
            const novo = { ...this.getConfig(), ...updates };
            firebase.database().ref('config').set(novo);
            this._cacheConfig = novo;
            this._notify('config_update', novo);
            return novo;
        }
        const config = { ...this.getConfig(), ...updates };
        localStorage.setItem(this.KEY_CONFIG, JSON.stringify(config));
        this._notify('config_update', config);
        return config;
    },

    // ====== CARDÁPIO ======
    getCardapio() {
        if (this.backend === 'firebase') return this._cacheCardapio || this.CARDAPIO_DEFAULT;
        const c = localStorage.getItem(this.KEY_CARDAPIO);
        if (!c) {
            localStorage.setItem(this.KEY_CARDAPIO, JSON.stringify(this.CARDAPIO_DEFAULT));
            return this.CARDAPIO_DEFAULT;
        }
        return JSON.parse(c);
    },

    updateCardapio(updates) {
        if (this.backend === 'firebase') {
            const novo = { ...this.getCardapio(), ...updates };
            firebase.database().ref('cardapio').set(novo);
            this._cacheCardapio = novo;
            this._notify('cardapio_update', novo);
            return novo;
        }
        const atual = this.getCardapio();
        const novo = { ...atual, ...updates };
        localStorage.setItem(this.KEY_CARDAPIO, JSON.stringify(novo));
        this._notify('cardapio_update', novo);
        return novo;
    },

    resetCardapio() {
        if (this.backend === 'firebase') {
            firebase.database().ref('cardapio').set(this.CARDAPIO_DEFAULT);
            this._cacheCardapio = this.CARDAPIO_DEFAULT;
            this._notify('cardapio_update', this.CARDAPIO_DEFAULT);
            return this.CARDAPIO_DEFAULT;
        }
        localStorage.setItem(this.KEY_CARDAPIO, JSON.stringify(this.CARDAPIO_DEFAULT));
        this._notify('cardapio_update', this.CARDAPIO_DEFAULT);
        return this.CARDAPIO_DEFAULT;
    },

    // ====== CLIENTES ======
    getClientes() {
        if (this.backend === 'firebase') return this._cacheClientes || {};
        return JSON.parse(localStorage.getItem(this.KEY_CLIENTES) || '{}');
    },

    getCliente(telefone) {
        const tel = (telefone || '').replace(/\D/g, '');
        const clientes = this.getClientes();
        return clientes[tel] || null;
    },

    salvarCliente(dados) {
        if (!dados || !dados.tel) return null;
        if (this.backend === 'firebase') {
            return DBRemote.salvarCliente(dados);
        }
        const tel = dados.tel.replace(/\D/g, '');
        const clientes = this.getClientes();
        const existente = clientes[tel] || {};
        const novo = {
            ...existente,
            nome: dados.nome || existente.nome || '',
            tel: dados.tel,
            end: dados.end || existente.end || '',
            cep: dados.cep || existente.cep || '',
            ref: dados.ref || existente.ref || '',
            primeiroPedido: existente.primeiroPedido || new Date().toISOString(),
            ultimoPedido: new Date().toISOString(),
            totalPedidos: (existente.totalPedidos || 0) + 1,
        };
        clientes[tel] = novo;
        localStorage.setItem(this.KEY_CLIENTES, JSON.stringify(clientes));
        this._notify('cliente_update', novo);
        return novo;
    },

    getClienteLogado() {
        const tel = localStorage.getItem(this.KEY_CLIENTE_LOGADO);
        if (!tel) return null;
        return this.getCliente(tel);
    },

    setClienteLogado(telefone) {
        if (telefone) localStorage.setItem(this.KEY_CLIENTE_LOGADO, telefone.replace(/\D/g, ''));
        else localStorage.removeItem(this.KEY_CLIENTE_LOGADO);
    },

    logoutCliente() { localStorage.removeItem(this.KEY_CLIENTE_LOGADO); },

    // ====== MÉTRICAS ======
    getMetricasHoje() {
        const hoje = new Date().toDateString();
        const pedidos = this.getPedidos().filter(p => new Date(p.criadoEm).toDateString() === hoje);
        return {
            total: pedidos.length,
            faturamento: pedidos.filter(p => p.status === 'entregue').reduce((s, p) => s + p.total, 0),
            emAndamento: pedidos.filter(p => ['novo', 'preparando', 'pronto', 'em_entrega'].includes(p.status)).length,
            ticketMedio: pedidos.length ? pedidos.reduce((s, p) => s + p.total, 0) / pedidos.length : 0,
            porStatus: {
                novo: pedidos.filter(p => p.status === 'novo').length,
                preparando: pedidos.filter(p => p.status === 'preparando').length,
                pronto: pedidos.filter(p => p.status === 'pronto').length,
                em_entrega: pedidos.filter(p => p.status === 'em_entrega').length,
                entregue: pedidos.filter(p => p.status === 'entregue').length,
            }
        };
    },

    // ====== LISTENERS em tempo real (Firebase) ======
    onChange(callback) {
        if (this.backend === 'firebase') {
            // Sincroniza cache com Firebase
            DBRemote.onAllPedidosChange(arr => {
                const oldArr = this._cachePedidos || [];
                this._cachePedidos = arr;
                // Detecta qual pedido mudou
                const oldById = new Map(oldArr.map(p => [String(p.id), p]));
                let changed = false;
                // Pedidos novos
                for (const p of arr) {
                    if (!oldById.has(String(p.id))) {
                        callback({ tipo: 'pedido_novo', data: p });
                        changed = true;
                        // NÃO return — deixa o loop continuar
                    }
                }
                // Pedidos que mudaram
                for (const p of arr) {
                    const old = oldById.get(String(p.id));
                    if (old && JSON.stringify(old) !== JSON.stringify(p)) {
                        callback({ tipo: 'pedido_update', data: p });
                        changed = true;
                    }
                }
                // Pedidos removidos
                for (const old of oldArr) {
                    if (!arr.find(p => String(p.id) === String(old.id))) {
                        callback({ tipo: 'pedido_remove', data: old });
                        changed = true;
                    }
                }
                // Se foi o primeiro sync (oldArr estava vazio) e agora tem pedidos, força render
                if (!changed && oldArr.length === 0 && arr.length > 0) {
                    callback({ tipo: 'pedido_update', data: null });
                }
            });
            firebase.database().ref('motoboys').on('value', snap => {
                const val = snap.val() || {};
                this._cacheMotoboys = Object.values(val);
                callback({ tipo: 'motoboy_update', data: null });
            });
            firebase.database().ref('config').on('value', snap => {
                this._cacheConfig = snap.val() || {};
            });
            firebase.database().ref('cardapio').on('value', snap => {
                this._cacheCardapio = snap.val() || this.CARDAPIO_DEFAULT;
            });
            firebase.database().ref('clientes').on('value', snap => {
                this._cacheClientes = snap.val() || {};
            });
        }
        // Notificação local (funciona nos dois modos)
        window.addEventListener('donna_db_change', (e) => callback(e.detail));
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('donna_')) {
                callback({ tipo: 'storage_update', data: null });
            }
        });
    },

    // Listener específico de motoboy em tempo real
    onMotoboyChange(id, callback) {
        if (this.backend === 'firebase') {
            DBRemote.onMotoboyChange(id, callback);
        } else {
            // Fallback: polling a cada 4s
            const tick = () => {
                const m = this.getMotoboy(id);
                if (m) callback(m);
            };
            tick();
            const interval = setInterval(tick, 4000);
            return () => clearInterval(interval);
        }
    },

    onPedidoChange(id, callback) {
        if (this.backend === 'firebase') {
            DBRemote.onPedidoChange(id, callback);
        } else {
            const tick = () => {
                const p = this.getPedidos().find(x => x.id === id);
                if (p) callback(p);
            };
            tick();
            const interval = setInterval(tick, 4000);
            return () => clearInterval(interval);
        }
    },

    _notify(tipo, data) {
        window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
    }
};
