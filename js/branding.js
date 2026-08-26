/* Applies operation identity consistently without trusting arbitrary markup/URLs. */
(function () {
  'use strict';
  const HEX = /^#[0-9a-f]{6}$/i;
  const safeColor = (v, fallback) => HEX.test(String(v || '')) ? String(v) : fallback;
  const safeImage = v => { const s = String(v || '').trim(); return /^(?:https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(s) ? s : ''; };
  const config = () => window.DB && typeof DB.getConfig === 'function' ? (DB.getConfig() || {}) : {};
  function apply(c) {
    c = c || config();
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', safeColor(c.corPrimaria, '#ae8035'));
    root.style.setProperty('--brand-accent', safeColor(c.corDestaque, '#171614'));
    // Existing themes consume these aliases; defaults remain intact when unset.
    root.style.setProperty('--gold', 'var(--brand-primary)');
    root.style.setProperty('--red', 'var(--brand-primary)');
    root.style.setProperty('--ink', 'var(--brand-accent)');
    document.querySelectorAll('.brand-emoji,.brand-icon,[data-donna-brand-logo]').forEach(img => {
      const src = safeImage(c.logoData); if (src) img.src = src;
      img.alt = String(c.nome || 'Pizzaria');
    });
    const src = safeImage(c.logoData);
    document.querySelectorAll('.brand-mark').forEach(mark => {
      if (src) mark.innerHTML = `<img src="${src.replace(/&/g, '&amp;').replace(/\"/g, '&quot;')}" alt="${String(c.nome || 'Pizzaria').replace(/\"/g, '&quot;')}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">`;
    });
    document.querySelectorAll('[data-donna-brand-name]').forEach(el => { el.textContent = c.nome || 'Pizzaria'; });
    document.querySelectorAll('[data-donna-brand-cnpj]').forEach(el => { el.textContent = c.cnpj ? 'CNPJ ' + c.cnpj : ''; el.hidden = !c.cnpj; });
  }
  window.NONNA_BRANDING = { apply, safeImage, safeColor };
  window.addEventListener('nonna_db_ready', () => apply());
  window.addEventListener('nonna_config_update', e => apply(e.detail || config()));
})();
