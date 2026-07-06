/* ============================================
   DONNA PIZZA — Lógica do cliente
   ============================================ */

let carrinho = [];
let categoriaAtiva = 'mais-pedidos';
let produtoEmEdicao = null;
let tipoEscolhido = null;
let cupomAplicado = null;
let meuPedidoId = null; // ID do pedido do cliente (pra acompanhar)

const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const config = DB.getConfig();

// ============ INIT ============
function init() {
    renderCategorias();
    renderProdutos();
    verificarStatus();
    setInterval(verificarStatus, 60000);
    checarPedidoLocal();

    // Escutar mudanças no storage (caso tenha pedido em outra aba)
    DB.onChange(({ tipo }) => {
        if (tipo === 'pedido_update' && meuPedidoId) {
            // Atualizar tracker se tiver pedido
            abrirAcompanhamento();
        }
    });
}

function verificarStatus() {
    const hora = new Date().getHours();
    const el = document.getElementById('statusLoja');
    if (hora >= 18 && hora < 23) {
        el.className = 'status-badge';
        el.textContent = '● Aberto';
    } else {
        el.className = 'status-badge fechado';
        el.textContent = '● Fechado';
    }
}

// ============ CATEGORIAS ============
function renderCategorias() {
    const el = document.getElementById('categoriasBar');
    el.innerHTML = `<div class="categorias-inner">${
        CARDAPIO.categorias.map(c => `
            <button class="cat-btn ${c.id === categoriaAtiva ? 'active' : ''}" onclick="trocarCategoria('${c.id}')">
                ${c.nome}
            </button>
        `).join('')
    }</div>`;
}

