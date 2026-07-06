/* ============================================
   DONNA PIZZA — App do Motoboy
   COM MÚLTIPLAS ENTREGAS + ROTEIRIZAÇÃO OTIMIZADA
   ============================================ */

let motoboyAtual = null;
let mapa = null;
let markerPizza = null;
let markersClientes = [];
let markerMotoboy = null;
let rotaLayer = null;
let watchId = null;

// Coordenadas da pizzaria (Pé de Serra - BA)
const PIZZARIA_COORDS = [-11.8345, -39.6125];

// Gera coordenadas aleatórias próximas à pizzaria (pra pedidos antigos sem coords)
function gerarCoordsAleatorias() {
    // ~3km de raio (0.03 graus ~= 3.3km)
    const lat = PIZZARIA_COORDS[0] + (Math.random() - 0.5) * 0.06;
    const lng = PIZZARIA_COORDS[1] + (Math.random() - 0.5) * 0.06;
    return { lat, lng };
}

// Garante que pedido tenha coords (pra pedidos antigos)
function garantirCoords(pedido) {
    if (!pedido.coords) {
        pedido.coords = gerarCoordsAleatorias();
        DB.updatePedido(pedido.id, { coords: pedido.coords });
    }
    return pedido;
}

// ===== INIT =====
function init() {
    const saved = localStorage.getItem('donna_motoboy_logado');
    if (saved) {
        motoboyAtual = parseInt(saved);
        const m = DB.getMotoboy(motoboyAtual);
        if (m) {
            iniciarApp();
            return;
        }
    }
    renderLogin();
}

function renderLogin() {
    const motoboys = DB.getMotoboys();
    document.getElementById('motoboyLoginList').innerHTML = motoboys.map(m => `
        <div class="motoboy-login-item" onclick="login(${m.id})">
            <div class="motoboy-avatar-small">${m.foto}</div>
            <div class="mli-info">
                <div class="mli-nome">${m.nome}</div>
                <div class="mli-moto">${m.moto}</div>
            </div>
            <div class="mli-arrow">→</div>
        </div>
    `).join('');
}

function login(id) {
    motoboyAtual = id;
    localStorage.setItem('donna_motoboy_logado', id);
    iniciarApp();
}

function iniciarApp() {
    const m = DB.getMotoboy(motoboyAtual);
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    document.getElementById('motoboyAvatar').textContent = m.foto;
    document.getElementById('motoboyNome').textContent = m.nome;
    atualizarStatusVisual();
    atualizarContadorEntregas();
    renderHistorico();
    renderPedidosAtuais();
    initMapa();

    // Escutar mudanças
    DB.onChange(({ tipo, data }) => {
        if (tipo === 'pedido_novo') {
            if (data.motoboyId === motoboyAtual) {
                const qtd = DB.getPedidosMotoboy(motoboyAtual).length;
                if (qtd === 1) {
                    toast('🆕 Novo pedido pra você!', 'success');
                    tocarSom('novo');
                } else {
                    toast(`🆕 +1 entrega! Total: ${qtd}`, 'success');
                    tocarSom('novo');
                }
            }
        } else if (tipo === 'pedido_update') {
            if (data.motoboyId === motoboyAtual) {
                renderPedidosAtuais();
                atualizarContadorEntregas();
                renderHistorico();
            }
        } else if (tipo === 'motoboy_update') {
            if (data.id === motoboyAtual) atualizarStatusVisual();
        }
        atualizarStatusVisual();
    });
}

// ===== STATUS =====
function toggleStatus() {
    const m = DB.getMotoboy(motoboyAtual);
    const novo = m.status === 'disponivel' ? 'pausa' : 'disponivel';
    DB.updateMotoboy(motoboyAtual, { status: novo });
    atualizarStatusVisual();
    toast(novo === 'disponivel' ? '✅ Disponível' : '⏸️ Em pausa');
}

