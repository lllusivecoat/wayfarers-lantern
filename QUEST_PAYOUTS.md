# Client-funded quest payouts

New dispatches no longer receive the within-day gold payout reduction. v9Market retains its day/counter state for existing reputation logic, but returns a gold multiplier of 1 for every attempt. Daily quest generation, expiry and daily completion limits remain separate. Outcomes still multiply payment by 0 for failure, 0.5 for partial, 1 for success and 1.5 for exceptional success. Existing building and trait modifiers remain.

Member contract rates per hero by rank: F–A 8%, S/SS 10%, Legendary/Renown 12%. Greedy multiplies the base share by 1.05, Very Greedy by 1.10, and Frugal/Generous by 0.95. The final trait-adjusted share is rounded up once; existing payout caps remain. Active trait-retraining rules can suppress these effects.

Paid normal dungeons and normal raids share 42% of the payment across the party before rounding and personal trait adjustments. Guild-funded permanent expeditions do not pay a client-funded hero share. The current paid daily boss compensation branch returns zero; this is a separate unresolved omission, not changed by the gold-decay fix.

For a 77 gp successful E-rank contract and three members without compensation modifiers, each earns ceil(77 × 0.08) = 7 gp and the guild receives 56 gp. This is unchanged by how many quests were already dispatched that day. Existing sealed/returned payouts are not recalculated.

Repair limits are documented in REPAIR_AND_UTILITY_BALANCE.md. They depend on gear tier, damage fraction, hand budget, Armory and hero perks, not hero rank.

Tests cover thirty successive full-payment calculations, day reset, all ten contract rates, the 77 gp example, an actual late-day report and treasury payment, save/reload, quest variety, utility/repair regression and offline updates.
