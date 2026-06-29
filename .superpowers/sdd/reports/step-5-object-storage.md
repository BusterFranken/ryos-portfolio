# Step 5: Remove Object Storage (Vercel Blob / S3)

## Deleted files

### Client-side utils
- `src/utils/storageUpload.ts` — upload helper using `@vercel/blob/client` and XHR presigned-PUT; zero importers after S4
- `src/utils/autoSyncPreference.ts` — dead `/api/sync/auto-sync-preference` client; zero importers

### Server API routes
- `api/sync/` — entire directory including `v2/` (core, import, maintenance, tool-state, blobs, changes, ops, snapshot), plus top-level `backup.ts`, `backup-token.ts`, `status.ts`, `auto-sync-preference.ts`, `_keys.ts`, `_storage-location.ts`
- `api/_utils/storage.ts` — S3 + Vercel Blob server utilities; only imported by `api/sync/`
- `api/cron/sync-maintenance.ts` — cron that called `runSyncMaintenance` from the deleted `api/sync/v2/_maintenance`

### Tests deleted
| File | Suite | Reason |
|---|---|---|
| `test-sync-v2-core.test.ts` | `test:unit` | imports `api/sync/v2/_core`, `src/shared/sync2` |
| `test-sync-maintenance.test.ts` | `test:unit` | imports `api/sync/v2/_core`, `api/sync/v2/_maintenance`, `src/shared/sync2` |
| `test-songs-tombstone-sync.test.ts` | `test:unit` | imports `api/sync/v2/_core`, `src/shared/sync2` |
| `test-self-host-storage-config.test.ts` | `test:unit` | imports `api/_utils/storage` (deleted) |
| `test-cloud-sync-backup.test.ts` | `test:api` | integration test for `api/sync/backup*` (deleted) |
| `test-sync-v2-api.test.ts` | `test:api` | integration test for `api/sync/v2/*` routes (deleted) |

Also removed the `test:sync-v2` convenience script from `package.json`.

## `src/shared/sync2` — KEPT

`src/shared/sync2/` (`hlc.ts`, `namespaces.ts`, `types.ts`) was NOT deleted. Two kept server-side utilities still import it:
- `api/_utils/song-library-state.ts` — imports `hlcFromTimestamp`, `SyncOp`, and functions from `api/sync/v2/_core`
- `api/_utils/contacts.ts` — same

Note: `api/_utils/song-library-state.ts` and `api/_utils/contacts.ts` also import from the now-deleted `api/sync/v2/_core.js`; those imports are broken at the server level, but they are NOT compiled by `tsc -b` (the root tsconfig only includes `src/` and `vite.config.ts`). Fixing those files is out of scope for this step (they belong to the chat/contacts subsystem strips in later milestones).

## Dependencies removed
- `@vercel/blob` ^2.2.0
- `@aws-sdk/client-s3` ^3.1041.0
- `@aws-sdk/s3-request-presigner` ^3.1041.0

`bun install` confirmed removal of 3 packages.

## Verification
- `bun run build` (tsc -b + vite build): **PASSED** — built in 9.52s
- `bun run test:unit` (40 files, 390 tests): **390 pass, 0 fail**
