# Equipment sell-back and dismantling

Inventory → Gear & Repair now has a collapsible Sell equipment & dismantle section.

Heroes sell equipment to the guild for the smaller of 25% of recorded purchase value (current listed value for legacy equipment) and 65% of full-condition ingredient-based export value, multiplied by remaining durability fraction and rounded down. The guild pays from its treasury into the hero's personal purse. A confirmation explains the transfer. Away and fallen heroes cannot sell. Equipment is removed from hero slots and becomes guild stock; repeated sale attempts cannot pay again. Broken or valueless equipment can be transferred for zero gold.

Equipment ownership persists when unequipped. Re-equipping an item the hero already owns is free. Other heroes must wait for the owner to sell it before they can purchase it. Existing equipped gear acquires this ownership marker without changing its stats. Gear already unequipped before this patch has no recoverable previous owner and remains guild stock.

A staffed Workshop can permanently dismantle guild-owned equipment. The preview and confirmation show the exact yield: 25% of ordinary materials recorded at crafting, rounded down with a minimum of one per ordinary ingredient. Heritage Ore, dungeon ingredients, relics and other rare loot are excluded. Enhancement materials are not refunded. Items lacking recorded crafting costs cannot produce invented salvage; the UI explains why dismantling is unavailable. Full salvage yield does not depend on durability, so repairing merely to dismantle gives no advantage.

Existing saves remain compatible. New fields are heroOwner and purchaseValue on gear. No existing inventory is removed automatically. Crafted stats, tier effects and enhancements are preserved until the player explicitly dismantles an item.

Browser checks cover ownership after unequipping, free re-equipping, condition pricing, canceled confirmations, away heroes, treasury/purse transfers, clearing equipped references, preventing repeat payouts/salvage, rare-material exclusions, actual resource awards and save/reload. Repair cost parity and offline update tests also run. The quest-review files from the previous task remain separate local review artifacts.

## Outbound convoy sales

Trade cargo now includes materials, guild-owned unequipped gear, and stored uses from consumables, alchemy potions and field kits. Hero-owned gear is excluded, even when unequipped; sell it back first. Equipped utility supplies are already reserved outside storage and are excluded. One gear item or consumable use occupies one cargo unit, sharing escort capacity with materials.

Gear export base value is 135% of the trade value of ingredients actually paid, rounded up, then adjusted for condition and rounded down. Broken gear has zero export value. Consumable base values are 2 plus twice the recipe skill requirement (or item bonus for legacy supplies), capped at 25 gp per use. These conservative base prices receive the existing route, Storekeeping and trade modifiers; the preview shows gross value, escort pay and net guild proceeds. No new market discovery or reputation rules were introduced.

Dispatch requires confirmation when gear or supplies are included. Validation completes before removal; cargo leaves storage at dispatch and its name and base value are recorded in the saved report. Existing loss rules apply: partial delivery retains 75% of each line rounded down, so a single gear item is lost on partial delivery; failure loses everything. Payout and market relationships apply through the existing return flow. Dismantling, equipping or another convoy cannot reuse cargo removed at dispatch.

Verified mixed manifests, hero-owned exclusions, canceled dispatch, exact removal of gear/materials/uses, price snapshots, repeat-dispatch prevention and save/reload. The existing full trade regression passed inbound/outbound transactions, partial/failure outcomes, return handling, relationships, discovery and mobile/desktop rendering without console errors. Offline update tests passed.


## Ingredient pricing balance

Ingredient trade value uses exactly the same material base prices as direct convoy sales (including the existing 2 gp fallback for unpriced materials). It is an opportunity cost, not a gold crafting fee. Staff savings reduce the recorded ingredients and therefore the new item's export value; changing staff later cannot reprice that snapshot. Quality and paid enhancements do not create extra export premiums.

Example: a sword crafted with 2 Copper Ore has an ingredient value of 4 gp and full-condition base export value of 6 gp. Buy-back is capped at 3 gp, or less if its original purchase price or condition warrants it. At half durability its export base becomes 3 gp. Route bonuses and escort payment then determine the actual treasury return; the 35% premium does not guarantee a net profit for tiny or dangerous shipments. Existing hero equip charges remain unchanged.

Older recognized patterns without recorded ingredients use their undiscounted recipe and hand count as a stable fallback. Unknown legacy items retain a conservative 40%-of-listed-price export fallback; they cannot honestly be assigned a verified ingredient profit margin. Existing items and personal gold are never rewritten for this price change.

Crafting preview shows ingredient value and full-condition export base. Browser checks cover all catalog recipes, worn/broken items, buy-back caps, recorded-cost stability, legacy fallback and save/reload, plus convoy/recycling/offline regressions.
