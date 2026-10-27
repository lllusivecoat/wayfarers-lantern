/* Offline installation and explicit, save-preserving updates. */
(function(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
  const panel=document.createElement('aside');panel.className='offline-tools';panel.setAttribute('aria-label','Offline play and updates');
  panel.innerHTML='<p id="offline-status" role="status">Preparing offline play…</p><button class="btn secondary" id="install-game" hidden>Install game</button><button class="btn" id="apply-game-update" hidden>Restart to apply update</button><details id="install-help"><summary>Install and offline help</summary><p>In your browser menu choose Install app or Add to Home Screen, if available. Wait for “Offline ready” before disconnecting. Saves stay in this browser; export a backup before clearing browser data. The optional Spotify soundtrack needs internet.</p></details>';
  document.querySelector('.top')?.insertAdjacentElement('afterend',panel);
  if(!panel.isConnected)document.body.appendChild(panel);
  const status=panel.querySelector('#offline-status'),updateButton=panel.querySelector('#apply-game-update'),installButton=panel.querySelector('#install-game');
  if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)panel.querySelector('#install-help').hidden=true;
  let registration,waitingWorker,restarting=false,installPrompt,lastCheck=0;
  function refresh(){
    waitingWorker=registration?.waiting||null;
    updateButton.hidden=!waitingWorker;
    if(waitingWorker){status.textContent='Update available. Restart when you’re ready to apply it.';return}
    if(navigator.serviceWorker.controller)status.textContent=navigator.onLine?'Offline ready. Your save stays on this device.':'Offline ready. Playing without internet.';
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false});
  installButton.onclick=async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;installButton.hidden=true;await prompt.prompt();await prompt.userChoice};
  window.addEventListener('appinstalled',()=>{installButton.hidden=true;panel.querySelector('#install-help').hidden=true});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(restarting)location.reload();else refresh()});
  updateButton.onclick=()=>{
    if(restarting||!waitingWorker)return;
    try{
      save();
      if(localStorage.getItem(SAVE_KEY)!==JSON.stringify(game))throw Error('Save verification failed');
    }catch(e){status.textContent='Could not save progress. Export a save backup before restarting.';return}
    restarting=true;updateButton.disabled=true;status.textContent='Saving complete. Applying update…';
    const channel=new MessageChannel();
    channel.port1.onmessage=event=>{
      channel.port1.close();
      if(event.data?.blocked){restarting=false;updateButton.disabled=false;status.textContent='Close other game tabs or windows, then restart to apply the update.'}
    };
    waitingWorker.postMessage({type:'APPLY_UPDATE'},[channel.port2]);
  };
  async function checkForUpdate(){
    if(!registration||!navigator.onLine||Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();try{await registration.update();refresh()}catch(e){/* Keep the installed game usable offline. */}
  }
  window.addEventListener('online',()=>{refresh();checkForUpdate()});
  window.addEventListener('offline',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdate()});
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;refresh();
    function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{
      if(worker.state==='installed')refresh();
      if(worker.state==='redundant'&&!navigator.serviceWorker.controller)status.textContent='Offline setup incomplete. Connect and reload to try again.';
    })}
    watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));
    checkForUpdate();
  }).catch(()=>{status.textContent='Offline setup unavailable. You can still play online; connect and reload to retry.'});
})();
