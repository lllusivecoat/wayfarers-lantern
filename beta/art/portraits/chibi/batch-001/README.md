# Chibi portrait batch 001 — portraits 001–100

Generated as five 5-column × 4-row atlases using the approved chibi sample style.
The final draenei warrior female cell in sheet 05 was corrected before export.

- 18 Human, 20 Dwarf, 22 Night Elf, 16 Gnome, 20 Draenei, 4 Worgen.
- One male and one female per listed race/class combination.
- `portraits/`: 100 named 128×128 WebP bubble assets.
- `manifest.json`: race/class/gender, source sheet, one-based grid row/column, file and size.
- `preview.html`: review exports at 32, 58 and 128 pixels.
- `sheet-01.png` through `sheet-05.png`: retained original atlas artwork.

Beta uses these portraits for matching race/class combinations. Custom uploads
take priority. Existing gender fields are respected; heroes without one receive
a stable variant based on their ID. The Switch portrait button stores an optional
portraitGender choice. Unsupported combinations retain their previous display.

Next batch starts at 101: Worgen Hunter male, then female, following the class
order in beta/index.html; do not generate 001–100 again.
