/* ============================================
   DONNA PIZZA — Painel de gestão
   ============================================ */

let filtroStatus = 'novo';
let pedidoSelecionado = null;
let motoboySelecionado = null;

// ===== INIT =====
function init() {
    renderRelogio();
    setInterval(renderRelogio, 1000);
    renderFila();
    renderMetricas();
    renderContadores();

    // Escutar mudanças no "banco"
    DB.onChange(({ tipo, data }) => {
        if (tipo === 'pedido_novo') {
            notificar(`🍕 Novo pedido de ${data.cliente.nome}!`, 'success');
            tocarSom();
        }
        renderFila();
        renderMetricas();
        renderContadores();
    });
}

function renderRelogio() {
    const agora = new Date();
    document.getElementById('relogio').textContent =
        agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===== FILA =====
function renderFila() {
    const container = document.getElementById('filaPedidos');
    let pedidos = DB.getPedidos();

    if (filtroStatus !== 'todos') {
        pedidos = pedidos.filter(p => p.status === filtroStatus);
    }

    if (pedidos.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">${filtroStatus === 'novo' ? '📭' : '🔍'}</div>
            <h3>${filtroStatus === 'novo' ? 'Aguardando pedidos...' : 'Nenhum pedido nesse status'}</h3>
            <p>${filtroStatus === 'novo' ? 'Quando um cliente fizer um pedido, ele aparece aqui em tempo real.' : 'Mude o filtro acima para ver outros pedidos.'}</p>
        </div>`;
        return;
    }

    container.innerHTML = pedidos.map(p => renderPedidoCard(p)).join('');
}

function renderPedidoCard(p) {
    const minutos = Math.floor((Date.now() - new Date(p.criadoEm).getTime()) / 60000);
    const hora = new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const statusLabel = {
        novo: 'NOVO',
        preparando: 'PREPARANDO',
        pronto: 'PRONTO',
        em_entrega: 'EM ENTREGA',
        entregue: 'ENTREGUE',
        cancelado: 'CANCELADO',
    }[p.status] || p.status.toUpperCase();

    const itensHtml = p.itens.map(it => `
        <div class="pedido-item">
            <span class="item-nome">${it.nome} (${it.tipo})${it.detalhe ? ' • ' + it.detalhe : ''}</span>
            <span class="item-preco">${BRL(it.preco)}</span>
        </div>
    `).join('');

    let actionsHtml = '';
    if (p.status === 'novo') {
        actionsHtml = `
            <button class="btn-acao" onclick="aceitarPedido(${p.id})">✓ Aceitar</button>
            <button class="btn-acao whatsapp" onclick="contatarCliente('${p.cliente.tel}')" title="WhatsApp">📱</button>
            <button class="btn-acao cancelar" onclick="cancelarPedido(${p.id})" title="Cancelar">✕</button>
        `;
    } else if (p.status === 'preparando') {
        actionsHtml = `
            <button class="btn-acao" onclick="marcarPronto(${p.id})">🍕 Marcar como pronto</button>
            <button class="btn-acao whatsapp" onclick="contatarCliente('${p.cliente.tel}')">📱</button>
        `;
    } else if (p.status === 'pronto') {
        actionsHtml = `
            <button class="btn-acao motoboy" onclick="abrirDespacho(${p.id})">🛵 Despachar motoboy</button>
            <button class="btn-acao whatsapp" onclick="contatarCliente('${p.cliente.tel}')">📱</button>
        `;
    } else if (p.status === 'em_entrega') {
        const motoboy = DB.getMotoboy(p.motoboyId);
        actionsHtml = `
            <button class="btn-acao" onclick="marcarEntregue(${p.id})">✅ Marcar como entregue</button>
            <button class="btn-acao whatsapp" onclick="contatarMotoboy('${motoboy ? motoboy.telefone : ''}')">🛵</button>
        `;
    } else if (p.status === 'entregue') {
        actionsHtml = `<button class="btn-acao entregue" disabled>✓ Pedido finalizado</button>`;
    }

    let motoboyInfo = '';
    if (p.motoboyId && p.status === 'em_entrega') {
        const motoboy = DB.getMotoboy(p.motoboyId);
        if (motoboy) {
            motoboyInfo = `
            <div class="pedido-motoboy-info">
                🛵 <strong>${motoboy.nome}</strong> • ${motoboy.moto}
            </div>`;
        }
    }

    return `
    <div class="pedido-card ${p.status}">
        <div class="pedido-card-header">
            <div>
                <div class="pedido-id">#${p.id.toString().slice(-5)}</div>
                <div class="pedido-hora">${hora} • há ${minutos} min</div>
            </div>
            <span class="pedido-status-badge ${p.status}">${statusLabel}</span>
        </div>

        <div class="pedido-cliente">
            <div class="cliente-nome">${p.cliente.nome}</div>
            <div class="cliente-endereco">📍 ${p.cliente.end}${p.cliente.cep ? ` • CEP ${p.cliente.cep}` : ''}</div>
            <a class="cliente-tel" href="https://wa.me/55${p.cliente.tel.replace(/\D/g, '')}" target="_blank">📞 ${p.cliente.tel}</a>
        </div>

        <div class="pedido-itens">
            ${itensHtml}
        </div>

        ${p.cliente.obs ? `<div class="peduto-obs"><strong>Obs:</strong> ${p.cliente.obs}</div>` : ''}

        ${motoboyInfo}

        <div class="pedido-total">
            <span class="total-label">${p.cliente.pag}</span>
            <span class="total-valor">${BRL(p.total)}</span>
        </div>

        <div class="pedido-actions">
            ${actionsHtml}
        </div>
    </div>
    `;
}

function filtrarStatus(status) {
    filtroStatus = status;
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    renderFila();
}

// ===== AÇÕES =====
function aceitarPedido(id) {
    DB.updatePedido(id, { status: 'preparando' });
    notificar('✅ Pedido aceito!', 'success');
    tocarSom('ok');
}

function marcarPronto(id) {
    DB.updatePedido(id, { status: 'pronto' });
    notificar('🍕 Pizza pronta! Despache um motoboy', 'success');
    filtrarStatus('pronto');
}

function marcarEntregue(id) {
    DB.updatePedido(id, { status: 'entregue' });
    notificar('🎉 Pedido entregue!', 'success');
    // Libera o motoboy
    const pedido = DB.getPedidos().find(p => p.id === id);
    if (pedido && pedido.motoboyId) {
        DB.updateMotoboy(pedido.motoboyId, { status: 'disponivel' });
    }
    renderContadores();
}

function cancelarPedido(id) {
    if (!confirm('Cancelar este pedido?')) return;
    DB.updatePedido(id, { status: 'cancelado' });
    notificar('❌ Pedido cancelado', 'error');
}

// ===== DESPACHO DE MOTOBOY =====
function abrirDespacho(pedidoId) {
    pedidoSelecionado = pedidoId;
    motoboySelecionado = null;
    const pedido = DB.getPedidos().find(p => p.id === pedidoId);

    const motoboys = DB.getMotoboys();
    const motoboysHtml = motoboys.map(m => {
        const ind = m.status !== 'disponivel';
        return `
        <div class="motoboy-card ${ind ? 'indisponivel' : ''}" onclick="${ind ? '' : `selecionarMotoboy(${m.id})`}" data-motoboy="${m.id}">
            <div class="motoboy-avatar">${m.foto}</div>
            <div class="motoboy-info">
                <div class="motoboy-nome">${m.nome}</div>
                <div class="motoboy-moto">${m.moto}</div>
                <div class="motoboy-moto">📞 ${m.telefone}</div>
            </div>
            <span class="motoboy-status-tag ${m.status}">${m.status === 'disponivel' ? 'Disponível' : 'Em entrega'}</span>
        </div>
        `;
    }).join('');

    document.getElementById('despachoBody').innerHTML = `
        <div class="despacho-info-pedido">
            <h4>📦 Pedido #${pedido.id.toString().slice(-5)}</h4>
            <p><strong>Cliente:</strong> ${pedido.cliente.nome}</p>
            <p><strong>Endereço:</strong> ${pedido.cliente.end}</p>
            <p><strong>Itens:</strong> ${pedido.itens.length} ${pedido.itens.length === 1 ? 'item' : 'itens'}</p>
            <p><strong>Total:</strong> ${BRL(pedido.total)}</p>
        </div>
        <h4 style="color:var(--gold);margin-bottom:10px;">Escolha o motoboy:</h4>
        ${motoboysHtml}
        <button class="btn-despachar" id="btnConfirmarDespacho" disabled onclick="confirmarDespacho()">
            🛵 Despachar
        </button>
    `;
    document.getElementById('modalDespacho').style.display = 'flex';
}

function selecionarMotoboy(id) {
    motoboySelecionado = id;
    document.querySelectorAll('.motoboy-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-motoboy="${id}"]`).classList.add('selected');
    document.getElementById('btnConfirmarDespacho').disabled = false;
}

function confirmarDespacho() {
    if (!pedidoSelecionado || !motoboySelecionado) return;
    DB.updatePedido(pedidoSelecionado, {
        status: 'em_entrega',
        motoboyId: motoboySelecionado,
    });
    DB.updateMotoboy(motoboySelecionado, { status: 'entregando' });
    const motoboy = DB.getMotoboy(motoboySelecionado);
    notificar(`🛵 Despachado para ${motoboy.nome}!`, 'success');
    fecharDespacho();
    filtrarStatus('em_entrega');
}

function fecharDespacho() {
    document.getElementById('modalDespacho').style.display = 'none';
    pedidoSelecionado = null;
    motoboySelecionado = null;
}

// ===== DETALHES =====
function abrirDetalhes(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    document.getElementById('detalhesTitulo').textContent = `Pedido #${p.id.toString().slice(-5)}`;
    document.getElementById('detalhesBody').innerHTML = renderPedidoCard(p);
    document.getElementById('modalDetalhes').style.display = 'flex';
}

function fecharDetalhes() {
    document.getElementById('modalDetalhes').style.display = 'none';
}

// ===== WHATSAPP =====
function contatarCliente(tel) {
    const clean = tel.replace(/\D/g, '');
    window.open(`https://wa.me/55${clean}`, '_blank');
}

function contatarMotoboy(tel) {
    const clean = tel.replace(/\D/g, '');
    window.open(`https://wa.me/55${clean}`, '_blank');
}

// ===== MÉTRICAS =====
function renderMetricas() {
    const m = DB.getMetricasHoje();
    document.getElementById('metTotal').textContent = m.total;
    document.getElementById('metFat').textContent = BRL(m.faturamento);
    document.getElementById('metAndamento').textContent = m.emAndamento;
    document.getElementById('metTicket').textContent = BRL(m.ticketMedio);
}

function renderContadores() {
    const m = DB.getMetricasHoje();
    document.getElementById('cnt-novo').textContent = m.porStatus.novo;
    document.getElementById('cnt-preparando').textContent = m.porStatus.preparando;
    document.getElementById('cnt-pronto').textContent = m.porStatus.pronto;
    document.getElementById('cnt-em_entrega').textContent = m.porStatus.em_entrega;
}

// ===== CONFIG =====
function abrirConfig() {
    const c = DB.getConfig();
    document.getElementById('cfgNome').value = c.nome;
    document.getElementById('cfgEnd').value = c.endereco;
    document.getElementById('cfgZap').value = c.whatsapp;
    document.getElementById('cfgTaxa').value = c.taxaEntrega;
    document.getElementById('modalConfig').style.display = 'flex';
}

function fecharConfig() {
    document.getElementById('modalConfig').style.display = 'none';
}

function salvarConfig() {
    DB.updateConfig({
        nome: document.getElementById('cfgNome').value,
        endereco: document.getElementById('cfgEnd').value,
        whatsapp: document.getElementById('cfgZap').value,
        taxaEntrega: parseFloat(document.getElementById('cfgTaxa').value) || 0,
    });
    notificar('⚙️ Configurações salvas!', 'success');
    fecharConfig();
}

function limparDados() {
    if (!confirm('Apagar TODOS os pedidos? Isso não pode ser desfeito.')) return;
    localStorage.setItem('donna_pedidos', JSON.stringify([]));
    notificar('🗑️ Pedidos limpos!', 'success');
    renderFila();
    renderMetricas();
    renderContadores();
    fecharConfig();
}

// ===== NOTIFICAÇÃO =====
function notificar(texto, tipo = '') {
    const container = document.getElementById('notificacaoContainer');
    const el = document.createElement('div');
    el.className = 'notificacao ' + tipo;
    el.textContent = texto;
    container.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// ===== SOM =====
function tocarSom(tipo = 'novo') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = tipo === 'novo' ? 800 : 600;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignora */ }
}

// ===== UTIL =====
const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

document.addEventListener('DOMContentLoaded', init);
