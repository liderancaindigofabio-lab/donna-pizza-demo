/* ============================================
   NONNA PIZZARIA — App do Motoboy
   COM MÚLTIPLAS ENTREGAS + ROTEIRIZAÇÃO OTIMIZADA
   ============================================ */

let motoboyAtual = null;
let mapa = null;
let markerPizza = null;
let markersClientes = [];
let markerMotoboy = null;
let rotaLayer = null;
let watchId = null;
let refreshInterval = null;

// Coordenadas da pizzaria (Atalaia - Aracaju/SE)
// Av. Melício Machado, 1060 - Atalaia, Aracaju - SE, 49037-440
const PIZZARIA_COORDS = [-10.9893597, -37.0605839];
const PIZZARIA_ENDERECO = 'Av. Melício Machado, 1060 - Atalaia, Aracaju - SE';

// Coordenadas de cliente só são usadas quando vieram do pedido/Firebase.
// Nunca gerar ou persistir uma localização estimada.
function coordenadasValidas(pedido) {
    const c = pedido && pedido.coords;
    return !!c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)) &&
        Number(c.lat) >= -90 && Number(c.lat) <= 90 && Number(c.lng) >= -180 && Number(c.lng) <= 180;
}

function enderecoNavegavel(cliente) {
    return formatarEndereco(cliente || {}) || '';
}

function pedidosComCoordenadas(pedidos) {
    return pedidos.filter(coordenadasValidas);
}

function atualizarStatusPedido(id, status, dados) {
    // Mantém uma única escrita no pedido central, independentemente do backend ativo.
    if (typeof DB.atualizarStatusPedido === 'function') return DB.atualizarStatusPedido(id, status, dados || {});
    return DB.updatePedido(id, { ...(dados || {}), status });
}

function pedidosEmOperacao() {
    return DB.getPedidos().filter(p => p.motoboyId === motoboyAtual &&
        (p.status === 'pronto' || p.status === 'em_entrega'));
}

// ===== INIT =====
async function init() {
    try {
        const profile = await NONNA_STAFF_AUTH?.restore?.();
        if (profile) { entrarComPerfil(profile); return; }
    } catch (_) {}
    renderLogin();
}

function entrarComPerfil(profile) {
    if (!profile || !profile.courierId) { toast('Seu perfil não está vinculado a um motoboy.', 'error'); return; }
    motoboyAtual = profile.courierId;
    localStorage.removeItem('donna_motoboy_logado');
    iniciarApp();
}

function renderLogin() {
    const form=document.getElementById('motoboyAuthForm'), error=document.getElementById('motoboyAuthError');
    if(!form) return;
    form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form),btn=form.querySelector('button');error.textContent='';btn.disabled=true;try{const p=await NONNA_STAFF_AUTH.signIn(String(fd.get('email')).trim(),String(fd.get('password')));entrarComPerfil(p)}catch(err){error.textContent=err.message||'Não foi possível entrar.'}finally{btn.disabled=false}};
}

