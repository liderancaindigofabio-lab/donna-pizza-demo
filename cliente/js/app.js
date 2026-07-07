/* ============================================
   NONNA PIZZARIA — Lógica do cliente (v2)
   - Fluxo: TAMANHO → SABOR (até 2)
   - Salva cliente automaticamente
   - Histórico de pedidos
   ============================================ */

let carrinho = [];
let categoriaAtiva = 'pizzas';
let cupomAplicado = null;
let meuPedidoId = null;
let clienteLogado = null; // cliente salvo (autopreenchimento)
let pizzaBuilder = null;  // { tamanho, sabores: [], adicionais: [] }

const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const config = DB.getConfig();
const cardapio = DB.getCardapio();

// ============ INIT ============
function init() {
    clienteLogado = DB.getClienteLogado();

    renderCategorias();
    renderProdutos();
    renderHeaderCliente();
    verificarStatus();
    setInterval(verificarStatus, 60000);
    checarPedidoLocal();

    DB.onChange(({ tipo, data }) => {
        if (tipo === 'cardapio_update') {
            // recarrega cardápio se pizzaria editou
            location.reload();
        }
        if (tipo === 'pedido_update' && meuPedidoId) {
            abrirAcompanhamento();
        }
        if (tipo === 'cliente_update' && clienteLogado && data.tel === clienteLogado.tel) {
            clienteLogado = data;
            renderHeaderCliente();
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

// ============ HEADER DO CLIENTE (se logado) ============
function renderHeaderCliente() {
    const el = document.getElementById('clienteHeader');
    if (!el) return;
    if (clienteLogado) {
        el.style.display = 'flex';
        const primeiroNome = (clienteLogado.nome || '').split(' ')[0].slice(0, 12) || 'Cliente';
        el.innerHTML = `
            <div class="cli-avatar">👤</div>
            <div class="cli-info-header">
                <div class="cli-nome-header">Olá, ${primeiroNome}!</div>
                <div class="cli-tel-header">${clienteLogado.tel}</div>
            </div>
            <div class="cli-acoes">
                <button class="btn-mini" onclick="abrirMeusPedidos()" title="Meus pedidos">📋</button>
                <button class="btn-mini ghost" onclick="logoutCliente()" title="Sair">↩</button>
            </div>
        `;
    } else {
        el.style.display = 'none';
    }
}

function logoutCliente() {
    if (!confirm('Sair da sua conta? Seus dados não serão mais preenchidos automaticamente.')) return;
    DB.logoutCliente();
    clienteLogado = null;
    renderHeaderCliente();
    toast('Você saiu da conta');
}

// ============ CATEGORIAS ============
function renderCategorias() {
    const el = document.getElementById('categoriasBar');
    const cats = [
        { id: 'pizzas',   icone: '🍕', nome: 'Pizzas' },
        { id: 'calzones', icone: '🥟', nome: 'Calzones' },
        { id: 'bebidas',  icone: '🥤', nome: 'Bebidas' },
        { id: 'combos',   icone: '🎁', nome: 'Combos' },
    ];
    el.innerHTML = `<div class="categorias-inner">${
        cats.map(c => `
            <button class="cat-btn ${c.id === categoriaAtiva ? 'active' : ''}" onclick="trocarCategoria('${c.id}')">
                <span class="cat-icone">${c.icone}</span>
                <span class="cat-nome">${c.nome}</span>
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
    let produtos = [];
    let titulo = '';

    if (categoriaAtiva === 'pizzas') {
        titulo = '🍕 Monte sua Pizza';
        // Pizza: mostra por tamanho, escolhe sabor depois
        produtos = cardapio.tamanhos.map(t => {
            const precos = Object.values(cardapio.precos_base).map(p => p[t.id]);
            const precoMin = Math.min(...precos);
            const precoMax = Math.max(...precos);
            return {
                tipo: 'tamanho',
                id: `tam_${t.id}`,
                tamanho: t,
                nome: `Pizza ${t.nome}`,
                desc: `${t.fatias} fatias • até ${t.qtdSabores} ${t.qtdSabores === 1 ? 'sabor' : 'sabores'}`,
                precoMin, precoMax,
                emoji: t.id === 'P' ? '🍕' : t.id === 'M' ? '🍕' : '🍕',
            };
        });
    } else if (categoriaAtiva === 'calzones') {
        titulo = '🥟 Calzones';
        produtos = cardapio.calzones.map(c => ({
            tipo: 'calzone',
            ...c,
        }));
    } else if (categoriaAtiva === 'bebidas') {
        titulo = '🥤 Bebidas';
        produtos = cardapio.bebidas.map(b => ({
            tipo: 'bebida',
            ...b,
        }));
    } else if (categoriaAtiva === 'combos') {
        titulo = '🎁 Combos Promocionais';
        produtos = cardapio.combos.map(c => ({
            tipo: 'combo',
            ...c,
        }));
    }

    // Filtro
    if (termo) {
        produtos = produtos.filter(p => (p.nome || '').toLowerCase().includes(termo) || (p.desc || '').toLowerCase().includes(termo));
    }

    let html = `<h2 class="categoria-titulo">${titulo}</h2>`;

    if (produtos.length === 0) {
        html += `<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Nenhum produto encontrado</p></div>`;
    } else {
        html += produtos.map(p => {
            if (p.tipo === 'tamanho') {
                const precoTexto = p.precoMin === p.precoMax
                    ? BRL(p.precoMin)
                    : `${BRL(p.precoMin)} — ${BRL(p.precoMax)}`;
                return `
                <div class="produto produto-tamanho" onclick="abrirBuilderPizza('${p.tamanho.id}')">
                    <div class="produto-img">${p.emoji}</div>
                    <div class="produto-info">
                        <div>
                            <div class="produto-nome">${p.nome}</div>
                            <div class="produto-desc">${p.desc}</div>
                        </div>
                        <div class="produto-bottom">
                            <span class="produto-preco">${precoTexto}</span>
                            <button class="btn-add">Montar →</button>
                        </div>
                    </div>
                </div>`;
            } else if (p.tipo === 'combo') {
                return `
                <div class="produto produto-combo" onclick='adicionarCombo(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    <div class="produto-img combo">${p.emoji}</div>
                    <div class="produto-info">
                        <div>
                            <div class="produto-nome">${p.nome}</div>
                            <div class="produto-desc">${p.desc}</div>
                            <div class="produto-tags"><span class="tag combo">🎁 ECONOMIZE</span></div>
                        </div>
                        <div class="produto-bottom">
                            <span class="produto-preco">${BRL(p.preco)}</span>
                            <button class="btn-add">+ Adicionar</button>
                        </div>
                    </div>
                </div>`;
            } else {
                return `
                <div class="produto" onclick='adicionarItemSimples(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    <div class="produto-img">${p.emoji || '🥟'}</div>
                    <div class="produto-info">
                        <div>
                            <div class="produto-nome">${p.nome}</div>
                            <div class="produto-desc">${p.desc || ''}</div>
                        </div>
                        <div class="produto-bottom">
                            <span class="produto-preco">${BRL(p.preco)}</span>
                            <button class="btn-add">+ Adicionar</button>
                        </div>
                    </div>
                </div>`;
            }
        }).join('');
    }

    el.innerHTML = html;
}

function filtrarProdutos() {
    const termo = document.getElementById('searchInput').value;
    renderProdutos(termo);
}

// ============ BUILDER DE PIZZA (NOVO FLUXO) ============
function abrirBuilderPizza(tamanhoId) {
    const tamanho = cardapio.tamanhos.find(t => t.id === tamanhoId);
    pizzaBuilder = {
        tamanho,
        sabores: [],
        adicionais: [],
    };
    renderBuilder();
    const modal = document.getElementById('modalOpcoes');
    modal.style.display = 'flex';
    modal.style.alignItems = 'flex-end';
}

function renderBuilder() {
    const titulo = document.getElementById('modalOpcoesTitulo');
    const body = document.getElementById('opcoesBody');
    titulo.innerHTML = `🍕 Pizza ${pizzaBuilder.tamanho.nome}`;

    const saboresSalgados = cardapio.sabores.filter(s => s.cat === 'salgada');
    const saboresDoces = cardapio.sabores.filter(s => s.cat === 'doce');
    const maxSabores = pizzaBuilder.tamanho.qtdSabores;

    body.innerHTML = `
    <div class="builder-tamanho-selecionado">
        <div class="bts-info">
            <strong>Tamanho:</strong> ${pizzaBuilder.tamanho.nome} (${pizzaBuilder.tamanho.fatias} fatias)
        </div>
        <div class="bts-info">
            <strong>Sabores:</strong> <span id="btsCount">${pizzaBuilder.sabores.length}/${maxSabores}</span> — escolha até ${maxSabores}
        </div>
    </div>

    <h3 class="builder-secao">1. Escolha ${maxSabores === 1 ? 'o sabor' : 'os sabores'} (${pizzaBuilder.sabores.length}/${maxSabores})</h3>

    <div class="builder-grupo-titulo">🍕 Salgadas</div>
    <div class="builder-sabores">
        ${saboresSalgados.map(s => {
            const preco = cardapio.precos_base[s.id]?.[pizzaBuilder.tamanho.id] || 0;
            const selecionado = pizzaBuilder.sabores.find(x => x.id === s.id);
            return `
            <div class="sabor-opcao ${selecionado ? 'selected' : ''}" onclick="toggleSabor('${s.id}')">
                <div class="sabor-info">
                    <div class="sabor-nome">${s.nome}</div>
                    <div class="sabor-desc">${s.desc}</div>
                </div>
                <div class="sabor-preco">${BRL(preco)}</div>
            </div>`;
        }).join('')}
    </div>

    <div class="builder-grupo-titulo">🍫 Doces</div>
    <div class="builder-sabores">
        ${saboresDoces.map(s => {
            const preco = cardapio.precos_base[s.id]?.[pizzaBuilder.tamanho.id] || 0;
            const selecionado = pizzaBuilder.sabores.find(x => x.id === s.id);
            return `
            <div class="sabor-opcao ${selecionado ? 'selected' : ''}" onclick="toggleSabor('${s.id}')">
                <div class="sabor-info">
                    <div class="sabor-nome">${s.nome}</div>
                    <div class="sabor-desc">${s.desc}</div>
                </div>
                <div class="sabor-preco">${BRL(preco)}</div>
            </div>`;
        }).join('')}
    </div>

    <h3 class="builder-secao">2. Adicionais (opcional)</h3>
    <div class="builder-adicionais">
        ${cardapio.adicionais.map(a => {
            const preco = a.preco[pizzaBuilder.tamanho.id] || 0;
            const selecionado = pizzaBuilder.adicionais.find(x => x.id === a.id);
            return `
            <div class="adicional-opcao ${selecionado ? 'selected' : ''}" onclick="toggleAdicional('${a.id}')">
                <div class="adicional-check">${selecionado ? '✓' : '+'}</div>
                <div class="adicional-nome">${a.nome}</div>
                <div class="adicional-preco">+${BRL(preco)}</div>
            </div>`;
        }).join('')}
    </div>

    <div class="builder-resumo">
        <div class="builder-resumo-linha">
            <span>Pizza ${pizzaBuilder.tamanho.nome}</span>
            <span id="builderPrecoPizza">${BRL(calcularPrecoPizza())}</span>
        </div>
        <div class="builder-resumo-linha">
            <span>Adicionais</span>
            <span id="builderPrecoAdicionais">${BRL(calcularPrecoAdicionais())}</span>
        </div>
        <div class="builder-resumo-linha builder-resumo-total">
            <span>Total desta pizza</span>
            <span id="builderPrecoTotal">${BRL(calcularPrecoPizza() + calcularPrecoAdicionais())}</span>
        </div>
    </div>

    <button class="btn-confirmar" onclick="confirmarBuilder()" ${pizzaBuilder.sabores.length === 0 ? 'disabled' : ''}>
        ${pizzaBuilder.sabores.length === 0 ? 'Escolha pelo menos 1 sabor' : `Adicionar ao carrinho (${BRL(calcularPrecoPizza() + calcularPrecoAdicionais())})`}
    </button>
    `;
}

function toggleSabor(saborId) {
    const idx = pizzaBuilder.sabores.findIndex(s => s.id === saborId);
    if (idx >= 0) {
        pizzaBuilder.sabores.splice(idx, 1);
    } else {
        if (pizzaBuilder.sabores.length >= pizzaBuilder.tamanho.qtdSabores) {
            toast(`⚠️ ${pizzaBuilder.tamanho.nome} permite só ${pizzaBuilder.tamanho.qtdSabores} ${pizzaBuilder.tamanho.qtdSabores === 1 ? 'sabor' : 'sabores'}`, 'warning');
            return;
        }
        const sabor = cardapio.sabores.find(s => s.id === saborId);
        pizzaBuilder.sabores.push(sabor);
    }
    renderBuilder();
}

function toggleAdicional(adId) {
    const idx = pizzaBuilder.adicionais.findIndex(a => a.id === adId);
    if (idx >= 0) {
        pizzaBuilder.adicionais.splice(idx, 1);
    } else {
        const adicional = cardapio.adicionais.find(a => a.id === adId);
        pizzaBuilder.adicionais.push(adicional);
    }
    renderBuilder();
}

function calcularPrecoPizza() {
    if (pizzaBuilder.sabores.length === 0) return 0;
    // Prevalecer o maior preço
    const precos = pizzaBuilder.sabores.map(s => cardapio.precos_base[s.id]?.[pizzaBuilder.tamanho.id] || 0);
    return Math.max(...precos);
}

function calcularPrecoAdicionais() {
    return pizzaBuilder.adicionais.reduce((s, a) => s + (a.preco[pizzaBuilder.tamanho.id] || 0), 0);
}

function confirmarBuilder() {
    if (pizzaBuilder.sabores.length === 0) {
        toast('⚠️ Escolha pelo menos 1 sabor', 'warning');
        return;
    }
    const saboresTexto = pizzaBuilder.sabores.map(s => s.nome).join(' + ');
    const adicionaisTexto = pizzaBuilder.adicionais.length > 0
        ? ' + ' + pizzaBuilder.adicionais.map(a => a.nome).join(', ')
        : '';
    const precoPizza = calcularPrecoPizza();
    const precoAdic = calcularPrecoAdicionais();
    const precoTotal = precoPizza + precoAdic;

    carrinho.push({
        uid: Date.now() + Math.random(),
        tipo: 'pizza',
        nome: `Pizza ${pizzaBuilder.tamanho.nome} (${saboresTexto}${adicionaisTexto ? ', ' + pizzaBuilder.adicionais.map(a => a.nome).join(', ') : ''})`,
        descricao: `${pizzaBuilder.tamanho.fatias} fatias • ${pizzaBuilder.tamanho.qtdSabores} ${pizzaBuilder.tamanho.qtdSabores === 1 ? 'sabor' : 'sabores'}`,
        sabores: pizzaBuilder.sabores.map(s => s.nome),
        tamanho: pizzaBuilder.tamanho.nome,
        adicionais: pizzaBuilder.adicionais.map(a => a.nome),
        preco: precoTotal,
    });
    atualizarCarrinho();
    fecharOpcoes();
    toast(`✅ Pizza ${pizzaBuilder.tamanho.nome} adicionada!`);
}

function fecharOpcoes() {
    document.getElementById('modalOpcoes').style.display = 'none';
    pizzaBuilder = null;
}

// ============ ITENS SIMPLES (calzone, bebida) ============
function adicionarItemSimples(p) {
    carrinho.push({
        uid: Date.now() + Math.random(),
        tipo: 'item',
        nome: p.nome,
        descricao: p.desc || '',
        preco: p.preco,
    });
    atualizarCarrinho();
    toast(`✅ ${p.nome} adicionado!`);
}

function adicionarCombo(p) {
    carrinho.push({
        uid: Date.now() + Math.random(),
        tipo: 'combo',
        nome: p.nome,
        descricao: p.desc,
        preco: p.preco,
    });
    atualizarCarrinho();
    toast(`🎁 ${p.nome} adicionado!`);
}

// ============ CARRINHO ============
function atualizarCarrinho() {
    const countEl = document.getElementById('carrinhoCount');
    const valorEl = document.getElementById('carrinhoValor');
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
        lista.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Seu carrinho está vazio</p></div>`;
        return;
    }
    lista.innerHTML = carrinho.map((item, idx) => `
        <div class="carrinho-item">
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${item.nome}</div>
                ${item.descricao ? `<div class="carrinho-item-detalhe">${item.descricao}</div>` : ''}
            </div>
            <span class="carrinho-item-preco">${BRL(item.preco)}</span>
            <button class="btn-remover" onclick="removerItem(${idx})">🗑️</button>
        </div>
    `).join('');

    document.getElementById('resumoSubtotal').textContent = BRL(calcularSubtotal());
    document.getElementById('resumoTaxa').textContent = BRL(config.taxaEntrega || 0);
    document.getElementById('resumoTotal').textContent = BRL(calcularTotal());

    if (cupomAplicado) {
        document.getElementById('linhaDesconto').style.display = 'flex';
        const desc = cupomAplicado.tipo === 'percentual' ? `-${cupomAplicado.valor}%` : `-${BRL(cupomAplicado.valor)}`;
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
    return carrinho.reduce((s, i) => s + i.preco, 0);
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
    const cupom = cardapio.cupons[codigo];
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
    document.getElementById('cupomInput').value = 'NONNA10';
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
    // Preenche com dados salvos
    if (clienteLogado) {
        document.getElementById('cliNome').value = clienteLogado.nome || '';
        document.getElementById('cliTel').value = clienteLogado.tel || '';
        document.getElementById('cliEnd').value = clienteLogado.end || '';
        document.getElementById('cliCep').value = clienteLogado.cep || '';
        document.getElementById('cliRef').value = clienteLogado.ref || '';
    } else {
        document.getElementById('cliNome').value = '';
        document.getElementById('cliTel').value = '';
        document.getElementById('cliEnd').value = '';
        document.getElementById('cliCep').value = '';
        document.getElementById('cliRef').value = '';
    }
    document.getElementById('modalCheckout').style.display = 'flex';
    const sel = document.getElementById('cliPag');
    sel.removeEventListener('change', atualizarPagInfo);
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
    const ref = document.getElementById('cliRef').value.trim();

    if (!nome || !tel || !end) {
        toast('⚠️ Preencha nome, telefone e endereço', 'error');
        return;
    }
    if (tel.replace(/\D/g, '').length < 10) {
        toast('⚠️ Telefone inválido', 'error');
        return;
    }

    // Salva o cliente pra próxima vez
    const clienteSalvo = DB.salvarCliente({ nome, tel, end, cep, ref });
    DB.setClienteLogado(tel);
    clienteLogado = clienteSalvo;
    renderHeaderCliente();

    const pedido = {
        cliente: { nome, tel, end, cep, ref, pag, obs },
        itens: carrinho.map(i => ({
            nome: i.nome,
            descricao: i.descricao,
            tipo: i.tipo,
            sabores: i.sabores || [],
            tamanho: i.tamanho,
            adicionais: i.adicionais || [],
            preco: i.preco,
        })),
        subtotal: calcularSubtotal(),
        taxa: config.taxaEntrega,
        desconto: cupomAplicado ? (cupomAplicado.tipo === 'percentual' ? calcularSubtotal() * cupomAplicado.valor / 100 : cupomAplicado.valor) : 0,
        cupom: cupomAplicado ? cupomAplicado.codigo || cupomAplicado.desc : null,
        total: calcularTotal(),
        coords: coordsAleatorias(),
    };

    const pedidoSalvo = DB.addPedido(pedido);
    meuPedidoId = pedidoSalvo.id;
    localStorage.setItem('donna_meu_pedido', meuPedidoId);

    // Mensagem WhatsApp
    let msg = `🍕 *NOVO PEDIDO - NONNA PIZZARIA* #${pedidoSalvo.id.toString().slice(-5)}\n\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📞 *Telefone:* ${tel}\n`;
    msg += `📍 *Endereço:* ${end}${cep ? ` (CEP ${cep})` : ''}\n`;
    if (ref) msg += `🏠 *Referência:* ${ref}\n`;
    msg += `💳 *Pagamento:* ${pag}\n`;
    if (obs) msg += `📝 *Obs:* ${obs}\n`;
    msg += `\n*--- ITENS ---*\n`;
    pedido.itens.forEach((it, i) => {
        msg += `${i + 1}. ${it.nome}${it.descricao ? ' — ' + it.descricao : ''} (${BRL(it.preco)})\n`;
    });
    msg += `\n*Subtotal:* ${BRL(pedido.subtotal)}\n`;
    msg += `*Taxa entrega:* ${BRL(pedido.taxa)}\n`;
    if (pedido.cupom) msg += `*Cupom:* ${pedido.cupom}\n`;
    if (pedido.desconto > 0) msg += `*Desconto:* -${BRL(pedido.desconto)}\n`;
    msg += `*TOTAL: ${BRL(pedido.total)}* 🎯\n`;

    const zap = config.whatsapp;
    const url = `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;

    carrinho = [];
    cupomAplicado = null;
    atualizarCarrinho();
    fecharCheckout();

    toast('🚀 Pedido enviado! Acompanhe aqui...');
    setTimeout(() => abrirAcompanhamento(), 300);
}

function coordsAleatorias() {
    return {
        lat: -11.83 + (Math.random() - 0.5) * 0.15,
        lng: -39.61 + (Math.random() - 0.5) * 0.15,
    };
}

// ============ HISTÓRICO DO CLIENTE ============
function abrirMeusPedidos() {
    if (!clienteLogado) {
        toast('Faça um pedido primeiro pra ter histórico', 'warning');
        return;
    }
    const pedidos = DB.getPedidosCliente(clienteLogado.tel);
    const stats = DB.getEstatisticasCliente(clienteLogado.tel);
    const primeiroNome = clienteLogado.nome.split(' ')[0];

    const modal = document.getElementById('modalMeusPedidos');
    document.getElementById('meusPedidosBody').innerHTML = `
        <div class="perfil-bloco">
            <div class="perfil-bloco-titulo">👤 Olá, ${primeiroNome}!</div>
            <div class="perfil-linha">
                <span class="perfil-label">📱 Telefone</span>
                <span class="perfil-valor">${clienteLogado.tel}</span>
            </div>
            <div class="perfil-linha">
                <span class="perfil-label">📍 Endereço</span>
                <span class="perfil-valor">${clienteLogado.endereco || 'Não cadastrado'}</span>
            </div>
            <div class="perfil-linha">
                <span class="perfil-label">💜 Cliente desde</span>
                <span class="perfil-valor">${new Date(clienteLogado.criadoEm || Date.now()).toLocaleDateString('pt-BR')}</span>
            </div>
        </div>

        <div class="meus-pedidos-stats">
            <div class="stat-mini">
                <div class="stat-mini-num">${stats.total}</div>
                <div class="stat-mini-label">Pedidos</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-num">${stats.entregues}</div>
                <div class="stat-mini-label">Entregues</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-num">${BRL(stats.gastoTotal)}</div>
                <div class="stat-mini-label">Gasto total</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-num">${BRL(stats.ticketMedio)}</div>
                <div class="stat-mini-label">Ticket médio</div>
            </div>
        </div>

        <h3 class="historico-titulo">📦 Seus pedidos</h3>
        ${pedidos.length === 0 ?
            '<div class="historico-vazio"><p>🍕 Você ainda não fez nenhum pedido</p><small>Que tal experimentar uma Nonna delícia?</small></div>' :
            pedidos.map(p => {
                const statusLabel = {
                    novo:       { txt: 'Recebido',    cor: 'novo' },
                    preparando: { txt: 'Preparando',  cor: 'preparando' },
                    pronto:     { txt: 'Pronto',      cor: 'pronto' },
                    em_entrega: { txt: 'A caminho',   cor: 'entrega' },
                    entregue:   { txt: 'Entregue',    cor: 'entregue' },
                    cancelado:  { txt: 'Cancelado',   cor: 'cancelado' },
                }[p.status] || { txt: p.status, cor: '' };
                let motoboy = null;
                try { motoboy = p.motoboyId ? DB.getMotoboy(p.motoboyId) : null; } catch(e) { motoboy = null; }
                return `
                <div class="mpi-card">
                    <div class="mpi-header">
                        <span class="mpi-id">#${p.id.toString().slice(-5)}</span>
                        <span class="mpi-status ${statusLabel.cor}">${statusLabel.txt}</span>
                    </div>
                    <div class="mpi-itens">${p.itens.map(i => i.nome).join(', ')}</div>
                    <div class="mpi-footer">
                        <span>${BRL(p.total)} • ${new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
                        ${motoboy ? `<span class="mpi-motoboy">🛵 ${motoboy.nome}</span>` : ''}
                    </div>
                </div>`;
            }).join('')
        }

        <div class="perfil-bloco perfil-bloco-acoes">
            <button class="btn-mini ghost" onclick="logoutCliente()">🚪 Sair da conta</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function fecharMeusPedidos() {
    document.getElementById('modalMeusPedidos').style.display = 'none';
}

// ============ ACOMPANHAMENTO ============
function checarPedidoLocal() {
    const id = localStorage.getItem('donna_meu_pedido');
    if (id) {
        meuPedidoId = parseInt(id);
        const pedido = DB.getPedidos().find(p => p.id === meuPedidoId);
        if (pedido && !['entregue', 'cancelado'].includes(pedido.status)) {
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
        document.getElementById('pedidoAcompanhamento').innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>Pedido não encontrado</p></div>`;
        document.getElementById('modalAcompanhamento').style.display = 'flex';
        return;
    }

    const statusInfo = {
        novo:        { label: 'Pedido recebido!', icon: '✅', tempo: 'Aguardando confirmação da pizzaria' },
        preparando:  { label: 'Preparando com carinho', icon: '👨‍🍳', tempo: 'Tempo estimado: 15-25 min' },
        pronto:      { label: 'Pizza pronta!', icon: '🍕', tempo: 'Saindo para entrega em instantes' },
        em_entrega:  { label: 'A caminho!', icon: '🛵', tempo: 'Seu motoboy está a caminho' },
        entregue:    { label: 'Entregue!', icon: '🎉', tempo: 'Bom apetite! Avalie seu pedido' },
        cancelado:   { label: 'Pedido cancelado', icon: '❌', tempo: '' },
    };
    const info = statusInfo[pedido.status] || statusInfo.novo;

    const steps = [
        { key: 'novo',       label: 'Pedido recebido',  icon: '✅',     desc: 'Confirmado pela pizzaria' },
        { key: 'preparando', label: 'Preparando',       icon: '👨‍🍳',  desc: 'Massa, molho e forno' },
        { key: 'em_entrega', label: 'A caminho',        icon: '🛵',     desc: 'Motoboy saiu para entrega' },
        { key: 'entregue',   label: 'Entregue',         icon: '🎉',     desc: 'Pedido concluído' },
    ];

    const stepAtual = ['novo', 'preparando', 'pronto', 'em_entrega', 'entregue'].indexOf(pedido.status);
    let motoboy = null;
    try { motoboy = pedido.motoboyId ? DB.getMotoboy(pedido.motoboyId) : null; } catch (e) { motoboy = null; }
    const totalItens = (pedido.itens || []).reduce((acc, i) => acc + (i.qtd || 1), 0);
    const criado = new Date(pedido.criadoEm);
    const horaFormatada = criado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let html = `
    <div class="pedido-tracker">
        <div class="tracker-header">
            <div class="tracker-id">PEDIDO #${pedido.id.toString().slice(-5)} • ${horaFormatada}</div>
            <div class="tracker-status">${info.icon} ${info.label}</div>
            ${info.tempo ? `<div class="tracker-tempo">⏱️ ${info.tempo}</div>` : ''}
            ${motoboy ? `<div class="tracker-motoboy">🛵 Entregador: <strong>${motoboy.nome}</strong></div>` : ''}
        </div>
        <div class="tracker-steps">
            ${steps.map((s, i) => {
                const status = i < stepAtual ? 'done' : (i === stepAtual ? 'active' : '');
                const icon = i < stepAtual ? '✓' : (i === stepAtual ? info.icon : s.icon);
                return `<div class="tracker-step ${status}">
                    <div class="tracker-step-icon">${icon}</div>
                    <div class="tracker-step-info">
                        <h4>${s.label}</h4>
                        <p>${s.desc}</p>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>
    <div class="tracker-resumo">
        <div class="tracker-resumo-linha">
            <span>Itens no pedido</span>
            <strong>${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</strong>
        </div>
        <div class="tracker-resumo-linha">
            <span>Forma de pagamento</span>
            <strong>${pedido.pagamento || '—'}</strong>
        </div>
        <div class="tracker-resumo-linha total">
            <span>Total</span>
            <strong>${BRL(pedido.total)}</strong>
        </div>
    </div>
    ${pedido.status === 'em_entrega' ? `
    <div class="tracker-map">
        🗺️ Mapa em tempo real disponível em breve
    </div>` : ''}`;

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

function toggleTheme() {
    // Mantém o mesmo tom de creme/bege em todos os modos, sem inverter cores
    toast('☀️ Nonna Pizzaria');
}

document.addEventListener('DOMContentLoaded', init);
