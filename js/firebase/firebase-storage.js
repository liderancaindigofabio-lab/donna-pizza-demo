/* ============================================
   FIREBASE STORAGE — Implementação remota do DB
   Mesma API do storage.js (localStorage), mas usa Firebase Realtime DB
   Funciona entre múltiplos dispositivos/celulares em tempo real
   ============================================ */

const DBRemote = {
    // === PEDIDOS ===
    _ref(path) { return firebase.database().ref(path); },

    getPedidos(callback) {
        this._ref('pedidos').once('value', snap => {
            const val = snap.val() || {};
            const arr = Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
            callback(arr);
        });
    },

    // Versão promise (pra usar com await)
    async getPedidosAsync() {
        const snap = await this._ref('pedidos').once('value');
        const val = snap.val() || {};
        return Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
    },

    _normalizarPedido(pedido) {
        const p = { ...(pedido || {}) };
        const ts = new Date().toISOString();
        const origem = p.origem || p.canal || 'cliente';
        p.origem = origem;
        p.canal = p.canal || origem;
        p.clienteTelIndex = p.clienteTelIndex || (p.cliente && p.cliente.tel ? String(p.cliente.tel).replace(/\D/g, '') : '');
        p.createdBy = p.createdBy || (origem === 'salao' ? 'garcom' : origem);
        p.status = p.status || 'novo';
        ['subtotal', 'taxa', 'desconto', 'total'].forEach(k => { p[k] = p[k] == null || Number.isNaN(Number(p[k])) ? 0 : Number(p[k]); });
        p.criadoEm = p.criadoEm || p.createdAt || ts;
        p.createdAt = p.createdAt || p.criadoEm;
        p.updatedAt = p.updatedAt || p.criadoEm;
        if (!Array.isArray(p.timeline) || !p.timeline.length) p.timeline = [{ evento: 'pedido_criado', status: p.status, em: p.criadoEm, createdAt: p.criadoEm, createdBy: p.createdBy }];
        if (p.motoboyId === undefined) p.motoboyId = null;
        if (p.rota === undefined) p.rota = null;
        return p;
    },

    _evento(status, dados) {
        const agora = new Date().toISOString();
        return { ...(dados || {}), evento: (dados && dados.evento) || 'status_alterado', status: status || (dados && dados.status) || null, em: (dados && dados.em) || agora, createdAt: (dados && dados.createdAt) || agora, createdBy: (dados && dados.createdBy) || 'sistema' };
    },

    addPedido(pedido) {
        const normalizado = this._normalizarPedido(pedido);
        normalizado.id = Date.now();
        this._ref('pedidos/' + normalizado.id).set(normalizado);
        this._notify('pedido_novo', normalizado);
        return normalizado;
    },

    updatePedido(id, updates) {
        const ref = this._ref('pedidos/' + id);
        return ref.once('value').then(snap => {
            const anterior = snap.val();
            if (!anterior) return null;
            const agora = new Date().toISOString();
            const patch = { ...(updates || {}), updatedAt: agora };
            const mudouStatus = patch.status && patch.status !== anterior.status;
            if (mudouStatus) {
                const evento = this._evento(patch.status, { evento: 'status_alterado' });
                // Timeline é um mapa no Firebase: push evita colisões entre dispositivos.
                const eventoRef = ref.child('timeline').push();
                patch['timeline/' + eventoRef.key] = evento;
            }
            return ref.update(patch).then(() => ref.once('value')).then(finalSnap => {
                const p = finalSnap.val();
                if (p) this._notify('pedido_update', p);
                return p;
            });
        });
    },

    registrarEventoPedido(id, evento, dados) {
        const nome = typeof evento === 'string' ? evento : ((evento || {}).evento || 'evento');
        const extra = typeof evento === 'object' ? evento : (dados || {});
        return this._ref('pedidos/' + id).once('value').then(snap => {
            const p = snap.val();
            if (!p) return null;
            const item = this._evento(extra.status || p.status, { ...extra, evento: nome });
            const eventRef = this._ref('pedidos/' + id + '/timeline').push();
            return eventRef.set(item).then(() => {
                return this._ref('pedidos/' + id).update({ updatedAt: item.em }).then(() => {
                    this._notify('pedido_update', { ...p, updatedAt: item.em });
                    return item;
                });
            });
        });
    },

    atualizarStatusPedido(id, status, dados) {
        return this.updatePedido(id, { ...(dados || {}), status });
    },

    getPedidosCliente(telefone) {
        return new Promise(resolve => {
            const tel = (telefone || '').replace(/\D/g, '');
            // Lê a coleção para manter compatibilidade com pedidos legados que
            // ainda não possuem clienteTelIndex.
            this._ref('pedidos').once('value', snap => {
                const val = snap.val() || {};
                const arr = Object.values(val).filter(p => p && (
                    p.clienteTelIndex === tel ||
                    (p.cliente && p.cliente.tel && String(p.cliente.tel).replace(/\D/g, '') === tel)
                )).sort((a, b) => (b.id || 0) - (a.id || 0));
                resolve(arr);
            });
        });
    },

    // === MOTOBOYS ===
    // Converte ID numérico (1, 2, 3) em chave Firebase ("mb_1", "mb_2", "mb_3")
    // Necessário porque chaves numéricas viram arrays no Firebase
    _motoboyKey(id) { return 'mb_' + id; },

    getMotoboysAsync() {
        return this._ref('motoboys').once('value').then(snap => {
            const val = snap.val() || {};
            return Object.values(val);
        });
    },

    getMotoboyAsync(id) {
        return this._ref('motoboys/' + this._motoboyKey(id)).once('value').then(snap => snap.val());
    },

    updateMotoboyPos(id, lat, lng) {
        const pos = { lat, lng, t: Date.now() };
        // Salva em DOIS caminhos: pos (com timestamp) e lat/lng direto (pra ler fácil)
        this._ref('motoboys/' + this._motoboyKey(id)).update({ lat, lng, pos });
    },

    // === TRACKING em tempo real ===
    // Listener que dispara toda vez que a posição de QUALQUER motoboy muda
    onMotoboyChange(id, callback) {
        this._ref('motoboys/' + this._motoboyKey(id)).on('value', snap => {
            callback(snap.val());
        });
    },

    offMotoboyChange(id) {
        this._ref('motoboys/' + this._motoboyKey(id)).off();
    },

    // === PEDIDOS em tempo real ===
    onPedidoChange(id, callback) {
        this._ref('pedidos/' + id).on('value', snap => {
            callback(snap.val());
        });
    },

    offPedidoChange(id) {
        this._ref('pedidos/' + id).off();
    },

    onAllPedidosChange(callback) {
        this._ref('pedidos').on('value', snap => {
            const val = snap.val() || {};
            const arr = Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
            callback(arr);
        });
    },

    // === CONFIG ===
    getConfigAsync() {
        return this._ref('config').once('value').then(snap => snap.val() || {});
    },

    // === CARDÁPIO ===
    getCardapioAsync() {
        return this._ref('cardapio').once('value').then(snap => snap.val());
    },

    // === CLIENTES ===
    getClienteAsync(telefone) {
        const tel = (telefone || '').replace(/\D/g, '');
        return this._ref('clientes/' + tel).once('value').then(snap => snap.val());
    },

    salvarCliente(dados) {
        if (!dados || !dados.tel) return Promise.resolve(null);
        const tel = dados.tel.replace(/\D/g, '');
        return this._ref('clientes/' + tel).once('value').then(snap => {
            const existente = snap.val() || {};
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
            this._ref('clientes/' + tel).set(novo);
            this._notify('cliente_update', novo);
            return novo;
        });
    },

    // === NOTIFICAÇÃO local ===
    _notify(tipo, data) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
        }
    }
};
