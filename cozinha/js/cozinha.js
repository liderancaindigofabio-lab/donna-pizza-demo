/* NONNA Cozinha — KDS ligado ao DB compartilhado. Sem dados de demonstração. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STATUS=['novo','preparando','pronto'];
  let started=false, sound=false, tick;
  const label={novo:'Recebido',preparando:'Em preparo',pronto:'Pronto'};
  function pedidos(){return (window.DB&&DB.getPedidos?DB.getPedidos():[]).filter(p=>p&&STATUS.includes(String(p.status||'novo')));}
  function dateOf(p){const d=new Date(p.criadoEm||p.createdAt||p.updatedAt);return Number.isNaN(d.getTime())?null:d}
  function elapsed(p){const d=dateOf(p);return d?Math.max(0,Date.now()-d.getTime()):0}
  function duration(ms){const min=Math.floor(ms/60000),sec=Math.floor(ms/1000)%60;return min+'min '+String(sec).padStart(2,'0')+'s'}
  function deadline(){const cfg=DB.getConfig?DB.getConfig():{};const n=Number(cfg&&cfg.tempoPreparo);return Number.isFinite(n)&&n>0?n:25}
  function itemName(i){return i&&String(i.nome||i.name||i.produto||'Item sem nome')}
  function itemQty(i){return Number(i&& (i.quantidade??i.qtd??i.quantity))||1}
  function items(p){return Array.isArray(p.itens)?p.itens:(Array.isArray(p.items)?p.items:[])}
  function place(p){return p.mesa?'Mesa '+p.mesa:(p.tipoEntrega==='retirada'||p.endereco&&p.endereco.tipo==='retirada'?'Retirada':'Entrega')}
  function card(p){
    const ms=elapsed(p), overdue=ms>deadline()*60000;
    const customer=p.cliente&&p.cliente.nome?p.cliente.nome:(p.nomeCliente||'Cliente');
    const list=items(p).map(i=>`<li><span class="qty">${itemQty(i)}×</span><span>${esc(itemName(i))}${i&& (i.observacao||i.obs)?`<small class="item-note">${esc(i.observacao||i.obs)}</small>`:''}</span></li>`).join('');
    const next=p.status==='novo'?'preparando':p.status==='preparando'?'pronto':null;
    const action=p.status==='pronto'?'<button class="action secondary" data-status="preparando">Voltar ao preparo</button>':`<button class="action" data-status="${next}">${next==='pronto'?'Marcar pronto':'Iniciar preparo'}</button>`;
    return `<article class="order-card${overdue?' is-overdue':''}" data-id="${esc(p.id)}" data-created="${esc((dateOf(p)||new Date()).toISOString())}"><div class="order-top"><div><div class="order-number">#${esc(String(p.id).slice(-5))}</div><span class="order-place">${esc(place(p))}</span></div><time class="elapsed" title="${overdue?'Acima do tempo previsto':'Tempo de espera'}">${overdue?'⚠ ':''}${duration(ms)}</time></div><div class="customer">${esc(customer)}</div><ul class="items">${list||'<li><span>Itens não informados</span></li>'}</ul><div class="order-actions" role="group" aria-label="Ações do pedido"><button class="action secondary" data-status="${p.status==='novo'?'novo':'preparando'}">${p.status==='novo'?'Manter novo':'← Voltar'}</button>${action}</div></article>`;
  }
  function render(){
    if(!window.DB)return;
    const active=pedidos();
    STATUS.forEach(s=>{const arr=active.filter(p=>String(p.status||'novo')===s);$('count-'+s).textContent=arr.length;$('orders-'+s).innerHTML=arr.length?arr.map(card).join(''):'<p class="empty">Nenhum pedido aqui.</p>';});
    $('totalActive').textContent=active.length;
  }
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2600)}
  async function change(id,status,button){
    if(!STATUS.includes(status))return;
    const method=typeof DB.atualizarStatusPedido==='function'?DB.atualizarStatusPedido.bind(DB):DB.updatePedido&&DB.updatePedido.bind(DB);
    if(!method){toast('DB sem suporte a atualização de status.');return}
    button.disabled=true;
    try{await Promise.resolve(method(id,status));toast(status==='pronto'?'Pedido pronto!':status==='preparando'?'Preparo iniciado.':'Pedido mantido como novo.');render();if(sound)beep()}catch(e){toast('Não foi possível atualizar o pedido.');console.error('[KDS]',e)}finally{button.disabled=false}
  }
  function beep(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=660;g.gain.value=.04;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.12)}catch(e){/* som é opcional */}}
  function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});document.querySelectorAll('.order-card').forEach(el=>{const p=pedidos().find(x=>String(x.id)===String(el.dataset.id));if(p){const t=el.querySelector('.elapsed');const over=elapsed(p)>deadline()*60000;t.textContent=(over?'⚠ ':'')+duration(elapsed(p));el.classList.toggle('is-overdue',over)}})}
  function start(){if(started)return;started=true;$('connectionLabel').textContent='Conectado';render();DB.onChange(()=>render());tick=setInterval(clock,1000);$('soundToggle').onclick=()=>{sound=!sound;$('soundToggle').textContent=sound?'🔊':'🔇';$('soundToggle').setAttribute('aria-pressed',String(sound));if(sound)beep()};document.querySelector('.board').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;const c=b.closest('.order-card');if(c)change(c.dataset.id,b.dataset.status,b)});}
  function wait(){if(window.DB&&typeof DB.onReady==='function')DB.onReady(start);else setTimeout(wait,40)}
  wait();
})();
