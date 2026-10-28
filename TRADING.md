# Trading balance

Only towns and cities discovered by exploration appear as markets. Storekeeping
and trade relationships never reveal locations. The same Warehouse and escort
selection serve incoming purchases and outgoing sales.

## Cargo and routes

Both directions accept mixed manifests. Each material item uses one cargo unit.
Warehouse levels 1–5 allow 20, 35, 50, 70 and 90 units respectively. The whole
manifest is checked before any money, supplies, goods or heroes are committed.
Cart selections survive reloads; stock and prices are rechecked at dispatch.

Base travel times, before relationship discounts:

| Market | Minutes | Market | Minutes |
| --- | ---: | --- | ---: |
| Booty Bay | 10 | Stormwind | 30 |
| Grom'gol | 15 | Lakeshire | 32 |
| Darkshire | 20 | Theramore | 34 |
| Sentinel Hill | 22 | Orgrimmar | 35 |
| Stonard | 24 | Gadgetzan | 38 |
| Ratchet | 25 | Ironforge | 40 |
| Nethergarde | 28 | Thunder Bluff | 42 |
| Light's Hope | 48 | Undercity | 50 |

## Escort resolution and payment

The strongest ready escort leads one d20 roll, using their readiness (including
equipped ration/potion bonuses), rank bonus and wound penalty. Each additional
escort adds +1 support, capped at +4. Adding a weaker escort never reduces the
chance of full delivery. Storekeeping, Warehouse perks and relationships reduce
route danger, with a minimum DC of 6.

A total at or above DC delivers everything. A miss by 1–4 delivers 75% of each
cargo line, rounded down to whole items. A worse result loses the shipment.
Existing ambush casualties, wound remedies, field-kit protection, gear wear and
staff practice continue to apply. Only the lead receives a natural-1 critical;
supporting heroes do not make extra independent failure rolls.

Outbound escort pay is 20% of actual delivered gross value, plus 2 percentage
points per additional escort, capped at 30%. The existing minimum of 2 gp per
escort remains, limited to the gross proceeds. Incoming escorts receive 2 gp each,
paid by the guild at dispatch and distributed on return. Dispatch previews show
goods costs, escort pay, total cost or estimated net proceeds, capacity, travel,
danger and full/partial delivery odds.

Incoming prices use a 30% merchant spread before relationship discounts, rounded
up per item. This prevents buying and reselling at the same market from creating
gold even at maximum Storekeeping, Warehouse and relationship bonuses. Selling
gathered materials or transporting cheaper purchases to a better market remains
useful. Mixed manifests share one trip's escort payment.

## Market relationships

| Relationship | Points | Buy discount | Extra stock per good | Faster travel | Danger reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| New contact | 0 | 0% | 0 | 0% | 0 |
| Familiar | 20 | 1% | 2 | 5% | 0 |
| Trusted | 60 | 2% | 4 | 10% | 1 |
| Trade partner | 140 | 3% | 6 | 15% | 1 |
| Close ally | 260 | 4% | 8 | 20% | 2 |

Actual delivered goods earn 1 point per 10 gp of base material value, capped at
10 points per market per game day. Both directions count when their report
returns. Small shipments accumulate within that day; splitting a shipment cannot
increase the award. Lost cargo earns nothing. The cap applies to the return day.
There is no relationship decay or loss penalty. At most 26 fully productive
trading days are needed for an alliance. Travel rounds up to whole minutes.

## Save compatibility

Existing staff, skills, materials and discovery data are retained. New relation
and cart fields are added lazily. Already dispatched reports keep their sealed
travel times, payments and outcomes. Legacy single-item incoming reports still
deliver once. New reports carry mixed delivery manifests and a one-time
relationship-award flag; reloading or revisiting the report does not grant goods
or relationship points twice. Old reports do not receive retroactive points.

Validation: `node tests/trade-model.cjs` and `python3 tests/trade-browser.py`.
Browser tests require a local static server on port 8000. Rebuild `sw.js` before
release with `python3 scripts/build-offline.py`.
