/* ============================================
   FIREBASE STORAGE — Implementação remota do DB
   Mesma API do storage.js (localStorage), mas usa Firebase Realtime DB
   Funciona entre múltiplos dispositivos/celulares em tempo real

   v2 — CORREÇÕES:
   - Mantém o _id original no objeto do pedido (NÃO usa key Firebase como ID)
   - Salva pedidos usando o próprio id como key Firebase
   - updatePedido busca a key Firebase correta via _idMap
   - onAllPedidosChange retorna o id original e a key
   ============================================ */

const DBRemote = {
    // === PEDIDOS ===
    _ref(path) { return firebase.database().ref(path); },

    // Mapa id -> key Firebase (pra achar o path certo no update)
    _idMap: new Map(),

    getPedidos(callback) {
        this._ref('pedidos').once('value', snap => {
            const val = snap.val() || {};
            this._syncIdMap(val);
            const arr = Object.entries(val).map(([key, p]) => ({ ...p, _firebaseKey: key }));
            arr.sort(this._sortPedidos);
            callback(arr);
        });
    },

    // Versão promise (pra usar com await)
    async getPedidosAsync() {
        const snap = await this._ref('pedidos').once('value');
        const val = snap.val() || {};
        this._syncIdMap(val);
        const arr = Object.entries(val).map(([key, p]) => ({ ...p, _firebaseKey: key }));
        arr.sort(this._sortPedidos);
        return arr;
    },

    // Sync mapa id -> key Firebase
    _syncIdMap(val) {
        this._idMap = new Map();
        Object.entries(val).forEach(([key, p]) => {
            if (p && p.id != null) {
                this._idMap.set(String(p.id), key);
            }
        });
    },

    // Sort seguro: trata id como número quando possível
    _sortPedidos(a, b) {
        const aId = typeof a.id === 'number' ? a.id : parseInt(a.id) || 0;
        const bId = typeof b.id === 'number' ? b.id : parseInt(b.id) || 0;
        return bId - aId;
    },

    addPedido(pedido) {
        pedido.id = pedido.id || Date.now();
        pedido.criadoEm = pedido.criadoEm || new Date().toISOString();
        pedido.status = pedido.status || 'novo';
        pedido.motoboyId = pedido.motoboyId || null;
        pedido.rota = pedido.rota || null;
        // USA O PRÓPRIO ID COMO KEY (consistência com updatePedido)
        this._ref('pedidos/' + pedido.id).set(pedido);
        this._idMap.set(String(pedido.id), String(pedido.id));
        this._notify('pedido_novo', pedido);
        return pedido;
    },

    updatePedido(id, updates) {
        const idStr = String(id);
        // Primeiro tenta achar pela key Firebase (caso exista)
        let key = this._idMap.get(idStr);
        // Se não tem, tenta usar o próprio id (assumindo que foi salvo com id como key)
        if (!key) {
            key = idStr;
        }
        // Validação: se updates tem id, mantém
        const safeUpdates = { ...updates };
        this._ref('pedidos/' + key).update(safeUpdates);
        // Atualiza o mapa com a key
        this._idMap.set(idStr, key);
        // Notifica com o pedido completo
        this._ref('pedidos/' + key).once('value', snap => {
            const p = snap.val();
            if (p) {
                this._notify('pedido_update', p);
            }
        });
    },

    getPedidosCliente(telefone) {
        return new Promise(resolve => {
            const tel = (telefone || '').replace(/\D/g, '');
            this._ref('pedidos').orderByChild('clienteTelIndex').equalTo(tel).once('value', snap => {
                const val = snap.val() || {};
                const arr = Object.values(val).map(p => ({ ...p }));
                arr.sort(this._sortPedidos);
                resolve(arr);
            });
        });
    },

    // === MOTOBOYS ===
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
        this._ref('motoboys/' + this._motoboyKey(id)).update({ lat, lng, pos });
    },

    // === TRACKING em tempo real ===
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
        const idStr = String(id);
        const key = this._idMap.get(idStr) || idStr;
        this._ref('pedidos/' + key).on('value', snap => {
            callback(snap.val());
        });
    },

    offPedidoChange(id) {
        const idStr = String(id);
        const key = this._idMap.get(idStr) || idStr;
        this._ref('pedidos/' + key).off();
    },

    onAllPedidosChange(callback) {
        this._ref('pedidos').on('value', snap => {
            const val = snap.val() || {};
            this._syncIdMap(val);
            const arr = Object.entries(val).map(([key, p]) => ({ ...p, _firebaseKey: key }));
            arr.sort(this._sortPedidos);
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
