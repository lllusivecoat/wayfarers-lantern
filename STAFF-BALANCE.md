# Staff aptitudes and personalities: balance specification

Status: implemented for all twelve existing building types. Runtime formulas live
in `staff-aptitudes.js`; the candidate/assignment interface and saved paid-day
practice live in `staff-system.js`. New staff receive four saved aptitude scores,
one personality and a fixed 2–4 gp/day base wage. Existing staff receive neutral
3/3/3/3 aptitudes and no trait, preserving their wages, assignments and all practice.
Current unhired candidates receive their profile once, without replacing names or
races; their new quoted wage is confirmed before hiring. Reloads do not reroll them.

Run `node tests/staff-aptitudes-model.cjs` to verify the live formulas and
`python3 tests/staff-aptitudes-browser.py` against a local server for service,
migration, paid-work, loyalty and UI checks. `scripts/staff-aptitude-model.cjs`
remains an independent balance reference. The future buildings below remain planned.

## Candidate generation and replacement

- Four permanent aptitudes: Organisation, Craftsmanship, Care and Fieldcraft.
- Scores range from 1 to 5 and total **12**. Choose uniformly from the 85 valid
  score combinations. A candidate cannot excel at everything; races do not alter scores.
- One visible trait. Candidates have no building skills at recruitment.
- Two candidates per game day. Their identities, stats, traits, wage and hire status
  are saved. Reloading, closing the game, advancing a browser clock or dismissing
  someone cannot refresh the list. Refresh only on the next in-game day.
- Hiring fills an unassigned roster slot. Hall capacity and building slots remain
  separate. No recruitment fee for this first implementation.
- Fixed base wage: **2 gp/day**, plus **1 gp** if any aptitude is 5, plus **1 gp**
  for Industrious or Ambitious. Thus 2–4 gp/day. Wage is shown before hiring and
  stays unchanged on reassignment, skill advancement, or loss of a trait condition.
- Existing staff retain names, assignments, wages and every practice point. Give
  them neutral 3/3/3/3 aptitudes and no trait as a one-time saved migration. Do not
  reroll them or increase their agreed wage.

A skill-6 worker with aptitude 2 outperforms a skill-0 worker with aptitude 5 in
trade prices, guaranteed preparation support, crafting quality, ration strength
and route speed. Replacement trades experience and current wages for long-term fit.

At Storekeeping 10 and Warehouse L5, moving from Organisation 4 to 5 adds 0.9
percentage points to the staff sale bonus before the building multiplier. If that
candidate costs 1 gp/day more, they need roughly **127 gp of base cargo value/day**
to cover that premium after the 20% escort share, assuming full deliveries and no
sale-bonus cap. Low-volume guilds can reasonably keep the cheaper worker. Existing
fixed wages, other traits and failed journeys change that comparison.

## How effects combine

1. Building level establishes access, capacity and its existing upgrades.
2. The chosen staff member's learned skill provides the main staff benefit.
3. The matching aptitude contributes **0/3/6/9/12% fit** at scores 1–5.
4. One trait adjusts that fit or a specified service property.
5. Apply hard caps, then integer costs/output and displayed previews.

Fit is an input to the building-specific formulas below, not a universal percentage
multiplier on every benefit. A positive trait can raise effective fit to **16%**.
Do not multiply quality, output, sale prices, loot, safety and speed all together.
Each building has **exactly one staff assignment slot at every upgrade level**.
Building upgrades improve its service, output or hero capacity, not staff count.
That one person's skill, aptitude and trait supply the staff benefit. Duplicate
buildings each have their own single worker; unique/global effects do not stack.
Sociable and Independent are removed because their conditions do not fit this rule.
The initial list now contains **ten traits**.

## All twelve existing building types

`S` = lead skill (0–10); `E` = effective fit (0–0.16). Percentages below are decimal
fractions in the executable model. Building requirements and discovery gates stay.