function sairMotoboy(event) { event.preventDefault(); try{firebase.auth().signOut()}catch(_){} location.reload(); }

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
    renderPedidosAtuais();

    // Escutar mudanças
    DB.onChange(({ tipo, data }) => {
        if (tipo === 'pedido_novo') {
            if (data && data.motoboyId === motoboyAtual) {
                const qtd = pedidosEmOperacao().length;
                if (qtd === 1) {
                    toast('🆕 Novo pedido pra você!', 'success');
                    tocarSom('novo');
                } else {
                    toast(`🆕 +1 entrega! Total: ${qtd}`, 'success');
                    tocarSom('novo');
                }
            }
        } else if (tipo === 'pedido_update') {
            // Sempre re-renderiza: pode ser que esse update seja da entrega atual
            // (finalizar um pedido muda status e tira da lista "em_entrega")
            renderPedidosAtuais();
            atualizarContadorEntregas();
            renderHistorico();
        } else if (tipo === 'motoboy_update') {
            atualizarStatusVisual();
        }
        atualizarStatusVisual();
    });
    // Revalida o cache local periodicamente para não depender apenas de eventos do navegador.
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        renderPedidosAtuais();
        atualizarContadorEntregas();
        renderHistorico();
        atualizarStatusVisual();
    }, 10000);
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
    const qtdRota = pedidosEmOperacao().length;
    if (m.status === 'disponivel') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = '<span class="status-dot"></span> Disponível';
    } else if (m.status === 'entregando') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = `<span class="status-dot"></span> Em rota (${qtdRota})`;
    } else if (m.status === 'problema') {
        el.className = 'motoboy-status-toggle indisponivel';
        el.innerHTML = '<span class="status-dot"></span> Atenção necessária';
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
    markerPizza.bindPopup('<b>🍕 Nonna Pizzaria</b><br>Ponto de retirada');

    // Marcador do motoboy
    const mbIcon = L.divIcon({
        html: '<div class="marker-motoboy">🛵</div>',
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
    // Sem posição real, o mapa permanece centrado na pizzaria, sem inventar localização.
    const m = DB.getMotoboy(motoboyAtual);
    const posicaoValida = m && Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng));
    function criarMarcadorMotoboy(lat, lng, permitirArrastar = false) {
        if (markerMotoboy) {
            markerMotoboy.setLatLng([lat, lng]);
            return;
        }
        markerMotoboy = L.marker([lat, lng], { icon: mbIcon, draggable: permitirArrastar }).addTo(mapa);
        markerMotoboy.bindPopup('<b>🛵 Você está aqui</b><br>Posição obtida pelo GPS');
        markerMotoboy.on('dragend', () => {
            const ll = markerMotoboy.getLatLng();
            DB.updateMotoboyPos(motoboyAtual, ll.lat, ll.lng);
            otimizarERenderizarRota();
        });
    }
    if (posicaoValida) criarMarcadorMotoboy(Number(m.lat), Number(m.lng));

    // A posição só é gravada quando fornecida pelo GPS (ou já existente no DB).
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                criarMarcadorMotoboy(latitude, longitude);
                DB.updateMotoboyPos(motoboyAtual, latitude, longitude);
                mapa.setView([latitude, longitude], 14);
                renderPedidosAtuais();
            },
            (err) => console.log('Geolocalização negada')
        );
        // Tracking em tempo real
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                criarMarcadorMotoboy(latitude, longitude);
                DB.updateMotoboyPos(motoboyAtual, latitude, longitude);
                renderPedidosAtuais();
            },
            (err) => console.log('Watch position erro'),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
        );
    }
}

