# Daily contracts and story events

Timed, non-standing Contract acceptances are limited by Hall level:
1: 4, 2: 6, 3: 8, 4: 10, 5: 12, 6: 14, 7: 16.
Slots are charged on successful dispatch, not on opening details or failing a
validation check. Returning, recalling or failing does not refund a slot.
The saved counter resets on the next game day. Permanent expeditions, gathering,
and the one-day Story Event do not consume these slots.

A single saved 20% event roll is made per day. Reloading never rerolls it.
Six stories cover an invasion, frenzied beasts, haunted chapel, relief convoy,
poisoned wells and a threatened truce. Events are one rank below the guild's
current quest ceiling, clamped to F, with base DC 15 + 2 × rank. Offers expire
at the end of the day; accepted missions may finish later.

Success guarantees 2 World Dungeon Relics and one quality sword; Exceptional
Success guarantees 3 relics and one sword. Failure and Partial Success grant no
special loot. Gear tier is floor(event rank / 2), with +2 quality over that
tier's ordinary bonus, e.g. a +3 Basic sword. It respects the existing equipped
loadout bonus cap. Reward IDs and settlement flags prevent duplicate grants.

Trade-only inventory contains Ancient Trade Goods, Contract Trade Goods,
Trade Goods and Bonus Shipment. All other resources remain in Crafting materials
& supplies. Existing consumable batches and identities are unchanged.

Summaries select situation and outcome passages deterministically, avoiding
extra gameplay random draws during report generation or redisplay.

Tests: node tests/daily-adventures.cjs and python3 tests/promotion-check.py.
