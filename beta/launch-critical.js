/* Inlined before any game files. This controller never writes browser storage. */
(() => {
 'use strict';
 const root=document.documentElement;
 let phase='loading',minimum=false,holding=true,problem='',cleanupTimer;
 const byId=id=>document.getElementById(id);
 function sync(){
  const cover=byId('beta-launch-cover');if(!cover)return;
  cover.dataset.state=phase;
  const skip=byId('launch-skip');if(skip){skip.disabled=!minimum||!!problem;skip.hidden=!!problem}
  const status=byId('launch-status');if(status)status.textContent=problem||'Preparing the hall…';
  const retry=byId('launch-retry');if(retry)retry.hidden=!problem;
 }
 function fail(message){
  if(phase==='done'||problem)return;
  problem=message||'The hall could not open. Check your connection and Retry.';
  phase='error';minimum=false;holding=true;clearTimeout(cleanupTimer);
  root.classList.add('beta-booting');byId('beta-launch-cover')?.classList.remove('launch-leaving');sync();
 }
 function preflight(){
  try{const raw=localStorage.getItem('wayfarers_lantern_offline_v1');if(raw!==null){const saved=JSON.parse(raw);if(!saved||!Array.isArray(saved.heroes)||!Array.isArray(saved.gear))throw Error('Invalid save shape')}}
  catch(error){fail('Your saved guild could not be read. Retry reloads without resetting it.');throw error}
 }
 function reveal(){
  if(!minimum||problem||phase==='revealing'||phase==='done')return false;
  phase='revealing';
  const cover=byId('beta-launch-cover');root.classList.remove('beta-booting');cover?.classList.add('launch-leaving');
  const finish=()=>{if(problem||phase==='done')return;phase='hydrating';holding=false;window.dispatchEvent(new Event('beta:boot-portraits'));if(problem)return;phase='done';clearTimeout(watchdog);cover?.remove();window.dispatchEvent(new Event('beta:boot-ready'))};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else cleanupTimer=setTimeout(finish,300);
  return true;
 }
 window.WL_BETA_BOOT=Object.freeze({get active(){return phase!=='done'},get holding(){return holding},get phase(){return phase},get failed(){return !!problem},get minimumReady(){return minimum},fail,preflight,skip:reveal,reveal,allowSkip(){if(problem)return false;minimum=true;sync();return true}});
 addEventListener('error',event=>{if(phase==='done')return;const target=event.target;if(target?.tagName==='SCRIPT'||target?.tagName==='LINK'&&target.rel==='stylesheet'&&!target.hasAttribute('data-boot-optional'))fail('A required game file could not load. Check your connection and Retry.');else if(event.message)fail('The hall could not finish opening. Retry reloads without resetting your guild.')},true);
 addEventListener('unhandledrejection',()=>fail('The hall could not finish opening. Retry reloads without resetting your guild.'));
 document.addEventListener('DOMContentLoaded',sync,{once:true});
 const watchdog=setTimeout(()=>{if(phase==='loading'&&!problem){const status=byId('launch-status');if(status)status.textContent='Still preparing the hall… You can Retry if the connection has stalled.';const retry=byId('launch-retry');if(retry)retry.hidden=false}},20000);
})();
