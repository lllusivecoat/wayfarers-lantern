/* Shared balance rules. Save values are never rewritten when these rules change. */
window.WL_BALANCE=Object.freeze({
  supportBonus:level=>Math.floor(Math.max(0,Math.min(10,level))/3),
  salePerLevel:.03,
  materialPerLevel:.025,
  craftChancePerLevel:.03,
  craftExtra:level=>level>=9?2:1,
  rationCount:(staffedLevel,skill)=>1+Math.floor((staffedLevel-1)/2)+Math.floor(skill/4),
  rationBonus:skill=>skill>=6?2:1,
  marketPrice:(base,rate)=>Math.max(1,Math.ceil(base*rate*1.2)),
  marketStock:ring=>Math.min(18,8+ring*2)
});
