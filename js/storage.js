/* ============================================
   STORAGE — Banco de dados compartilhado
   Usa localStorage pra simular backend em tempo real
   Todos os módulos (cliente/pizzaria/motoboy) leem e escrevem aqui
   ============================================ */

const DB = {
    KEY_PEDIDOS: 'donna_pedidos',
    KEY_MOTOBOYS: 'donna_motoboys',
    KEY_CONFIG: 'donna_config',

    init() {
        if (!localStorage.getItem(this.KEY_PEDIDOS)) {
            localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEY_MOTOBOYS)) {
            localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify([
                { id: 1, nome: 'Carlos Silva', moto: 'Honda CB 500 - Placa ABC-1234', status: 'disponivel', telefone: '16991234567', foto: '👨🏾' },
                { id: 2, nome: 'João Santos', moto: 'Yamaha Fazer 250 - Placa XYZ-9876', status: 'disponivel', telefone: '16997654321', foto: '👨🏼' },
                { id: 3, nome: 'Pedro Costa', moto: 'Honda CG 160 - Placa DEF-5555', status: 'disponivel', telefone: '16996543210', foto: '🧔🏽' },
            ]));
        }
        if (!localStorage.getItem(this.KEY_CONFIG)) {
            localStorage.setItem(this.KEY_CONFIG, JSON.stringify({
                nome: 'Donna Pizza',
                endereco: 'Rua Principal, 123 - Centro, Pé de Serra - BA',
                whatsapp: '5500900000000',
                taxaEntrega: 7.00,
                tempoPreparo: 25,
                cuponsAtivos: ['DONNA10', 'BEMVINDO', 'FOME10']
            }));
        }
    },

    // === PEDIDOS ===
    getPedidos() {
        return JSON.parse(localStorage.getItem(this.KEY_PEDIDOS) || '[]');
    },

    addPedido(pedido) {
        const pedidos = this.getPedidos();
        pedido.id = Date.now();
        pedido.criadoEm = new Date().toISOString();
        pedido.status = 'novo'; // novo | preparando | pronto | em_entrega | entregue | cancelado
        pedido.motoboyId = null;
        pedido.rota = null;
        pedidos.unshift(pedido);
        localStorage.setItem(this.KEY_PEDIDOS, JSON.stringify(pedidos));
        this._notify('pedido_novo', pedido);
        return pedido;
    },

    updatePedido(id, updates) {
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

    // === MOTOBOYS ===
    getMotoboys() {
        return JSON.parse(localStorage.getItem(this.KEY_MOTOBOYS) || '[]');
    },

    getMotoboy(id) {
        return this.getMotoboys().find(m => m.id === id);
    },

    updateMotoboy(id, updates) {
        const motoboys = this.getMotoboys();
        const idx = motoboys.findIndex(m => m.id === id);
        if (idx >= 0) {
            motoboys[idx] = { ...motoboys[idx], ...updates };
            localStorage.setItem(this.KEY_MOTOBOYS, JSON.stringify(motoboys));
            this._notify('motoboy_update', motoboys[idx]);
        }
    },

    // === CONFIG ===
    getConfig() {
        return JSON.parse(localStorage.getItem(this.KEY_CONFIG) || '{}');
    },

    updateConfig(updates) {
        const config = { ...this.getConfig(), ...updates };
        localStorage.setItem(this.KEY_CONFIG, JSON.stringify(config));
        return config;
    },

    // === NOTIFICAÇÃO (evento customizado) ===
    _notify(tipo, data) {
        window.dispatchEvent(new CustomEvent('donna_db_change', { detail: { tipo, data } }));
    },

    // Escutar mudanças em tempo real
    onChange(callback) {
        window.addEventListener('donna_db_change', (e) => callback(e.detail));
        // Escutar mudanças em outras abas
        window.addEventListener('storage', (e) => {
            if (e.key === this.KEY_PEDIDOS || e.key === this.KEY_MOTOBOYS) {
                callback({ tipo: 'storage_update', data: null });
            }
        });
    },

    // === MÉTRICAS (para o dashboard da pizzaria) ===
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
    }
};

// Inicializa automaticamente quando o script carrega
DB.init();
