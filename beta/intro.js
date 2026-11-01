/* First-run sample, deliberately isolated from the shared live save. */
(() => {
 const KEY='wayfarers-lantern-beta-intro';
 const read=key=>{try{return localStorage.getItem(key)}catch(e){return null}};
 function start(){
  if(read(KEY)||(game.heroes||[]).length||Number(game.day)>1)return;
  const dialog=document.createElement('dialog');dialog.id='beta-intro';dialog.setAttribute('aria-labelledby','beta-intro-title');
  dialog.innerHTML='<div class="beta-intro-card"><header><span id="beta-intro-progress"></span><button type="button" class="beta-intro-skip">Skip</button></header><img src="img/locations/booty-bay.webp" alt="Painted view of Booty Bay harbour at dusk"><main><h1 id="beta-intro-title" tabindex="-1"></h1><div id="beta-intro-copy"></div></main><footer><button type="button" class="beta-intro-next"></button></footer></div>';
  const title=dialog.querySelector('h1'),copy=dialog.querySelector('#beta-intro-copy'),next=dialog.querySelector('.beta-intro-next');
  const screens=[
   ['The Wayfarer’s Lantern','<p>A guild rises in Booty Bay.</p>','Begin'],
   ['The Bay','<p>Goblin docks. Salt air. Contracts pinned to every board.</p><p>You’ve hung the Lantern above a rented hall. Word will travel if you make good on the work.</p>','Continue'],
   ['Your role','<p>You are the guildmaster. Heroes take the jobs. You choose who goes, who rests, and how bold to be.</p><p>A bad night costs gold. A worse one costs lives.</p>','Continue'],
   ['First steps','<p>Start simple:</p><ul><li>Recruit from the applicants waiting in the hall</li><li>Pin a contract and send a party</li><li>Rest when the day is done</li></ul>','Enter the hall →']
  ];
  let step=0;
  function paint(){title.textContent=screens[step][0];copy.innerHTML=screens[step][1];next.textContent=screens[step][2];dialog.querySelector('#beta-intro-progress').textContent=(step+1)+' / 4';dialog.querySelector('img').hidden=step!==0;title.focus();dialog.scrollTop=0}
  function finish(){try{localStorage.setItem(KEY,'seen');localStorage.removeItem('wayfarers-lantern-beta-onboarding')}catch(e){}dialog.close();dialog.remove();document.documentElement.classList.remove('beta-intro-open');showView('hall');window.betaR3Run?.();const checklist=document.getElementById('beta-onb');if(checklist){checklist.setAttribute('tabindex','-1');checklist.focus({preventScroll:true});checklist.scrollIntoView({block:'start',behavior:'instant'})}}
  next.onclick=()=>{if(step===3)finish();else{step++;paint()}};
  dialog.querySelector('.beta-intro-skip').onclick=finish;
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish()});
  document.body.append(dialog);document.documentElement.classList.add('beta-intro-open');dialog.showModal();paint();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
