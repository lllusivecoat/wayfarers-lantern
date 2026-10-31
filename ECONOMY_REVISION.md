# Member shares, enhancement fees and repairs

Contract member rates are now 8% each at F–A, 10% each at S/SS, and 12% each at Legendary/Renown. Greedy adds 5% to that base share (×1.05), Very Greedy adds 10% (×1.10), and Frugal/Generous take 5% less (×0.95). These are relative modifiers, not additional percentage points. The final adjusted amount rounds up once, with a small floating-point tolerance at exact integer boundaries. Existing budget caps and trait-retraining behavior remain. Other party-compensation rules are unchanged.

Enhancements consume guild materials and transfer a service fee from the owning hero's personal purse into the guild treasury. Unowned warehouse items must first be bought/equipped by a hero. Previously purchased stored gear can be enhanced using its retained heroOwner. Away or dead owners cannot enhance items. The quote displays exact gold, materials, current effects and next effects. Insufficient materials or personal gold fail without deducting resources or consuming fractional material credits.

| Tier | Upgrade 1 | Upgrade 2 | Upgrade 3 | Upgrade 4 |
| --- | --- | --- | --- | --- |
| Basic | 20 gp | 50 gp | 80 gp | 110 gp |
| Sturdy | 50 gp | 80 gp | 110 gp | 140 gp |
| Fine | 80 gp | 110 gp | 140 gp | 170 gp |
| Superior | 110 gp | 140 gp | 170 gp | 200 gp |
| Masterwork | 140 gp | 170 gp | 200 gp | 230 gp |
| Relic | 170 gp | 200 gp | 230 gp | 260 gp |
| Legendary | 200 gp | 230 gp | 260 gp | 290 gp |
| Heritage | 230 gp | 260 gp | 290 gp | 320 gp |

These fees apply per hand unit, or per armor/ring/cape item. Formula: 20 + 30 × tier index + 30 × (target stage − 1). Two-handed weapons pay twice, matching two one-handed pieces. Paid enhancements do not retroactively charge existing stages, reroll stats or increase export/buyback value.

All repair charges are exactly twice the previous result after Armory/perk discounts and rounding. Full-repair caps before discounts: Basic 20, Sturdy 32, Fine 48, Superior 64, Masterwork 96, Relic 128, Legendary 160, Heritage 200 gp for non-hand gear or a two-handed weapon; one-handed/offhand items use half. Gathering-tool repair fees are doubled too. Repairs remain a personal-gold expense; only enhancement fees are newly transferred to the guild.

Existing pending/returned quest payments are sealed and unchanged; revised cuts apply to new dispatches. No saved items, staff, skill progress or enhancement levels are deleted.

Tests exercise all member rates and trait modifiers, exact-boundary rounding, tier/stage fee quotes, hero-to-guild transfers, material-credit atomicity on insufficient funds, ownership/away guards, hand parity, existing enhancement effects, material discounts, doubled repair caps and actual payments, save/reload and offline updates. The previously identified zero-share daily-boss compensation rule remains a separate unresolved omission.