| Building / aptitude | Existing building growth retained | Implemented aptitude benefit and cap |
| --- | --- | --- |
| Warehouse / Organisation | Storage 20/40/60/90/135; sale multiplier ×1.05 at L4, ×1.10 at L5; danger −1 at L5 | Staff sale bonus = 3% × S × (1+E), then trait adjustments; **35% maximum**. Skill danger reduction remains floor(S/3), with trait adjustment. No location unlocks. |
| Staff Office / Organisation | Existing preparation upgrades; practice ×1.25 at L2, wages −1 at L3 (minimum 1), extra offer at L4, office DC benefit at L5 | E chance per dispatch of one additional preparation DC reduction. Guaranteed skill support stays floor(S/3). Shared staff DC-reduction cap **6** includes this proc. |
| Workshop / Craftsmanship | Skill gates Basic through Heritage at S1–8; 2 crafts per operational Workshop/day; building quality +1 at L2/+2 at L4, durability +10 at L3/+20 at L5; L5 material factor ×0.8 | Skill material discount = 2.5% × S × (1+E), plus Resourceful if applicable; combined building/staff discount **45% maximum**. Quality proc = 3% × S + E/2 + trait adjustment, **40% maximum**. No duplicate free items. |
| Kitchen / Craftsmanship | Base ration count **1/2/3/4/5** at building L1–5, with exactly one cook. Five ingredient-backed recipe tiers retain their skill/building gates and +1/+2 readiness; advanced recovery effects stay separate | One extra-ration roll per daily batch: E + 5 percentage points at Cooking 4 and 8 + 15 for Industrious; **30% chance maximum**. At most one extra ration, **6/day/building hard cap**. No render/reassignment farming. |
| Infirmary / Care | Treatment slots, wound recovery, weekly free treatments and casualty protections; building L4 treatment factor ×0.75 | Skill discount = floor(S/3) × 5% × (1+E), at most 20%; then trait cost adjustment. Combined non-free gold cost is at least **50% of the base treatment charge**, rounded to at least 1 gp. Free slots remain free. No extra stacking death prevention. |
| Armory / Craftsmanship | Repair factors 70/60/50/45/40%; existing wear protection | Unit = (5 × building factor − 0.5 × floor(S/3)) × (1−E/2), then trait cost adjustment; **minimum 1 gp/unit**. Apply existing hero repair perks and rounding once. No free infinite repairs. |
| Training Hall / Care | Existing slots, prices, day reductions, respec options and cooldowns | Staff discount = floor(S/3) × 5% × (1+E), at most 20%. Training gold cost = sheet price × 0.75 × building factor × staff factor × trait factor, with a **30%-of-sheet floor**. Respecs retain their own price tables, at least 1 gp; no extra aptitude time reduction. |
| War Room / Organisation | Raid access; building DC −1 at L3, payout +10% at L4, bonus-loot modifier +5% at L2/+10% at L5, reputation upgrade | Loot modifier = skill support × 5% + building bonus + E + trait adjustment, **35 percentage points maximum**; final drop chance **95% maximum**. Staff support applies once to DC, never again to rolls. |
| Hunter's Lodge / Fieldcraft | World Boss access and equivalent building reward progression | Same bounded loot/support rules as War Room, applied only to World Boss expeditions. No automatic location discovery. |
| Command Post / Organisation | World Raid access and equivalent building reward progression | Same bounded loot/support rules as War Room, applied only to World Raids. No multiplicative reward bonuses per staff member. |
| Cartographer's Office / Fieldcraft | Completed building reveals Exploration at Hall 2/50 reputation; one staff slot at every level | Guaranteed skill support floor(S/3). Partial-success discovery chance = 35/38/41/44/47% at building L1–5 + E, **50% maximum**. Success/exceptional discovery rules stay; no discoveries on failure or outside exploration reports. |
| Waystation / Fieldcraft | Base reduction 10/25/40/55/80%; plus 2% × S; one-minute quest minimum; new quests only | Add E/3 to time reduction (up to 5.33 percentage points with a conditional trait), then clamp at **80%**. Convoy time unchanged. L5 already reaches the cap with any assigned worker. |

### Global safety and economic rules

- Staff support is normally at most 3; Cautious can raise one lead to 4. Preparation
  and the expedition specialist combined remain capped at 6, including the Staff
  Office preparation proc. Existing building benefits remain separate; apply the
  existing effective DC floor. Trait bonuses must not be applied a second time to rolls.
