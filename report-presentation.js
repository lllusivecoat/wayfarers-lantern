/* Named encounters and accessible, structured full-report emphasis. */
(() => {
 const oldRooms=['Flooded gallery','Warded vault','Guardian hall'];
 const vaultBosses=['Gorath the Drowned','Selvara the Runeweaver','Korvash, Vault Sentinel'];
 // Deepdelve is an original dungeon; these are its own named guardians.
 V9_LOC['deepdelve-vault'].world.encounters.forEach((e,i)=>e.name=vaultBosses[i]);
 function bosses(r){const run=r.stagePlan;let names=r.dailyBossNames?.length?r.dailyBossNames:r.bossName?[r.bossName]:run?.encounters?(Number.isInteger(r.stageIndex)?[run.encounters[r.stageIndex]?.name]:run.encounters.map(e=>e.name)):[];
 return names.filter(Boolean).map(n=>oldRooms.includes(n)?vaultBosses[oldRooms.indexOf(n)]:n)}
 const style=document.createElement('style');style.textContent='.report-fight{margin:20px 0;padding:16px;border:1px solid var(--line);border-radius:10px;line-height:1.65}.report-fight h3{margin:0 0 12px}.report-discovery{color:#88e2b1;font-weight:600}.report-traits,.report-discovery{display:block;margin:18px 0;line-height:1.7}.report-loot{color:#f2ce78;font-weight:600}.report-xp{color:#86d5f5;font-weight:600}.report-wound{color:#ff9393;font-weight:600}#report-detail-text{line-height:1.7;overflow-wrap:anywhere}#report-detail-text .report-fight p{margin:12px 0}';document.head.append(style);
 function span(cls,text){const s=document.createElement('span');s.className=cls;s.textContent=text;return s}
 const show=showReportDetails;showReportDetails=function(r){const out=show.apply(this,arguments),root=document.getElementById('report-detail-text');if(!root)return out;
 const isVault=/Deepdelve Vault/.test(r.title||'')||r.stagePlan?.quest?.locationId==='deepdelve-vault';
 if(isVault){for(let i=0;i<oldRooms.length;i++)root.textContent=root.textContent.split(oldRooms[i]).join(vaultBosses[i]);const title=document.getElementById('report-detail-title');for(let i=0;i<oldRooms.length;i++)title.textContent=title.textContent.split(oldRooms[i]).join(vaultBosses[i])}
 const names=bosses(r);if(names.length){const section=document.createElement('section');section.className='report-fight';const heading=document.createElement('h3');heading.textContent='Boss encounter';section.append(heading);
 for(const name of names){const bossResult=r.dailyBossResults?.find(e=>e.name===name),outcome=bossResult?['Failure','Partial Success','Success','Exceptional Success'][bossResult.tier]:r.outcome;const p=document.createElement('p');p.append(span('boss-name',name),document.createTextNode(' — '+({ 'Exceptional Success':'The party broke through the boss’s defenses with coordinated attacks and secured a decisive victory.',Success:'The party held its formation through the boss’s assault and defeated the guardian.', 'Partial Success':'The party made headway, but could not overcome the boss. The expedition withdrew before clearing this stage.',Failure:'The boss broke the party’s offensive. The survivors withdrew without clearing this stage.'}[outcome]||'The encounter ended with the recorded outcome.')));section.append(p)}root.prepend(section)}
 // Highlight recorded text using DOM nodes, never interpolate report data as HTML.
 const woundedIds=new Set(Object.keys(r.wounds||{}));for(const id of r.partyIds||[]){const name=purse(id)?.name;if(name&&(r.tbwNotes||[]).some(n=>n.includes(name)&&/wound/i.test(n)))woundedIds.add(id)}const woundNames=[...woundedIds].map(id=>purse(id)?.name).filter(Boolean);
 const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const parts=['(?:Level progress earned|Advancement earned):[^.]*\\.','(?:Bonus find secured|Crafting materials secured):[^.]*\\.','\\b(?:Light|Serious|Grievous) wound(?: worsens)?',...woundNames.map(esc)];
 const re=new RegExp(parts.join('|'),'g'),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('.report-fight'))nodes.push(walker.currentNode);
 for(const node of nodes){const text=node.textContent;let pos=0,match,fragment=document.createDocumentFragment(),changed=false;re.lastIndex=0;while((match=re.exec(text))){fragment.append(text.slice(pos,match.index));const value=match[0],cls=/^(Level progress|Advancement)/.test(value)?'report-xp':/^(Bonus find|Crafting materials)/.test(value)?'report-loot':'report-wound';fragment.append(span(cls,value));pos=match.index+value.length;changed=true}if(changed){fragment.append(text.slice(pos));node.replaceWith(fragment)}}
 // Split trailing trait and discovery blocks while preserving existing spans.
 function splitAt(label,cls){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(walker.nextNode()){if(walker.currentNode.textContent.includes(label)){node=walker.currentNode;break}}if(!node)return;const offset=node.textContent.indexOf(label),range=document.createRange();range.setStart(node,offset);const container=node.parentElement.closest('.report-traits')||root;range.setEnd(container,container.childNodes.length);const section=document.createElement('section');section.className=cls;section.append(range.extractContents());root.append(section)}
 splitAt('Traits, bonds & wounds:','report-traits');
 // Discovery can be nested inside the extracted trait section; split using the root range.
 splitAt('Discovery:','report-discovery');
 // Explicit injury line keeps the injured name and severity together in red.
 for(const [id,w] of Object.entries(r.wounds||{})){const p=document.createElement('p');p.className='report-wound';p.textContent=`${purse(id)?.name||'Hero'} — ${WOUND_TIERS[w.tier]?.name||'Unknown'} wound${w.worsened?' (worsened)':''}.`;root.append(p)}
 return out};
 window.WL_REPORT_PRESENTATION=Object.freeze({bosses});
})();
