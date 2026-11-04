/* Paint feedback before expensive user actions; keep each action synchronous once started. */
(() => {
 'use strict';
 const style=document.createElement('style');style.textContent='.game-activity{position:fixed;left:50%;bottom:max(96px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);padding:12px 18px;border:1px solid var(--acc,#d9b45b);border-radius:12px;background:var(--panel,#1b2028);color:var(--text,#fff);box-shadow:0 6px 24px #0005;font:14px/1.4 system-ui,sans-serif;pointer-events:none}.game-activity[hidden]{display:none}.game-activity::before{content:"";width:15px;height:15px;flex:none;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:game-working .8s linear infinite}@keyframes game-working{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.game-activity::before{animation:none}}';document.head.append(style);
 const prompt=document.createElement('div');prompt.className='game-activity';prompt.hidden=true;prompt.setAttribute('role','status');prompt.setAttribute('aria-live','polite');document.body.append(prompt);
 let working=0,replaying=false,hideTimer;
 const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function run(label,task){
  clearTimeout(hideTimer);working++;prompt.textContent=label||'Working…';prompt.hidden=false;
  try{await paint();return await task()}
  finally{if(--working===0)hideTimer=setTimeout(()=>{prompt.hidden=true},180)}
 }
 window.WL_ACTIVITY=Object.freeze({run,get working(){return working>0}});
 const selectors='#alchemy-brew,[data-cook-now],.beta-rcraft,[data-inventory-potion],button[id*=equip i],button[onclick*=equip i],button[data-a*=equip i],.gearcare-hero-toggle,.gearcare-chips button,.v9-rrow,button[onclick*="openHeroStats"],.tab[data-view],.dropdown-item[data-view],.beta-bbar button,.beta-sheet-item,button[data-gear-action],button[data-gear-bulk],button[onclick*="dispatch" i],button[onclick*="craft" i],button[onclick*="nextDay"],button[onclick*="confirmRest"],#rest-nav-button';
 document.addEventListener('click',event=>{
  if(replaying||window.WL_BETA_BOOT?.active)return;
  const button=event.target.closest?.(selectors);if(!button||button.disabled)return;
  event.preventDefault();event.stopImmediatePropagation();if(working)return;
  const navigation=button.matches('.tab,.dropdown-item,.beta-bbar button,.beta-sheet-item');
  run(navigation?'Loading…':/equip|provision/i.test(button.textContent||'')?'Equipping provisions…':/craft|brew|cook/i.test(button.textContent||'')?'Crafting…':'Updating…',()=>{replaying=true;try{button.click()}finally{replaying=false}}).catch(error=>{
   clearTimeout(hideTimer);prompt.hidden=false;prompt.textContent='The action could not finish. Please try again.';hideTimer=setTimeout(()=>{prompt.hidden=true},5000);
   window.dispatchEvent(new ErrorEvent('error',{error,message:error.message||String(error)}));
  });
 },true);
 const tracked=new WeakSet();let pending=0,imageTimer;
 function track(image){
  if(tracked.has(image)||image.complete||image.loading==='lazy'||!image.closest('.view.active,.modal.open'))return;
  tracked.add(image);pending++;
  if(!imageTimer)imageTimer=setTimeout(()=>{imageTimer=null;if(pending&&!working){prompt.textContent='Loading image…';prompt.hidden=false}},250);
  const done=()=>{image.removeEventListener('load',done);image.removeEventListener('error',done);tracked.delete(image);pending--;if(!pending&&!working){clearTimeout(imageTimer);imageTimer=null;prompt.hidden=true}};
  image.addEventListener('load',done,{once:true});image.addEventListener('error',done,{once:true});
 }
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(n.matches('img'))track(n);n.querySelectorAll?.('img').forEach(track)}}).observe(document.body,{childList:true,subtree:true});
})();
