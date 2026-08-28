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
    _connection: { mode: 'demo', state: 'starting' },
    get backend() {
        if (this._backend) return this._backend;
        if (window.NONNA_API && (sessionStorage.getItem('nonna_api_token') || localStorage.getItem('nonna_api_token'))) {
            this._backend = 'api';
        } else if (window.NONNA_API) {
            this._backend = 'public-api';
        } else if (typeof FIREBASE_ATIVO !== 'undefined' && FIREBASE_ATIVO && typeof firebase !== 'undefined') {
            this._backend = 'firebase';
        } else {
            this._backend = 'local';
        }
        return this._backend;
    },

    get backendInfo() {
        return { backend: this.backend, mode: this._connection.mode, state: this._connection.state };
    },

    _setConnection(mode, state) {
        this._connection = { mode, state };
        const labels = {
            firebase: state === 'ready' ? '● Firebase sincronizado' : state === 'degraded' ? '⚠ Firebase com falha · verifique a conexão' : '● Firebase conectando…',
            demo: state === 'fallback' ? '⚠ Firebase indisponível · modo demo' : '● Modo demo · dados locais'
        };
        if (mode === 'api') labels.api = state === 'ready' ? '● API sincronizada' : '● API conectando…';
        if (mode === 'public-api') labels['public-api'] = state === 'ready' ? '● Cardápio online' : '● API conectando…';
        const text = labels[mode] || labels.demo;
        document.querySelectorAll('[data-donna-connection]').forEach(el => {
            el.textContent = text;
            el.dataset.connectionMode = mode;
            el.dataset.connectionState = state;
            el.title = mode === 'firebase' ? 'Dados compartilhados pelo Firebase' : 'Este ambiente usa dados locais neste dispositivo';
        });
        window.dispatchEvent(new CustomEvent('donna_connection_change', { detail: this.backendInfo }));
    },

    onConnectionChange(callback) {
        window.addEventListener('donna_connection_change', e => callback(e.detail));
        callback(this.backendInfo);
    },

    _normalizarStatusPedido(status) {
        const key = String(status || 'novo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]/g, '_');
        return ({ pending:'novo', new:'novo', novo:'novo', received:'novo', preparing:'preparando', preparo:'preparando', preparando:'preparando', ready:'pronto', pronto:'pronto', delivering:'em_entrega', in_delivery:'em_entrega', em_entrega:'em_entrega', delivered:'entregue', entregue:'entregue', completed:'entregue', concluido:'entregue', cancelled:'cancelado', canceled:'cancelado', cancelado:'cancelado' })[key] || key;
    },
    _normalizarPedidoApi(order) {
        if (!order || typeof order !== 'object') return order;
        const status = this._normalizarStatusPedido(order.status);
        const customer = order.customer || order.cliente || {};
        const items = order.items || order.itens || [];
        return { ...order, status, cliente: order.cliente || customer, itens: order.itens || items, criadoEm: order.criadoEm || order.created_at || order.createdAt, total: order.total ?? order.total_amount ?? order.totalAmount };
    },

    _cardapioFromApiProducts(products) {
        const current = this.CARDAPIO_DEFAULT;
        if (!Array.isArray(products) || !products.length) return current;

        // The public API stores the legacy catalogue as normalized products. Do not
        // replace the rich client shape with the raw rows: sizes need fatias/qtdSabores,
        // flavours need their sweet/savoury category, and prices for flavours are
        // represented by the per-size legacy price matrix.
        const byId = (list) => Object.fromEntries((list || []).map(item => [String(item.id), item]));
        const groups = { tamanhos: [], sabores: [], adicionais: [], calzones: [], bebidas: [], combos: [] };
        const defaults = Object.fromEntries(Object.keys(groups).map(k => [k, byId(current[k])]));
        const precos_base = { ...(current.precos_base || {}) };
        products.forEach(p => {
            const id = String(p.id), category = String(p.category || '').toLowerCase();
            const key = Object.prototype.hasOwnProperty.call(groups, category) ? category : 'sabores';
            const old = defaults[key][id];
            const apiPrice = Number(p.price);
            const item = { ...(old || {}), id, nome: p.name || old?.nome || id,
                desc: p.description || old?.desc || '', emoji: p.emoji || old?.emoji || '🍕' };
            if (key === 'sabores') item.cat = old?.cat || (category === 'doce' ? 'doce' : 'salgada');
            if (key === 'tamanhos') { item.qtdSabores = old?.qtdSabores ?? 1; item.fatias = old?.fatias ?? 4; }
            if (key === 'adicionais') item.preco = old?.preco || { P: apiPrice || 0, M: apiPrice || 0, G: apiPrice || 0 };
            else if (key !== 'sabores' && apiPrice > 0) item.preco = apiPrice;
            groups[key].push(item);
            if (key === 'sabores') precos_base[id] = precos_base[id] || { P: apiPrice, M: apiPrice, G: apiPrice };
        });
        // Keep known legacy details/prices for rows whose API price is zero.
        Object.keys(groups).forEach(key => { if (!groups[key].length) groups[key] = current[key] || []; });
        return { ...current, ...groups, precos_base };
    },

    async init(options = {}) {
        if (this.backend === 'api' || this.backend === 'public-api') {
            try {
                const products = await NONNA_API.products(window.NONNA_RESTAURANT_ID || 'nonna-pizzaria');
                this._cacheApiProducts = products || [];
                this._cacheCardapio = this._cardapioFromApiProducts(this._cacheApiProducts);
                this._cacheConfig = {};
                if (this.backend === 'api') { this._cachePedidos = (await NONNA_API.orders()).map(p => this._normalizarPedidoApi(p)); this._cacheConfig = (await NONNA_API.config()).data || {}; }
                else this._cachePedidos = [];
                this._ready = true; this._setConnection(this.backend === 'api' ? 'api' : 'public-api', 'ready');
                if (this._onReady) this._onReady();
                return true;
            } catch (error) {
                // Production is API-only: never silently fall back to the legacy Firebase
                // database (which can expose stale/tenant-global data) or local demo data.
                console.error('Nonna API indisponível; operação bloqueada.', error);
                this._setConnection(this.backend === 'api' ? 'api' : 'public-api', 'degraded');
                throw error;
            }
        }
        if (this.backend === 'firebase') {
            console.log('🔥 DB usando Firebase Realtime Database');
            // Carrega dados iniciais em cache
            this._cachePedidos = await DBRemote.getPedidosAsync();
            this._cacheMotoboys = await DBRemote.getMotoboysAsync();
            this._cacheConfig = await DBRemote.getConfigAsync();
            this._cacheCardapio = await DBRemote.getCardapioAsync() || {
                tamanhos: [], sabores: [], adicionais: [], precos_base: {},
                calzones: [], bebidas: [], combos: [], cupons: []
            };

            // Never seed production with sample staff, menu, or configuration.
            // Empty resources are valid and are rendered by each module as an empty state.
            this._ready = true;
            this._setConnection('firebase', 'ready');
            if (this._onReady) this._onReady();
            return true;
        } else {
            console.log('💾 DB usando localStorage (modo demo)');
            this._initLocal();
            this._ready = true;
            this._setConnection('demo', options.fallback ? 'fallback' : 'ready');
            if (this._onReady) this._onReady();
            return true;
        }
    },

    // Re-read protected Firebase resources after staff authentication. The boot
    // probe may have been anonymous (401 is expected); never promote the UI to
    // ready until every protected cache read succeeds with the staff session.
    async refreshAuthenticatedCaches() {
        if (this.backend !== 'firebase') return true;
        const auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
        if (!auth || !auth.currentUser) throw new Error('Sessão Firebase não autenticada; os dados operacionais não foram carregados.');
        const reads = await Promise.allSettled([
            DBRemote.getPedidosAsync(),
            DBRemote.getMotoboysAsync(),
            DBRemote.getConfigAsync(),
            DBRemote.getCardapioAsync()
        ]);
        const labels = ['pedidos', 'motoboys', 'configuração', 'cardápio'];
        const failures = reads.map((r, i) => r.status === 'rejected' ? { recurso: labels[i], erro: r.reason } : null).filter(Boolean);
        if (failures.length) {
            this._ready = false;
            this._setConnection('firebase', 'degraded');
            console.error('[NONNA AUTH CACHE] falha parcial:', failures);
            const detail = failures.map(f => `${f.recurso}: ${f.erro?.message || f.erro || 'erro desconhecido'}`).join('; ');
            throw new Error(`Não foi possível sincronizar ${failures.length} recurso(s) protegidos: ${detail}`);
        }
        this._cachePedidos = reads[0].value || [];
        this._cacheMotoboys = reads[1].value || [];
        this._cacheConfig = reads[2].value || {};
        this._cacheCardapio = reads[3].value || { tamanhos: [], sabores: [], adicionais: [], precos_base: {}, calzones: [], bebidas: [], combos: [], cupons: [] };
        this._ready = true;
        this._setConnection('firebase', 'ready');
        this._onReady && this._onReady();
        this._notify('authenticated_cache_refresh', this.backendInfo);
        return true;
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
    _normalizarPedido(pedido, agora) {
        const p = { ...(pedido || {}) };
        const ts = agora || new Date().toISOString();
        const origem = p.origem || p.canal || 'cliente';
        const canal = p.canal || origem;
        const status = p.status || 'novo';
        const valores = ['subtotal', 'taxa', 'desconto', 'total'];
        valores.forEach(chave => {
            if (p[chave] == null || Number.isNaN(Number(p[chave]))) p[chave] = 0;
            else p[chave] = Number(p[chave]);
        });
        p.origem = origem;
        p.canal = canal;
        p.clienteTelIndex = p.clienteTelIndex || (p.cliente && p.cliente.tel ? String(p.cliente.tel).replace(/\D/g, '') : '');
        p.createdBy = p.createdBy || (origem === 'salao' ? 'garcom' : origem);
        p.status = status;
        p.criadoEm = p.criadoEm || p.createdAt || ts;
        p.createdAt = p.createdAt || p.criadoEm;
        p.updatedAt = p.updatedAt || p.criadoEm;
        // Preserve legacy timeline maps from Firebase; only create one when absent.
        if (!p.timeline || (Array.isArray(p.timeline) && !p.timeline.length) || (typeof p.timeline === 'object' && !Array.isArray(p.timeline) && !Object.keys(p.timeline).length)) {
            p.timeline = [{ evento: 'pedido_criado', status, em: p.criadoEm, createdAt: p.criadoEm, createdBy: p.createdBy, timestamp: p.criadoEm, actor: p.createdBy, source: origem }];
        }
        if (p.motoboyId === undefined) p.motoboyId = null;
        if (p.rota === undefined) p.rota = null;
        return p;
    },

    // Single event shape for both localStorage and Firebase, while retaining
    // the old field names consumed by existing screens.
    _novoEventoPedido(status, dados) {
        const extra = (dados && typeof dados === 'object') ? dados : {};
        const agora = new Date().toISOString();
        const candidata = extra.timestamp || extra.em || extra.createdAt;
        const timestamp = candidata && !Number.isNaN(Date.parse(candidata)) ? new Date(candidata).toISOString() : agora;
        const actor = extra.actor || extra.createdBy || extra.operador || 'sistema';
        const source = extra.source || extra.origem || extra.canal || null;
        const evento = { ...extra, evento: extra.evento || 'status_alterado', status: status || extra.status || null, timestamp, em: timestamp, createdAt: timestamp };
        if (actor) { evento.actor = actor; evento.createdBy = actor; }
        if (source) evento.source = source;
        return evento;
    },

    _timelineEntries(timeline) {
        if (Array.isArray(timeline)) return timeline;
        if (timeline && typeof timeline === 'object') return Object.values(timeline);
        return [];
    },

    _appendTimeline(timeline, item) {
        if (Array.isArray(timeline)) return [...timeline, item];
        if (timeline && typeof timeline === 'object') {
            const key = 'evento_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            return { ...timeline, [key]: item };
        }
        return [item];
    },

    getPedidos() {
        if (this.backend === 'api') return this._cachePedidos || [];
        if (this.backend === 'firebase') {
            // Em modo Firebase, getPedidos() precisa ser async.
            // Pra manter compat, retorna cache local atualizado pelos listeners.
            return this._cachePedidos || [];
        }
        return JSON.parse(localStorage.getItem(this.KEY_PEDIDOS) || '[]');
    },

    addPedido(pedido) {
        const normalizado = this._normalizarPedido(pedido);
        if (this.backend === 'public-api') {
            const items = (normalizado.itens || normalizado.items || []).map(x => { const raw = x.customPizza || x.pizza; const customPizza = raw && typeof raw === 'object' ? { category: 'pizza', sizeId: raw.sizeId || raw.tamanho || x.tamanhoId || x.productId, flavours: (raw.flavours || raw.sabores || []).map(v => ({ id: v.id || v })), addons: (raw.addons || raw.adicionais || []).map(v => ({ id: v.id || v })), observations: String(raw.observations || raw.observacao || '').slice(0, 500) } : null; return { productId: x.productId || x.id, quantity: x.quantidade || x.qtd || 1, notes: x.obs || x.observacao || '', ...(customPizza ? { customPizza } : {}) }; });
            const key = 'donna-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
            return NONNA_API.publicOrder({ restaurantId: window.NONNA_RESTAURANT_ID || 'nonna-pizzaria', channel: normalizado.canal || 'delivery', customer: normalizado.cliente || {}, items, delivery_fee: normalizado.taxa || 0, payment: normalizado.pagamento || {} }, key).then(order => { this._cachePedidos.unshift(this._normalizarPedidoApi(order)); this._notify('pedido_novo', order); return order; });
        }
        if (this.backend === 'api') {
            return NONNA_API.createOrder({ status: 'pending', channel: normalizado.canal || 'counter', customer: normalizado.cliente || {}, items: normalizado.itens || normalizado.items || [], subtotal: normalizado.subtotal || 0, delivery_fee: normalizado.taxa || 0, total: normalizado.total || 0, payment: normalizado.pagamento || {} }).then(order => { this._cachePedidos.unshift(this._normalizarPedidoApi(order)); this._notify('pedido_novo', order); return order; });
        }
        if (this.backend === 'firebase') return DBRemote.addPedido(normalizado);
        const pedidos = this.getPedidos();
        normalizado.id = Date.now();
        pedidos.unshift(normalizado);
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_novo', normalizado);
        return normalizado;
    },

    updatePedido(id, updates) {
        if (this.backend === 'api') {
            if (!updates || !updates.status) return this.getPedidos().find(p => String(p.id) === String(id)) || null;
            return NONNA_API.updateOrderStatus(id, updates.status).then(order => { const i = this._cachePedidos.findIndex(p => String(p.id) === String(id)); if (i >= 0) this._cachePedidos[i] = this._normalizarPedidoApi(order); this._notify('pedido_update', order); return order; });
        }
        if (this.backend === 'firebase') {
            const ref = firebase.database().ref('pedidos/' + id);
            return ref.once('value').then(snap => {
                const anterior = snap.val();
                if (!anterior) return null;
                const agora = new Date().toISOString();
                const patch = { ...(updates || {}), updatedAt: agora };
                // Never replace a legacy timeline while applying an order patch.
                delete patch.timeline;
                if (patch.status && patch.status !== anterior.status) {
                    const evento = this._novoEventoPedido(patch.status, { ...patch, evento: patch.status === 'cancelado' ? 'pedido_cancelado' : 'status_alterado' });
                    const eventoRef = ref.child('timeline').push();
                    patch['timeline/' + eventoRef.key] = evento;
                }
                return ref.update(patch).then(() => ref.once('value')).then(finalSnap => {
                    const pedido = finalSnap.val();
                    if (pedido) this._notify('pedido_update', pedido);
                    return pedido;
                });
            });
        }
        const pedidos = this.getPedidos();
        const idx = pedidos.findIndex(p => String(p.id) === String(id));
        if (idx < 0) return null;
        const anterior = pedidos[idx];
        const agora = new Date().toISOString();
        const patch = { ...(updates || {}) };
        // Timeline is append-only; callers cannot replace legacy history via a patch.
        delete patch.timeline;
        const atualizado = { ...anterior, ...patch, updatedAt: agora };
        if (patch.status && patch.status !== anterior.status) {
            atualizado.timeline = this._appendTimeline(anterior.timeline, this._novoEventoPedido(patch.status, { ...patch, evento: patch.status === 'cancelado' ? 'pedido_cancelado' : 'status_alterado' }));
        }
        pedidos[idx] = atualizado;
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_update', atualizado);
        return atualizado;
    },

    registrarEventoPedido(id, evento, dados) {
        if (this.backend === 'firebase') {
            const nomeEvento = typeof evento === 'string' ? evento : ((evento || {}).evento || 'evento');
            const extra = typeof evento === 'object' ? evento : (dados || {});
            const ref = firebase.database().ref('pedidos/' + id);
            return ref.once('value').then(snap => {
                const pedido = snap.val();
                if (!pedido) return null;
                const item = this._novoEventoPedido(extra.status || pedido.status, { ...extra, evento: nomeEvento });
                const eventRef = ref.child('timeline').push();
                return eventRef.set(item).then(() => ref.update({ updatedAt: item.timestamp })).then(() => {
                    this._notify('pedido_update', { ...pedido, updatedAt: item.timestamp });
                    return item;
                });
            });
        }
        const pedidos = this.getPedidos();
        const idx = pedidos.findIndex(p => String(p.id) === String(id));
        if (idx < 0) return null;
        const p = pedidos[idx];
        const nomeEvento = typeof evento === 'string' ? evento : ((evento || {}).evento || 'evento');
        const extra = typeof evento === 'object' ? evento : (dados || {});
        const item = this._novoEventoPedido(extra.status || p.status, { ...extra, evento: nomeEvento });
        p.timeline = this._appendTimeline(p.timeline, item);
        p.updatedAt = item.em;
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_update', p);
        return item;
    },

    atualizarStatusPedido(id, status, dados) {
        return this.updatePedido(id, { ...(dados || {}), status });
    },

    // Cancela com motivo obrigatório e deixa o motivo na timeline central.
    cancelarPedido(id, motivo, dados) {
        const razao = String(motivo || '').trim();
        if (!razao) return null;
        return this.atualizarStatusPedido(id, 'cancelado', {
            ...(dados || {}),
            motivoCancelamento: razao,
            canceladoEm: new Date().toISOString()
        });
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
        if (this.backend === 'api') return this._cacheMotoboys || [];
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
        if (this.backend === 'api') return NONNA_API.update('motoboys', id, { name: updates.nome || updates.name, phone: updates.telefone || updates.phone, active: updates.active !== false }).then(m => { this._cacheMotoboys=(this._cacheMotoboys||[]).map(x=>String(x.id)===String(id)?m:x); this._notify('motoboy_update',m); return m; });
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
        if (this.backend === 'api') return NONNA_API.request('/api/motoboys/'+encodeURIComponent(id)+'/location',{method:'POST',body:JSON.stringify({lat,lng})});
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
        if (this.backend === 'api') return this._cacheConfig || {};
        if (this.backend === 'firebase') return this._cacheConfig || {};
        return JSON.parse(localStorage.getItem(this.KEY_CONFIG) || '{}');
    },

    updateConfig(updates) {
        if (this.backend === 'api') return NONNA_API.updateConfig({ ...this.getConfig(), ...updates }).then(r => { const c=r.data||r; this._cacheConfig=c; this._notify('config_update',c); return c; });
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
        if (this.backend === 'api') return this._cacheCardapio || this.CARDAPIO_DEFAULT;
        if (this.backend === 'firebase') return this._cacheCardapio || this.CARDAPIO_DEFAULT;
        const c = localStorage.getItem(this.KEY_CARDAPIO);
        if (!c) {
            localStorage.setItem(this.KEY_CARDAPIO, JSON.stringify(this.CARDAPIO_DEFAULT));
            return this.CARDAPIO_DEFAULT;
        }
        return JSON.parse(c);
    },

    updateCardapio(updates) {
        if (this.backend === 'api') {
            const products = (updates.sabores || this.getCardapio().sabores || []).map(p => ({name:p.nome||p.name,description:p.desc||p.description,price:Number((p.preco||p.price||0)),category:p.cat||'Geral',emoji:p.emoji,active:true}));
            return NONNA_API.request('/api/products/reset',{method:'POST',body:JSON.stringify({products})}).then(()=>{this._cacheCardapio={...this.getCardapio(),...updates};this._notify('cardapio_update',this._cacheCardapio);return this._cacheCardapio});
        }
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
        if (this.backend === 'api') return NONNA_API.request('/api/products/reset',{method:'POST',body:JSON.stringify({products:this.CARDAPIO_DEFAULT.sabores.map(p=>({name:p.nome,description:p.desc,price:0,category:p.cat,emoji:p.emoji,active:true}))})}).then(()=>{this._cacheCardapio=this.CARDAPIO_DEFAULT;this._notify('cardapio_update',this.CARDAPIO_DEFAULT);return this.CARDAPIO_DEFAULT});
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

    // ====== API management resources ======
    async _apiRefresh(){ this._cachePedidos=await NONNA_API.orders(); this._cacheMotoboys=await NONNA_API.list('motoboys'); this._cacheConfig=(await NONNA_API.config()).data||{}; return true; },
    _apiResource(path){ return this.backend==='api' || this.backend==='public-api'; },
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
                // Detecta o pedido realmente novo pelo ID. O array é ordenado do
                // mais recente para o mais antigo; usar o último item aqui fazia
                // um pedido antigo ser anunciado como novo quando outro canal criava pedido.
                const idsAnteriores = new Set(oldArr.map(p => String(p && p.id)));
                const novos = arr.filter(p => p && !idsAnteriores.has(String(p.id)));
                if (novos.length) {
                    novos.forEach(novo => callback({ tipo: 'pedido_novo', data: novo }));
                } else {
                    // Mesmo conjunto (ou remoção) = atualização de pedido
                    callback({ tipo: 'pedido_update', data: null });
                }
            });
            firebase.database().ref('motoboys').on('value', snap => {
                const val = snap.val() || {};
                this._cacheMotoboys = Object.values(val);
                callback({ tipo: 'motoboy_update', data: null });
            });
            firebase.database().ref('caixa/atual').on('value', snap => {
                this._cacheCaixa = snap.val() || null;
                callback({ tipo: 'caixa_update', data: this._cacheCaixa });
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

    // ====== CAIXA / PDV ======
    getCaixaAtual() {
        if (this.backend === 'api') return this._cacheCaixa || null;
        if (this.backend === 'firebase') return this._cacheCaixa || null;
        try { return JSON.parse(localStorage.getItem('donna_caixa_atual') || 'null'); } catch (_) { return null; }
    },
    abrirCaixa(dados) {
        if (this.backend === 'api') return NONNA_API.openCash({opening:Number(dados?.saldoInicial||0)}).then(c=>{this._cacheCaixa=c;this._notify('caixa_update',c);return c});
        const caixa = { id: Date.now(), status: 'aberto', operador: dados?.operador || 'Caixa', saldoInicial: Number(dados?.saldoInicial || 0), movimentos: [], abertoEm: new Date().toISOString() };
        if (this.backend === 'firebase') firebase.database().ref('caixa/atual').set(caixa);
        else localStorage.setItem('donna_caixa_atual', JSON.stringify(caixa));
        this._cacheCaixa = caixa; this._notify('caixa_update', caixa); return caixa;
    },
    registrarMovimentoCaixa(movimento) {
        if (this.backend === 'api') { const c=this.getCaixaAtual(); if(!c)return null; const type=movimento.tipo==='venda'?'sale':(movimento.tipo==='suprimento'?'in':'out'); return NONNA_API.movement(c.id,{type,amount:Number(movimento.valor||0),description:movimento.observacao||''}).then(m=>{this._notify('caixa_update',m);return m}); }
        const caixa = this.getCaixaAtual(); if (!caixa || caixa.status !== 'aberto') return null;
        const mov = { id: Date.now(), tipo: movimento.tipo, valor: Number(movimento.valor || 0), forma: movimento.forma || null, observacao: movimento.observacao || '', operador: movimento.operador || caixa.operador, em: new Date().toISOString() };
        caixa.movimentos = [...(caixa.movimentos || []), mov];
        if (this.backend === 'firebase') firebase.database().ref('caixa/atual').set(caixa); else localStorage.setItem('donna_caixa_atual', JSON.stringify(caixa));
        this._cacheCaixa = caixa; this._notify('caixa_update', caixa); return mov;
    },
    fecharCaixa(dados) {
        if (this.backend === 'api') { const c=this.getCaixaAtual(); if(!c)return null; return NONNA_API.closeCash(c.id,{counted:Number(dados?.valorContado||0)}).then(x=>{this._cacheCaixa=x;this._notify('caixa_update',x);return x}); }
        const caixa = this.getCaixaAtual(); if (!caixa || caixa.status !== 'aberto') return null;
        const fechado = { ...caixa, status: 'fechado', valorContado: Number(dados?.valorContado || 0), fechadoEm: new Date().toISOString(), fechadoPor: dados?.operador || caixa.operador };
        if (this.backend === 'firebase') firebase.database().ref('caixa/atual').set(fechado); else localStorage.setItem('donna_caixa_atual', JSON.stringify(fechado));
        this._cacheCaixa = fechado; this._notify('caixa_update', fechado); return fechado;
    },

    _notify(tipo, data) {
        window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
    }
};

