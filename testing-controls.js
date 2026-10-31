/* Temporary manual testing controls; remove this module when testing is done. */
(() => {
 const finishable=r=>r.kind==='operation'||r.kind==='trade';
 let running=false;
 window.testCompleteAllQuests=function(){if(running)return [];running=true;const earlier=[...(game.todayReports||[])],completed=[];
 try{
  if(game.storySession)finishStoryOnTimer();
  // New successful world stages are queued by normal return handling. Resolve
  // each new stage too, without starting a fresh attempt or advancing the day.
  for(let pass=0;pass<6;pass++){
   const pending=(game.pendingReports||[]).filter(finishable);if(!pending.length)break;
   for(const r of pending)r.dueAt=Date.now()-1;
   completed.push(...applyPendingReports());
  }
  game.todayReports=[...earlier,...completed];
  const status=document.getElementById('test-quest-status');if(status)status.textContent=completed.length?`${completed.length} reports returned. Day ${game.day} unchanged. Review the results in Quest tracker below.`:'No active quests to complete.';
  if(completed.length){const last=completed.at(-1);addLog('Testing: quest timers completed',`${completed.length} reports returned without advancing Day ${game.day}. Outcomes and rewards resolved normally.`);document.getElementById('latest-title').textContent=`${completed.length} quest reports returned`;document.getElementById('latest-text').textContent=last.summary}
  render();save();return completed;
 }finally{running=false;update()}
 };
 function update(){const button=document.getElementById('test-complete-quests');if(button)button.disabled=running||!(game.storySession||(game.pendingReports||[]).some(finishable))}
 const reports=renderReports;renderReports=function(){const out=reports.apply(this,arguments);update();return out};
 const style=document.createElement('style');style.textContent='#quests>.heading{align-items:flex-start;flex-wrap:wrap;gap:12px}.quest-testing-actions{display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:100%}#test-complete-quests{min-height:44px;max-width:100%;white-space:normal}#test-quest-status:empty{display:none}#test-quest-status{margin:0 0 16px;line-height:1.6}@media(max-width:600px){.quest-testing-actions{align-items:flex-start}}';document.head.append(style);update();
})();
