/* Beta-only readiness coordinator. Never reads or writes the shared save. */
(() => {
 'use strict';
 const boot=window.WL_BETA_BOOT;if(!boot)return;
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 function stylesheet(link){return new Promise((resolve,reject)=>{if(link.sheet)return resolve();link.addEventListener('load',resolve,{once:true});link.addEventListener('error',()=>reject(Error('stylesheet')),{once:true})})}
 function imageReady(image){return new Promise((resolve,reject)=>{
  const decode=()=>{if(!image.naturalWidth)return reject(Error('image'));if(typeof image.decode==='function')image.decode().then(resolve,reject);else resolve()};
  if(image.complete)return decode();image.addEventListener('load',decode,{once:true});image.addEventListener('error',()=>reject(Error('image')),{once:true});
 })}
 function preload(src){const image=new Image();image.decoding='async';image.src=src;return imageReady(image)}
 async function coverArt(){const image=document.getElementById('launch-art');try{await imageReady(image)}catch(error){image.src='img/locations/booty-bay.webp';await imageReady(image)}}
 async function start(){
  try{
   // All parser scripts and their DOMContentLoaded initializers must finish first.
   await Promise.resolve();await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]:not([data-boot-optional])')].map(stylesheet));
   if(boot.failed)return;
   if(typeof game==='undefined'||!game?.player||!Array.isArray(game.heroes)||typeof render!=='function'||typeof showView!=='function'||!window.WL_BETA_GEAR_CARE)throw Error('game initialization');
   if(window.__betaSaveGuard?.error)throw Error('save guard');
   showView('hall');window.betaUxRun?.();window.betaR3Run?.();
   await frame();await frame();
   if(!document.querySelector('#beta-guild-name')?.textContent||!document.querySelector('#player-name-label')?.textContent)throw Error('hall render');
   if(!boot.allowSkip())return;
   const portrait=imageSrc(game.player)||window.WL_BETA_PORTRAITS?.lookup(game.player);
   // Only one above-the-fold portrait is warmed. Other chibi files remain deferred.
   const art=[coverArt(),preload('img/locations/booty-bay.webp')];if(portrait)art.push(preload(portrait).catch(()=>{}));
   await Promise.all(art);await frame();
   if(window.__betaSaveGuard?.error)throw Error('save guard');
   boot.reveal();
  }catch(error){console.warn('beta-launch',error);if(boot.phase==='loading')boot.fail('The hall could not finish opening. Retry reloads without resetting your guild.')}
 }
 window.addEventListener('beta:boot-ready',()=>{
  const title=document.querySelector('#hall h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true})}
  window.WL_BETA_HARBOUR?.afterBoot?.();
 },{once:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
