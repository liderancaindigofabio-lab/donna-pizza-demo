/* ============================================
   DONNA PIZZA — App do Motoboy
   Com mapa Leaflet + rota otimizada
   ============================================ */

let motoboyAtual = null;
let mapa = null;
let markerPizza = null;
let markerCliente = null;
let markerMotoboy = null;
let rotaLayer = null;
let pedidoEmEntrega = null;
let watchId = null;

// Coordenadas da pizzaria (Pé de Serra - BA)
const PIZZARIA_COORDS = [-11.8345, -39.6125];

// ===== INIT =====
function init() {
    // Verificar se já tem motoboy logado
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

function logout() {
    localStorage.removeItem('donna_motoboy_logado');
    location.reload();
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
    renderPedidoAtual();
    initMapa();

    // Escutar mudanças
    DB.onChange(({ tipo, data }) => {
        if (tipo === 'pedido_novo') {
            // Novo pedido - mas só notifica se for pra mim
            if (data.motoboyId === motoboyAtual) {
                toast('🆕 Novo pedido pra você!', 'success');
                tocarSom('novo');
            }
        } else if (tipo === 'pedido_update') {
            if (data.motoboyId === motoboyAtual || data.status === 'entregue') {
                renderPedidoAtual();
                atualizarContadorEntregas();
                renderHistorico();
            }
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
    if (m.status === 'disponivel') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = '<span class="status-dot"></span> Disponível';
    } else if (m.status === 'entregando') {
        el.className = 'motoboy-status-toggle';
        el.innerHTML = '<span class="status-dot"></span> Em entrega';
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

    // Tile dark (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CartoDB',
        maxZoom: 19,
    }).addTo(mapa);

    // Marcador da pizzaria
    const pizzaIcon = L.divIcon({
        html: '<div class="marker-pizza"></div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
    markerPizza = L.marker(PIZZARIA_COORDS, { icon: pizzaIcon }).addTo(mapa);
    markerPizza.bindPopup('<b>🍕 Donna Pizza</b><br>Ponto de retirada');

    // Marcador do motoboy (posição inicial aleatória próxima)
    const mbIcon = L.divIcon({
        html: '<div class="marker-motoboy">🛵</div>',
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
    const mbPos = [PIZZARIA_COORDS[0] + 0.005, PIZZARIA_COORDS[1] + 0.005];
    markerMotoboy = L.marker(mbPos, { icon: mbIcon, draggable: true }).addTo(mapa);
    markerMotoboy.bindPopup('<b>🛵 Você está aqui</b><br>Arraste pra simular movimento');

    // Atualiza posição se arrastar
    markerMotoboy.on('dragend', (e) => {
        if (pedidoEmEntrega) {
            recalcularRota();
        }
    });

    // Tenta geolocalização real
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                markerMotoboy.setLatLng([latitude, longitude]);
                mapa.setView([latitude, longitude], 14);
            },
            (err) => {
                console.log('Geolocalização negada, usando posição padrão');
            }
        );
    }
}

function mostrarClienteNoMapa(coords) {
    if (!mapa) return;
    if (markerCliente) mapa.removeLayer(markerCliente);

    const clienteIcon = L.divIcon({
        html: '<div class="marker-cliente"></div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
    markerCliente = L.marker(coords, { icon: clienteIcon }).addTo(mapa);
    markerCliente.bindPopup('<b>🏠 Cliente</b><br>Destino da entrega');

    // Ajusta zoom pra ver tudo
    const group = L.featureGroup([markerPizza, markerMotoboy, markerCliente]);
    mapa.fitBounds(group.getBounds(), { padding: [50, 50] });

    // Calcula e mostra rota
    calcularRota(coords);
}

async function calcularRota(destino) {
    if (!markerMotoboy) return;
    const origem = markerMotoboy.getLatLng();

    // Remove rota anterior
    if (rotaLayer) mapa.removeLayer(rotaLayer);

    try {
        // OSRM (Open Source Routing Machine) - grátis, sem token
        const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino[1]},${destino[0]}?overview=full&geometries=geojson&steps=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
            const rota = data.routes[0];
            const coords = rota.geometry.coordinates.map(c => [c[1], c[0]]);

            // Desenha a rota
            rotaLayer = L.polyline(coords, {
                color: '#d4a574',
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(mapa);

            // Ajusta zoom pra ver a rota toda
            mapa.fitBounds(rotaLayer.getBounds(), { padding: [80, 80] });

            // Mostra info
            const distanciaKm = (rota.distance / 1000).toFixed(1);
            const tempoMin = Math.ceil(rota.duration / 60);
            document.getElementById('rotaDistancia').textContent = `${distanciaKm} km`;
            document.getElementById('rotaTempo').textContent = `~${tempoMin} min de moto`;
            document.getElementById('mapaInfo').classList.add('show');
            document.getElementById('btnRecalcular').style.display = 'block';

            return { distancia: rota.distance, duracao: rota.duration };
        }
    } catch (e) {
        console.error('Erro ao calcular rota:', e);
        // Fallback: linha reta
        rotaLayer = L.polyline([origem, destino], {
            color: '#d4a574',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10',
        }).addTo(mapa);

        // Distância em linha reta (haversine)
        const dist = calcularDistanciaHaversine(origem.lat, origem.lng, destino[0], destino[1]);
        const tempo = Math.ceil(dist / 30 * 60); // ~30 km/h média de moto
        document.getElementById('rotaDistancia').textContent = `${dist.toFixed(1)} km`;
        document.getElementById('rotaTempo').textContent = `~${tempo} min (estimado)`;
        document.getElementById('mapaInfo').classList.add('show');
        document.getElementById('btnRecalcular').style.display = 'block';

        return { distancia: dist * 1000, duracao: tempo * 60 };
    }
}

function recalcularRota() {
    if (pedidoEmEntrega && pedidoEmEntrega.coords) {
        mostrarClienteNoMapa([pedidoEmEntrega.coords.lat, pedidoEmEntrega.coords.lng]);
    }
}

function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===== PEDIDO ATUAL =====
function renderPedidoAtual() {
    const container = document.getElementById('pedidoAtual');

    // Buscar pedido em entrega pra esse motoboy
    const pedido = DB.getPedidos().find(p =>
        p.motoboyId === motoboyAtual && p.status === 'em_entrega'
    );

    if (!pedido) {
        pedidoEmEntrega = null;
        if (markerCliente) {
            mapa.removeLayer(markerCliente);
            markerCliente = null;
        }
        if (rotaLayer) {
            mapa.removeLayer(rotaLayer);
            rotaLayer = null;
        }
        document.getElementById('mapaInfo').classList.remove('show');
        document.getElementById('btnRecalcular').style.display = 'none';
        container.innerHTML = `
        <div class="empty-state-mobile">
            <div class="empty-state-icon">⏳</div>
            <h3>Sem entregas no momento</h3>
            <p>Você está disponível. Quando a pizzaria despachar um pedido, ele aparece aqui.</p>
        </div>`;
        return;
    }

    pedidoEmEntrega = pedido;
    const minutos = Math.floor((Date.now() - new Date(pedido.criadoEm).getTime()) / 60000);
    const itens = pedido.itens.map(i => `
        <div class="pac-item">
            <span>${i.nome} (${i.tipo})</span>
            <span>${BRL(i.preco)}</span>
        </div>
    `).join('');

    container.innerHTML = `
    <div class="pedido-atual-card">
        <div class="pac-header">
            <span class="pac-id">#${pedido.id.toString().slice(-5)}</span>
            <span class="pac-tempo">⏱️ há ${minutos} min</span>
        </div>
        <div class="pac-cliente">
            <div class="pac-cliente-nome">${pedido.cliente.nome}</div>
            <div class="pac-cliente-end">📍 ${pedido.cliente.end}</div>
            <a class="pac-cliente-tel" href="https://wa.me/55${pedido.cliente.tel.replace(/\D/g, '')}" target="_blank">
                📞 ${pedido.cliente.tel} (chamar)
            </a>
        </div>
        <div class="pac-itens">${itens}</div>
        <div class="pac-total">${BRL(pedido.total)} • ${pedido.cliente.pag}</div>
        <div class="pac-acoes pac-acoes-3">
            <button class="btn-mb secondary" onclick="abrirNavegacao()">🧭 Navegar</button>
            <button class="btn-mb primary" onclick="ligarCliente()">📞 Ligar</button>
            <button class="btn-mb success" onclick="finalizarEntrega(${pedido.id})">✅ Entreguei</button>
        </div>
        ${pedido.cliente.obs ? `<div class="peduto-obs" style="background:rgba(212,165,116,0.08);border-left:3px solid var(--gold);padding:10px;border-radius:6px;margin-top:12px;font-size:0.85rem;color:var(--gray);"><strong>Obs:</strong> ${pedido.cliente.obs}</div>` : ''}
    </div>
    `;

    // Mostra no mapa
    if (pedido.coords) {
        mostrarClienteNoMapa([pedido.coords.lat, pedido.coords.lng]);
    }
}

// ===== AÇÕES DO MOTOBOY =====
function abrirNavegacao() {
    if (!pedidoEmEntrega || !pedidoEmEntrega.coords) return;
    const { lat, lng } = pedidoEmEntrega.coords;
    // Abre no Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
}

function ligarCliente() {
    if (!pedidoEmEntrega) return;
    const tel = pedidoEmEntrega.cliente.tel.replace(/\D/g, '');
    window.location.href = `tel:+55${tel}`;
}

function finalizarEntrega(id) {
    if (!confirm('Confirmar que a entrega foi feita?')) return;
    DB.updatePedido(id, { status: 'entregue' });
    // Libera o motoboy
    DB.updateMotoboy(motoboyAtual, { status: 'disponivel' });
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
            <div class="historico-emoji">🍕</div>
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

// ===== SOM =====
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

// ===== UTIL =====
const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

document.addEventListener('DOMContentLoaded', init);