- Ingredient charges round **up** per material and never below one. Boss relics,
  Heritage Ore and recipe unlocks cannot be bypassed by aptitude or traits.
- Crafted extra readiness is +1, or +2 at Blacksmithing 9+. With building quality,
  an individual item and the existing relevant equipped-gear contribution cap at
  +6. When a quality proc cannot add readiness because of that cap, grant +5 maximum
  durability instead; retain the +20 building durability limit before that proc.
- Keep the 20% market purchase premium, escort share, stock restrictions and loss
  on ambush. Even the best sale bonus must not make same-market buy/resell profitable.
- The Waystation is intentionally saturated at L5. A cheap junior can operate it;
  experienced Fieldcraft staff can move to hunting or cartography. Do not promise
  that a high aptitude makes an already capped service stronger.
- Gold perks change the previewed charge, not hidden refunds. Fractional chances
  roll once per actual service/batch. Daily limits, saved stock and queued reports
  must survive reloads; never roll bonuses during UI rendering.

## Ten personality traits

All bonuses below are conditional on the currently assigned service. Show inactive
or capped effects explicitly in candidate/assignment previews.

| Trait | Benefit | Cost / condition |
| --- | --- | --- |
| Meticulous | +6 percentage points to Workshop quality chance | Service gold charges ×1.05. Does not improve access, recipe tier, or daily capacity. Initially a crafting trait; no undisclosed ration-quality system. |
| Resourceful | +3 percentage points skill material discount; treatment/training/repair gold charges ×0.95 | Workshop quality chance −3 percentage points; combined discount caps still apply. |
| Industrious | Kitchen extra-ration chance +15 percentage points; Workshop crafted durability +5 | Permanent base wage +1 gp/day. No extra crafted item, relic or sale cargo. |
| Studious | +0.20 passive practice credit per completed workday | Aptitude fit multiplied by 0.75. No additional service-use award. |
| Specialist | +4 percentage points fit when working their highest positive-level skill; ties qualify | Inactive at skill 0 and while developing a lower-level skill. |
| Adaptable | +0.25 passive practice credit/day while current skill is below their highest skill | Stops at parity. New workers with all skills 0 do not receive it yet. |
| Cautious | +1 support/danger reduction for expedition preparation, convoy safety or exploration, subject to shared caps | Warehouse sale bonus −3 percentage points; expedition bonus-loot modifier −3 points. No extra death-prevention stack. |
| Daring | Warehouse sale bonus +4 percentage points or expedition loot modifier +3 points | Support/danger reduction −1, minimum 0. Sale/loot hard caps remain. |
| Loyal | +1 percentage point fit per seven consecutive completed workdays at the same building, up to +4 after 28 | Moving/unassignment or an unpaid day resets the streak, never skills. Reselecting the same building does not reset or advance it. |
| Ambitious | +4 percentage points fit in a building upgraded to L4 or L5 | Permanent base wage +1 gp/day, even while working in a lower-level building. |

## Practice and progression

The cumulative skill thresholds remain **5, 15, 30, 50, 75, 105, 140, 180, 225, 275**.
Only the assigned skill earns points. Normal work = 1 passive point/day and service
use = at most 1 point per staff member/skill/day. Fractions never disappear:

- Store passive credit in hundredths. Start at 100/day; an operational Staff Office
  L2+ adds 25; Studious adds 20, or eligible Adaptable adds 25. These are additive.
- Pay whole points and retain the remainder. Credit does not tick while unassigned
  or on a UI render. Do not grant office practice twice or multiply service awards.
- Persist the last completed workday, passive credit, per-skill service award dates,
  loyalty instance/streak and candidate refresh day. Same-day moves cannot earn
  additional passive shifts. Reassignment retains earned XP and unused fractional credit.

| Fully active work pattern | Days to 275 practice from zero |
| --- | ---: |
| Normal, no Office bonus | 138 |
| Studious, no Office bonus | 125 |
| Normal, Staff Office L2+ | 123 |
| Studious, Staff Office L2+ | 113 |
| Adaptable while continuously catching up, Office L2+ | 110 |

These assume one real service award each day. Adaptable is an upper bound: it stops
when the current skill catches up, so the 110-day row is not a guaranteed route to
mastery for a new candidate. Do not shorten the actual level thresholds.