// ===== ROTEIRIZAÇÃO INTELIGENTE =====
// Recebe várias entregas e calcula a melhor ordem (vizinho mais próximo)
function otimizarERenderizarRota() {
    if (!mapa || !markerMotoboy) return;

    const pedidos = pedidosEmOperacao();
    if (pedidos.length === 0) {
        // Sem entregas: limpa mapa
        markersClientes.forEach(m => mapa.removeLayer(m.marker));
        markersClientes = [];
        if (rotaLayer) { mapa.removeLayer(rotaLayer); rotaLayer = null; }
        document.getElementById('mapaInfo').classList.remove('show');
        document.getElementById('btnRecalcular').style.display = 'none';
        return;
    }

    const pedidosComCoords = pedidosComCoordenadas(pedidos);
    if (pedidosComCoords.length === 0 || !markerMotoboy) {
        mostrarMapaIndisponivel(pedidos.length);
        return;
    }
    if (pedidosComCoords.length === 1) {
        renderizarRotaSimples(pedidosComCoords[0]);
        return;
    }

    // Várias entregas: otimizar apenas destinos com coordenadas reais.
    const pontoAtual = markerMotoboy.getLatLng();
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
        📍 ${formatarEndereco(pedido.cliente)}<br>
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

function mostrarMapaIndisponivel(qtdPedidos) {
    markersClientes.forEach(m => mapa.removeLayer(m.marker));
    markersClientes = [];
    if (rotaLayer) { mapa.removeLayer(rotaLayer); rotaLayer = null; }
    document.getElementById('mapaInfo').classList.remove('show');
    document.getElementById('btnRecalcular').style.display = 'none';
}

// ===== LISTA DE PEDIDOS ATUAIS (a nova tela principal) =====
function renderPedidosAtuais() {
    const container = document.getElementById('pedidoAtual');
    const pedidos = pedidosEmOperacao();

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

    // Só endereços com coordenadas reais entram na rota; os demais continuam visíveis por texto.
    const pedidosComCoords = pedidosComCoordenadas(pedidos);
    const pontoAtual = markerMotoboy ? markerMotoboy.getLatLng() : null;
    const ordenados = pontoAtual && pedidosComCoords.length ? vizinhoMaisProximo(pontoAtual, pedidosComCoords) : [];
    const semCoordenadas = pedidos.filter(p => !coordenadasValidas(p));

    // Header com resumo
    const headerHtml = `
        ${semCoordenadas.length ? `<div class="localizacao-indisponivel">⚠️ ${semCoordenadas.length} pedido(s) sem localização no mapa. Use o endereço informado; nenhuma posição foi estimada.</div>` : ''}
        ${!ordenados.length ? `<div class="localizacao-indisponivel">📍 GPS do motoboy indisponível. A rota será exibida quando a posição real for obtida.</div>` : ''}
        <div class="rota-resumo">
            <div class="rota-resumo-titulo">
                🗺️ <span>Rota otimizada</span>
                <span class="rota-badge">${ordenados.length} ${ordenados.length === 1 ? 'entrega' : 'entregas'}</span>
            </div>
            <p class="rota-resumo-desc">Entregas organizadas por proximidade. A primeira é a mais perto de você.</p>
        </div>
    `;

    // Lista de cards: pedidos sem coordenadas continuam operacionais por endereço.
    const idsOrdenados = new Set(ordenados.map(p => String(p.id)));
    const pedidosExibidos = [...ordenados, ...pedidos.filter(p => !idsOrdenados.has(String(p.id)))];
    const cardsHtml = pedidosExibidos.map((p, i) => {
        const ehProxima = i === 0 && coordenadasValidas(p);
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
                <div class="pac-cliente-end">📍 ${formatarEndereco(p.cliente)}</div>
                ${!coordenadasValidas(p) ? '<div class="pac-localizacao-indisponivel">⚠️ Localização no mapa indisponível — confira o endereço</div>' : ''}
                <a class="pac-cliente-tel" href="https://wa.me/55${p.cliente.tel.replace(/\D/g, '')}" target="_blank">
                    📞 ${p.cliente.tel}
                </a>
            </div>
            <div class="pac-itens">${itens}</div>
            <div class="pac-total">${BRL(p.total)} • ${p.cliente.pag}</div>
            ${p.cliente.obs ? `<div class="pac-obs"><strong>Obs:</strong> ${p.cliente.obs}</div>` : ''}
            <div class="pac-acoes">
                <button class="btn-mb secondary" onclick="abrirNavegacao(${p.id})">🧭 Google Maps</button>
                <button class="btn-mb secondary" onclick="abrirWaze(${p.id})">🟣 Waze</button>
                <button class="btn-mb primary" onclick="ligarCliente(${p.id})">📞 Ligar</button>
                ${p.status === 'pronto' ? `<button class="btn-mb warning" onclick="iniciarEntrega(${p.id})">🚀 Iniciar entrega</button>` : ''}
                ${ehProxima && p.status === 'em_entrega' ? `<button class="btn-mb success" onclick="finalizarEntrega(${p.id})">✅ Entreguei</button>` : ''}
                ${p.status === 'em_entrega' ? `<button class="btn-mb danger" onclick="registrarProblema(${p.id})">⚠️ Problema</button>` : ''}
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
    const pedidos = pedidosEmOperacao();
    if (pedidos.length === 0) return;
    if (!markerMotoboy) { toast('📍 Sua localização real ainda não está disponível.', 'error'); return; }
    const pontoAtual = markerMotoboy.getLatLng();
    const pedidosComCoords = pedidosComCoordenadas(pedidos);
    const ordenados = vizinhoMaisProximo(pontoAtual, pedidosComCoords);
    const proxima = ordenados[0];
    if (!proxima || !coordenadasValidas(proxima)) {
        toast('⚠️ Localização do cliente indisponível. Use o endereço do pedido.', 'error');
        return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${proxima.coords.lat},${proxima.coords.lng}&travelmode=driving`;
    window.open(url, '_blank');
}

// ===== AÇÕES =====
function abrirNavegacao(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    const destino = coordenadasValidas(p) ? `${p.coords.lat},${p.coords.lng}` : encodeURIComponent(enderecoNavegavel(p.cliente));
    if (!destino) { toast('⚠️ Endereço do cliente indisponível.', 'error'); return; }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
}

function abrirWaze(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    if (!coordenadasValidas(p)) { toast('⚠️ Waze precisa da localização. Use o endereço no Google Maps.', 'error'); return; }
    const url = `https://waze.com/ul?ll=${p.coords.lat},${p.coords.lng}&navigate=yes`;
    window.open(url, '_blank');
}

async function iniciarEntrega(id) {
    const pedido = DB.getPedidos().find(x => String(x.id) === String(id));
    if (!pedido || String(pedido.motoboyId) !== String(motoboyAtual) || pedido.status !== 'pronto') { toast('Este pedido não pertence à sua rota ou não está pronto.', 'error'); return; }
    if (!confirm('Iniciar entrega agora? O cliente vai ver sua posição em tempo real.')) return;
    try {
        const salvo = await atualizarStatusPedido(id, 'em_entrega', { saiuEm: new Date().toISOString(), actor: `courier:${motoboyAtual}` });
        if (!salvo) throw new Error('Pedido não encontrado');
        await DB.updateMotoboy(motoboyAtual, { status: 'entregando' });
        toast('🚀 Entrega iniciada! Cliente notificado.', 'success'); tocarSom('novo'); renderPedidosAtuais();
    } catch (e) { toast(e.message || 'Não foi possível iniciar a entrega.', 'error'); }
}

async function registrarProblema(id) {
    const pedido = DB.getPedidos().find(x => String(x.id) === String(id));
    if (!pedido || String(pedido.motoboyId) !== String(motoboyAtual) || pedido.status !== 'em_entrega') { toast('Este pedido não pertence à sua rota.', 'error'); return; }
    const motivo = prompt('Descreva o problema da entrega:');
    if (!motivo || !motivo.trim()) return;
    try { await atualizarStatusPedido(id, 'problema_entrega', { problemaEntrega: motivo.trim(), problemaEm: new Date().toISOString(), actor: `courier:${motoboyAtual}` }); await DB.updateMotoboy(motoboyAtual, { status: 'problema' }); toast('⚠️ Problema registrado e enviado à pizzaria.', 'error'); renderPedidosAtuais(); }
    catch (e) { toast(e.message || 'Não foi possível registrar o problema.', 'error'); }
}

function ligarCliente(pedidoId) {
    const p = DB.getPedidos().find(x => x.id === pedidoId);
    if (!p) return;
    const tel = p.cliente.tel.replace(/\D/g, '');
    window.location.href = `tel:+55${tel}`;
}

async function finalizarEntrega(id) {
    const pedido = DB.getPedidos().find(x => String(x.id) === String(id));
    if (!pedido || String(pedido.motoboyId) !== String(motoboyAtual) || pedido.status !== 'em_entrega') { toast('Este pedido não pertence à sua rota.', 'error'); return; }
    if (!confirm('Confirmar que essa entrega foi feita?')) return;
    try {
        await atualizarStatusPedido(id, 'entregue', { entregueEm: new Date().toISOString(), actor: `courier:${motoboyAtual}` });
        if (pedidosEmOperacao().filter(p => String(p.id) !== String(id)).length === 0) await DB.updateMotoboy(motoboyAtual, { status: 'disponivel' });
        toast('🎉 Entrega finalizada!', 'success'); tocarSom('ok'); renderPedidosAtuais();
    } catch (e) { toast(e.message || 'Não foi possível finalizar a entrega.', 'error'); }
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
                <div class="historico-end">${formatarEnderecoCurto(p.cliente)}</div>
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
