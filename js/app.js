/* ============================================
   DONNA PIZZA — Lógica do app
   ============================================ */

let carrinho = [];
let categoriaAtiva = 'pizzas';
let produtoEmEdicao = null;
let tipoEscolhido = null;
let saboresEscolhidos = [];
let cupomAplicado = null;

const BRL = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

// ============ INIT ============
function init() {
    renderCategorias();
    renderProdutos();
    verificarStatus();
    setInterval(verificarStatus, 60000);
}

function verificarStatus() {
    const hora = new Date().getHours();
    const el = document.getElementById('statusLoja');
    if (hora >= 18 && hora < 23) {
        el.className = 'status-aberto';
        el.textContent = '● Aberto';
    } else {
        el.className = 'status-fechado';
        el.textContent = '● Fechado';
    }
}

// ============ CATEGORIAS ============
function renderCategorias() {
    const el = document.getElementById('categorias');
    el.innerHTML = CARDAPIO.categorias.map(c => `
        <button class="cat-btn ${c.id === categoriaAtiva ? 'active' : ''}" onclick="trocarCategoria('${c.id}')">
            ${c.nome}
        </button>
    `).join('');
}

function trocarCategoria(id) {
    categoriaAtiva = id;
    renderCategorias();
    renderProdutos();
    document.getElementById('produtos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============ PRODUTOS ============
function renderProdutos() {
    const el = document.getElementById('produtos');
    const produtos = CARDAPIO.produtos.filter(p => p.cat === categoriaAtiva);
    const cat = CARDAPIO.categorias.find(c => c.id === categoriaAtiva);

    let html = `<h2 class="categoria-titulo">${cat.icone} ${cat.nome.replace(/^.+ /, '')}</h2>`;

    if (produtos.length === 0) {
        html += '<p style="text-align:center;color:#888;padding:20px;">Nenhum item nesta categoria.</p>';
    } else {
        html += produtos.map(p => {
            const precoMin = p.preco || Math.min(...p.tipos.map(t => t.preco));
            return `
            <div class="produto" onclick='abrirOpcoes(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                <div class="produto-img">${p.emoji}</div>
                <div class="produto-info">
                    <div>
                        <div class="produto-nome">${p.nome}</div>
                        <div class="produto-desc">${p.desc}</div>
                        <div class="produto-tags">
                            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    <div class="produto-bottom">
                        <span class="produto-preco">${BRL(precoMin)}+</span>
                        <button class="btn-add">+ Adicionar</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    el.innerHTML = html;
}

// ============ MODAL DE OPÇÕES (tamanho / sabor) ============
function abrirOpcoes(p) {
    produtoEmEdicao = p;
    tipoEscolhido = null;
    saboresEscolhidos = [];

    const modal = document.getElementById('modalOpcoes');
    const titulo = document.getElementById('modalOpcoesTitulo');
    const body = document.getElementById('opcoesBody');

    if (p.tipos) {
        // Pizza: escolhe tamanho
        titulo.innerHTML = `${p.emoji} ${p.nome} <button class="modal-close" onclick="fecharOpcoes()">×</button>`;
        body.innerHTML = `
            <p style="color:#999;margin-bottom:12px;font-size:0.9rem;">Escolha o tamanho:</p>
            ${p.tipos.map(t => `
                <div class="tamanho-opcao" onclick="escolherTipo('${t.id}')" data-tipo="${t.id}">
                    <div class="tamanho-opcao-info">
                        <div class="tamanho-opcao-nome">${t.nome} ${t.destaque ? `<span style="color:var(--gold);font-size:0.75rem;">${t.destaque}</span>` : ''}</div>
                        <div class="tamanho-opcao-detalhe">${t.detalhe}</div>
                    </div>
                    <div class="tamanho-opcao-preco">${BRL(t.preco)}</div>
                </div>
            `).join('')}
        `;
    } else {
        // Calzone / Bebida: tem preço fixo
        titulo.innerHTML = `${p.emoji} ${p.nome} <button class="modal-close" onclick="fecharOpcoes()">×</button>`;
        body.innerHTML = `
            <p style="color:#999;margin-bottom:12px;">Produto simples, preço fixo:</p>
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
        toast('⚠️ Escolha um tamanho');
        return;
    }
    const item = {
        uid: Date.now() + Math.random(),
        produto: produtoEmEdicao,
        tipo: tipoEscolhido,
    };
    carrinho.push(item);
    atualizarCarrinho();
    fecharOpcoes();
    toast('✅ Adicionado!');
}

function fecharOpcoes() {
    document.getElementById('modalOpcoes').style.display = 'none';
    produtoEmEdicao = null;
    tipoEscolhido = null;
}

// ============ CARRINHO ============
function atualizarCarrinho() {
    const countEl = document.getElementById('carrinhoCount');
    const total = carrinho.length;
    if (total > 0) {
        countEl.style.display = 'flex';
        countEl.textContent = total;
    } else {
        countEl.style.display = 'none';
    }
}

function abrirCarrinho() {
    renderCarrinho();
    document.getElementById('modalCarrinho').style.display = 'flex';
}

function fecharCarrinho() {
    document.getElementById('modalCarrinho').style.display = 'none';
}

function renderCarrinho() {
    const lista = document.getElementById('carrinhoLista');
    if (carrinho.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#888;padding:30px 0;">🛒 Seu carrinho está vazio</p>';
        document.getElementById('carrinhoTotal').textContent = 'R$ 0,00';
        return;
    }

    lista.innerHTML = carrinho.map((item, idx) => {
        const preco = item.tipo.preco;
        return `
        <div class="carrinho-item">
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${item.produto.emoji} ${item.produto.nome}</div>
                <div class="carrinho-item-preco">${item.tipo.nome}${item.tipo.detalhe ? ' • ' + item.tipo.detalhe : ''} • ${BRL(preco)}</div>
            </div>
            <button class="btn-remover" onclick="removerItem(${idx})">🗑️</button>
        </div>
        `;
    }).join('');

    document.getElementById('carrinhoTotal').textContent = BRL(calcularTotal());
}

function removerItem(idx) {
    carrinho.splice(idx, 1);
    atualizarCarrinho();
    renderCarrinho();
}

function calcularTotal() {
    let total = carrinho.reduce((s, i) => s + i.tipo.preco, 0);
    if (cupomAplicado) {
        if (cupomAplicado.tipo === 'percentual') {
            total = total * (1 - cupomAplicado.valor / 100);
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
        msg.textContent = '✅ ' + cupom.desc + ' aplicado!';
        renderCarrinho();
    } else {
        cupomAplicado = null;
        msg.className = 'cupom-msg err';
        msg.textContent = '❌ Cupom inválido';
    }
}

function aplicarCupomDestaque() {
    document.getElementById('cupomInput').value = 'DONNA10';
    abrirCarrinho();
    setTimeout(() => aplicarCupom(), 200);
}

// ============ CHECKOUT ============
function abrirCheckout() {
    if (carrinho.length === 0) {
        toast('⚠️ Carrinho vazio');
        return;
    }
    fecharCarrinho();
    document.getElementById('modalCheckout').style.display = 'flex';
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

    if (!nome || !tel || !end) {
        toast('⚠️ Preencha nome, telefone e endereço');
        return;
    }

    let msg = `🍕 *NOVO PEDIDO - DONNA PIZZA* 🍕\n\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📞 *Telefone:* ${tel}\n`;
    msg += `📍 *Endereço:* ${end}\n`;
    msg += `💳 *Pagamento:* ${pag}\n`;
    if (obs) msg += `📝 *Obs:* ${obs}\n`;
    msg += `\n*--- ITENS DO PEDIDO ---*\n`;
    carrinho.forEach((item, i) => {
        msg += `${i+1}. ${item.produto.nome} (${item.tipo.nome}) - ${BRL(item.tipo.preco)}\n`;
    });
    msg += `\n*Subtotal:* ${BRL(carrinho.reduce((s,i) => s+i.tipo.preco, 0))}\n`;
    if (cupomAplicado) {
        msg += `*Cupom:* ${cupomAplicado.desc}\n`;
    }
    msg += `*TOTAL: ${BRL(calcularTotal())}* 🎯\n`;

    const zap = '5500900000000'; // SUBSTITUIR PELO WHATSAPP DA DONNA PIZZA
    const url = `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Limpa tudo
    carrinho = [];
    cupomAplicado = null;
    atualizarCarrinho();
    fecharCheckout();
    toast('🚀 Pedido enviado! Aguarde confirmação.');
}

// ============ TOAST ============
function toast(texto) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = texto;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// Init
document.addEventListener('DOMContentLoaded', init);
