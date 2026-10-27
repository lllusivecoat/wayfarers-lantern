# Staff and market balance

This is a first balance pass using the existing d20 checks, costs, escort shares,
upkeep, crafting tiers and daily progression. It does not rewrite saved practice,
crafted items, inventory, staff wages, or convoys already dispatched. New rules
apply to future actions. Nothing here changes exploration unlocks.

## Values

The shared tuning rules live in `balance.js`; UI and gameplay use the same values.

| System | Previous implementation | Balanced value |
| --- | --- | --- |
| Support skill bonus | +1 every 2 levels, maximum +5 | +1 at levels 3, 6 and 9, maximum +3 |
| Raid/boss specialist | Both a DC reduction and a roll bonus | DC reduction once; retain the existing loot benefit |
| Storekeeping | +5% sales per level, up to +50%; danger −5 | +3% sales per level, up to +30%; danger −3 |
| Blacksmithing material discount | 4% per level, up to 40% | 2.5% per level, up to 25% |
| Extra crafted readiness | 5% chance per level; +2 from level 8 | 3% chance per level, up to 30%; +1, or +2 at level 9+ |
| Kitchen output | Staffed level × (1 + floor(skill / 3)), up to 20 | 1/2/3 base at staffed levels 1/3/5, plus 1 at Cooking 4 and 8; up to 5 |
| Ration readiness | +1 to +3 | +1; +2 from Cooking 6 |
| Market purchases | Base value × 1.2 at every location | Base value × local exchange rate × 1.2, rounded up |
| Daily market stock per good | 8 + 2 × location ring, uncapped | Same progression, capped at 18 |

Kitchen production is recorded per building per day, preventing duplicate output
on repeated calls. Early towns stock basic goods; city stocks add Mithril Ore and
Arcane Thread from discovery ring 4 onward. All towns/cities still need to be discovered.
Inbound escorts now use the same rank and wound modifiers as outbound escorts.

The existing level-5 Workshop material discount remains multiplicative: at master
skill and building level 5, the combined discount is 40% before rounding. Each
required material still costs at least one unit. The existing +6 equipped gear
readiness cap remains. Higher recipes retain their resource and gold costs.

The smaller shared skill bonus also limits skill-based treatment discounts to 15%,
repair unit discounts to 1.5 gp, and training/respec discounts to 15%. Building-based
service upgrades remain separate. A master Quartermaster plus a master expedition
specialist can reduce DC by 6 total; the specialist no longer adds another +3 to rolls.

## Progression

The requested cumulative thresholds remain 5, 15, 30, 50, 75, 105, 140, 180, 225 and
275. Working grants 1 practice per day; service use grants at most 1 additional point
per staff member, skill and day. An active specialist therefore reaches Basic at
about 3 working days, Heritage at about 90, and mastery at about 138; with work alone,
these take 5, 180 and 275 days. Reassignment retains every skill's accumulated points.

## Economy checks

`node tests/balance-model.cjs` checks 124,740 combinations of route rates, staff
levels, Warehouse upgrades, good values and shipment sizes. Even assuming two
perfect journeys, a same-market purchase/resale cannot increase treasury gold once
the existing escort share is deducted. Casualties and partial deliveries can only
make that trade worse. The model also checks output and bonus bounds.

Cross-market trade remains viable: buy twelve base-8-gp goods in Ratchet for 132 gp,
then sell in Stormwind with Storekeeping 10 and Warehouse 5 for 198 gp treasury on
full success. That is 66 gp profit before upkeep, two journeys, and cargo/escort risk.
Stock limits restrict the volume; discovered routes, escorts and capital are required.
This example demonstrates an opportunity, not an expected or guaranteed profit.

`python3 tests/staff-browser.py` checks real gameplay, migration, assignment, service
effects, crafting, both convoy directions, mobile crafting and existing screens.
Serve the checkout with `python3 -m http.server 8000 --bind 127.0.0.1` first.

Long campaign pacing, player strategy and subjective difficulty still need human
playtesting. These checks establish bounded rewards and remove obvious local
arbitrage and duplicate bonuses; they do not establish an optimal economy.
