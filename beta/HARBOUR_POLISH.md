# Harbour presentation — beta only

This layer is loaded only by beta/index.html. Do not port it to live without the
user's explicit approval. Shared root scripts, mechanics and the save guard remain
unchanged. Existing banner and thumbnail artwork is reused; empty-state drawings
are small inline SVGs.

- A single Booty Bay cover for an unseen, unprogressed save. Begin, Skip and Escape
  mark `wayfarers-lantern-beta-cover` seen, open Hall and expand Getting started.
  Heroes, later days, missions, reports, staff, construction or other recorded
  progress skip the automatic cover. A confirmed new guild is eligible again.
  Settings → Replay intro opens the cover without resetting progress.
- Recruit, Contracts and Rest checklist buttons reveal and briefly highlight the
  existing target. Mobile Rest opens More and highlights Rest without executing it.
- Distinct illustrated empty states for Heroes, Staff and building extensions.
- Grey parchment contract cards with a wax-style seal; existing details still act.
- Away badges and a next-return chip read the current quest/convoy/story timers.
- Real Exploration discoveries queue one toast per new place with its thumbnail
  (or a map illustration), Open World, and Dismiss. Loading saves produces no toast.
- Light-theme banner, paper, atlas and portrait-frame contrast; muted remembrance.

The presentation does not write the shared gameplay save. Only cover/checklist
preferences are written; existing game actions retain responsibility for saving.
The existing beta error/backup/empty-guild guard is preserved byte-for-byte.
Reduced motion uses a static target outline and immediate scrolling.

Validation: `node beta/tests/harbour-polish.cjs` exercises actual module behavior
with isolated fixtures. `python3 beta/tests/harbour-polish-browser.py` exercises
fresh/progressed saves, widths, themes and screenshots when Chromium/local server
permissions are available. Existing game-screen browser fixtures seed the cover
marker so the new first-run dialog does not block unrelated controls.
