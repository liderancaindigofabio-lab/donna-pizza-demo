/* ============================================
   UTILS DE ENDEREÇO — Função compartilhada
   entre cliente, pizzaria e motoboy.
   ============================================ */

// Formata endereço de pedido pra exibição.
// Aceita pedido OU cliente direto. Funciona com formato NOVO (objeto endereco)
// ou LEGADO (string end + campos soltos).
function formatarEndereco(c) {
    if (!c) return 'Sem endereço';

    // Formato novo: c.endereco existe
    if (c.endereco && typeof c.endereco === 'object') {
        const e = c.endereco;
        const partes = [];
        if (e.rua) {
            let linha = e.rua;
            if (e.numero) linha += `, ${e.numero}`;
            if (e.complemento) linha += ` - ${e.complemento}`;
            partes.push(linha);
        }
        if (e.bairro) partes.push(e.bairro);
        if (e.cidade) partes.push(e.cidade);
        if (e.cep) partes.push(`CEP ${e.cep}`);
        if (partes.length === 0) {
            // Objeto vazio, cai pro legado
            return c.end || 'Endereço não informado';
        }
        return partes.join(' • ');
    }

    // Formato legado: c.end é uma string
    if (c.end) {
        let s = c.end;
        if (c.cep && !s.includes(c.cep)) s += ` • CEP ${c.cep}`;
        return s;
    }
    return 'Endereço não informado';
}

// Versão curta (1 linha) pro cabeçalho do card
function formatarEnderecoCurto(c) {
    const full = formatarEndereco(c);
    return full.length > 60 ? full.substring(0, 60) + '...' : full;
}

// Pega o link do Google Maps pra abrir navegação
// Prioriza as coordenadas (se salvas no pedido); senão monta com endereço
function linkMaps(c, coords) {
    if (coords && coords.lat && coords.lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    }
    if (c && c.endereco && c.endereco.rua) {
        const e = c.endereco;
        const parts = [e.rua, e.numero, e.bairro, e.cidade].filter(Boolean);
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(', '))}`;
    }
    if (c && c.end) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.end)}`;
    }
    return 'https://www.google.com/maps';
}
