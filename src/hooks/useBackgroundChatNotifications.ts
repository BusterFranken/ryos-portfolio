/**
 * No-op stub for the static, no-backend portfolio build.
 *
 * This hook previously drove background chat-room notifications over the
 * realtime (Pusher/Electron) backend. With the Chats app and its realtime
 * service removed, and every visitor an anonymous guest, there is nothing to
 * subscribe to. The full realtime subsystem (this hook included) is deleted in
 * the realtime-strip step; until then this keeps `App.tsx` compiling while doing
 * nothing.
 */
export function useBackgroundChatNotifications() {
  // Intentionally empty.
}
