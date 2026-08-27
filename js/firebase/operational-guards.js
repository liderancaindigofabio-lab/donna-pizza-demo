/* Operational safeguards for the shared UI layer.
 * These checks improve operator feedback and duplicate-click handling only.
 * Firebase Security Rules remain the authority for authorization and integrity.
 */
(function (root) {
  const transitions = Object.freeze({
    novo: ['novo', 'preparando', 'cancelado'],
    preparando: ['preparando', 'novo', 'pronto', 'cancelado'],
    pronto: ['pronto', 'preparando', 'em_entrega', 'cancelado'],
    em_entrega: ['em_entrega', 'entregue', 'problema_entrega', 'cancelado'],
    problema_entrega: ['problema_entrega', 'em_entrega', 'cancelado'],
    aguardando_conta: ['aguardando_conta', 'fechado', 'cancelado'],
    fechado: ['fechado'], entregue: ['entregue'], cancelado: ['cancelado']
  });
  root.NONNA_OPERATIONAL_GUARDS = Object.freeze({
    transitions,
    normalizeStatus(v) { return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '_').replace(/[ -]/g, '_'); },
    canTransition(from, to) {
      const a = this.normalizeStatus(from), b = this.normalizeStatus(to);
      return !!transitions[a] && transitions[a].includes(b);
    },
    positiveAmount(v) { const n = Number(v); return Number.isFinite(n) && n > 0; }
  });
})(window);
