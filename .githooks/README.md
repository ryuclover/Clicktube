# Local Git hooks for this repository

This folder contains a local `pre-commit` hook that scans staged files for common secret patterns (API keys, private keys, database URIs) and blocks the commit if any are found.

To enable the hook locally (one-time):

```bash
git config core.hooksPath .githooks
```

Notes:
- This is a local safeguard and is not enforced on remote services like GitHub; you should avoid pushing secrets and rotate any secrets that were exposed.
- The hook checks staged files only. If you need to commit other changes while keeping secrets unstaged, use `git stash --keep-index`.
- On Windows, ensure you have Git Bash or an environment that can run shell scripts.
