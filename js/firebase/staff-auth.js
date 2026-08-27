/* NONNA STAFF AUTH
 * Autenticação real via Firebase Authentication.
 * O frontend nunca contém senhas, hashes ou perfis privilegiados hardcoded.
 */
(function(root){
  try { root.NONNA_REST_TOKEN = sessionStorage.getItem('nonna_api_token') || localStorage.getItem('nonna_api_token') || ''; } catch (_) { root.NONNA_REST_TOKEN = ''; }
  const PAGE_ROLES={
    caixa:['cashier','owner','manager'],
    pizzaria:['owner','manager'],
    cozinha:['kitchen','owner','manager'],
    garcom:['waiter','owner','manager'],
    motoboy:['courier','owner','manager'],
    gestao:['owner','manager']
  };
  function page(){return (location.pathname.match(/\/(caixa|pizzaria|cozinha|garcom|motoboy|gestao)(\/|$)/)||[])[1]||null}
  async function profile(uid){
    const path='userProfiles/'+uid;
    try{
      const snap=await Promise.race([
        firebase.database().ref(path).once('value'),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),8000))
      ]);
      return snap.val()||null;
    }catch(_){
      const u=root.firebase?.auth?.().currentUser;
      const token=u?await u.getIdToken(true):'';
      const base=(root.FIREBASE_CONFIG||{}).databaseURL;
      if(!base||!token)return null;
      const res=await fetch(base+'/'+path+'.json?auth='+encodeURIComponent(token));
      if(!res.ok)throw new Error('Não foi possível validar o perfil no Firebase.');
      return await res.json()||null;
    }
  }
  async function signIn(email,password){
    if(!root.firebase?.auth) throw new Error('Autenticação Firebase indisponível.');
    const credential=await firebase.auth().signInWithEmailAndPassword(email,password);
    const p=await profile(credential.user.uid);
    if(!p || p.ativo===false || !p.restaurantId || !p.role) { await firebase.auth().signOut(); throw new Error('Usuário sem perfil operacional configurado.'); }
    const allowed=PAGE_ROLES[page()]||[];
    if(allowed.length && !allowed.includes(p.role)) { await firebase.auth().signOut(); throw new Error('Seu perfil não possui acesso a este ambiente.'); }
    // Mirror the operator session to Nonna API when available. Firebase remains the
    // rollback/auth fallback if the API is unavailable.
    try {
      if (root.NONNA_API) { const apiSession=await root.NONNA_API.login(email,password); sessionStorage.setItem('nonna_api_token',apiSession.token); root.NONNA_REST_TOKEN=apiSession.token; }
    } catch (_) { sessionStorage.removeItem('nonna_api_token'); }
    // Operational metadata only; credentials never enter the profile.
    try { const last=new Date().toISOString(); await firebase.database().ref('userProfiles/'+credential.user.uid).update({lastAccessAt:last}); p.lastAccessAt=last; } catch (_) {}
    sessionStorage.removeItem('donna_pizzaria_auth');
    sessionStorage.removeItem('nonna_caixa');
    sessionStorage.removeItem('donna_garcom_auth');
    return {...p,uid:credential.user.uid,email:credential.user.email||email};
  }
  async function restore(){
    if(!root.firebase?.auth) return null;
    const u=firebase.auth().currentUser;
    if(!u) return null;
    const p=await profile(u.uid);
    if(!p || p.ativo===false || !p.restaurantId || !(PAGE_ROLES[page()]||[]).includes(p.role)) { await firebase.auth().signOut(); return null; }
    try { const last=new Date().toISOString(); await firebase.database().ref('userProfiles/'+u.uid).update({lastAccessAt:last}); p.lastAccessAt=last; } catch (_) {}
    return {...p,uid:u.uid,email:u.email};
  }

  // Authorize an exceptional manual discount without replacing the cashier's
  // primary Firebase session. Passwords are used only by Firebase Auth and are
  // never retained in this page, storage, or the staff profile.
  async function authorizeDiscount(activeStaff){
    if(!root.firebase?.auth || typeof root.firebase.auth.EmailAuthProvider?.credential!=='function')
      throw new Error('Autenticação Firebase indisponível; o desconto manual não foi autorizado.');
    const email=String(root.prompt('E-mail do gerente ou proprietário:')||'').trim().toLowerCase();
    if(!email) throw new Error('Informe o e-mail do gerente ou proprietário.');
    const password=root.prompt('Senha do gerente ou proprietário:');
    if(password===null || !String(password)) throw new Error('Informe a senha do gerente ou proprietário.');
    const primary=root.firebase.auth();
    const activeUser=primary.currentUser;
    let managerUid=null, managerProfile=null, secondary=null;
    try {
      if(activeUser && String(activeUser.email||'').toLowerCase()===email){
        const credential=root.firebase.auth.EmailAuthProvider.credential(email,String(password));
        await activeUser.reauthenticateWithCredential(credential);
        managerUid=activeUser.uid;
        managerProfile=await profile(managerUid);
      } else {
        // A named secondary app keeps the cashier authenticated in the primary app.
        const appName='nonna-discount-'+Date.now()+'-'+Math.random().toString(36).slice(2);
        secondary=root.firebase.initializeApp(typeof FIREBASE_CONFIG!=='undefined'?FIREBASE_CONFIG:root.FIREBASE_CONFIG,appName);
        const secondaryAuth=secondary.auth();
        const result=await secondaryAuth.signInWithEmailAndPassword(email,String(password));
        managerUid=result.user.uid;
        const snap=await secondary.database().ref('userProfiles/'+managerUid).once('value');
        managerProfile=snap.val()||null;
      }
      const role=managerProfile?.role;
      if(!managerProfile || !managerProfile.restaurantId || !['owner','manager'].includes(role))
        throw new Error('Esse usuário não tem perfil de gerente ou proprietário.');
      if(activeStaff?.restaurantId && String(managerProfile.restaurantId)!==String(activeStaff.restaurantId))
        throw new Error('O gerente pertence a outro estabelecimento.');
      return {uid:managerUid,email,role};
    } catch(error){
      const code=String(error?.code||'');
      if(code==='auth/wrong-password'||code==='auth/invalid-credential'||code==='auth/invalid-login-credentials'||code==='auth/user-not-found')
        throw new Error('E-mail ou senha do gerente inválidos.');
      if(code==='auth/too-many-requests') throw new Error('Muitas tentativas. Aguarde e tente novamente.');
      if(code==='auth/network-request-failed') throw new Error('Sem conexão com o Firebase. Tente novamente.');
      if(code==='PERMISSION_DENIED'||code==='database/permission-denied') throw new Error('Não foi possível verificar o perfil do gerente.');
      throw error instanceof Error ? error : new Error('Não foi possível autorizar o desconto.');
    } finally {
      // Never sign out the primary auth. Only the disposable secondary session
      // is closed and the app is deleted after the authorization check.
      if(secondary){
        try { await secondary.auth().signOut(); } catch(_) {}
        try { await secondary.delete(); } catch(_) {}
      }
    }
  }
  // Re-authenticate the logged-in operator, or verify a manager/owner in a
  // disposable secondary Firebase app. Passwords never leave Firebase Auth.
  async function authorizeCashClosure(activeStaff){
    if(!root.firebase?.auth || typeof root.firebase.auth.EmailAuthProvider?.credential!=='function')
      throw new Error('Autenticação Firebase indisponível; o fechamento não foi autorizado.');
    const email=String(root.prompt('E-mail do operador ou gerente:')||'').trim().toLowerCase();
    if(!email) throw new Error('Informe o e-mail do operador ou gerente.');
    const password=root.prompt('Senha para confirmar o fechamento:');
    if(password===null || !String(password)) throw new Error('Informe a senha para confirmar o fechamento.');
    const primary=root.firebase.auth(), activeUser=primary.currentUser;
    let secondary=null, verified=null, profileData=null;
    try{
      if(activeUser && String(activeUser.email||'').toLowerCase()===email){
        await activeUser.reauthenticateWithCredential(root.firebase.auth.EmailAuthProvider.credential(email,String(password)));
        verified=activeUser.uid; profileData=await profile(verified);
      }else{
        const appName='nonna-close-'+Date.now()+'-'+Math.random().toString(36).slice(2);
        secondary=root.firebase.initializeApp(typeof FIREBASE_CONFIG!=='undefined'?FIREBASE_CONFIG:root.FIREBASE_CONFIG,appName);
        const result=await secondary.auth().signInWithEmailAndPassword(email,String(password));
        verified=result.user.uid; profileData=(await secondary.database().ref('userProfiles/'+verified).once('value')).val()||null;
      }
      if(!profileData||profileData.ativo===false||!profileData.restaurantId||!['owner','manager','cashier'].includes(profileData.role)) throw new Error('Esse usuário não possui permissão para fechar o caixa.');
      if(profileData.role==='cashier' && (!activeStaff?.uid || String(verified)!==String(activeStaff.uid))) throw new Error('Somente o operador logado ou um gerente pode fechar o caixa.');
      if(activeStaff?.restaurantId && String(profileData.restaurantId)!==String(activeStaff.restaurantId)) throw new Error('O usuário pertence a outro estabelecimento.');
      return {uid:verified,email,role:profileData.role,nome:profileData.nome};
    }catch(error){
      const code=String(error?.code||'');
      if(['auth/wrong-password','auth/invalid-credential','auth/invalid-login-credentials','auth/user-not-found'].includes(code)) throw new Error('E-mail ou senha inválidos.');
      if(code==='auth/too-many-requests') throw new Error('Muitas tentativas. Aguarde e tente novamente.');
      if(code==='auth/network-request-failed') throw new Error('Sem conexão com o Firebase. Tente novamente.');
      throw error instanceof Error?error:new Error('Não foi possível autorizar o fechamento.');
    }finally{if(secondary){try{await secondary.auth().signOut()}catch(_){} try{await secondary.delete()}catch(_){}}}
  }
  root.NONNA_STAFF_AUTH={signIn,restore,authorizeDiscount,authorizeCashClosure,roles:PAGE_ROLES};
  const STAFF_ROLES=['manager','cashier','kitchen','waiter','courier'];
  function cleanEmail(value){const email=String(value||'').trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;}
  async function createStaffAccount({email,password,nome,role,restaurantId}={}){
    const primary=root.firebase?.auth?.();
    const actor=primary?.currentUser;
    if(!actor) throw new Error('Faça login novamente para cadastrar a equipe.');
    const actorProfile=await profile(actor.uid);
    if(!actorProfile||!['owner','manager'].includes(actorProfile.role)) throw new Error('Somente proprietário ou gerente pode cadastrar a equipe.');
    const rid=String(actorProfile.restaurantId||'');
    if(!rid||String(restaurantId||rid)!==rid) throw new Error('Estabelecimento inválido.');
    const safeEmail=cleanEmail(email), safeName=String(nome||'').trim().slice(0,80), safeRole=String(role||'');
    if(!safeEmail||!safeName||!STAFF_ROLES.includes(safeRole)) throw new Error('Informe nome, e-mail e uma função operacional válida.');
    const appName='nonna-staff-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    let secondary=null, created=null;
    try{
      secondary=root.firebase.initializeApp(typeof FIREBASE_CONFIG!=='undefined'?FIREBASE_CONFIG:root.FIREBASE_CONFIG,appName);
      created=await secondary.auth().createUserWithEmailAndPassword(safeEmail,String(password||''));
      // The profile write deliberately uses the still-authenticated primary app.
      // This avoids replacing the manager's session and lets rules authorize the actor.
      await primaryRef('userProfiles/'+created.user.uid).set({uid:created.user.uid,restaurantId:rid,role:safeRole,nome:safeName,email:safeEmail,ativo:true,createdAt:new Date().toISOString(),createdBy:actor.uid});
      return {uid:created.user.uid,email:safeEmail,nome:safeName,role:safeRole,restaurantId:rid,ativo:true};
    }catch(error){
      if(created?.user){try{await created.user.delete();}catch(_){} }
      const code=String(error?.code||'');
      if(code==='auth/email-already-in-use') throw new Error('Este e-mail já possui uma conta.');
      if(code==='auth/weak-password') throw new Error('A senha deve ter pelo menos 6 caracteres.');
      if(code==='PERMISSION_DENIED'||code==='database/permission-denied') throw new Error('As regras não autorizaram o cadastro. Verifique o perfil de proprietário/gerente.');
      throw error instanceof Error?error:new Error('Não foi possível cadastrar a equipe.');
    }finally{if(secondary){try{await secondary.auth().signOut()}catch(_){} try{await secondary.delete()}catch(_){}}}
  }
  function primaryRef(path){return root.firebase.database().ref(path);}
  async function deactivateStaff(uid){
    const primary=root.firebase?.auth?.(), actor=primary?.currentUser;
    if(!actor||!uid||String(uid)===String(actor.uid)) throw new Error('Não é possível desativar sua própria conta nesta tela.');
    const actorProfile=await profile(actor.uid), target=await profile(uid);
    if(!actorProfile||!['owner','manager'].includes(actorProfile.role)||!target||String(target.restaurantId)!==String(actorProfile.restaurantId)) throw new Error('Sem permissão para desativar este usuário.');
    if(actorProfile.role==='manager'&&target.role==='owner') throw new Error('Gerente não pode desativar o proprietário.');
    await primaryRef('userProfiles/'+uid).set({...target,uid,restaurantId:actorProfile.restaurantId,ativo:false});
  }
  root.NONNA_STAFF_AUTH.createStaffAccount=createStaffAccount;
  root.NONNA_STAFF_AUTH.deactivateStaff=deactivateStaff;
  root.NONNA_STAFF_AUTH.staffRoles=STAFF_ROLES;

})(window);
