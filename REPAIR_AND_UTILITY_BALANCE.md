# Repair and utility changes

Full-condition repair budgets before Armory and hero discounts:

| Tier | Armor/cape/rings or both hands | One hand |
| --- | --- | --- |
| Basic | 10 gp | 5 gp |
| Sturdy | 16 gp | 8 gp |
| Fine | 24 gp | 12 gp |
| Superior | 32 gp | 16 gp |
| Masterwork | 48 gp | 24 gp |
| Relic | 64 gp | 32 gp |
| Legendary | 80 gp | 40 gp |
| Heritage | 100 gp | 50 gp |

Repairs scale with the fraction of durability missing, with a minimum charge for damaged equipment. Armory and existing hero perks reduce the charge. Two-handed repairs use two rounded hand units, preserving parity with two equivalent one-handed repairs. Fully repaired items cost zero. Gathering tools retain their previous repair calculation and durability behavior. The existing repair quote and actual payment share the same function, so displayed fees agree with charges.

Ration, readiness potion and field-kit utility slots now reserve up to three actual uses from stock. Each expedition spends one use from the strongest useful item in each category; remaining charges stay equipped. Bonuses remain one ration plus one potion, at most +4 readiness, and one kit's protection. A multi-stage expedition still consumes only once at its start. Charges do not stack into stronger effects.

Unequipping or replacing returns every unused charge, including when the original stock entry was exhausted. Low stock loads one or two uses instead of inventing free charges. Existing equipped packs keep their remaining charges; re-equipping from sufficient stock loads up to three. Supplies carried by fallen heroes remain lost. Sale quantities continue to refer to stored, unreserved uses.

Inventory Consumables is now a native details section, closed by default. Existing headings and storage rendering retain the same element IDs.

Tests cover three successive departures in all three categories, stock reservations, partially stocked slots, returning unused charges, tier caps, one/two-handed parity, actual gold deductions, the consumables toggle and save/reload. Stage tests verify remaining charges stay unchanged through automatic continuation. Gear cost and offline lifecycle regressions pass.
