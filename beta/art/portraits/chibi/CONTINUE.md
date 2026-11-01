# Resume beta portrait completion

Repository: lllusivecoat/wayfarers-lantern. Scope: beta/ only. Never change live.
Approved format: hand-painted circular gold-rimmed chibi portraits, 128×128 WebP.
Preserve custom-upload precedence, portraitGender, explicit gender, and stable ID fallback.

The authoritative work list is `queue.json`. Original 001–100 must remain intact.
There are 498 supported male/female race/class entries in the current beta.
Work in batches of 100; batch 005 has the final 98. Never fabricate exported status.

## Paste this into a new chat

Continue the Wayfarer's Lantern beta portrait completion in
`lllusivecoat/wayfarers-lantern`. Read `beta/AGENTS.md` and
`beta/art/portraits/chibi/CONTINUE.md`, inspect the current main branch and
`queue.json`, then resume the first pending portrait. Complete all remaining
portraits in batches of 100 (last batch may be shorter), matching the approved
128×128 WebP circular chibi style. Do not regenerate completed portraits or alter
live. Use retained atlas sheets and manifests; export five-column/four-row sheets
with `python3 beta/art/portraits/chibi/tools/export.py START ATLAS.png`.
Integrate only real exported assets into the beta catalogue, preserve custom
uploads and save data, validate race/class/gender mappings and image dimensions,
and commit/deploy each completed batch to beta. Update queue and progress after
each sheet so this task is resumable.

## Commands

- Inspect progress: `python3 beta/art/portraits/chibi/tools/status.py`
- Export reviewed sheet: `python3 beta/art/portraits/chibi/tools/export.py 101 PATH_TO_ATLAS.png`
- Rebuild catalogue and previews: `python3 beta/art/portraits/chibi/tools/catalog.py`
- Validate: `python3 beta/art/portraits/chibi/tools/validate.py`

Image generation uses five columns × four rows: 20 cells per atlas, five atlases
per 100-portrait batch. Use the original batch 001 artwork as the style reference.
Use the exact row-major identities from queue.json. Keep original generated PNGs
in the workspace and publish the compact full-resolution source WebPs in each batch directory. Review each atlas before export. Batch 005's
last atlas has 18 portraits and two unused cells.
