/* Access gate for the legacy restaurant panel. Authentication is local to this static site. */
(() => {
  const HASH='1b75524238844c22a7e2d90cffb72f288e478eb2c7d87a80d8699168265279f5';
  const key='donna_pizzaria_auth';
  const digest=async value=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')};
  window.addEventListener('DOMContentLoaded',()=>{
    const gate=document.getElementById('accessGate'),form=document.getElementById('accessForm'),error=document.getElementById('accessError');
    if(!gate||!form)return;
    const close=()=>{gate.hidden=true;document.body.classList.add('authenticated')};
    if(sessionStorage.getItem(key)==='ok')close();
    form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const btn=form.querySelector('button');btn.disabled=true;btn.textContent='Verificando...';try{const fd=new FormData(form);if(String(fd.get('email')).trim().toLowerCase()!=='fabio08dejesusjunior@gmail.com'||await digest(String(fd.get('password')))!==HASH)throw Error('E-mail ou senha inválidos.');sessionStorage.setItem(key,'ok');close()}catch(err){error.textContent=err.message}finally{btn.disabled=false;btn.textContent='Entrar no painel'}});
  });
})();