function trocarCategoria(id) {
    categoriaAtiva = id;
    renderCategorias();
    renderProdutos();
    document.querySelector('.produtos-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============ PRODUTOS ============
function renderProdutos(filtro = '') {
    const el = document.getElementById('produtos');
    const termo = filtro.toLowerCase();
    let produtos = CARDAPIO.produtos.filter(p => p.cat === categoriaAtiva);

    if (termo) {
        produtos = CARDAPIO.produtos.filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            p.desc.toLowerCase().includes(termo) ||
            p.tags.some(t => t.toLowerCase().includes(termo))
        );
    }

    const cat = CARDAPIO.categorias.find(c => c.id === categoriaAtiva);
    const titulo = termo ? `Resultados para "${filtro}"` : (cat ? cat.nome : '');

    let html = `<h2 class="categoria-titulo">${titulo}</h2>`;

    if (produtos.length === 0) {
        html += `
        <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <p>Nenhum produto encontrado</p>
        </div>`;
    } else {
        html += produtos.map(p => {
            const precoMin = p.preco || Math.min(...p.tipos.map(t => t.preco));
            return `
            <div class="produto" onclick='abrirOpcoes(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                <div class="produto-img" style="background-image:url('${p.img}');background-size:cover;background-position:center;">${p.emoji}</div>
                <div class="produto-info">
                    <div>
                        <div class="produto-nome">${p.nome}</div>
                        <div class="produto-desc">${p.desc}</div>
                        <div class="produto-tags">
                            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    <div class="produto-bottom">
                        <span class="produto-preco">${BRL(precoMin)}${!p.preco ? ' <small>a partir de</small>' : ''}</span>
                        <button class="btn-add">+ Adicionar</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    el.innerHTML = html;
}

function filtrarProdutos() {
    const termo = document.getElementById('searchInput').value;
    renderProdutos(termo);
}

// ============ MODAL OPÇÕES ============
function abrirOpcoes(p) {
    produtoEmEdicao = p;
    tipoEscolhido = null;

    const modal = document.getElementById('modalOpcoes');
    const titulo = document.getElementById('modalOpcoesTitulo');
    const body = document.getElementById('opcoesBody');

    titulo.innerHTML = `${p.emoji} ${p.nome} <button class="modal-close" onclick="fecharOpcoes()">×</button>`;

    if (p.tipos) {
        body.innerHTML = `
            <p style="color:#999;margin-bottom:14px;font-size:0.9rem;">Escolha o tamanho:</p>
            ${p.tipos.map(t => `
                <div class="tamanho-opcao" onclick="escolherTipo('${t.id}')" data-tipo="${t.id}">
                    <div class="tamanho-opcao-info">
                        <div class="tamanho-opcao-nome">${t.nome}${t.bonus ? `<span class="bonus">${t.bonus}</span>` : ''}</div>
                        <div class="tamanho-opcao-detalhe">${t.detalhe}</div>
                    </div>
                    <div class="tamanho-opcao-preco">${BRL(t.preco)}</div>
                </div>
            `).join('')}
        `;
    } else {
        body.innerHTML = `
            <p style="color:#999;margin-bottom:14px;">Item de preço único:</p>
            <div class="tamanho-opcao selected">
                <div class="tamanho-opcao-info">
                    <div class="tamanho-opcao-nome">${p.nome}</div>
                    <div class="tamanho-opcao-detalhe">${p.desc}</div>
                </div>
                <div class="tamanho-opcao-preco">${BRL(p.preco)}</div>
            </div>
        `;
        tipoEscolhido = { id: 'unico', nome: p.nome, preco: p.preco, detalhe: '' };
    }
    modal.style.display = 'flex';
}

function escolherTipo(id) {
    const tipo = produtoEmEdicao.tipos.find(t => t.id === id);
    tipoEscolhido = tipo;
    document.querySelectorAll('.tamanho-opcao').forEach(el => el.classList.remove('selected'));
    document.querySelector(`[data-tipo="${id}"]`).classList.add('selected');
}

function confirmarOpcoes() {
    if (produtoEmEdicao.tipos && !tipoEscolhido) {
        toast('⚠️ Escolha um tamanho', 'warning');
        return;
    }
    carrinho.push({
        uid: Date.now() + Math.random(),
        produto: produtoEmEdicao,
        tipo: tipoEscolhido,
    });
    atualizarCarrinho();
    fecharOpcoes();
    toast('✅ Adicionado ao carrinho!');
}

function fecharOpcoes() {
    document.getElementById('modalOpcoes').style.display = 'none';
    produtoEmEdicao = null;
    tipoEscolhido = null;
}

// ============ CARRINHO ============
function atualizarCarrinho() {
    const countEl = document.getElementById('carrinhoCount');
    const valorEl = document.getElementById('carrinhoValor');
    const subtotal = carrinho.reduce((s, i) => s + i.tipo.preco, 0);
    const total = calcularTotal();

    if (carrinho.length > 0) {
        countEl.style.display = 'flex';
        countEl.textContent = carrinho.length;
        valorEl.textContent = BRL(total);
    } else {
        countEl.style.display = 'none';
        valorEl.textContent = '';
    }
}

function abrirCarrinho() {
    if (carrinho.length === 0) {
        toast('🛒 Seu carrinho está vazio', 'warning');
        return;
    }
    renderCarrinho();
    document.getElementById('modalCarrinho').style.display = 'flex';
}

function fecharCarrinho() {
    document.getElementById('modalCarrinho').style.display = 'none';
}

function renderCarrinho() {
    const lista = document.getElementById('carrinhoLista');
    if (carrinho.length === 0) {
        lista.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🛒</div>
            <p>Seu carrinho está vazio</p>
        </div>`;
        return;
    }

    lista.innerHTML = carrinho.map((item, idx) => {
        const detalhe = item.tipo.detalhe ? ` • ${item.tipo.detalhe}` : '';
        return `
        <div class="carrinho-item">
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${item.produto.emoji} ${item.produto.nome}</div>
                <div class="carrinho-item-detalhe">${item.tipo.nome}${detalhe}</div>
            </div>
            <span class="carrinho-item-preco">${BRL(item.tipo.preco)}</span>
            <button class="btn-remover" onclick="removerItem(${idx})">🗑️</button>
        </div>
        `;
    }).join('');

    document.getElementById('resumoSubtotal').textContent = BRL(calcularSubtotal());
    document.getElementById('resumoTaxa').textContent = BRL(config.taxaEntrega);
    document.getElementById('resumoTotal').textContent = BRL(calcularTotal());

    if (cupomAplicado) {
        document.getElementById('linhaDesconto').style.display = 'flex';
        const desc = cupomAplicado.tipo === 'percentual'
            ? `-${cupomAplicado.valor}%`
            : `-${BRL(cupomAplicado.valor)}`;
        document.getElementById('descLabel').textContent = `Cupom (${desc})`;
        document.getElementById('resumoDesconto').textContent = cupomAplicado.tipo === 'percentual'
            ? `-${BRL(calcularSubtotal() * cupomAplicado.valor / 100)}`
            : `-${BRL(cupomAplicado.valor)}`;
    } else {
        document.getElementById('linhaDesconto').style.display = 'none';
    }
}

function removerItem(idx) {
    carrinho.splice(idx, 1);
    cupomAplicado = null;
    document.getElementById('cupomInput').value = '';
    document.getElementById('cupomMsg').textContent = '';
    atualizarCarrinho();
    if (carrinho.length === 0) fecharCarrinho();
    else renderCarrinho();
}

function calcularSubtotal() {
    return carrinho.reduce((s, i) => s + i.tipo.preco, 0);
}

function calcularTotal() {
    let total = calcularSubtotal() + (config.taxaEntrega || 0);
    if (cupomAplicado) {
        if (cupomAplicado.tipo === 'percentual') {
            total = total - (calcularSubtotal() * cupomAplicado.valor / 100);
        } else {
            total = Math.max(0, total - cupomAplicado.valor);
        }
    }
    return total;
}

// ============ CUPOM ============
function aplicarCupom() {
    const codigo = document.getElementById('cupomInput').value.trim().toUpperCase();
    const msg = document.getElementById('cupomMsg');
    const cupom = CARDAPIO.cupons[codigo];
    if (cupom) {
        cupomAplicado = cupom;
        msg.className = 'cupom-msg ok';
        msg.textContent = '✅ ' + cupom.desc;
        renderCarrinho();
    } else {
        cupomAplicado = null;
        msg.className = 'cupom-msg err';
        msg.textContent = '❌ Cupom inválido';
        renderCarrinho();
    }
}

function abrirCupom() {
    document.getElementById('cupomInput').value = 'DONNA10';
    abrirCarrinho();
    setTimeout(() => aplicarCupom(), 200);
}

// ============ CHECKOUT ============
function abrirCheckout() {
    if (carrinho.length === 0) {
        toast('⚠️ Carrinho vazio', 'warning');
        return;
    }
    fecharCarrinho();
    document.getElementById('modalCheckout').style.display = 'flex';
    // Listener pra info de pagamento
    const sel = document.getElementById('cliPag');
    sel.addEventListener('change', atualizarPagInfo);
    atualizarPagInfo();
}

function atualizarPagInfo() {
    const pag = document.getElementById('cliPag').value;
    const info = document.getElementById('pagInfo');
    if (pag === 'Pix') {
        info.className = 'checkout-pagamento-info show';
        info.innerHTML = '💡 <strong>Pix:</strong> após enviar o pedido, você receberá a chave Pix no WhatsApp da pizzaria.';
    } else if (pag.startsWith('Cartão')) {
        info.className = 'checkout-pagamento-info show';
        info.innerHTML = '💳 <strong>Cartão na entrega:</strong> leve a maquininha. Taxa pode ser repassada.';
    } else {
        info.className = 'checkout-pagamento-info show';
        info.innerHTML = '💵 <strong>Dinheiro:</strong> informe o troco necessário no campo de observações.';
    }
}

function fecharCheckout() {
    document.getElementById('modalCheckout').style.display = 'none';
}

function finalizarPedido() {
    const nome = document.getElementById('cliNome').value.trim();
    const tel = document.getElementById('cliTel').value.trim();
    const end = document.getElementById('cliEnd').value.trim();
    const pag = document.getElementById('cliPag').value;
    const obs = document.getElementById('cliObs').value.trim();
    const cep = document.getElementById('cliCep').value.trim();

    if (!nome || !tel || !end) {
        toast('⚠️ Preencha nome, telefone e endereço', 'error');
        return;
    }

    // Monta pedido
    const pedido = {
        cliente: { nome, tel, end, cep, pag, obs },
        itens: carrinho.map(i => ({
            nome: i.produto.nome,
            tipo: i.tipo.nome,
            detalhe: i.tipo.detalhe,
            preco: i.tipo.preco,
        })),
        subtotal: calcularSubtotal(),
        taxa: config.taxaEntrega,
        desconto: cupomAplicado ? (cupomAplicado.tipo === 'percentual' ? calcularSubtotal() * cupomAplicado.valor / 100 : cupomAplicado.valor) : 0,
        cupom: cupomAplicado ? cupomAplicado.desc : null,
        total: calcularTotal(),
        // Coordenadas aleatórias próximas a Pé de Serra - BA pra demo
        coords: coordsAleatorias(),
    };

    // Salva no "banco"
    const pedidoSalvo = DB.addPedido(pedido);
    meuPedidoId = pedidoSalvo.id;
    localStorage.setItem('donna_meu_pedido', meuPedidoId);

    // Monta msg WhatsApp
    let msg = `🍕 *NOVO PEDIDO - DONNA PIZZA* #${pedidoSalvo.id.toString().slice(-5)}\n\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📞 *Telefone:* ${tel}\n`;
    msg += `📍 *Endereço:* ${end}${cep ? ` (CEP ${cep})` : ''}\n`;
    msg += `💳 *Pagamento:* ${pag}\n`;
    if (obs) msg += `📝 *Obs:* ${obs}\n`;
    msg += `\n*--- ITENS ---*\n`;
    pedido.itens.forEach((it, i) => {
        msg += `${i+1}. ${it.nome} (${it.tipo})${it.detalhe ? ' • ' + it.detalhe : ''} — ${BRL(it.preco)}\n`;
    });
    msg += `\n*Subtotal:* ${BRL(pedido.subtotal)}\n`;
    msg += `*Taxa entrega:* ${BRL(pedido.taxa)}\n`;
    if (pedido.cupom) msg += `*Cupom:* ${pedido.cupom}\n`;
    if (pedido.desconto > 0) msg += `*Desconto:* -${BRL(pedido.desconto)}\n`;
    msg += `*TOTAL: ${BRL(pedido.total)}* 🎯\n`;

    const zap = config.whatsapp;
    const url = `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;

    // Limpa
    carrinho = [];
    cupomAplicado = null;
    atualizarCarrinho();
    fecharCheckout();

    toast('🚀 Pedido enviado! Acompanhe aqui...');

    // Abre o WhatsApp
    window.open(url, '_blank');

    // Abre o tracker
    setTimeout(() => abrirAcompanhamento(), 500);
}

// Coordenadas aleatórias em volta de Pé de Serra - BA
function coordsAleatorias() {
    // Pé de Serra: aprox -11.83, -39.61
    const baseLat = -11.83;
    const baseLng = -39.61;
    return {
        lat: baseLat + (Math.random() - 0.5) * 0.15,
        lng: baseLng + (Math.random() - 0.5) * 0.15,
    };
}

// ============ ACOMPANHAMENTO ============
function checarPedidoLocal() {
    const id = localStorage.getItem('donna_meu_pedido');
    if (id) {
        meuPedidoId = parseInt(id);
        const pedido = DB.getPedidos().find(p => p.id === meuPedidoId);
        if (pedido && !['entregue', 'cancelado'].includes(pedido.status)) {
            // Pedido ativo, mostra notificação
            setTimeout(() => {
                if (confirm('Você tem um pedido em andamento! Quer acompanhar?')) {
                    abrirAcompanhamento();
                }
            }, 1000);
        }
    }
}

function abrirAcompanhamento() {
    if (!meuPedidoId) {
        toast('Você não tem pedido ativo', 'warning');
        return;
    }
    const pedido = DB.getPedidos().find(p => p.id === meuPedidoId);
    if (!pedido) {
        document.getElementById('pedidoAcompanhamento').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p>Pedido não encontrado</p>
        </div>`;
        document.getElementById('modalAcompanhamento').style.display = 'flex';
        return;
    }

    const statusInfo = {
        novo: { label: 'Pedido recebido!', icon: '✅', tempo: 'Aguardando confirmação...' },
        preparando: { label: 'Preparando', icon: '👨‍🍳', tempo: 'Tempo estimado: 20-30 min' },
        pronto: { label: 'Pronto!', icon: '🍕', tempo: 'Saindo para entrega em breve' },
        em_entrega: { label: 'A caminho!', icon: '🛵', tempo: 'O motoboy está indo até você' },
        entregue: { label: 'Entregue!', icon: '🎉', tempo: 'Bom apetite!' },
    };
    const info = statusInfo[pedido.status] || statusInfo.novo;

    const steps = [
        { key: 'novo', label: 'Pedido recebido', desc: 'Aguardando pizzaria aceitar' },
        { key: 'preparando', label: 'Preparando', desc: 'No forno!' },
        { key: 'pronto', label: 'Saiu pra entrega', desc: 'Motoboy a caminho' },
        { key: 'entregue', label: 'Entregue', desc: 'Bom apetite!' },
    ];

    const stepAtual = ['novo', 'preparando', 'pronto', 'em_entrega', 'entregue'].indexOf(pedido.status);

    let html = `
    <div class="pedido-tracker">
        <div class="tracker-header">
            <div class="tracker-id">PEDIDO #${pedido.id.toString().slice(-5)}</div>
            <div class="tracker-status">${info.icon} ${info.label}</div>
            <div class="tracker-tempo">${info.tempo}</div>
        </div>
        <div class="tracker-steps">
            ${steps.map((s, i) => {
                const status = i < stepAtual ? 'done' : (i === stepAtual ? 'active' : '');
                const icon = i < stepAtual ? '✓' : (i === stepAtual ? info.icon : ['✅', '👨‍🍳', '🛵', '🎉'][i]);
                return `
                <div class="tracker-step ${status}">
                    <div class="tracker-step-icon">${icon}</div>
                    <div class="tracker-step-info">
                        <h4>${s.label}</h4>
                        <p>${s.desc}</p>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        <div style="margin-top:24px;text-align:center;color:var(--gray);font-size:0.85rem;">
            Atualiza automaticamente
        </div>
    </div>
    `;

    document.getElementById('pedidoAcompanhamento').innerHTML = html;
    document.getElementById('modalAcompanhamento').style.display = 'flex';
}

function fecharAcompanhamento() {
    document.getElementById('modalAcompanhamento').style.display = 'none';
}

// ============ TOAST ============
function toast(texto, tipo = '') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast ' + tipo;
    el.textContent = texto;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ============ TEMA ============
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    toast(document.body.classList.contains('light-theme') ? '☀️ Tema claro' : '🌙 Tema escuro');
}

document.addEventListener('DOMContentLoaded', init);
