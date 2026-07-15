# EVE-260 — Contacts: card-only + fill the avatar

**Linear:** EVE-260 (Medium) — default the Contacts app to the "Card Only" view,
and make the headshot fill the avatar bubble (more zoomed in).

## Changes
- `useContactsAppController.tsx`: `isCardOnlyView` initial state `false` → `true`.
  There's only one contact (the owner), so the list panel is redundant; card-only
  is the sensible default. The toolbar toggle still works.
- `ContactsCardPanel.tsx`: avatar `<img>` `object-contain` → `object-cover` so the
  headshot fills and crops to the circular bubble instead of letterboxing.

## Delivery
Branch off `main` → PR → comment + In Review.
