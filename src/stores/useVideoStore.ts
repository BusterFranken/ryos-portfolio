import { create } from "zustand";
import { useStoreShallow } from "./helpers";
import { persist } from "zustand/middleware";

export interface Video {
  id: string;
  url: string;
  title: string;
  artist?: string;
}

// Buster's FruitPunch AI talks & challenge recaps. Order: the pitch first, then
// the "AI for …" wildlife/earth challenge series.
export const DEFAULT_VIDEOS: Video[] = [
  {
    id: "JNXnE-wpEmc",
    url: "https://www.youtube.com/watch?v=JNXnE-wpEmc",
    title: "FruitPunch AI — The Pitch",
    artist: "Buster Franken",
  },
  {
    id: "aGy0lwtGgXw",
    url: "https://youtu.be/aGy0lwtGgXw",
    title: "AI for Bears",
    artist: "FruitPunch AI",
  },
  {
    id: "ZbYeP_4RldQ",
    url: "https://youtu.be/ZbYeP_4RldQ",
    title: "AI for Sea Turtles",
    artist: "FruitPunch AI",
  },
  {
    id: "oi_w9m2gj9o",
    url: "https://youtu.be/oi_w9m2gj9o",
    title: "AI for Forest Elephants",
    artist: "FruitPunch AI",
  },
  {
    id: "xyRKm39qBZ4",
    url: "https://youtu.be/xyRKm39qBZ4",
    title: "AI for Seals",
    artist: "FruitPunch AI",
  },
  {
    id: "P9I4gy1-nrw",
    url: "https://youtu.be/P9I4gy1-nrw",
    title: "AI for Wildlife",
    artist: "FruitPunch AI",
  },
  {
    id: "u-lzr5YdQvs",
    url: "https://youtu.be/u-lzr5YdQvs",
    title: "AI for Trees",
    artist: "FruitPunch AI",
  },
  {
    id: "pnosMD8vDTg",
    url: "https://youtu.be/pnosMD8vDTg",
    title: "AI for Oil Spills",
    artist: "FruitPunch AI",
  },
  {
    id: "qyZRPIziCkI",
    url: "https://youtu.be/qyZRPIziCkI",
    title: "AI for European Wildlife",
    artist: "FruitPunch AI",
  },
  {
    id: "0h-S2fTDbxs",
    url: "https://youtu.be/0h-S2fTDbxs",
    title: "AI for Earth — with the European Space Agency",
    artist: "FruitPunch AI",
  },
  {
    id: "ghtcwxDgZnA",
    url: "https://youtu.be/ghtcwxDgZnA",
    title: "AI for Wind Energy",
    artist: "FruitPunch AI",
  },
];

interface VideoStoreState {
  videos: Video[];
  currentVideoId: string | null;
  loopAll: boolean;
  loopCurrent: boolean;
  isShuffled: boolean;
  isPlaying: boolean;
  // actions
  setVideos: (videos: Video[] | ((prev: Video[]) => Video[])) => void;
  setCurrentVideoId: (videoId: string | null) => void;
  setLoopAll: (val: boolean) => void;
  setLoopCurrent: (val: boolean) => void;
  setIsShuffled: (val: boolean) => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
  // derived state helpers
  getCurrentIndex: () => number;
  getCurrentVideo: () => Video | null;
}

const CURRENT_VIDEO_STORE_VERSION = 9; // Portfolio: FruitPunch talks

const getInitialState = () => ({
  videos: DEFAULT_VIDEOS,
  currentVideoId: DEFAULT_VIDEOS.length > 0 ? DEFAULT_VIDEOS[0].id : null,
  loopAll: true,
  loopCurrent: false,
  isShuffled: false,
  isPlaying: false,
});

export const useVideoStore = create<VideoStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setVideos: (videosOrUpdater) => {
        set((state) => {
          const newVideos =
            typeof videosOrUpdater === "function"
              ? (videosOrUpdater as (prev: Video[]) => Video[])(state.videos)
              : videosOrUpdater;

          // Validate currentVideoId when videos change
          let currentVideoId = state.currentVideoId;
          if (
            currentVideoId &&
            !newVideos.find((v) => v.id === currentVideoId)
          ) {
            currentVideoId = newVideos.length > 0 ? newVideos[0].id : null;
          }

          return {
            videos: newVideos,
            currentVideoId,
          };
        });
      },
      setCurrentVideoId: (videoId) =>
        set((state) => {
          // Ensure videoId exists in videos array
          const validVideoId =
            videoId && state.videos.find((v) => v.id === videoId)
              ? videoId
              : null;
          return { currentVideoId: validVideoId };
        }),
      setLoopAll: (val) => set({ loopAll: val }),
      setLoopCurrent: (val) => set({ loopCurrent: val }),
      setIsShuffled: (val) => set({ isShuffled: val }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (val) => set({ isPlaying: val }),

      // Derived state helpers
      getCurrentIndex: () => {
        const state = get();
        return state.currentVideoId
          ? state.videos.findIndex((v) => v.id === state.currentVideoId)
          : -1;
      },
      getCurrentVideo: () => {
        const state = get();
        return state.currentVideoId
          ? state.videos.find((v) => v.id === state.currentVideoId) || null
          : null;
      },
    }),
    {
      name: "ryos:videos",
      version: CURRENT_VIDEO_STORE_VERSION,
      migrate: () => {
        console.log(
          `Migrating video store to clean ID-based version ${CURRENT_VIDEO_STORE_VERSION}`
        );
        // Always reset to defaults for clean start
        return getInitialState();
      },
      // Persist videos array to prevent ID-based errors
      partialize: (state) => ({
        videos: state.videos,
        currentVideoId: state.currentVideoId,
        loopAll: state.loopAll,
        loopCurrent: state.loopCurrent,
        isShuffled: state.isShuffled,
      }),
    }
  )
);

/**
 * Shallow-equality selector hook for this store. Co-located with the store
 * (rather than a central helpers barrel) so importing it doesn't pull other
 * stores into the bundle.
 */
export function useVideoStoreShallow<T>(
  selector: (state: ReturnType<typeof useVideoStore.getState>) => T
): T {
  return useStoreShallow(useVideoStore, selector);
}
