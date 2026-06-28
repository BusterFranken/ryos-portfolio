/**
 * No-op stub. The Chats app and its realtime backend were removed for the
 * static, no-backend portfolio build. The only remaining caller is the chat
 * notification display helper, which is itself dead code slated for removal in
 * the realtime-strip step. Kept as an exported no-op so that orphaned module
 * still type-checks until then.
 */
export const openChatRoomFromNotification = (
  _roomId: string | null = null
): void => {
  void _roomId;
};
