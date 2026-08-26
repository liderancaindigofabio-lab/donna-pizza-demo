(function(){
  const gate=document.getElementById('accessGate'), form=document.getElementById('accessForm'), error=document.getElementById('accessError');
  if(!gate||!form) return;
  function apply(profile){
    gate.hidden=true;
    document.body.classList.add('authenticated');
    document.body.dataset.profile=profile.role;
    if(profile.role==='kitchen') document.querySelectorAll('[data-aba="cardapio"],#btnConfig,[onclick*="abrirDespacho"],[onclick*="abrirConfig"],[onclick*="limparDados"],.cardapio-editor').forEach(el=>el.remove());
    if(profile.role==='cashier') document.querySelectorAll('[data-aba="cardapio"],#btnConfig,[onclick*="abrirConfig"],[onclick*="limparDados"],.cardapio-editor').forEach(el=>el.remove());
  }
  async function restore(){try{const p=await window.NONNA_STAFF_AUTH?.restore?.();if(p) apply(p)}catch(_){} }
  restore();
  form.addEventListener('submit',async e=>{
    e.preventDefault(); error.textContent=''; const btn=form.querySelector('button'); btn.disabled=true; btn.textContent='Entrando…';
    try{const fd=new FormData(form);const p=await NONNA_STAFF_AUTH.signIn(String(fd.get('email')).trim(),String(fd.get('password')));apply(p)}
    catch(err){error.textContent=err.message||'Não foi possível entrar.'}
    finally{btn.disabled=false;btn.textContent='Entrar no painel'}
  });
})();
