# Beta visual upgrade

Approved for beta deployment. Only beta/ files changed. Root assets,
mechanics, save keys and the existing backup/error/empty-guild guard are unchanged.

Includes the painted Booty Bay banner (existing WebP, 103,832 bytes), pencil rename,
compact ledger with expandable details, reputation progress, icon/summary Hall
headers, class/level portrait frames, wound-condition bars, lazy-loaded contract thumbnails/rank/reward
indicators and expiry bars, active timer bars, dawn and level flashes, reduced
motion, classified Chronicle entries, Hall ticker, textured surfaces, notification
badges, active navigation, empty-state illustrations and clickable atlas.

Atlas is deliberately schematic, not an accurate geographical map. Gold pins
cover the curated Eastern Kingdoms/Kalimdor landmarks and open existing paintings;
other discovered places remain available in the normal World list below. Wound
condition is not HP: this game does not track combat health points. Storage is
unlimited; the stock-full indicator only refers to the actual ration batch limit.

`python3 beta/tests/visual-preview-browser.py` generates isolated fresh-guild and
established-guild screenshots in /tmp/wayfarers-preview. Tests exercise rename,
atlas pins, dawn/reduced-motion behavior, and save-backup protection. Existing
beta Hall, navigation and treasury suites also cover the new controls.

## Fast rollback

Previous UI: /wayfarers-lantern/beta/backup/ (same save, same save guard).
Baseline commit: 42cd1d12bd93d8cd0739ce411aa8fec1e3897de3.
Baseline tag: beta-before-visual-42cd1d1. Revert the visual-rollout commit to
restore the previous main beta without touching saves or live root assets.

Card thumbnails are WebP, at most 480px wide, quality62. IntersectionObserver
loads them within160px of the visible viewport; hidden tabs and distant cards do
not trigger artwork downloads. Full paintings remain in location popups and the
Hall banner. There is a non-IntersectionObserver fallback.

Post-optimization sample on simulated slow4G: Contracts opened with2 thumbnails,
35KB, versus8 full images /718KB previously. World initially loads no location
paintings while only the schematic atlas is visible; scroll to load card art.
The whole thumbnail library is1.19MB versus roughly6MB of full paintings.
