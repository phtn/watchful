# Git History Cleanup

This is the exact process used to remove accidentally committed large files from this repository.

## Problem

Large generated and local files had already been committed into git history, including:

- `node_modules/`
- `dist/`
- local machine files like `.DS_Store`
- editor files like `.vscode/`

Removing them from the working tree alone was not enough, because the large blobs were already stored in commit history.

## What I Did

### 1. Inspected the repository state

Used these commands to confirm the problem and identify the large tracked files:

```bash
git status --short
git log --oneline --decorate -n 5
git show --stat --oneline --name-only HEAD
git ls-tree -r -l HEAD | sort -k4 -n | tail -n 20
git remote -v
git branch -vv
git ls-files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n | tail -n 25
```

This confirmed that very large files under `node_modules/` were already in history.

### 2. Made sure `.gitignore` would block the bad paths

The repo had an empty `.gitignore`, so it was filled out to ignore:

- `node_modules/`
- `dist/`
- logs
- env files
- `.DS_Store`
- `.vscode/`
- `.idea/`
- packaged extension artifacts

That ensured the bad files would not be re-added during cleanup.

### 3. Created a new orphan branch

```bash
git checkout --orphan history-cleanup
```

This created a new branch with no parent history while keeping the current working tree on disk.

### 4. Cleared the git index

```bash
git rm -r --cached .
```

This removed all currently tracked files from the index only. It did not delete the files from disk.

### 5. Re-added only the correct project files

```bash
git add .
```

Because `.gitignore` was now correct, only the real source/config/assets were staged.

Ignored files such as `node_modules/` and `dist/` remained on disk but stayed out of git.

### 6. Verified the staged result

```bash
git status --short
git status --short --ignored
git diff --cached --stat
```

This confirmed that the staged tree contained only the intended project files.

### 7. Created a clean replacement commit

```bash
git commit -m "Clean repository history"
```

This produced a new root commit containing only the proper files.

### 8. Replaced `main` with the cleaned history

```bash
git branch -M main
```

That renamed the orphan cleanup branch to `main`.

### 9. Pruned old local git objects

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

This removed the now-unreachable old commits and their large blobs from the local `.git` database.

## Verification

Used these commands after cleanup:

```bash
git status --short --ignored
git log --oneline --decorate -n 3
git count-objects -vH
git ls-tree -r -l HEAD | sort -k4 -n | tail -n 15
```

The result showed:

- only one clean commit on `main`
- ignored files still present locally but no longer tracked
- packed git object storage reduced to a very small size

## Remote Follow-Up

If the bad history was already pushed to the remote, the remote must also be rewritten:

```bash
git push --force-with-lease origin main
```

Use `--force-with-lease`, not plain `--force`, unless you explicitly want to ignore remote state.

## Important Notes

- This is a history rewrite.
- Old commit hashes are no longer valid.
- Anyone else with a clone of the old history will need to resync.
- If you ever need a safer alternative, `git filter-repo` is the more general tool for selective history surgery. In this case, replacing the repo history with a clean root commit was the fastest fix.
