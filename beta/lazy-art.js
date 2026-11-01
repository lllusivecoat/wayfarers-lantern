/* Card artwork only: preserve the eager Hall banner and full-size location viewer. */
(() => {
 const pending=new WeakMap(),applied=new WeakMap();
 function apply(el){if(window.WL_BETA_BOOT?.active)return;const data=pending.get(el);if(!data)return;el.style.setProperty(data.property,data.value,data.priority);applied.set(el,data);pending.delete(el);observer?.unobserve(el)}
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)apply(e.target)},{rootMargin:'160px 0px'}):null;
 window.addEventListener('beta:boot-ready',()=>{if(!observer)document.querySelectorAll('[data-boot-art]').forEach(apply);else document.querySelectorAll('[data-boot-art]').forEach(el=>{observer.unobserve(el);observer.observe(el)})},{once:true});
 window.betaDeferArtwork=(el,value,property='background-image',priority='')=>{value=value.replaceAll('img/locations/','img/thumbnails/');const prior=applied.get(el);if(prior?.value===value&&prior.property===property)return;const waiting=pending.get(el);if(waiting?.value===value&&waiting.property===property)return;pending.set(el,{value,property,priority});el.setAttribute('data-boot-art','');if(observer)observer.observe(el);else apply(el)};
})();

