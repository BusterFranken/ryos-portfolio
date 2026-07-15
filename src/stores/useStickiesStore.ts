import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getContactEmail } from "@/utils/contactChannels";

export type StickyColor = "yellow" | "blue" | "green" | "pink" | "purple" | "orange";

export interface StickyNote {
  id: string;
  content: string;
  color: StickyColor;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
}

interface StickiesState {
  notes: StickyNote[];
  addNote: (color?: StickyColor) => string;
  updateNote: (id: string, updates: Partial<Omit<StickyNote, "id" | "createdAt">>) => void;
  deleteNote: (id: string) => void;
  bringToFront: (id: string) => void;
  clearAllNotes: () => void;
}

const DEFAULT_NOTE_SIZE = { width: 220, height: 240 };

// Easter egg: a personal note seeded mostly off the left edge, so a curious
// visitor discovers it by dragging it into view.
const SECRET_NOTE_ID = "portfolio-secret-note";
const SECRET_NOTE: StickyNote = {
  id: SECRET_NOTE_ID,
  content: `you found me 🐣

if you're poking around in here,
we'd probably get along.

say hi → ${getContactEmail()}`,
  color: "pink",
  position: { x: -150, y: 340 }, // ~70px peeks in from the left edge
  size: { width: 220, height: 240 },
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

// A few seeded notes with pointers for visitors (EVE-268). Stable ids so the
// migration can add them once without duplicating.
const PROJECT_NOTES: StickyNote[] = [
  {
    id: "portfolio-note-welcome",
    content: `Every window here is one of my projects.

Switch the whole OS between Mac OS X and Windows in Control Panels → Appearance.`,
    color: "yellow",
    position: { x: 880, y: 110 },
    size: { width: 240, height: 210 },
    createdAt: 1700000001000,
    updatedAt: 1700000001000,
  },
  {
    id: "portfolio-note-eigenvector",
    content: `Eigenvector is what I'm building now — a live app. Open it from the desktop to take a look.`,
    color: "blue",
    position: { x: 1090, y: 250 },
    size: { width: 230, height: 190 },
    createdAt: 1700000002000,
    updatedAt: 1700000002000,
  },
  {
    id: "portfolio-note-fruitpunch",
    content: `I founded FruitPunch AI — 50+ AI-for-Good challenges with 80+ partner organizations. The Videos app has some of my talks.`,
    color: "green",
    position: { x: 900, y: 430 },
    size: { width: 250, height: 210 },
    createdAt: 1700000003000,
    updatedAt: 1700000003000,
  },
];

// Stack new notes with slight offset from existing notes
const getNextPosition = (existingNotes: StickyNote[]) => {
  const baseX = 100;
  const baseY = 60; // Account for menu bar
  const offset = 25; // Offset for each new note
  
  if (existingNotes.length === 0) {
    return { x: baseX, y: baseY };
  }
  
  // Get the last note's position and offset from it
  const lastNote = existingNotes[existingNotes.length - 1];
  let newX = lastNote.position.x + offset;
  let newY = lastNote.position.y + offset;
  
  // Wrap around if going off screen
  const maxX = typeof window !== "undefined" ? window.innerWidth - DEFAULT_NOTE_SIZE.width - 50 : 600;
  const maxY = typeof window !== "undefined" ? window.innerHeight - DEFAULT_NOTE_SIZE.height - 50 : 400;
  
  if (newX > maxX) newX = baseX + (existingNotes.length % 5) * offset;
  if (newY > maxY) newY = baseY + (existingNotes.length % 5) * offset;
  
  return { x: newX, y: newY };
};

export const useStickiesStore = create<StickiesState>()(
  persist(
    (set, get) => ({
      notes: [SECRET_NOTE, ...PROJECT_NOTES],

      addNote: (color: StickyColor = "yellow") => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const existingNotes = get().notes;
        const newNote: StickyNote = {
          id,
          content: "",
          color,
          position: getNextPosition(existingNotes),
          size: DEFAULT_NOTE_SIZE,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
        return id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      bringToFront: (id) => {
        const { notes } = get();
        const noteIndex = notes.findIndex((n) => n.id === id);
        if (noteIndex === -1 || noteIndex === notes.length - 1) return;
        
        set((state) => {
          const newNotes = [...state.notes];
          const [note] = newNotes.splice(noteIndex, 1);
          newNotes.push(note);
          return { notes: newNotes };
        });
      },

      clearAllNotes: () => {
        set({ notes: [] });
      },
    }),
    {
      name: "stickies-storage",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Partial<StickiesState>;
        if (version < 2) {
          let notes = state.notes ?? [];
          // v1: seed the hidden note if missing.
          if (!notes.some((n) => n.id === SECRET_NOTE_ID)) {
            notes = [SECRET_NOTE, ...notes];
          }
          // v2: add the project-info notes (by stable id, once).
          const missing = PROJECT_NOTES.filter(
            (p) => !notes.some((n) => n.id === p.id)
          );
          notes = [...notes, ...missing];
          return { ...state, notes };
        }
        return state;
      },
    }
  )
);
