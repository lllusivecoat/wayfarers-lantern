# Resume beta portrait completion

Repository: lllusivecoat/wayfarers-lantern. Scope: beta/ only. Never change live.
Approved format: hand-painted circular gold-rimmed chibi portraits, 128×128 WebP.
Preserve custom-upload precedence, portraitGender, explicit gender, and stable ID fallback.

The authoritative work list is `queue.json`. Original 001–100 must remain intact.

Current completion: all 498 entries exported and integrated. Batches 002–004
added 100 portraits each; batch 005 added the final 98. The resume prompt below
checks the queue first and must never regenerate completed work.
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

## Alignment progress (separate from artwork completion)

Portraits 001–400 are aligned; the final alignment batch is 401–498 (98 portraits).
One 128×128 WebP per portrait, preserved originals, no new artwork generation.
The main and batch galleries show the 128 px files without 32/58 px switches.
Reviewed source-rim corrections are recorded in `alignment-overrides.json`.

To continue in a new chat, paste:

> Continue beta-only portrait alignment in lllusivecoat/wayfarers-lantern.
> Read beta/AGENTS.md and beta/art/portraits/chibi/CONTINUE.md, check current
> main and queue.json, and align the remaining 98 unaligned portraits (expected
> 401–498). Use the existing deterministic align.py pipeline, preserve
> originals and completed work, review the crops, then validate and deploy
> beta only. Do not regenerate artwork or touch live.

Next batch commands (review source geometry and output before deployment):

```sh
python3 beta/art/portraits/chibi/tools/align.py 401 498
python3 beta/art/portraits/chibi/tools/catalog.py
python3 beta/art/portraits/chibi/tools/validate.py
python3 beta/tests/alignment-batch.py 401 498
node beta/tests/portrait-catalog.cjs
```
