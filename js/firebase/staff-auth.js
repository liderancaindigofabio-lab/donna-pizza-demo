/* NONNA STAFF AUTH
 * Autenticação real via Firebase Authentication.
 * O frontend nunca contém senhas, hashes ou perfis privilegiados hardcoded.
 */
(function(root){
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
    const snap=await firebase.database().ref('userProfiles/'+uid).once('value');
    return snap.val()||null;
  }
  async function signIn(email,password){
    if(!root.firebase?.auth) throw new Error('Autenticação Firebase indisponível.');
    const credential=await firebase.auth().signInWithEmailAndPassword(email,password);
    const p=await profile(credential.user.uid);
    if(!p || !p.restaurantId || !p.role) { await firebase.auth().signOut(); throw new Error('Usuário sem perfil operacional configurado.'); }
    const allowed=PAGE_ROLES[page()]||[];
    if(allowed.length && !allowed.includes(p.role)) { await firebase.auth().signOut(); throw new Error('Seu perfil não possui acesso a este ambiente.'); }
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
    if(!p || !p.restaurantId || !(PAGE_ROLES[page()]||[]).includes(p.role)) { await firebase.auth().signOut(); return null; }
    return {...p,uid:u.uid,email:u.email};
  }
  root.NONNA_STAFF_AUTH={signIn,restore,roles:PAGE_ROLES};
})(window);
