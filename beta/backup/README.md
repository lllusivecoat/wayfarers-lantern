# Previous beta design

This accessible snapshot preserves beta as deployed at commit
42cd1d12bd93d8cd0739ce411aa8fec1e3897de3, before the visual preview.
Open /wayfarers-lantern/beta/backup/ to use it. It shares the normal save and
retains the original beta backup/error/empty-guild guard. It imports the same
live root modules as the previous beta; this is a UI backup, not an isolated save.

To restore the main beta, revert the visual rollout commit. Do not reset or
replace the user's save. The original location paintings remain untouched.
