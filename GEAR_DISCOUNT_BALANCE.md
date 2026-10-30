# Material discount balance — fix 5

Gear crafting and material-paid enhancements now retain fractional savings in the save. Previously every ingredient was rounded up independently on every craft, so a two-unit recipe could receive no benefit even at the maximum 45% discount.

For each ingredient, savings accumulate by material name and original quantity per hand unit. Each whole saved unit reduces the next transaction's requirement. Credit belongs to the guild and remains when staff move or change; changing recipes cannot convert credit into a different material. Crafts and enhancements share this ledger. No past crafts are retroactively credited.

For example, a recipe requiring 2 Copper Ore at a 30% discount costs 2, 1, 2, 1, 1 over five crafts: 7 total instead of 10. At 45%, ten such crafts cost 11 instead of 20. Actual discounts continue to include skill, aptitude and personality under the existing 45% cap.

Every ingredient retains a minimum cost of one per hand unit. A one-unit rare or dungeon ingredient is always required; its discount does not accumulate toward a free future ingredient. For larger quantities, fractional savings apply normally. Two-handed weapons process two consecutive hand units, exactly matching two sequential one-handed crafts with the same pattern and starting credit. Enhancements process the same units repeated by enhancement stage, retaining this parity.

Quotes and rendering never spend credits. Only a successful craft or enhancement commits both ingredient deductions and the new ledger. Missing materials, locked recipes and unavailable buildings do not spend credit. The preview shows the exact next cost; costs can change after another successful transaction uses the shared credit. Saves without this ledger start empty; existing gear remains unchanged.

Browser coverage: cumulative savings on small recipes, preview/payment agreement, repeated non-mutating renders, failed craft/enhancement attempts, one-unit ingredient protection, enhancement credit commits, save/reload of credit and the next quote, hand parity across every tier and three staff levels, recipe/quality progression, existing enhancement regression and offline update lifecycle.

Maximum-level set benefits remain the next separate balance review item. Historical audit outputs predate fractional material savings.
