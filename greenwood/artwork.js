import {get} from './data.js';
// Compact, full-body menu sprites are the chibi view. Full-body battle sprites
// are fallbacks and preserve true Shiny colours when no Shiny menu icon exists.
const spriteRoot='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
export function spriteCandidates(c,style='chibi',reducedMotion=false){
 const s=get(c.species);if(!s)return [];
 const shiny=c.variant==='Shiny',variant=shiny?'shiny/':'';
 const staticBattle=`${spriteRoot}/versions/generation-v/black-white/${variant}${s.number}.png`;
 const animated=`${spriteRoot}/versions/generation-v/black-white/animated/${variant}${s.number}.gif`;
 const standard=`${spriteRoot}/${variant}${s.number}.png`;
 const chibi=`${spriteRoot}/versions/generation-viii/icons/${s.number}.png`;
 if(style==='animated'&&!reducedMotion)return [animated,staticBattle,standard];
 return style==='chibi'&&!shiny?[chibi,staticBattle,standard]:[staticBattle,standard];
}
export function bindSprite(img){
 let candidates=[];try{candidates=JSON.parse(img.dataset.sources)}catch{}
 let index=0;
 const loaded=()=>{if(img.naturalWidth>0)img.parentElement?.classList.add('has-sprite')};
 img.onload=loaded;
 img.onerror=()=>{img.parentElement?.classList.remove('has-sprite');index++;if(index<candidates.length){img.src=candidates[index]}else{img.remove()}};
 // Cached images can finish before the listeners are attached after rendering.
 if(img.complete){if(img.naturalWidth>0)loaded();else img.onerror()}
}
