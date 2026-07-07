/* ============================================
   NONNA PIZZARIA — Painel de gestão v2
   - Abas: Pedidos + Cardápio
   - Card de cliente clicável (mostra histórico)
   - Mostrar motoboy em todos os status
   ============================================ */

let filtroStatus = 'novo';
let pedidoSelecionado = null;
let motoboySelecionado = null;
let abaAtiva = 'pedidos';

// Coordenadas da pizzaria (Atalaia - Aracaju/SE)
// Av. Melício Machado, 1060 - Atalaia, Aracaju - SE, 49037-440
const PIZZARIA_COORDS = [-10.9893597, -37.0605839];

function gerarCoordsAleatorias() {
    const lat = PIZZARIA_COORDS[0] + (Math.random() - 0.5) * 0.06;
    const lng = PIZZARIA_COORDS[1] + (Math.random() - 0.5) * 0.06;
    return { lat, lng };
}

function calcularDistanciaHaversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== INIT =====
function init() {
    renderRelogio();
    setInterval(renderRelogio, 1000);
    renderFila();
    renderMetricas();
    renderContadores();

    DB.onChange(({ tipo, data }) => {
        if (tipo === 'pedido_novo') {
            notificar(`🍕 Novo pedido de ${data.cliente.nome}!`, 'success');
            tocarSom();
        }
        if (tipo === 'cardapio_update' && abaAtiva === 'cardapio') {
            renderEditorCardapio();
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

// ===== ABAS =====
function trocarAba(aba) {
    abaAtiva = aba;
    document.querySelectorAll('.nav-aba').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-aba="${aba}"]`).classList.add('active');
    document.getElementById('abaPedidos').style.display = aba === 'pedidos' ? 'block' : 'none';
    document.getElementById('abaCardapio').style.display = aba === 'cardapio' ? 'block' : 'none';
    if (aba === 'cardapio') renderEditorCardapio();
}

// ===== FILA DE PEDIDOS =====
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

    const itensHtml = p.itens.map(it => {
        let detalhe = '';
        if (it.sabores && it.sabores.length) {
            detalhe = '🍕 ' + it.sabores.join(' + ');
        } else if (it.descricao) {
            detalhe = it.descricao;
        }
        if (it.adicionais && it.adicionais.length) {
            detalhe += (detalhe ? ' • ' : '') + '➕ ' + it.adicionais.join(', ');
        }
        return `
        <div class="pedido-item">
            <span class="item-nome">${it.nome}${detalhe ? ' <span class="item-detalhe">— ' + detalhe + '</span>' : ''}</span>
            <span class="item-preco">${BRL(it.preco)}</span>
        </div>`;
    }).join('');

    // Mostra motoboy em qualquer status onde já foi despachado
    let motoboyInfo = '';
    if (p.motoboyId) {
        const motoboy = DB.getMotoboy(p.motoboyId);
        if (motoboy) {
            const entregueEm = p.entregueEm ? new Date(p.entregueEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
            const acaoEntrega = entregueEm ? ` • Entregue às ${entregueEm}` : '';
            motoboyInfo = `
            <div class="pedido-motoboy-info">
                🛵 <strong>${motoboy.nome}</strong> • ${motoboy.moto}${acaoEntrega}
            </div>`;
        }
    }

    // Cliente: total de pedidos + total gasto (se histórico)
    const tel = (p.cliente.tel || '').replace(/\D/g, '');
    const stats = tel ? DB.getEstatisticasCliente(tel) : null;
    let clienteHistorico = '';
    if (stats && stats.total > 1) {
        clienteHistorico = `
        <button class="cliente-historico-btn" onclick="abrirCliente('${p.cliente.tel}')" title="Ver histórico">
            🏆 ${stats.total}º pedido • ${BRL(stats.gastoTotal)} total
        </button>`;
    } else if (stats && stats.total === 1) {
        clienteHistorico = `<span class="cliente-historico-tag">🆕 Cliente novo</span>`;
    }

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
            <button class="btn-acao" onclick="abrirMapaRota(${p.id})">🗺️ Acompanhar rota</button>
            <button class="btn-acao" onclick="marcarEntregue(${p.id})">✅ Entregue</button>
            ${motoboy ? `<button class="btn-acao whatsapp" onclick="contatarMotoboy('${motoboy.telefone}')">🛵</button>` : ''}
        `;
    } else if (p.status === 'entregue') {
        actionsHtml = `<button class="btn-acao entregue" disabled>✓ Pedido finalizado</button>`;
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
            ${clienteHistorico}
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

// ============ MAPA DE ROTA EM TEMPO REAL ============
let mapaPizzaria = null;
let markerMotoboyPizzaria = null;
let markersEntregasPizzaria = [];
let rotaLayerPizzaria = null;
let rotaHistoricoLayer = null;
let rotaFuturoLayer = null;
let rotaTimerPizzaria = null;

function abrirMapaRota(pedidoId) {
    const pedido = DB.getPedidos().find(p => p.id === pedidoId);
    if (!pedido) return;
    const motoboyId = pedido.motoboyId;
    if (!motoboyId) { notificar('Pedido sem motoboy', 'warning'); return; }

    document.getElementById('modalMapaRota').style.display = 'flex';
    document.getElementById('mapaRotaPedidoId').textContent = pedidoId;

    setTimeout(() => {
        if (!mapaPizzaria) {
            mapaPizzaria = L.map('mapaRotaPizzaria', {
                zoomControl: true,
                attributionControl: false
            }).setView(PIZZARIA_COORDS, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapaPizzaria);
        } else {
            mapaPizzaria.invalidateSize();
        }
        atualizarMapaRotaPizzaria();
        if (rotaTimerPizzaria) clearInterval(rotaTimerPizzaria);
        rotaTimerPizzaria = setInterval(atualizarMapaRotaPizzaria, 3000);
    }, 200);
}

function atualizarMapaRotaPizzaria() {
    if (!mapaPizzaria) return;
    const pedidosEmEntrega = DB.getPedidos().filter(p => p.status === 'em_entrega');
    if (pedidosEmEntrega.length === 0) {
        document.getElementById('mapaRotaInfo').innerHTML =
            '<div class="mapa-rota-info-linha" style="text-align:center;color:#999;">Nenhuma entrega ativa no momento</div>';
        return;
    }

    const pedidoId = parseInt(document.getElementById('mapaRotaPedidoId').textContent);
    const pedidoAtual = pedidosEmEntrega.find(p => p.id === pedidoId) || pedidosEmEntrega[0];
    const motoboyId = pedidoAtual.motoboyId;
    const motoboy = DB.getMotoboy(motoboyId);

    // Limpa markers antigos (mas NAO o motoboy marker, pra animar)
    markersEntregasPizzaria.forEach(m => mapaPizzaria.removeLayer(m));
    markersEntregasPizzaria = [];
    if (rotaLayerPizzaria) { mapaPizzaria.removeLayer(rotaLayerPizzaria); rotaLayerPizzaria = null; }
    if (rotaFuturoLayer) { mapaPizzaria.removeLayer(rotaFuturoLayer); rotaFuturoLayer = null; }
    if (rotaHistoricoLayer) { mapaPizzaria.removeLayer(rotaHistoricoLayer); rotaHistoricoLayer = null; }

    // Marker da pizzaria
    const pizzaIcon = L.divIcon({
        html: '<div class="mapa-icon-pizzaria">P</div>',
        className: 'mapa-icon-wrapper',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
    L.marker(PIZZARIA_COORDS, { icon: pizzaIcon, zIndexOffset: 500 })
        .addTo(mapaPizzaria)
        .bindPopup('<b>Nonna Pizzaria</b><br>Ponto de partida e retorno');

    // Posicao atual do motoboy (do storage, em tempo real)
    const pos = DB.getMotoboyPos(motoboyId);
    const mbPos = pos ? [pos.lat, pos.lng] : PIZZARIA_COORDS;
    const mbIcon = L.divIcon({
        html: '<div class="mapa-icon-motoboy">M</div>',
        className: 'mapa-icon-wrapper',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
    });
    if (!markerMotoboyPizzaria) {
        markerMotoboyPizzaria = L.marker(mbPos, { icon: mbIcon, zIndexOffset: 1000 })
            .addTo(mapaPizzaria);
    } else {
        // ANIMACAO SUAVE: o marker se move com transicao
        markerMotoboyPizzaria.setLatLng(mbPos, { animate: true, duration: 2 });
    }

    // Calcula tempo desde a ultima atualizacao
    const t = pos ? Math.max(0, Math.round((Date.now() - pos.t) / 1000)) : 0;
    const tempoStr = t < 60 ? 'ha ' + t + 's' : 'ha ' + Math.floor(t/60) + 'min';
    markerMotoboyPizzaria.bindPopup(
        '<b>' + (motoboy?.nome || 'Motoboy') + '</b><br>' +
        'Atualizado ' + tempoStr + '<br>' +
        '<small>Lat: ' + mbPos[0].toFixed(5) + '<br>Lng: ' + mbPos[1].toFixed(5) + '</small>'
    );

    // Marcadores dos clientes
    const clienteIcon = L.divIcon({
        html: '<div class="mapa-icon-cliente">C</div>',
        className: 'mapa-icon-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
    const allCoords = [PIZZARIA_COORDS, mbPos];
    pedidosEmEntrega.forEach((p, idx) => {
        const c = p.coords || gerarCoordsAleatorias();
        p.coords = c;
        const m = L.marker([c.lat, c.lng], { icon: clienteIcon })
            .addTo(mapaPizzaria);
        m.bindPopup(
            '<b>Pedido #' + p.id.toString().slice(-5) + '</b><br>' +
            p.cliente.nome + '<br>' +
            (p.cliente.endereco || 'Sem endereco') + '<br>' +
            '<small>' + BRL(p.total) + ' - ' + p.cliente.pag + '</small>'
        );
        markersEntregasPizzaria.push(m);
        allCoords.push([c.lat, c.lng]);
    });

    // Calcula rota otimizada
    const pedidos = pedidosEmEntrega.map(p => ({ ...p, coords: p.coords || gerarCoordsAleatorias() }));
    const ordenados = vizinhoMaisProximoRota(mbPos, pedidos);

    // ENCONTRA O INDICE DO PEDIDO ATUAL na rota otimizada
    const idxAtual = ordenados.findIndex(p => p.id === pedidoId);

    // TRACOS:
    // 1. Linha HISTORICO (cinza) - pizzaria ate posicao atual
    rotaHistoricoLayer = L.polyline([PIZZARIA_COORDS, mbPos], {
        color: '#999',
        weight: 3,
        opacity: 0.6,
        dashArray: '4, 8',
    }).addTo(mapaPizzaria);

    // 2. Linha FUTURO (verde) - do motoboy ate todas as entregas em ordem
    const waypointsFuturo = [mbPos, ...ordenados.map(o => [o.coords.lat, o.coords.lng])];
    rotaFuturoLayer = L.polyline(waypointsFuturo, {
        color: '#3D5C3A',
        weight: 5,
        opacity: 0.85,
    }).addTo(mapaPizzaria);

    // 3. Numeros nos pontos de entrega (ordem de visita)
    ordenados.forEach((p, i) => {
        const numIcon = L.divIcon({
            html: '<div class="mapa-icon-ordem">' + (i + 1) + '</div>',
            className: 'mapa-icon-wrapper',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
        L.marker([p.coords.lat, p.coords.lng], { icon: numIcon, zIndexOffset: 200 })
            .addTo(mapaPizzaria);
    });

    // Calculo de distancia e ETA
    const kmTotal = calcularDistanciaTotalRota(waypointsFuturo);

    // ETA ate o pedido atual (distancia do motoboy ate o pedido na rota)
    let kmAteAqui = 0;
    let prox = mbPos;
    for (let i = 0; i <= idxAtual; i++) {
        const d = calcularDistanciaHaversine(prox[0], prox[1], ordenados[i].coords.lat, ordenados[i].coords.lng);
        kmAteAqui += d;
        prox = [ordenados[i].coords.lat, ordenados[i].coords.lng];
    }
    // Se o pedido atual e o primeiro (idx 0), kmAteAqui ja ta pronto
    if (idxAtual === 0) {
        kmAteAqui = calcularDistanciaHaversine(mbPos[0], mbPos[1], ordenados[0].coords.lat, ordenados[0].coords.lng);
    } else if (idxAtual > 0) {
        kmAteAqui = 0;
        let p = mbPos;
        for (let i = 0; i <= idxAtual; i++) {
            kmAteAqui += calcularDistanciaHaversine(p[0], p[1], ordenados[i].coords.lat, ordenados[i].coords.lng);
            p = [ordenados[i].coords.lat, ordenados[i].coords.lng];
        }
    }
    const etaAtual = Math.round(kmAteAqui * 3);
    const etaTotal = Math.round(kmTotal * 3);

    document.getElementById('mapaRotaInfo').innerHTML =
        '<div class="mapa-rota-info-linha"><span class="info-label">Motoboy</span><span class="info-valor">' + (motoboy?.nome || '-') + '</span></div>' +
        '<div class="mapa-rota-info-linha"><span class="info-label">Entregas</span><span class="info-valor">' + pedidosEmEntrega.length + ' ativas</span></div>' +
        '<div class="mapa-rota-info-linha destaque"><span class="info-label">ETA deste pedido</span><span class="info-valor-grande">~' + etaAtual + ' min</span></div>' +
        '<div class="mapa-rota-info-linha"><span class="info-label">Distancia ate cliente</span><span class="info-valor">' + kmAteAqui.toFixed(1) + ' km</span></div>' +
        '<div class="mapa-rota-info-linha"><span class="info-label">Rota total</span><span class="info-valor">' + kmTotal.toFixed(1) + ' km / ~' + etaTotal + ' min</span></div>' +
        '<div class="mapa-rota-info-ordem">' +
        '<div class="info-ordem-titulo">ORDEM DE ENTREGA</div>' +
        ordenados.map((p, i) => '<div class="info-ordem-item' + (i === idxAtual ? ' ativo' : '') + '"><span class="ordem-num">' + (i+1) + '</span><span>' + p.cliente.nome + '</span></div>').join('') +
        '</div>';

    // Ajusta o zoom pra mostrar tudo
    if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        mapaPizzaria.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
}

function vizinhoMaisProximoRota(origem, pedidos) {
    if (!pedidos.length) return [];
    const restantes = [...pedidos];
    const rota = [];
    let atual = typeof origem.lat === 'number' ? origem : { lat: origem[0], lng: origem[1] };
    while (restantes.length > 0) {
        let menorDist = Infinity;
        let idxProx = 0;
        for (let i = 0; i < restantes.length; i++) {
            const c = restantes[i].coords;
            const d = calcularDistanciaHaversine(atual.lat, atual.lng, c.lat, c.lng);
            if (d < menorDist) { menorDist = d; idxProx = i; }
        }
        const prox = restantes.splice(idxProx, 1)[0];
        prox.distancia = menorDist;
        rota.push(prox);
        atual = L.latLng(prox.coords.lat, prox.coords.lng);
    }
    return rota;
}

function calcularDistanciaTotalRota(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += calcularDistanciaHaversine(points[i-1][0], points[i-1][1], points[i][0], points[i][1]);
    }
    return total;
}

function calcularRotaOSRMPizzaria(points) {
    if (points.length < 2) return;
    if (rotaLayerPizzaria) mapaPizzaria.removeLayer(rotaLayerPizzaria);
    rotaLayerPizzaria = L.polyline(points, {
        color: '#3D5C3A',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 8',
    }).addTo(mapaPizzaria);
}

function fecharMapaRota() {
    document.getElementById('modalMapaRota').style.display = 'none';
    if (rotaTimerPizzaria) { clearInterval(rotaTimerPizzaria); rotaTimerPizzaria = null; }
}

function marcarEntregue(id) {
    DB.updatePedido(id, { status: 'entregue', entregueEm: new Date().toISOString() });
    const pedido = DB.getPedidos().find(p => p.id === id);
    if (pedido && pedido.motoboyId) {
        const restantes = DB.getPedidosMotoboy(pedido.motoboyId);
        if (restantes.length === 0) {
            DB.updateMotoboy(pedido.motoboyId, { status: 'disponivel' });
        }
    }
    notificar('🎉 Pedido entregue!', 'success');
    renderContadores();
}

function cancelarPedido(id) {
    if (!confirm('Cancelar este pedido?')) return;
    DB.updatePedido(id, { status: 'cancelado' });
    notificar('❌ Pedido cancelado', 'error');
}

// ===== DESPACHO =====
function abrirDespacho(pedidoId) {
    pedidoSelecionado = pedidoId;
    motoboySelecionado = null;
    const pedido = DB.getPedidos().find(p => p.id === pedidoId);

    const motoboys = DB.getMotoboys();
    const motoboysHtml = motoboys.map(m => {
        const emRota = DB.getPedidosMotoboy(m.id);
        const qtdRota = emRota.length;
        const isDisponivel = m.status === 'disponivel';
        return `
        <div class="motoboy-card ${!isDisponivel && qtdRota === 0 ? 'indisponivel' : ''}" onclick="${qtdRota === 0 && !isDisponivel ? '' : `selecionarMotoboy(${m.id})`}" data-motoboy="${m.id}">
            <div class="motoboy-avatar">${m.foto}</div>
            <div class="motoboy-info">
                <div class="motoboy-nome">${m.nome}</div>
                <div class="motoboy-moto">${m.moto}</div>
                <div class="motoboy-moto">📞 ${m.telefone}</div>
                ${qtdRota > 0 ? `<div class="motoboy-carga">📦 ${qtdRota} entrega${qtdRota > 1 ? 's' : ''} em rota</div>` : ''}
            </div>
            <span class="motoboy-status-tag ${m.status}">${
                m.status === 'disponivel' ? 'Disponível' :
                qtdRota > 0 ? `🛵 Em rota (${qtdRota})` : 'Em entrega'
            }</span>
        </div>
        `;
    }).join('');

    const temMotoboyEmRota = motoboys.some(m => DB.getPedidosMotoboy(m.id).length > 0);
    const dicaAcumular = temMotoboyEmRota ? `
        <div class="dica-acumular">
            💡 <strong>Dica:</strong> motoboys com entregas em rota podem receber mais pedidos — o sistema calcula a melhor ordem automaticamente!
        </div>
    ` : '';

    document.getElementById('despachoBody').innerHTML = `
        ${dicaAcumular}
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
    const qtdRota = DB.getPedidosMotoboy(motoboySelecionado).length;
    const msg = qtdRota > 1
        ? `🛵 ${qtdRota} entregas em rota com ${motoboy.nome}!`
        : `🛵 Despachado para ${motoboy.nome}!`;
    notificar(msg, 'success');
    fecharDespacho();
    filtrarStatus('em_entrega');
}

function fecharDespacho() {
    document.getElementById('modalDespacho').style.display = 'none';
    pedidoSelecionado = null;
    motoboySelecionado = null;
}

// ===== DETALHES DO CLIENTE =====
function abrirCliente(telefone) {
    const stats = DB.getEstatisticasCliente(telefone);
    const cliente = DB.getCliente(telefone);
    const pedidos = DB.getPedidosCliente(telefone);

    document.getElementById('clienteTitulo').textContent = `👤 ${cliente ? cliente.nome : 'Cliente'}`;

    document.getElementById('clienteBody').innerHTML = `
        <div class="cliente-detalhes-stats">
            <div class="cli-stat">
                <div class="cli-stat-num">${stats.total}</div>
                <div class="cli-stat-label">Total de pedidos</div>
            </div>
            <div class="cli-stat">
                <div class="cli-stat-num">${stats.entregues}</div>
                <div class="cli-stat-label">Entregues</div>
            </div>
            <div class="cli-stat">
                <div class="cli-stat-num">${BRL(stats.gastoTotal)}</div>
                <div class="cli-stat-label">Gasto total</div>
            </div>
            <div class="cli-stat">
                <div class="cli-stat-num">${BRL(stats.ticketMedio)}</div>
                <div class="cli-stat-label">Ticket médio</div>
            </div>
        </div>

        <div class="cliente-detalhes-info">
            <p><strong>📞 Telefone:</strong> <a href="https://wa.me/55${(cliente?.tel || telefone).replace(/\D/g, '')}" target="_blank">${cliente?.tel || telefone}</a></p>
            <p><strong>📍 Endereço:</strong> ${cliente?.end || '(não informado)'}</p>
            <p><strong>📅 Primeiro pedido:</strong> ${cliente?.primeiroPedido ? new Date(cliente.primeiroPedido).toLocaleDateString('pt-BR') : '-'}</p>
            <p><strong>📅 Último pedido:</strong> ${cliente?.ultimoPedido ? new Date(cliente.ultimoPedido).toLocaleDateString('pt-BR') : '-'}</p>
        </div>

        <h3 style="color:var(--gold);font-family:'Playfair Display',serif;margin:18px 0 10px;">📦 Histórico de pedidos</h3>
        <div class="cliente-historico-lista">
            ${pedidos.length === 0 ? '<p style="color:var(--gray);text-align:center;padding:20px;">Nenhum pedido ainda</p>' :
                pedidos.map(p => {
                    const statusLabel = {
                        novo: { txt: 'Recebido', cor: 'novo' },
                        preparando: { txt: 'Preparando', cor: 'preparando' },
                        pronto: { txt: 'Pronto', cor: 'pronto' },
                        em_entrega: { txt: 'A caminho', cor: 'entrega' },
                        entregue: { txt: 'Entregue', cor: 'entregue' },
                        cancelado: { txt: 'Cancelado', cor: 'cancelado' },
                    }[p.status] || { txt: p.status, cor: '' };
                    const motoboy = p.motoboyId ? DB.getMotoboy(p.motoboyId) : null;
                    const itensResumo = p.itens.map(i => i.nome.split(' (')[0]).join(', ');
                    return `
                    <div class="cliente-historico-item">
                        <div class="chi-header">
                            <span class="chi-id">#${p.id.toString().slice(-5)}</span>
                            <span class="mpi-status ${statusLabel.cor}">${statusLabel.txt}</span>
                            <span class="chi-data">${new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="chi-itens">${itensResumo}</div>
                        <div class="chi-footer">
                            <span class="chi-valor">${BRL(p.total)}</span>
                            ${motoboy ? `<span class="chi-motoboy">🛵 ${motoboy.nome}</span>` : ''}
                        </div>
                    </div>`;
                }).join('')
            }
        </div>
    `;
    document.getElementById('modalCliente').style.display = 'flex';
}

function fecharCliente() {
    document.getElementById('modalCliente').style.display = 'none';
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

// ============================================
// EDITOR DE CARDÁPIO
// ============================================
function renderEditorCardapio() {
    const c = DB.getCardapio();
    document.getElementById('editorTamanhos').innerHTML = renderEditorTamanhos(c.tamanhos);
    document.getElementById('editorSabores').innerHTML = renderEditorSabores(c.sabores, c.precos_base, c.tamanhos);
    document.getElementById('editorAdicionais').innerHTML = renderEditorAdicionais(c.adicionais, c.tamanhos);
    document.getElementById('editorCalzones').innerHTML = renderEditorCalzones(c.calzones);
    document.getElementById('editorBebidas').innerHTML = renderEditorBebidas(c.bebidas);
    document.getElementById('editorCombos').innerHTML = renderEditorCombos(c.combos);
    document.getElementById('editorCupons').innerHTML = renderEditorCupons(c.cupons);
}

function renderEditorTamanhos(tamanhos) {
    return tamanhos.map((t, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">${t.nome} (${t.id})</span>
            <button class="btn-mini ghost" onclick="removerTamanho(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label>Nome <input type="text" value="${t.nome}" onchange="atualizarTamanho(${i}, 'nome', this.value)"></label>
            <label>Fatias <input type="number" value="${t.fatias}" onchange="atualizarTamanho(${i}, 'fatias', +this.value)"></label>
            <label>Qtd sabores <input type="number" min="1" max="3" value="${t.qtdSabores}" onchange="atualizarTamanho(${i}, 'qtdSabores', +this.value)"></label>
        </div>
    </div>`).join('');
}

function renderEditorSabores(sabores, precos, tamanhos) {
    return sabores.map((s, i) => {
        const p = precos[s.id] || { P: 0, M: 0, G: 0 };
        return `
        <div class="editor-item editor-sabor">
            <div class="ei-header">
                <span class="ei-titulo">${s.emoji} ${s.nome}</span>
                <div>
                    <select onchange="atualizarSabor(${i}, 'cat', this.value)" class="ei-select">
                        <option value="salgada" ${s.cat === 'salgada' ? 'selected' : ''}>Salgada</option>
                        <option value="doce" ${s.cat === 'doce' ? 'selected' : ''}>Doce</option>
                    </select>
                    <button class="btn-mini ghost" onclick="removerSabor(${i})">🗑️</button>
                </div>
            </div>
            <div class="ei-campos">
                <label class="full">Nome <input type="text" value="${s.nome}" onchange="atualizarSabor(${i}, 'nome', this.value)"></label>
                <label class="full">Descrição <input type="text" value="${s.desc}" onchange="atualizarSabor(${i}, 'desc', this.value)"></label>
                ${tamanhos.map(t => `
                    <label>${t.id} R$ <input type="number" step="0.50" value="${p[t.id] || 0}" onchange="atualizarPrecoSabor('${s.id}', '${t.id}', +this.value)"></label>
                `).join('')}
            </div>
        </div>`;
    }).join('');
}

function renderEditorAdicionais(adicionais, tamanhos) {
    return adicionais.map((a, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">${a.nome}</span>
            <button class="btn-mini ghost" onclick="removerAdicional(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label class="full">Nome <input type="text" value="${a.nome}" onchange="atualizarAdicional(${i}, 'nome', this.value)"></label>
            ${tamanhos.map(t => `
                <label>${t.id} R$ <input type="number" step="0.50" value="${a.preco[t.id] || 0}" onchange="atualizarAdicionalPreco(${i}, '${t.id}', +this.value)"></label>
            `).join('')}
        </div>
    </div>`).join('');
}

function renderEditorCalzones(calzones) {
    return calzones.map((c, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">🥟 ${c.nome}</span>
            <button class="btn-mini ghost" onclick="removerCalzone(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label class="full">Nome <input type="text" value="${c.nome}" onchange="atualizarCalzone(${i}, 'nome', this.value)"></label>
            <label class="full">Descrição <input type="text" value="${c.desc}" onchange="atualizarCalzone(${i}, 'desc', this.value)"></label>
            <label>Preço R$ <input type="number" step="0.50" value="${c.preco}" onchange="atualizarCalzone(${i}, 'preco', +this.value)"></label>
        </div>
    </div>`).join('');
}

function renderEditorBebidas(bebidas) {
    return bebidas.map((b, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">${b.emoji} ${b.nome}</span>
            <button class="btn-mini ghost" onclick="removerBebida(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label class="full">Nome <input type="text" value="${b.nome}" onchange="atualizarBebida(${i}, 'nome', this.value)"></label>
            <label>Emoji <input type="text" value="${b.emoji}" onchange="atualizarBebida(${i}, 'emoji', this.value)"></label>
            <label>Preço R$ <input type="number" step="0.50" value="${b.preco}" onchange="atualizarBebida(${i}, 'preco', +this.value)"></label>
        </div>
    </div>`).join('');
}

function renderEditorCombos(combos) {
    return combos.map((c, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">${c.emoji} ${c.nome}</span>
            <button class="btn-mini ghost" onclick="removerCombo(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label class="full">Nome <input type="text" value="${c.nome}" onchange="atualizarCombo(${i}, 'nome', this.value)"></label>
            <label class="full">Descrição <input type="text" value="${c.desc}" onchange="atualizarCombo(${i}, 'desc', this.value)"></label>
            <label>Emoji <input type="text" value="${c.emoji}" onchange="atualizarCombo(${i}, 'emoji', this.value)"></label>
            <label>Preço R$ <input type="number" step="0.50" value="${c.preco}" onchange="atualizarCombo(${i}, 'preco', +this.value)"></label>
        </div>
    </div>`).join('');
}

function renderEditorCupons(cupons) {
    return cupons.map((c, i) => `
    <div class="editor-item">
        <div class="ei-header">
            <span class="ei-titulo">🎟️ ${c.codigo} — ${c.desc}</span>
            <button class="btn-mini ghost" onclick="removerCupom(${i})">🗑️</button>
        </div>
        <div class="ei-campos">
            <label>Código <input type="text" value="${c.codigo}" onchange="atualizarCupom(${i}, 'codigo', this.value.toUpperCase())"></label>
            <label class="full">Descrição <input type="text" value="${c.desc}" onchange="atualizarCupom(${i}, 'desc', this.value)"></label>
            <label>Tipo
                <select onchange="atualizarCupom(${i}, 'tipo', this.value)">
                    <option value="percentual" ${c.tipo === 'percentual' ? 'selected' : ''}>% Percentual</option>
                    <option value="fixo" ${c.tipo === 'fixo' ? 'selected' : ''}>R$ Fixo</option>
                </select>
            </label>
            <label>Valor <input type="number" step="1" value="${c.valor}" onchange="atualizarCupom(${i}, 'valor', +this.value)"></label>
        </div>
    </div>`).join('');
}

// ----- Atualizadores (mutam o cardápio no storage) -----
function getCardapioFresh() {
    return JSON.parse(JSON.stringify(DB.getCardapio()));
}
function salvarCardapio(c) {
    DB.updateCardapio(c);
}

function atualizarTamanho(i, campo, valor) {
    const c = getCardapioFresh();
    c.tamanhos[i][campo] = valor;
    salvarCardapio(c);
    renderEditorCardapio();
}
function removerTamanho(i) {
    if (!confirm('Remover este tamanho?')) return;
    const c = getCardapioFresh();
    c.tamanhos.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarTamanho() {
    const c = getCardapioFresh();
    c.tamanhos.push({ id: 'X' + (c.tamanhos.length + 1), nome: 'Novo tamanho', qtdSabores: 1, fatias: 6 });
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarSabor(i, campo, valor) {
    const c = getCardapioFresh();
    c.sabores[i][campo] = valor;
    salvarCardapio(c);
}
function atualizarPrecoSabor(saborId, tamanho, valor) {
    const c = getCardapioFresh();
    if (!c.precos_base[saborId]) c.precos_base[saborId] = { P: 0, M: 0, G: 0 };
    c.precos_base[saborId][tamanho] = valor;
    salvarCardapio(c);
}
function removerSabor(i) {
    if (!confirm('Remover este sabor?')) return;
    const c = getCardapioFresh();
    const id = c.sabores[i].id;
    c.sabores.splice(i, 1);
    delete c.precos_base[id];
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarSabor() {
    const c = getCardapioFresh();
    const id = 'sabor_' + Date.now();
    c.sabores.push({ id, nome: 'Novo sabor', cat: 'salgada', desc: '', emoji: '🍕' });
    c.precos_base[id] = { P: 25, M: 38, G: 48 };
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarAdicional(i, campo, valor) {
    const c = getCardapioFresh();
    c.adicionais[i][campo] = valor;
    salvarCardapio(c);
}
function atualizarAdicionalPreco(i, tamanho, valor) {
    const c = getCardapioFresh();
    if (!c.adicionais[i].preco) c.adicionais[i].preco = {};
    c.adicionais[i].preco[tamanho] = valor;
    salvarCardapio(c);
}
function removerAdicional(i) {
    if (!confirm('Remover este adicional?')) return;
    const c = getCardapioFresh();
    c.adicionais.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarAdicional() {
    const c = getCardapioFresh();
    c.adicionais.push({ id: 'adic_' + Date.now(), nome: 'Novo adicional', preco: { P: 5, M: 7, G: 9 } });
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarCalzone(i, campo, valor) {
    const c = getCardapioFresh();
    c.calzones[i][campo] = valor;
    salvarCardapio(c);
}
function removerCalzone(i) {
    if (!confirm('Remover este calzone?')) return;
    const c = getCardapioFresh();
    c.calzones.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarCalzone() {
    const c = getCardapioFresh();
    c.calzones.push({ id: 'cal_' + Date.now(), nome: 'Novo calzone', desc: '', preco: 28 });
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarBebida(i, campo, valor) {
    const c = getCardapioFresh();
    c.bebidas[i][campo] = valor;
    salvarCardapio(c);
}
function removerBebida(i) {
    if (!confirm('Remover esta bebida?')) return;
    const c = getCardapioFresh();
    c.bebidas.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarBebida() {
    const c = getCardapioFresh();
    c.bebidas.push({ id: 'beb_' + Date.now(), nome: 'Nova bebida', preco: 5, emoji: '🥤' });
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarCombo(i, campo, valor) {
    const c = getCardapioFresh();
    c.combos[i][campo] = valor;
    salvarCardapio(c);
}
function removerCombo(i) {
    if (!confirm('Remover este combo?')) return;
    const c = getCardapioFresh();
    c.combos.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarCombo() {
    const c = getCardapioFresh();
    c.combos.push({ id: 'combo_' + Date.now(), nome: 'Novo combo', desc: '', preco: 50, emoji: '🎁' });
    salvarCardapio(c);
    renderEditorCardapio();
}

function atualizarCupom(i, campo, valor) {
    const c = getCardapioFresh();
    c.cupons[i][campo] = valor;
    salvarCardapio(c);
}
function removerCupom(i) {
    if (!confirm('Remover este cupom?')) return;
    const c = getCardapioFresh();
    c.cupons.splice(i, 1);
    salvarCardapio(c);
    renderEditorCardapio();
}
function adicionarCupom() {
    const c = getCardapioFresh();
    c.cupons.push({ codigo: 'NOVO' + Date.now().toString().slice(-4), desc: 'Novo cupom', tipo: 'percentual', valor: 10 });
    salvarCardapio(c);
    renderEditorCardapio();
}

function resetarCardapio() {
    if (!confirm('Resetar o cardápio pro padrão? Suas edições serão perdidas.')) return;
    DB.resetCardapio();
    renderEditorCardapio();
    notificar('↺ Cardápio resetado!', 'success');
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
function fecharConfig() { document.getElementById('modalConfig').style.display = 'none'; }
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
    if (!confirm('Apagar TODOS os pedidos, clientes e cardápio customizado?')) return;
    localStorage.setItem('donna_pedidos', JSON.stringify([]));
    localStorage.setItem('donna_clientes', JSON.stringify({}));
    localStorage.removeItem('donna_cardapio');
    DB.init();
    notificar('🗑️ Tudo limpo!', 'success');
    fecharConfig();
    renderFila();
    renderMetricas();
}

// ===== NOTIFICAÇÃO + SOM =====
function notificar(texto, tipo = '') {
    const container = document.getElementById('notificacaoContainer');
    const el = document.createElement('div');
    el.className = 'notificacao ' + tipo;
    el.textContent = texto;
    container.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}
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

const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

document.addEventListener('DOMContentLoaded', init);