## Planned buildings at Hall tiers 3–6

These are design limits, not implemented game features and not part of the current
runtime matrix. Retain their proposed unlock tiers when implementing them later.

| Hall | Building / aptitude | Suggested L1–5 progression and overall bound |
| --- | --- | --- |
| 3 | Trading House / Organisation | +2/4/6/8/10 incoming units per stocked good; total market stock capped at 30. No second sale multiplier. |
| 4 | Herbal Garden / Care | 1/2/3/4/5 basic herbs daily, skill can add up to 2, fit can occasionally add 1; cap 8. Advanced seeds require discovered sources and recurring input costs. No relics. |
| 4 | Enchanting Study / Craftsmanship | 1/2/3/4/5 daily consumable enchant charges; at most +1 temporary readiness, included in the existing +6 gear cap. Consumes materials; no permanent infinite stacking. |
| 5 | Salvage Yard / Craftsmanship | Recover 10/15/20/25/30% of common recipe materials; skill/fit cap 40%, round down. Destroy the item; no recovered gold, relics or Heritage Ore. No crafting/salvage profit loop. |
| 5 | Diplomatic Embassy / Organisation | Reputation bonus 1/2/3/4/5%, plus skill up to 5% and fit up to 2%; total 12% cap. No direct discovery, building access or Hall-tier bypass. |
| 6 | Grand Expedition Office / Organisation | 2/2/3/3/4-stage expeditions; one active chain. Total loot budget follows the stages' normal combined rewards. Apply Waystation once per stage, never again to the chain total. |
| 6 | Hall of Legends / Care | Five achievement/cosmetic/heritage-recipe milestones. No stacking permanent combat or staff-XP multipliers; recipes keep resource and skill gates. |

## Integration notes

- Workshop building quality and durability now apply to crafted items and their
  previews. The final readiness cap is +6; a quality proc at that cap grants +5
  durability instead. Material and gold charges shown before crafting are final.
- Kitchens roll for one extra ration per completed paid batch. Every extra ration
  consumes its full selected recipe ingredients and respects the shared stock cap.
  Current five-tier cooking, healing and repair effects are preserved.
- Staff Office L2 adds 25 hundredths of passive practice per paid workday. Studious
  adds 20, eligible Adaptable adds 25. Unpaid/unassigned shifts earn none. Whole
  points go to the assigned skill, fractions remain saved, and the service award
  stays capped at one per skill/day. Loyalty also counts only paid completed days.
- All building levels retain one staff slot. Traits do not add staff, training slots,
  craft capacity, free material, automatic discoveries or a second speed multiplier.
- Expedition preparation is capped at six staff DC reduction including the Office
  proc, and it is applied once. Exploration's partial-discovery chance is saved at
  dispatch, so reassignment/upgrading cannot rewrite underway results.
- Gold-funded permanent expeditions retain their organising fees and zero client
  payment. Aptitude/loot support never restores those removed client payouts.

## Verification and practical limits

The executable model checks **36,300** existing-building combinations: all twelve
jobs, building L1–5, skill 0–10, matching aptitude 1–5, ten traits plus a neutral
baseline, with one worker per building. It checks caps, skill/upgrade monotonicity,
experience-versus-potential examples, fixed candidate wages, and practice pacing.
It also checks **18,900** maximum-bonus same-market price scenarios, including
integer rounding, Warehouse multipliers, stock sizes up to 30 and escort pay.
No tested purchase/resale loop returns more treasury gold than was spent.

The live model tests cover 850 candidate profiles, 36,300 building/skill/aptitude/trait
combinations and 4,410 maximum-sale market scenarios. Browser integration checks
exercise the actual services, saves, current recipes and assignment interface. These
checks do not establish an optimal campaign strategy; player playtesting remains useful.

## Revised Kitchen and ration balance

Recommendation: retain one staff member per building. Upgrade capacity belongs to
buildings; aptitude, learned skills and traits belong to the person running it.
This gives each Kitchen upgrade a guaranteed benefit without recruiting extra cooks.

