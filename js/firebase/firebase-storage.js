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
            const arr = Object.values(val).sort((a, b) => {
                const bt = Date.parse(b.criadoEm || b.createdAt || b.updatedAt || '') || Number(b.id) || 0;
                const at = Date.parse(a.criadoEm || a.createdAt || a.updatedAt || '') || Number(a.id) || 0;
                return bt - at;
            });
            callback(arr);
        });
    },

    // Versão promise (pra usar com await)
    async getPedidosAsync() {
        const snap = await this._ref('pedidos').once('value');
        const val = snap.val() || {};
        return Object.values(val).sort((a, b) => new Date(b.criadoEm || b.createdAt || 0).getTime() - new Date(a.criadoEm || a.createdAt || 0).getTime());
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

    async addPedido(pedido) {
        const normalizado = this._normalizarPedido(pedido);
        const key = this._ref('pedidos').push().key;
        normalizado.id = key;
        normalizado.firebaseKey = key;
        await this._ref('pedidos/' + key).set(normalizado);
        this._notify('pedido_novo', normalizado);
        return normalizado;
    },

    async _resolvePedidoRef(id) {
        const direct = this._ref('pedidos/' + id);
        const directSnap = await direct.once('value');
        if (directSnap.exists()) return direct;
        const snap = await this._ref('pedidos').orderByChild('id').equalTo(id).once('value');
        const val = snap.val() || {};
        const key = Object.keys(val)[0];
        return key ? this._ref('pedidos/' + key) : null;
    },

    updatePedido(id, updates) {
        return this._resolvePedidoRef(id).then(ref => {
            if (!ref) return null;
            return ref.once('value').then(snap => {
            const anterior = snap.val();
            if (!anterior) return null;
            const agora = new Date().toISOString();
            const patch = { ...(updates || {}), updatedAt: agora };
            const mudouStatus = patch.status && patch.status !== anterior.status;
            if (mudouStatus) {
                const evento = this._evento(patch.status, { evento: patch.status === 'cancelado' ? 'pedido_cancelado' : 'status_alterado', motivoCancelamento: patch.motivoCancelamento || null, createdBy: patch.createdBy || 'sistema' });
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
        });
    },

    registrarEventoPedido(id, evento, dados) {
        const nome = typeof evento === 'string' ? evento : ((evento || {}).evento || 'evento');
        const extra = typeof evento === 'object' ? evento : (dados || {});
        return this._resolvePedidoRef(id).then(ref => {
            if (!ref) return null;
            return ref.once('value').then(snap => {
            const p = snap.val();
            if (!p) return null;
            const item = this._evento(extra.status || p.status, { ...extra, evento: nome });
            const eventRef = ref.child('timeline').push();
            return eventRef.set(item).then(() => {
                return ref.update({ updatedAt: item.em }).then(() => {
                    this._notify('pedido_update', { ...p, updatedAt: item.em });
                    return item;
                });
            });
            });
        });
    },

    atualizarStatusPedido(id, status, dados) {
        return this.updatePedido(id, { ...(dados || {}), status });
    },

    cancelarPedido(id, motivo, dados) {
        const razao = String(motivo || '').trim();
        if (!razao) return null;
        return this.atualizarStatusPedido(id, 'cancelado', { ...(dados || {}), motivoCancelamento: razao, canceladoEm: new Date().toISOString() });
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
                )).sort((a, b) => (Date.parse(b.criadoEm || b.createdAt || '') || Number(b.id) || 0) - (Date.parse(a.criadoEm || a.createdAt || '') || Number(a.id) || 0));
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
        // Salva em DOIS caminhos: pos (com timestamp) e lat/lng direto (pra ler fácil).
        return this._ref('motoboys/' + this._motoboyKey(id)).update({ lat, lng, pos });
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
        this._resolvePedidoRef(id).then(ref => {
            if (!ref) return;
            ref.on('value', snap => callback(snap.val()));
        });
    },

    offPedidoChange(id) {
        this._ref('pedidos/' + id).off();
    },

    onAllPedidosChange(callback) {
        this._ref('pedidos').on('value', snap => {
            const val = snap.val() || {};
            const arr = Object.values(val).sort((a, b) => (Date.parse(b.criadoEm || b.createdAt || '') || Number(b.id) || 0) - (Date.parse(a.criadoEm || a.createdAt || '') || Number(a.id) || 0));
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

    // === ESTOQUE / FICHA TÉCNICA / FINANCEIRO / AUDITORIA ===
    async getEstoqueAsync() {
        const snap = await this._ref('gestao/estoque').once('value');
        return Object.values(snap.val() || {});
    },
    async salvarEstoque(item) {
        const id = item.id || ('stk_' + Date.now());
        const novo = { ...item, id, atualizado: new Date().toISOString() };
        await this._ref('gestao/estoque/' + id).set(novo);
        return novo;
    },
    async movimentarEstoque(stockId, movimento) {
        const ref = this._ref('gestao/estoque/' + stockId);
        const movRef = this._ref('gestao/movimentacoes').push();
        const agora = new Date().toISOString();
        let resultado = null;
        const tx = await ref.transaction(atual => {
            if (!atual) return;
            const qtd = Number(movimento.quantidade || 0);
            if (!Number.isFinite(qtd) || qtd <= 0) return;
            const delta = movimento.tipo === 'saida' ? -qtd : qtd;
            const saldo = Number(atual.saldo || 0) + delta;
            if (saldo < 0) return;
            resultado = { ...atual, saldo, atualizado: agora };
            return resultado;
        });
        if (!tx.committed || !resultado) throw new Error('Movimentação de estoque não pôde ser aplicada.');
        await movRef.set({ id: movRef.key, stockId, ...movimento, em: agora });
        return resultado;
    },
    async getFichasTecnicasAsync() {
        const snap = await this._ref('gestao/fichasTecnicas').once('value');
        return snap.val() || {};
    },
    async salvarFichaTecnica(produtoId, ficha) {
        const data = { produtoId, ...ficha, atualizado: new Date().toISOString() };
        await this._ref('gestao/fichasTecnicas/' + produtoId).set(data);
        return data;
    },
    async baixarEstoquePorPedido(pedido) {
        if (!pedido || pedido.estoqueBaixadoEm || !Array.isArray(pedido.itens)) return { aplicado: false };
        // Claim once before decrementing stock: concurrent status updates cannot
        // consume the same order twice. This is a safeguard, not authorization.
        const pedidoRef = await this._resolvePedidoRef(pedido.id);
        if (!pedidoRef) return { aplicado: false };
        const claim = await pedidoRef.child('estoqueBaixaEmAndamento').transaction(v => v ? undefined : new Date().toISOString());
        if (!claim.committed) return { aplicado: false, duplicada: true };
        try {
        const fichas = await this.getFichasTecnicasAsync();
        const movimentos = [];
        for (const item of pedido.itens) {
            const ficha = fichas[item.id];
            if (!ficha || !Array.isArray(ficha.insumos)) continue;
            for (const insumo of ficha.insumos) {
                const qtd = Number(insumo.quantidade || 0) * Number(item.quantidade || item.qtd || 1);
                if (qtd > 0) {
                    await this.movimentarEstoque(insumo.stockId, { tipo: 'saida', quantidade: qtd, observacao: `Consumo do pedido ${pedido.id}`, origem: 'pedido', pedidoId: pedido.id });
                    movimentos.push({ stockId: insumo.stockId, quantidade: qtd });
                }
            }
        }
        if (movimentos.length) {
            await pedidoRef.update({ estoqueBaixadoEm: new Date().toISOString(), estoqueMovimentos: movimentos, estoqueBaixaEmAndamento: null });
        } else {
            // No technical sheet was found; allow a later configured retry.
            await pedidoRef.child('estoqueBaixaEmAndamento').remove();
        }
        return { aplicado: movimentos.length > 0, movimentos };
        } catch (error) {
            try { await pedidoRef.child('estoqueBaixaEmAndamento').remove(); } catch (_) {}
            throw error;
        }
    },
    async registrarFinanceiro(transacao) {
        const ref = this._ref('gestao/financeiro').push();
        const data = { id: ref.key, criadoEm: new Date().toISOString(), status: 'registrado', ...transacao };
        await ref.set(data);
        return data;
    },
    async registrarAuditoria(evento) {
        const ref = this._ref('gestao/auditoria').push();
        const data = { id: ref.key, em: new Date().toISOString(), ...evento };
        await ref.set(data);
        return data;
    },

    // === NOTIFICAÇÃO local ===
    _notify(tipo, data) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
        }
    }
};

// Exposição explícita para o bootloader e diagnóstico.
window.DBRemote = DBRemote;
