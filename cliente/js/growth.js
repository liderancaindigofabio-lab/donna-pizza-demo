/* Nonna cliente: crescimento sem alterar o contrato do DB.
 * Favoritos ficam no dispositivo (por telefone quando há cliente logado),
 * portanto não criam registros falsos nem dependem de uma API Firebase nova.
 */
(function () {
    const KEY = 'donna_favoritos_v1';
    const storage = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; } };
    const userKey = () => (window.clienteLogado && clienteLogado.tel ? String(clienteLogado.tel).replace(/\D/g, '') : 'guest');
    const read = () => { const all = storage(); return Array.isArray(all[userKey()]) ? all[userKey()] : []; };
    const write = (items) => { const all = storage(); all[userKey()] = [...new Set(items)]; localStorage.setItem(KEY, JSON.stringify(all)); };
    window.isFavorito = key => read().includes(String(key));
    window.toggleFavorito = (key, ev) => {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        key = String(key); const items = read();
        write(items.includes(key) ? items.filter(x => x !== key) : items.concat(key));
        if (typeof renderProdutos === 'function') renderProdutos(document.getElementById('searchInput')?.value || '');
        if (document.getElementById('modalFavoritos')?.style.display === 'flex') abrirFavoritos();
        toast(items.includes(key) ? '☆ Removido dos favoritos' : '★ Salvo nos favoritos');
    };
    window.favoritoAdicionar = (key) => {
        key = String(key);
        if (key.indexOf('tam_') === 0) abrirBuilderPizza(key.slice(4));
        else {
            const cats = ['calzones','bebidas','combos'];
            for (const cat of cats) {
                const p = (cardapio[cat] || []).find(x => String(x.id) === key);
                if (p) { cat === 'combos' ? adicionarCombo(p) : adicionarItemSimples(p); break; }
            }
        }
        fecharFavoritos();
    };
    window.abrirFavoritos = () => {
        const modal = document.getElementById('modalFavoritos'); if (!modal) return;
        const ids = read(); const all = [];
        (cardapio.tamanhos || []).forEach(t => all.push({ key:'tam_'+t.id, nome:'Pizza '+t.nome, desc:`${t.fatias} fatias`, emoji:'🍕' }));
        ['calzones','bebidas','combos'].forEach(cat => (cardapio[cat] || []).forEach(p => all.push({ key:String(p.id), nome:p.nome, desc:p.desc || '', emoji:p.emoji || '🥟' })));
        const favs = all.filter(p => ids.includes(p.key));
        document.getElementById('favoritosBody').innerHTML = favs.length ? favs.map(p => `<div class="favorito-linha"><span class="favorito-emoji">${p.emoji}</span><span class="favorito-info"><strong>${p.nome}</strong><small>${p.desc}</small></span><button class="btn-add" onclick="favoritoAdicionar('${p.key}')">Adicionar</button><button class="favorito-star" onclick="toggleFavorito('${p.key}',event)" aria-label="Remover favorito">★</button></div>`).join('') : '<div class="historico-vazio"><p>☆ Você ainda não salvou favoritos</p><small>Toque na estrela dos produtos que você mais gosta.</small></div>';
        modal.style.display = 'flex';
    };
    window.fecharFavoritos = () => { const m = document.getElementById('modalFavoritos'); if (m) m.style.display = 'none'; };
})();
