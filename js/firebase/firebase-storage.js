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

    addPedido(pedido) {
        pedido.id = Date.now();
        pedido.criadoEm = new Date().toISOString();
        pedido.status = 'novo';
        pedido.motoboyId = null;
        pedido.rota = null;
        this._ref('pedidos/' + pedido.id).set(pedido);
        this._notify('pedido_novo', pedido);
        return pedido;
    },

    updatePedido(id, updates) {
        this._ref('pedidos/' + id).update(updates);
        // Notifica com o pedido completo
        this._ref('pedidos/' + id).once('value', snap => {
            const p = snap.val();
            if (p) this._notify('pedido_update', p);
        });
    },

    getPedidosCliente(telefone) {
        return new Promise(resolve => {
            const tel = (telefone || '').replace(/\D/g, '');
            this._ref('pedidos').orderByChild('clienteTelIndex').equalTo(tel).once('value', snap => {
                const val = snap.val() || {};
                const arr = Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
                resolve(arr);
            });
        });
    },

    // === MOTOBOYS ===
    getMotoboysAsync() {
        return this._ref('motoboys').once('value').then(snap => {
            const val = snap.val() || {};
            return Object.values(val);
        });
    },

    getMotoboyAsync(id) {
        return this._ref('motoboys/' + id).once('value').then(snap => snap.val());
    },

    updateMotoboyPos(id, lat, lng) {
        const pos = { lat, lng, t: Date.now() };
        // Salva em DOIS caminhos: pos (com timestamp) e lat/lng direto (pra ler fácil)
        this._ref('motoboys/' + id).update({ lat, lng, pos });
    },

    // === TRACKING em tempo real ===
    // Listener que dispara toda vez que a posição de QUALQUER motoboy muda
    onMotoboyChange(id, callback) {
        this._ref('motoboys/' + id).on('value', snap => {
            callback(snap.val());
        });
    },

    offMotoboyChange(id) {
        this._ref('motoboys/' + id).off();
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
