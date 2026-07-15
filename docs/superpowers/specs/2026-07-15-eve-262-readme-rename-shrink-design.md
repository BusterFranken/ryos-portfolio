# EVE-262 — Rename & shrink the README note

**Linear:** EVE-262 (High) — the "read me first" note is good but overpowering:
smaller window + text, no emojis, rename "README First" → "README", make it read
like a typical README with the same information.

## Decision (confirmed)
Demote the markdown headings a level (so TextEdit renders them smaller) **and**
shrink the boot window + tighten the prose.

## Content (`README.md`, was `read_me_first.md`)
- Title `#` → `##` "README"; sections `##` → `###` (smaller rendered text).
- Remove emojis (👋); reword the `↗` and Apple-glyph references into plain words.
- Trim heavy `**bold**` and tighten the copy so it reads like a plain README.
- Same information: what the site is, where to start, easter eggs, reach me.

## Rename `read_me_first` → `README`
- Asset `public/assets/documents/read_me_first.md` → `README.md`.
- `filesystem.json` seed entry → `/Documents/README.md` (path/name/assetPath).
- `bootLayout.ts` textedit → path `/Documents/README.md`, title `README.md`,
  window 440×480 → **360×420**.
- `useFilesStore.ts`:
  - Rename the `DEFAULT_READ_ME_FIRST_*` constants to README and give the
    seeded entry an `assetPath` so its content loads.
  - The v15 migration now seeds `README.md` (covers pre-v15 visitors).
  - Add a **v16** migration that renames an existing `/Documents/read_me_first.md`
    entry to `/Documents/README.md` (covers current v15 visitors, incl. Buster's
    own session). Bump `STORE_VERSION` 15 → 16.
- Fix the stray "start with *read_me_first*" line in the Quick Tips seed.

## Tests
- `test-boot-layout`: the note assertion `read_me_first` → `README`.

## Merge note
EVE-267's open PR #2 also edits the `bootLayout` textedit entry — these two will
conflict at merge; resolve by taking both changes (README path + new position).

## Delivery
Branch off `main` → PR → comment + In Review.