function atualizarStatusVisual() {
    const m = DB.getMotoboy(motoboyAtual);
    const el = document.getElementById('statusToggle');
    const qtdRota = DB.getPedidosMotoboy(motoboyAtual).length;
    if (m.status === 'disponivel') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = '<span class="status-dot"></span> Disponível';
    } else if (m.status === 'entregando') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = `<span class="status-dot"></span> Em rota (${qtdRota})`;
    } else {
        el.className = 'motoboy-status-toggle indisponivel';
        el.innerHTML = '<span class="status-dot"></span> Em pausa';
    }
}

// ===== MAPA =====
function initMapa() {
    if (mapa) return;

    mapa = L.map('mapa', {
        zoomControl: true,
        attributionControl: true,
    }).setView(PIZZARIA_COORDS, 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CartoDB',
        maxZoom: 19,
    }).addTo(mapa);

    // Marcador da pizzaria
    const pizzaIcon = L.divIcon({
        html: '<div class="marker-pizza"></div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
    markerPizza = L.marker(PIZZARIA_COORDS, { icon: pizzaIcon }).addTo(mapa);
    markerPizza.bindPopup('<b>🍕 Donna Pizza</b><br>Ponto de retirada');

    // Marcador do motoboy
    const mbIcon = L.divIcon({
        html: '<div class="marker-motoboy">🛵</div>',
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
    const mbPos = [PIZZARIA_COORDS[0] + 0.005, PIZZARIA_COORDS[1] + 0.005];
    markerMotoboy = L.marker(mbPos, { icon: mbIcon, draggable: true }).addTo(mapa);
    markerMotoboy.bindPopup('<b>🛵 Você está aqui</b><br>Arraste pra simular movimento');

    markerMotoboy.on('dragend', () => {
        if (DB.getPedidosMotoboy(motoboyAtual).length > 0) {
            otimizarERenderizarRota();
        }
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                markerMotoboy.setLatLng([latitude, longitude]);
                mapa.setView([latitude, longitude], 14);
            },
            (err) => console.log('Geolocalização negada')
        );
    }
}

// ===== ROTEIRIZAÇÃO INTELIGENTE =====
// Recebe várias entregas e calcula a melhor ordem (vizinho mais próximo)
function otimizarERenderizarRota() {
    if (!mapa || !markerMotoboy) return;

    const pedidos = DB.getPedidosMotoboy(motoboyAtual);
    if (pedidos.length === 0) {
        // Sem entregas: limpa mapa
        markersClientes.forEach(m => mapa.removeLayer(m.marker));
        markersClientes = [];
        if (rotaLayer) { mapa.removeLayer(rotaLayer); rotaLayer = null; }
        document.getElementById('mapaInfo').classList.remove('show');
        document.getElementById('btnRecalcular').style.display = 'none';
        return;
    }

    if (pedidos.length === 1) {
        // 1 entrega: rota direta
        renderizarRotaSimples(pedidos[0]);
        return;
    }

    // Várias entregas: OTIMIZAR com vizinho mais próximo
    const pontoAtual = markerMotoboy.getLatLng();
    const pedidosComCoords = pedidos.map(garantirCoords);
    const ordenados = vizinhoMaisProximo(pontoAtual, pedidosComCoords);
    renderizarRotaMultipla(ordenados, pontoAtual);
}

// Algoritmo do vizinho mais próximo (Nearest Neighbor)
function vizinhoMaisProximo(origem, pedidos) {
    if (!pedidos.length) return [];
    const restantes = [...pedidos];
    const rota = [];
    let atual = origem;

    while (restantes.length > 0) {
        let menorDist = Infinity;
        let idxProx = 0;
        for (let i = 0; i < restantes.length; i++) {
            const c = restantes[i].coords;
            const d = calcularDistanciaHaversine(
                atual.lat, atual.lng,
                c.lat, c.lng
            );
            if (d < menorDist) {
                menorDist = d;
                idxProx = i;
            }
        }
        const prox = restantes.splice(idxProx, 1)[0];
        prox.distancia = menorDist;
        rota.push(prox);
        atual = L.latLng(prox.coords.lat, prox.coords.lng);
    }
    return rota;
}

function renderizarRotaSimples(pedido) {
    // Limpa markers anteriores
    markersClientes.forEach(m => mapa.removeLayer(m.marker));
    markersClientes = [];

    const destino = [pedido.coords.lat, pedido.coords.lng];
    const marker = adicionarMarkerCliente(destino, 1, pedido, false);
    markersClientes.push({ marker, pedido });

    calcularRotaOSRM([markerMotoboy.getLatLng()], [destino])
        .then(({ distancia, duracao, coords }) => {
            if (rotaLayer) mapa.removeLayer(rotaLayer);
            rotaLayer = L.polyline(coords, {
                color: '#d4a574', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round'
            }).addTo(mapa);
            mapa.fitBounds(rotaLayer.getBounds(), { padding: [80, 80] });
            atualizarInfoMapa(distancia, duracao, 1);
            document.getElementById('btnRecalcular').style.display = 'block';
        });
}

async function renderizarRotaMultipla(pedidosOrdenados, origem) {
    // Limpa markers
    markersClientes.forEach(m => mapa.removeLayer(m.marker));
    markersClientes = [];

    // Adiciona markers numerados
    pedidosOrdenados.forEach((p, i) => {
        const ehProximo = i === 0;
        const marker = adicionarMarkerCliente([p.coords.lat, p.coords.lng], i + 1, p, ehProximo);
        markersClientes.push({ marker, pedido: p });
    });

    // Calcula rota completa (motoboy → 1 → 2 → 3...)
    const waypoints = [origem, ...pedidosOrdenados.map(p => L.latLng(p.coords.lat, p.coords.lng))];
    const result = await calcularRotaOSRM(waypoints);

    if (result && rotaLayer) mapa.removeLayer(rotaLayer);

    if (result) {
        rotaLayer = L.polyline(result.coords, {
            color: '#d4a574', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round'
        }).addTo(mapa);

        // Ajusta zoom
        mapa.fitBounds(rotaLayer.getBounds(), { padding: [80, 80] });

        // Atualiza info
        atualizarInfoMapa(result.distancia, result.duracao, pedidosOrdenados.length);
        document.getElementById('btnRecalcular').style.display = 'block';

        // Salva a ordem otimizada em cada pedido (pra UI mostrar)
        pedidosOrdenados.forEach((p, i) => {
            DB.updatePedido(p.id, { ordemEntrega: i + 1 });
        });
    }
}

function adicionarMarkerCliente(coords, numero, pedido, emDestaque) {
    const clienteIcon = L.divIcon({
        html: `<div class="marker-cliente ${emDestaque ? 'destaque' : ''}">${numero}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
    const marker = L.marker(coords, { icon: clienteIcon }).addTo(mapa);
    marker.bindPopup(`
        <b>${numero}. ${pedido.cliente.nome}</b><br>
        📍 ${pedido.cliente.end}<br>
        💰 ${BRL(pedido.total)}<br>
        ${emDestaque ? '<b>🟢 PRÓXIMA ENTREGA</b>' : ''}
    `);
    return marker;
}

async function calcularRotaOSRM(waypoints) {
    if (waypoints.length < 2) return null;

    // Se tem 2 pontos, rota direta
    if (waypoints.length === 2) {
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints[0].lng},${waypoints[0].lat};${waypoints[1].lng},${waypoints[1].lat}?overview=full&geometries=geojson`;
        try {
            const r = await fetch(url);
            const d = await r.json();
            if (d.routes && d.routes[0]) {
                return {
                    distancia: d.routes[0].distance,
                    duracao: d.routes[0].duration,
                    coords: d.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
                };
            }
        } catch (e) { return fallbackReta(waypoints); }
    }

    // 3+ pontos: usa waypoints do OSRM (rota otimizada automaticamente por eles)
    const coordsStr = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true&annotations=duration,distance`;

    try {
        const r = await fetch(url);
        const d = await r.json();
        if (d.routes && d.routes[0]) {
            return {
                distancia: d.routes[0].distance,
                duracao: d.routes[0].duration,
                coords: d.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
            };
        }
    } catch (e) {
        return fallbackReta(waypoints);
    }
    return fallbackReta(waypoints);
}

function fallbackReta(waypoints) {
    // Fallback: linha reta entre pontos + cálculo haversine
    const coords = waypoints.map(w => [w.lat, w.lng]);
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        dist += calcularDistanciaHaversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
    }
    return {
        distancia: dist * 1000,
        duracao: dist * 2 * 60, // ~30 km/h
        coords
    };
}

function atualizarInfoMapa(distanciaMetros, duracaoSegundos, qtdEntregas) {
    const km = (distanciaMetros / 1000).toFixed(1);
    const min = Math.ceil(duracaoSegundos / 60);
    document.getElementById('rotaDistancia').textContent = `${km} km total`;
    document.getElementById('rotaTempo').textContent = qtdEntregas > 1
        ? `~${min} min • ${qtdEntregas} entregas`
        : `~${min} min`;
    document.getElementById('mapaInfo').classList.add('show');
}

function recalcularRota() {
    otimizarERenderizarRota();
    toast('🔄 Rota recalculada!', 'success');
}

function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===== LISTA DE PEDIDOS ATUAIS (a nova tela principal) =====
function renderPedidosAtuais() {
    const container = document.getElementById('pedidoAtual');
    const pedidos = DB.getPedidosMotoboy(motoboyAtual);

    if (pedidos.length === 0) {
        container.innerHTML = `
        <div class="empty-state-mobile">
            <div class="empty-state-icon">⏳</div>
            <h3>Sem entregas no momento</h3>
            <p>Você está disponível. Quando a pizzaria despachar pedidos, eles aparecem aqui em ordem otimizada.</p>
        </div>`;
        otimizarERenderizarRota();
        return;
    }

    // Calcula ordem otimizada pra mostrar a UI
    const pontoAtual = markerMotoboy ? markerMotoboy.getLatLng() : L.latLng(PIZZARIA_COORDS[0], PIZZARIA_COORDS[1]);
    // Garante que todos têm coords (pedidos antigos podem não ter)
    const pedidosComCoords = pedidos.map(garantirCoords);
    const ordenados = vizinhoMaisProximo(pontoAtual, pedidosComCoords);

    // Header com resumo
    const headerHtml = `
        <div class="rota-resumo">
            <div class="rota-resumo-titulo">
                🗺️ <span>Rota otimizada</span>
                <span class="rota-badge">${ordenados.length} ${ordenados.length === 1 ? 'entrega' : 'entregas'}</span>
            </div>
            <p class="rota-resumo-desc">Entregas organizadas por proximidade. A primeira é a mais perto de você.</p>
        </div>
    `;

    // Lista de cards
    const cardsHtml = ordenados.map((p, i) => {
        const ehProxima = i === 0;
        const minutos = Math.floor((Date.now() - new Date(p.criadoEm).getTime()) / 60000);
        const itens = p.itens.map(it => `
            <div class="pac-item">
                <span>${it.nome} (${it.tipo})</span>
                <span>${BRL(it.preco)}</span>
            </div>
        `).join('');

        return `
        <div class="pedido-atual-card ${ehProxima ? 'proxima' : ''}">
            ${ehProxima ? '<div class="proxima-tag">📍 PRÓXIMA ENTREGA</div>' : ''}
            <div class="ordem-numero">${i + 1}</div>
            <div class="pac-header">
                <span class="pac-id">#${p.id.toString().slice(-5)}</span>
                <span class="pac-tempo">⏱️ há ${minutos} min</span>
            </div>
            <div class="pac-cliente">
                <div class="pac-cliente-nome">${p.cliente.nome}</div>
                <div class="pac-cliente-end">📍 ${p.cliente.end}</div>
                <a class="pac-cliente-tel" href="https://wa.me/55${p.cliente.tel.replace(/\D/g, '')}" target="_blank">
                    📞 ${p.cliente.tel}
                </a>
            </div>
            <div class="pac-itens">${itens}</div>
            <div class="pac-total">${BRL(p.total)} • ${p.cliente.pag}</div>
            ${p.cliente.obs ? `<div class="pac-obs"><strong>Obs:</strong> ${p.cliente.obs}</div>` : ''}
            <div class="pac-acoes">
                <button class="btn-mb secondary" onclick="abrirNavegacao(${p.id})">🧭 Navegar</button>
                <button class="btn-mb primary" onclick="ligarCliente(${p.id})">📞 Ligar</button>
                ${ehProxima ? `<button class="btn-mb success" onclick="finalizarEntrega(${p.id})">✅ Entreguei</button>` : ''}
            </div>
        </div>
        `;
    }).join('');

    // Botão de navegação "ir pra primeira entrega"
    const irParaProxima = ordenados.length > 0 ? `
        <button class="btn-ir-proxima" onclick="irParaProximaEntrega()">
            🧭 Navegar até a próxima entrega (${ordenados[0].cliente.nome.split(' ')[0]})
        </button>
    ` : '';

    container.innerHTML = headerHtml + cardsHtml + irParaProxima;

    // Atualiza mapa
    otimizarERenderizarRota();
}

function irParaProximaEntrega() {
    const pedidos = DB.getPedidosMotoboy(motoboyAtual);
    if (pedidos.length === 0) return;
    const pontoAtual = markerMotoboy.getLatLng();
    const pedidosComCoords = pedidos.map(garantirCoords);
    const ordenados = vizinhoMaisProximo(pontoAtual, pedidosComCoords);
    const proxima = ordenados[0];
    if (!proxima || !proxima.coords) {
        toast('⚠️ Pedido sem coordenadas', 'error');
        return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${proxima.coords.lat},${proxima.coords.lng}&travelmode=driving`;
    window.open(url, '_blank');
}

// ===== AÇÕES =====
function abrirNavegacao(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    const pComCoords = garantirCoords(p);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pComCoords.coords.lat},${pComCoords.coords.lng}&travelmode=driving`;
    window.open(url, '_blank');
}

function ligarCliente(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    const tel = p.cliente.tel.replace(/\D/g, '');
    window.location.href = `tel:+55${tel}`;
}

function finalizarEntrega(id) {
    if (!confirm('Confirmar que essa entrega foi feita?')) return;
    DB.updatePedido(id, { status: 'entregue', entregueEm: new Date().toISOString() });

    // Se não tem mais entregas, libera o motoboy
    const restantes = DB.getPedidosMotoboy(motoboyAtual);
    if (restantes.length === 0) {
        DB.updateMotoboy(motoboyAtual, { status: 'disponivel' });
    }

    toast('🎉 Entrega finalizada!', 'success');
    tocarSom('ok');
}

// ===== HISTÓRICO =====
function atualizarContadorEntregas() {
    const pedidos = DB.getPedidos().filter(p =>
        p.motoboyId === motoboyAtual &&
        p.status === 'entregue' &&
        new Date(p.criadoEm).toDateString() === new Date().toDateString()
    );
    document.querySelector('.contador-numero').textContent = pedidos.length;
}

function renderHistorico() {
    const container = document.getElementById('historicoLista');
    const historico = DB.getPedidos().filter(p =>
        p.motoboyId === motoboyAtual && p.status === 'entregue'
    ).slice(0, 20);

    if (historico.length === 0) {
        container.innerHTML = '<p class="historico-vazio">Nenhuma entrega ainda hoje</p>';
        return;
    }

    container.innerHTML = historico.map(p => `
        <div class="historico-item">
            <div class="historico-emoji">✅</div>
            <div class="historico-info">
                <div class="historico-cliente">${p.cliente.nome}</div>
                <div class="historico-end">${p.cliente.end.substring(0, 40)}...</div>
            </div>
            <span class="historico-valor">${BRL(p.total)}</span>
        </div>
    `).join('');
}

// ===== TOAST =====
function toast(texto, tipo = '') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast ' + tipo;
    el.textContent = texto;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function tocarSom(tipo) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = tipo === 'novo' ? 1000 : 700;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

document.addEventListener('DOMContentLoaded', init);
