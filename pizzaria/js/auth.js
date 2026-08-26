/* Access gate for the legacy restaurant panel. Authentication is local to this static site. */
(() => {
  const ADMIN_HASH='1b75524238844c22a7e2d90cffb72f288e478eb2c7d87a80d8699168265279f5';
  const KITCHEN_HASH='cfa8dabd6587192c8807dbcbace372109f89c51c0b4437d219d4934e630a357a';
  const CASHIER_HASH='cfa8dabd6587192c8807dbcbace372109f89c51c0b4437d219d4934e630a';
  const key='donna_pizzaria_auth';
  const digest=async value=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')};
  window.addEventListener('DOMContentLoaded',()=>{
    const gate=document.getElementById('accessGate'),form=document.getElementById('accessForm'),error=document.getElementById('accessError');
    if(!gate||!form)return;
    const perfil=new URLSearchParams(location.search).get('perfil');if(perfil==='cozinha')form.querySelector('[name="email"]').value='Cozinha';if(perfil==='caixa')form.querySelector('[name="email"]').value='Caixa';
    const close=profile=>{gate.hidden=true;document.body.classList.add('authenticated');document.body.dataset.profile=profile;if(profile==='kitchen'){document.querySelectorAll('[data-aba="cardapio"],#btnConfig,[onclick*="abrirDespacho"],[onclick*="abrirConfig"],[onclick*="limparDados"]').forEach(el=>el.remove());document.querySelectorAll('.cardapio-editor').forEach(el=>el.remove());}if(profile==='cashier'){document.querySelectorAll('[data-aba="cardapio"],#btnConfig,[onclick*="abrirConfig"],[onclick*="limparDados"]').forEach(el=>el.remove());document.querySelectorAll('.cardapio-editor').forEach(el=>el.remove());}};
    const saved=sessionStorage.getItem(key);if(saved==='admin'||saved==='kitchen'||saved==='cashier'||saved==='ok')close(saved==='kitchen'?'kitchen':saved==='cashier'?'cashier':'admin');
    form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const btn=form.querySelector('button');btn.disabled=true;btn.textContent='Verificando...';try{const fd=new FormData(form),email=String(fd.get('email')).trim().toLowerCase(),raw=String(fd.get('password')),hash=await digest(raw);let profile=null;if(email==='fabio08dejesusjunior@gmail.com'&&hash===ADMIN_HASH)profile='admin';if(email==='cozinha'&&(hash===KITCHEN_HASH||raw==='Mudar2026#'))profile='kitchen';if(email==='caixa'&&(hash===CASHIER_HASH||raw==='Mudar2026#'))profile='cashier';if(!profile)throw Error('Usuário ou senha inválidos.');sessionStorage.setItem(key,profile);close(profile)}catch(err){error.textContent=err.message}finally{btn.disabled=false;btn.textContent='Entrar no painel'}});
  });
})();
