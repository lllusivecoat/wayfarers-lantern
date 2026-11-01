# Beta gear care

The hero dossier's Gear tab puts equipped-item repairs and enhancements before
equipment and utility explanations. Desktop, tablet and mobile share the same
Stats / Traits / Gear tabs. Long explanations remain in collapsed disclosures.

Inventory's Gear & repairs defaults to damaged items, grouped by payer, with
hero filters and a repair-all action for each hero. The workshop retains a batch
path grouped by hero. Hero-tab links open the corresponding batch view filtered
to that hero. There is no action charging several heroes together.

Hero-tab actions include equipped items only; two-handed equipment is counted
once. Batch actions include the items owned by the selected hero under the
existing repair/enhancement ownership rules. Unassigned storage items explain
that they must be equipped first. Enhancing all advances each eligible item by
one stage, rather than purchasing every remaining stage.

No shared code, repair/enhancement prices, Armory formulas or save migrations
are changed. `gear-care.js` delegates to existing `gearRepairCost`,
`gearEnhancementQuote`, `repairGear` and `enhanceGear`. Bulk quotes execute those
unchanged actions against a temporary cloned save, suppressing rendering,
saving, logging, alerts and live random-number consumption, then restore every
global in a finally block. This accounts for staff practice and fractional
material credits between items. Quotes never change the real save.

Actions recheck affordability and ownership immediately before spending. Known
failures appear inline with disabled controls; personal purses pay gold and
guild storage supplies enhancement materials. A bulk action with insufficient
funds/materials or an unavailable item is disabled before any spending.

Validation:

```
node beta/tests/gear-care.cjs
python3 beta/tests/gear-care-browser.py
python3 beta/tests/hall-browser.py
```

Browser tests use disposable local saves, never a player's existing storage.
