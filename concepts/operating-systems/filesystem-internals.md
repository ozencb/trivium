---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Filesystem Internals

A filesystem is a translation layer between "a file you can name" and "blocks on physical storage" — its internal data structures determine read/write performance, crash safety, and why `df` can lie to you.

### The Core Mechanism: Inodes and Blocks

The key insight is that **filenames and file data are completely decoupled**. An inode holds all file metadata — permissions, timestamps, size, and crucially, pointers to the actual data blocks — but not the filename. The directory is just a file that maps names to inode numbers.

Disk space is divided into fixed-size blocks (typically 4KB). An inode's block pointers tell the kernel which blocks hold the file's data. Older filesystems (ext2) used tiered indirection — direct pointers, then a block full of pointers, then a block of blocks of pointers. Modern filesystems (ext4, XFS) use extent trees — this is your B-Tree connection. Instead of listing every block, they store ranges: "blocks 1000–1200 are contiguous." Much more efficient for large files.

A write isn't atomic. It involves: allocating free blocks, writing data, updating the inode, updating the directory, updating the superblock. A crash mid-sequence leaves inconsistent state — orphaned blocks, corrupt metadata. Journaling solves this by writing intent before acting (your Write-Ahead Log connection). The journal says "I'm about to do X" before doing X, so recovery can replay or roll back.

### Mental Model

Think of a library. The inode is the catalog card — metadata about the book. The directory is the card catalog — name-to-card mapping. The blocks are the actual pages on shelves. The journal is the librarian's notepad: "moving book X from shelf A to B" — if the librarian collapses mid-move, the notepad tells you what to fix.

### Practical Implications

**Backend:** Unix temp file pattern — `open()` then immediately `unlink()` — works because the inode persists until all file descriptors close, even with no directory entry. The file is invisible to other processes but accessible to yours. Atomic file replacement (`write to temp → rename`) exploits the fact that `rename` is a single directory-entry swap, guaranteed atomic.

**SRE:** "No space left on device" with `df` showing free space means inode exhaustion, not block exhaustion. Happens with directories holding millions of tiny files — log spools, mail queues, package caches. `df -i` exposes this. The fix is either deleting files or reformatting with a higher inode density.

**DevOps:** Copying files across filesystems destroys hard links — each hard link is just multiple directory entries pointing to the same inode, and inode numbers don't transfer. `rsync --hard-links` rebuilds them but must track the full inode-number mapping in memory. Container overlay filesystems (overlayfs) use inode-level copy-on-write to share unchanged layers between images without duplicating data.