| Kitchen level | Base rations/day | Possible extra | Readiness per ration |
| --- | ---: | ---: | --- |
| 1 | 1 | at most 1 | Trail +1 |
| 2 | 2 | at most 1 | Trail +1; Hearty +2 at Cooking 3 |
| 3 | 3 | at most 1 | Trail +1; Hearty +2 at Cooking 3 |
| 4 | 4 | at most 1 | Trail +1; Hearty +2 at Cooking 3 |
| 5 | 5 | at most 1 | Trail +1; Hearty +2 at Cooking 3 |

Cooking 4 adds five percentage points to the extra-ration chance; Cooking 8 adds
another five. Aptitude/conditional fit contributes at most sixteen, and Industrious
adds fifteen, with a combined thirty-point ceiling. Roll once per completed daily
batch. With enough selected ingredients, an upgraded Kitchen produces five, occasionally six,
without making food buffs stronger than +2. Skill and aptitude retain a modest output
benefit even when the building's quality guarantee has reached its cap.

Kitchen upkeep stays 2 gp per building level plus the assigned worker's wage.
Each Trail Ration consumes 1 Meat and 1 Fresh Fish. Each Hearty Ration consumes
1 Prime Meat and 1 Deviate Fish and requires Kitchen 2 and Cooking 3. Ingredient
stock limits actual production. Higher building levels never bypass ingredient gates. Production
requires that Kitchen's daily upkeep and worker wage have been paid; mark those
payments explicitly rather than assuming a large treasury means the shift was paid.
No extra batch from changing cooks, rebuilding an already-produced Kitchen, or
reloading a save. The guild's ration stock limit is thirty remaining ration uses;
existing saves above that limit keep their items, but production pauses until space
is available. Duplicate Kitchens add daily throughput, not a larger stockpile limit.

Provision rules: one active food/draught readiness bonus per hero, maximum +2,
separate from the existing +6 gear-readiness cap. A stronger provision may replace
an existing weaker bonus, never add to it. Reject equal/weaker uses without consuming
an item. Provisions can only be used before dispatch, not while a hero is away.
The bonus applies to that expedition and clears on return; existing queued rolls
and bonuses must not be rewritten during migration.

Kitchen L4+ retains the one-day Light-wound recovery benefit when a ration is used,
but only once per hero per game day. It does not heal Serious/Grievous wounds or
replace Infirmary treatment. Keep the existing paid-cost morale recovery capped
at 3; food does not grant immunity to unpaid wages.

## Comparison: optional head-and-assistant staffing

This alternative is not the recommended baseline and is not included in the
36,300 one-worker model cases. It would need a second balance pass before use.

| Rule | One-worker baseline | Optional two-worker alternative |
| --- | --- | --- |
| Slots | One per building at every level | One head; one assistant from building L3; never a slot per upgrade |
| Head | All skill, aptitude and trait effects come from that person | Same; the player explicitly selects the head |
| Assistant | Not applicable | Capacity-only assistance, up to 20% of base service throughput; fractional capacity carried between paid days |
| Quality/safety | One worker's contribution | No second readiness, recipe-tier, loot, discovery or safety bonus |
| Example Kitchen L5 | Five rations plus up to one chance-based extra, at most six | Assistant can fill the sixth-ration capacity; no seventh ration and still at most +2 readiness |
| Wages | One agreed wage | Both full agreed wages; assistance pauses when its wage is unpaid |
| Practice | Current building's skill only | Both get normal paid-shift practice; each has the same one-service-award/day limit when participating |
| Missing head | Building pauses | Assistant does not supply a second full head bonus; player promotes/reassigns them |

Capacity would mean additional ration/treatment/training slots, not additional
rare crafted items without their normal recipe ingredients and gold. In unique
support buildings, an assistant would chiefly be an apprentice; if the service has
already hit its cap, the UI must say the assistant adds no service benefit. Never
invent a second 80% speed reduction or multiply the same warehouse markup twice.

The alternative adds apprenticeships but also more wages, extra staffing screens
and more capped/low-value assignments. With twelve building types already present,
one worker gives twelve meaningful hiring decisions and makes swapping workers
clearer. Add assistants later only if the player explicitly wants that extra depth.

Implementation note: kitchen-system.js implements single-worker, ingredient-backed cooking, including the bounded aptitude/trait extra-ration roll. All five current recipes and recovery limits are retained; see BALANCE.md.
