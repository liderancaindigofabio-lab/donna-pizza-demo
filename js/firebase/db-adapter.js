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
    _ready: false,
    _connection: { mode: 'demo', state: 'starting' },
    get backend() {
        if (this._backend) return this._backend;
        if (window.NONNA_API && (sessionStorage.getItem('nonna_api_token') || localStorage.getItem('nonna_api_token'))) {
            this._backend = 'api';
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
            api: state === 'ready' ? '● API sincronizada' : state === 'degraded' ? '⚠ API indisponível · tentar novamente' : '● API conectando…',
            firebase: state === 'ready' ? '● Firebase sincronizado' : state === 'degraded' ? '⚠ Firebase com falha · verifique a conexão' : '● Firebase conectando…',
            demo: state === 'fallback' ? '⚠ Firebase indisponível · modo demo' : '● Modo demo · dados locais'
        };
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

    _cardapioFromApiProducts(products) {
        if (!Array.isArray(products) || !products.length) return this.CARDAPIO_DEFAULT;
        const out={...this.CARDAPIO_DEFAULT,sabores:[],bebidas:[],calzones:[],combos:[],adicionais:[],tamanhos:[],precos_base:{}};
        products.forEach(p=>{const id=String(p.id),cat=String(p.category||'sabores').toLowerCase(),item={id,nome:p.name||p.nome,desc:p.description||p.descricao||'',emoji:p.emoji||'🍕',preco:Number(p.price)||0,price:Number(p.price)||0}; const key=['sabores','bebidas','calzones','combos','adicionais','tamanhos'].includes(cat)?cat:'sabores'; out[key].push(item); out.precos_base[id]={P:item.preco,M:item.preco,G:item.preco};});
        return out;
    },
    _normalizeApiOrder(o) {
        if (!o) return o;
        const status = {pending:'novo',preparing:'preparando',ready:'pronto',out_for_delivery:'em_entrega',delivered:'entregue',cancelled:'cancelado'}[o.status] || o.status;
        return {...o, id:o.id, status, criadoEm:o.created_at || o.criadoEm, updatedAt:o.updated_at || o.updatedAt,
          cliente:o.customer || o.cliente || {}, itens:o.items || o.itens || [], taxa:o.delivery_fee ?? o.taxa ?? 0,
          pagamento:o.payment || o.pagamento || {}, canal:o.channel || o.canal || 'delivery', total:Number(o.total||0), subtotal:Number(o.subtotal||0)};
    },
    async refreshAuthenticatedCaches() {
        if (!window.NONNA_API || !(sessionStorage.getItem('nonna_api_token') || localStorage.getItem('nonna_api_token'))) return false;
        this._backend='api';
        const products=await NONNA_API.products(window.NONNA_RESTAURANT_ID || 'nonna-pizzaria');
        const orders=await NONNA_API.orders();
        this._cacheApiProducts=products||[]; this._cachePedidos=(orders||[]).map(o=>this._normalizeApiOrder(o));
        this._cacheCardapio=this._cardapioFromApiProducts ? this._cardapioFromApiProducts(this._cacheApiProducts) : this.CARDAPIO_DEFAULT;
        this._ready=true; this._setConnection('api','ready'); this._notify('pedido_update',null); return true;
    },
    async init(options = {}) {
        if (this.backend === 'api') { try { await this.refreshAuthenticatedCaches(); return true; } catch (e) { console.warn('[NONNA] API indisponível; mantendo Firebase/local.', e); this._backend=null; } }
        if (this.backend === 'firebase') {
            console.log('🔥 DB usando Firebase Realtime Database');
            // Carrega dados iniciais em cache
            // A sessão do Firebase Auth pode ainda estar sendo restaurada neste
            // primeiro ciclo. Dados operacionais protegidos não podem impedir o
            // boot; as telas recarregam após o login.
            try { this._cachePedidos = await DBRemote.getPedidosAsync(); }
            catch (_) { this._cachePedidos = []; }
            try { this._cacheMotoboys = await DBRemote.getMotoboysAsync(); }
            catch (_) { this._cacheMotoboys = []; }
            try { this._cacheConfig = await DBRemote.getConfigAsync(); }
            catch (_) { this._cacheConfig = {}; }
            try { this._cacheCardapio = await DBRemote.getCardapioAsync() || this.CARDAPIO_DEFAULT; }
            catch (_) { this._cacheCardapio = this.CARDAPIO_DEFAULT; }

            // Seeds são apenas de compatibilidade com instalações antigas.
            // Falha de escrita não pode derrubar o boot se o catálogo já foi lido.
            if (!this._cacheConfig.nome) {
                try {
                    await firebase.database().ref('config').set({
                        nome: 'Nonna Pizzaria',
                        endereco: 'Av. Melício Machado, 1060 - Atalaia, Aracaju - SE, 49037-440',
                        whatsapp: '5500900000000',
                        taxaEntrega: 7.00,
                        tempoPreparo: 25,
                        cuponsAtivos: ['NONNA10', 'BEMVINDO', 'FOME10', 'FAMILIA']
                    });
                } catch (seedError) { console.warn('[NONNA] seed config ignorado:', seedError.message); }
            }
            if (this._cacheMotoboys.length === 0) {
                const seed = [
                    { id: 1, nome: 'Carlos Silva', moto: 'Honda CB 500 - Placa ABC-1234', status: 'disponivel', telefone: '16991234567', foto: '👨🏾', lat: -10.9893597, lng: -37.0605839 },
                    { id: 2, nome: 'João Santos', moto: 'Yamaha Fazer 250 - Placa XYZ-9876', status: 'disponivel', telefone: '16997654321', foto: '👨🏼', lat: -10.9893597, lng: -37.0605839 },
                    { id: 3, nome: 'Pedro Costa', moto: 'Honda CG 160 - Placa DEF-5555', status: 'disponivel', telefone: '16996543210', foto: '🧔🏽', lat: -10.9893597, lng: -37.0605839 },
                    { id: 4, nome: 'Lucas Mendes', moto: 'Honda Titan 150 - Placa GHI-7777', status: 'disponivel', telefone: '16995432109', foto: '🧑🏾‍🦱', lat: -10.9893597, lng: -37.0605839 },
                ];
                try { await Promise.all(seed.map(m => firebase.database().ref('motoboys/mb_' + m.id).set(m))); this._cacheMotoboys = seed; }
                catch (seedError) { console.warn('[NONNA] seed motoboys ignorado:', seedError.message); }
            }
            if (!this._cacheCardapio || !this._cacheCardapio.sabores) {
                try {
                    await firebase.database().ref('cardapio').set(this.CARDAPIO_DEFAULT);
                    this._cacheCardapio = this.CARDAPIO_DEFAULT;
                } catch (seedError) {
                    console.warn('[NONNA] seed cardapio ignorado:', seedError.message);
                    // O boot continua para que o perfil operacional possa fazer login;
                    // a tela indicará a falta de dados sincronizados se a leitura continuar bloqueada.
                    this._cacheCardapio = this.CARDAPIO_DEFAULT;
                }
            }
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
        if (this.backend === 'api') return NONNA_API.createOrder({status:'pending',channel:normalizado.canal||'counter',customer:normalizado.cliente||{},items:normalizado.itens||[],subtotal:normalizado.subtotal||0,delivery_fee:normalizado.taxa||0,total:normalizado.total||0,payment:normalizado.pagamento||{}}).then(o=>{const criado=this._normalizeApiOrder(o);this._cachePedidos=[criado,...(this._cachePedidos||[])];this._notify('pedido_novo',criado);return criado;});
        if (this.backend === 'firebase') return DBRemote.addPedido(normalizado).then(async criado => {
            if (typeof DBRemote.registrarAuditoria === 'function') {
                try { await DBRemote.registrarAuditoria({ acao: 'pedido_criado', pedidoId: criado.id, canal: criado.canal, operador: criado.createdBy || 'sistema', valor: criado.total }); } catch (_) {}
            }
            return criado;
        });
        const pedidos = this.getPedidos();
        normalizado.id = Date.now();
        pedidos.unshift(normalizado);
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_novo', normalizado);
        return normalizado;
    },

    updatePedido(id, updates) {
        const patchInput = { ...(updates || {}) };
        // UI-level transition/idempotency guard. Rules must enforce this again server-side.
        if (patchInput.status && typeof NONNA_OPERATIONAL_GUARDS !== 'undefined') {
            const current = this.getPedidos().find(p => String(p.id) === String(id));
            if (current) {
                if (patchInput.status === current.status) return current;
                if (!NONNA_OPERATIONAL_GUARDS.canTransition(current.status, patchInput.status)) {
                    return Promise.reject(new Error(`Transição inválida: ${current.status} → ${patchInput.status}`));
                }
            }
        }
        if (this.backend === 'api') {
            if (!updates?.status) return this.getPedidos().find(p=>String(p.id)===String(id))||null;
            return NONNA_API.updateOrderStatus(id, ({novo:'pending',preparando:'preparing',pronto:'ready',em_entrega:'out_for_delivery',entregue:'delivered',cancelado:'cancelled'}[updates.status]||updates.status)).then(o=>{const pedido=this._normalizeApiOrder(o);const i=this._cachePedidos.findIndex(p=>String(p.id)===String(id));if(i>=0)this._cachePedidos[i]=pedido;this._notify('pedido_update',pedido);return pedido;});
        }
        if (this.backend === 'firebase') {
            return DBRemote.updatePedido(id, updates).then(async pedido => {
                if (!pedido) return null;
                if (updates && ['em_preparo', 'preparando'].includes(updates.status) && typeof DBRemote.baixarEstoquePorPedido === 'function') {
                    try { await DBRemote.baixarEstoquePorPedido(pedido); } catch (e) { console.warn('[NONNA] baixa de estoque não aplicada:', e.message); }
                }
                if (updates && updates.status && typeof DBRemote.registrarAuditoria === 'function') {
                    try { await DBRemote.registrarAuditoria({ acao: 'pedido_status', pedidoId: pedido.id, status: updates.status, operador: updates.createdBy || 'sistema' }); } catch (_) {}
                }
                return pedido;
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
        if (this.backend === 'firebase') {
            // Filtra motoboys sem nome (dados corrompidos) e ordena por ID
            return (this._cacheMotoboys || [])
                .filter(m => m && m.nome)
                .sort((a, b) => (a.id || 0) - (b.id || 0));
        }
        return JSON.parse(localStorage.getItem(this.KEY_MOTOBOYS) || '[]');
    },

    getMotoboy(id) {
        return this.getMotoboys().find(m => String(m.id) === String(id));
    },

    getMotoboyPos(id) {
        const m = this.getMotoboy(id);
        return m && m.pos ? m.pos : (m && m.lat ? { lat: m.lat, lng: m.lng, t: 0 } : null);
    },

    getPedidosMotoboy(motoboyId) {
        return this.getPedidos().filter(p => String(p.motoboyId) === String(motoboyId) && p.status === 'em_entrega');
    },

    updateMotoboy(id, updates) {
        if (this.backend === 'firebase') {
            return firebase.database().ref('motoboys/mb_' + id).update(updates).then(() => {
                this._notify('motoboy_update', { id, ...updates });
                return { id, ...updates };
            });
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
        if (this.backend === 'firebase') return this._cacheCaixa || null;
        try { return JSON.parse(localStorage.getItem('donna_caixa_atual') || 'null'); } catch (_) { return null; }
    },
    abrirCaixa(dados) {
        const abertoEm = new Date().toISOString();
        const caixa = { id: Date.now(), status: 'aberto', operador: dados?.operador || 'Caixa', saldoInicial: Number(dados?.saldoInicial || 0), movimentos: [{id: 'abertura_'+Date.now(), tipo: 'abertura', valor: Number(dados?.saldoInicial || 0), forma: 'dinheiro', operador: dados?.operador || 'Caixa', em: abertoEm}], abertoEm };
        if (this.backend === 'firebase') {
            return firebase.database().ref('caixa/atual').transaction(atual => {
                if (atual && atual.status === 'aberto') return;
                return caixa;
            }).then(result => {
                if (!result.committed) throw new Error('Já existe um caixa aberto.');
                this._cacheCaixa = result.snapshot.val();
                this._notify('caixa_update', this._cacheCaixa);
                return this._cacheCaixa;
            });
        }
        localStorage.setItem('donna_caixa_atual', JSON.stringify(caixa));
        this._cacheCaixa = caixa; this._notify('caixa_update', caixa); return caixa;
    },
    async registrarMovimentoCaixa(movimento) {
        const caixa = this.getCaixaAtual(); if (!caixa || caixa.status !== 'aberto') return null;
        const tipo = String(movimento?.tipo || '').trim().toLowerCase();
        const valor = Number(movimento?.valor);
        if (!['venda', 'sangria', 'suprimento'].includes(tipo) || !Number.isFinite(valor) || valor <= 0) throw new Error('Movimentação inválida: informe tipo e valor positivo.');
        const mov = { id: Date.now(), tipo, valor, forma: movimento.forma || null, observacao: String(movimento.observacao || '').slice(0,240), operador: movimento.operador || caixa.operador, em: new Date().toISOString() };
        if (this.backend === 'firebase') {
            return firebase.database().ref('caixa/atual').transaction(atual => {
                if (!atual || atual.status !== 'aberto') return;
                const movimentos = Array.isArray(atual.movimentos) ? atual.movimentos.slice() : Object.values(atual.movimentos || {});
                movimentos.push(mov);
                return { ...atual, movimentos, atualizadoEm: mov.em };
            }).then(async result => {
                if (!result.committed) throw new Error('O caixa foi fechado ou alterado por outro operador.')
                this._cacheCaixa = result.snapshot.val();
                this._notify('caixa_update', this._cacheCaixa);
                if (typeof DBRemote.registrarAuditoria === 'function') {
                    try { await DBRemote.registrarAuditoria({ acao: 'movimento_caixa', tipo: mov.tipo, valor: mov.valor, forma: mov.forma, operador: mov.operador }); } catch (_) {}
                }
                if (typeof DBRemote.registrarFinanceiro === 'function' && mov.tipo === 'venda') {
                    try { await DBRemote.registrarFinanceiro({ tipo: 'receita', origem: 'caixa', valor: mov.valor, forma: mov.forma, operador: mov.operador, referencia: this._cacheCaixa.id }); } catch (_) {}
                }
                return mov;
            });
        }
        caixa.movimentos = [...(caixa.movimentos || []), mov];
        localStorage.setItem('donna_caixa_atual', JSON.stringify(caixa));
        this._cacheCaixa = caixa; this._notify('caixa_update', caixa); return mov;
    },
    fecharCaixa(dados) {
        const caixa = this.getCaixaAtual(); if (!caixa || caixa.status !== 'aberto') return null;
        const valorContado = Number(dados?.valorContado || 0);
        const fechadoEm = new Date().toISOString();
        if (this.backend === 'firebase') {
            return firebase.database().ref('caixa/atual').transaction(atual => {
                if (!atual || atual.status !== 'aberto') return;
                const movimentos = Array.isArray(atual.movimentos) ? atual.movimentos : Object.values(atual.movimentos || {});
                const esperado = Number(atual.saldoInicial || 0) + movimentos.filter(m => m.tipo === 'venda' && (!m.forma || m.forma === 'dinheiro')).reduce((s,m) => s + Number(m.valor || 0), 0) + movimentos.filter(m => m.tipo === 'suprimento').reduce((s,m) => s + Number(m.valor || 0), 0) - movimentos.filter(m => m.tipo === 'sangria').reduce((s,m) => s + Number(m.valor || 0), 0);
                const diferenca = valorContado - esperado;
                return { ...atual, status: 'fechado', valorEsperado: esperado, valorContado, diferenca, fechadoEm, fechadoPor: dados?.operador || atual.operador, movimentos: [...movimentos, {id: 'fechamento_'+Date.now(), tipo: 'fechamento', valor: valorContado, forma: 'dinheiro', operador: dados?.operador || atual.operador, em: fechadoEm}] };
            }).then(async result => {
                if (!result.committed) throw new Error('O caixa já foi fechado ou alterado por outro operador.');
                this._cacheCaixa = result.snapshot.val();
                await firebase.database().ref('caixa/historico/' + this._cacheCaixa.id).set(this._cacheCaixa);
                this._notify('caixa_update', this._cacheCaixa);
                if (typeof DBRemote.registrarAuditoria === 'function') {
                    try { await DBRemote.registrarAuditoria({ acao: 'fechamento_caixa', caixaId: this._cacheCaixa.id, operador: this._cacheCaixa.fechadoPor, valorContado: this._cacheCaixa.valorContado }); } catch (_) {}
                }
                return this._cacheCaixa;
            });
        }
        const fechado = { ...caixa, status: 'fechado', valorContado, fechadoEm, fechadoPor: dados?.operador || caixa.operador, movimentos: [...(caixa.movimentos || []), {id: 'fechamento_'+Date.now(), tipo: 'fechamento', valor: valorContado, forma: 'dinheiro', operador: dados?.operador || caixa.operador, em: fechadoEm}] };
        const movimentos = fechado.movimentos.filter(m => m.tipo === 'venda' && (!m.forma || m.forma === 'dinheiro')).reduce((s,m) => s + Number(m.valor || 0), 0);
        const suprimentos = fechado.movimentos.filter(m => m.tipo === 'suprimento').reduce((s,m) => s + Number(m.valor || 0), 0);
        const sangrias = fechado.movimentos.filter(m => m.tipo === 'sangria').reduce((s,m) => s + Number(m.valor || 0), 0);
        fechado.valorEsperado = Number(caixa.saldoInicial || 0) + movimentos + suprimentos - sangrias;
        fechado.diferenca = valorContado - fechado.valorEsperado;
        localStorage.setItem('donna_caixa_atual', JSON.stringify(fechado));
        const historico = (()=>{try{return JSON.parse(localStorage.getItem('donna_caixa_historico')||'[]')}catch(_){return []}})();
        historico.unshift(fechado); localStorage.setItem('donna_caixa_historico', JSON.stringify(historico.slice(0,365)));
        this._cacheCaixa = fechado; this._notify('caixa_update', fechado); return fechado;
    },

    _notify(tipo, data) {
        window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
    }
};

// Exposição explícita para páginas e ferramentas de diagnóstico.
window.DB = DB;
