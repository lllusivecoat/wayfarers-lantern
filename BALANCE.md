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

## Waystation

A unique Waystation unlocks at Local guild rank and costs 75 gp, with 3 gp upkeep
per building level and a 2 gp/day Pathfinder base wage. Any staff member can fill
its slots and trains Pathfinding using the existing practice rules. A staffed
Waystation reduces new quest times by 10/25/40/55/80% at building levels 1–5,
plus 2% per Pathfinding level, capped at 80%. A Level 5 building grants 80%
even with a novice staff member.
The strongest assigned Pathfinder applies; bonuses do not stack. Building upgrades
improve the base reduction and add staff capacity. Quest timers have a
one-minute minimum. Contracts, gathering, exploration and group quests all benefit;
convoys and already-dispatched quest timers remain unchanged.

## Cartographer’s Office

Unlocks at Hall Tier 2 and Established guild rank (50 reputation). Costs 90 gp,
with 2 gp upkeep per building level and a 2 gp/day Cartographer base wage.
Completing construction reveals the permanent Exploration mission; staffing is
optional for access. The strongest assigned Cartographer reduces Exploration DC
by 1 at Cartography levels 3, 6 and 9 (up to 3). Exploration reports award service
practice under the existing daily limit. Upgrades add staff slots, not discoveries.

Without a completed office, Exploration is absent from quest lists and cannot be
dispatched through the normal UI. Construction in progress does not unlock it.
Destroying the office hides future Exploration offers but preserves discovered
locations, learned skills and reports already underway. Existing saves do not
automatically receive the building. Other quests and discovered markets remain.

## General staff recruitment

Staff recruitment and building assignments are separate. New hires join unassigned
with no hiring fee and a 2 gp/day base wage payable only while assigned. Existing
staff retain their saved wages, identities and skills. Staff Office wage reductions
still apply. Recruitment uses Hall capacity, even if all building slots are filled;
assignment uses completed building capacity and never creates another staff member.
Building-page staffing actions lead to the Staff page rather than hiring a specialist.

## Current implementation: one worker and ingredient cooking

This section supersedes earlier headcount and automatic free-ration descriptions.
Every completed building, including the Warehouse, has one staff slot at all levels.
A staffed building operates at its actual upgrade level. Existing multi-worker saves
keep the most experienced assigned worker in each building and retain every extra
worker, with all wages and skills intact, on the unassigned roster.

The Inventory page contains a daily recipe selector per Kitchen:

| Recipe | Kitchen / Cooking required | Ingredients per ration | Readiness |
| --- | --- | --- | --- |
| Trail Rations | Kitchen 1 / Cooking 0 | 1 Meat + 1 Fresh Fish | +1 |
| Hearty Rations | Kitchen 2 / Cooking 3 | 1 Prime Meat + 1 Deviate Fish | +2 |

One paid daily shift produces up to the Kitchen's level (1–5) in rations, limited by
the selected recipe's ingredients and guild ration stock (30 remaining uses). No
free substitution to a cheaper recipe. Players can pause cooking. Production happens
after costs are settled when resting; same-day calls/reloads do not create more food.
Existing food, including over-limit stocks, is retained; production waits for room.

Skinning keeps its leather rewards and adds Meat equal to half the returned material
quantity, rounded up. C-rank-and-higher Skinning adds Prime Meat equal to a quarter of that
quantity. Fishing keeps Fresh Fish and its existing rare catches; C-rank-and-higher trips add a
guaranteed extra quarter-haul of Deviate Fish. Partial hauls scale from actual returned
quantity. Failed expeditions add no food. Drops are committed in the expedition report
and delivered to storage on return, never by opening a preview.

Provisions provide a single non-stacking readiness bonus up to +2. A stronger item
can replace a weaker one; equal/weaker use consumes nothing. Provisions cannot be
used while a hero is away. Kitchen L4+ ration use advances Light-wound recovery once
per hero per day; it does not heal serious wounds. Existing prepared bonuses and
queued report results are not rewritten during migration.

Aptitude, personality and daily-candidate changes remain a separate balance proposal
in STAFF-BALANCE.md; the current cooking implementation adds no random extra output.

## Five Kitchen recipe tiers (latest food rules)

Gathering ranks are displayed as F/E/D/C/B/A/S/SS/Legendary/Renown; numeric rank
indices are internal only. Each recipe below consumes one of each listed ingredient
per ration. Production remains ingredient-limited, once daily after costs are paid,
with one assigned worker and a 30-use guild ration-stock limit.

| Kitchen | Cooking | Recipe | Minimum ingredient rank | Meat + fish | Effect |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | Trail Rations | F | Meat + Fresh Fish | +1 readiness |
| 2 | 3 | Hearty Rations | C | Prime Meat + Deviate Fish | +2 readiness |
| 3 | 5 | Restorative Rations | A | Rich Game Meat + Silverfin | +2 readiness, one Light-wound recovery day |
| 4 | 7 | Fortifying Rations | S | Wild Game Meat + Deepwater Fish | +2 readiness, one Light-wound recovery day, repair up to 1 durability on one equipped item |
| 5 | 9 | Grand Feast Rations | SS | Primal Meat + Royal Salmon | +2 readiness, one Light-wound recovery day, repair up to 2 durability on one equipped item |

Higher-rank trips retain every lower food grade. Skinning keeps its leather and
adds Meat at half the returned haul. C/A/S/SS ingredients are additional drops at
returned haul divided by 4/6/8/10 respectively, rounded up. Fishing's main reward
remains Fresh Fish; the same additional-grade rule applies. Partial success scales
food from the actual returned haul; failure grants no food. Original rare loot stays.

Use Provision now opens a choice of stored meals, displaying effects and quantities.
The player can conserve rare meals; selecting equal readiness is allowed only when
a recovery effect would actually help. Food never downgrades or stacks readiness.
All meals share a one-Light-wound-day-per-hero-per-day limit and a two-durability
repair limit. Fortifying followed by Grand Feast restores at most two total, not
three; repair affects the most damaged equipped item. Serious/Grievous wounds are
untouched. Recovery counters and meal effects persist through saves and reloads.
