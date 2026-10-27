/* Shared balance rules. Save values are never rewritten when these rules change. */
window.WL_BALANCE=Object.freeze({
  questTimeCut:(skill,building=1)=>Math.min(.8,[0,.1,.25,.4,.55,.8][Math.max(1,Math.min(5,building))]+.02*Math.max(0,Math.min(10,skill))),
  expeditionCost:(kind,rank,party)=>({Gathering:2,Exploration:4,'World Dungeon':8,'World Boss':10,'World Raid':16}[kind]||4)+2*Math.max(0,Math.min(9,Number(rank)||0))+Math.max(1,Math.floor(Number(party)||1)),
  supportBonus:level=>Math.floor(Math.max(0,Math.min(10,level))/3),
  salePerLevel:.03,
  materialPerLevel:.025,
  craftChancePerLevel:.03,
  craftExtra:level=>level>=9?2:1,
  rationCount:building=>Math.max(1,Math.min(5,Number(building)||1)),
  rationBonus:skill=>skill>=6?2:1,
  marketPrice:(base,rate)=>Math.max(1,Math.ceil(base*rate*1.2)),
  marketStock:ring=>Math.min(18,8+ring*2)
});
