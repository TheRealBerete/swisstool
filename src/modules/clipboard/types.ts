export type ClipboardItemType = "text" | "password" | "link";

/** Reflète la table `clipboard_items` (supabase/schema.sql). */
export interface ClipboardItem {
  id: string;
  user_id: string;
  content: string;
  type: ClipboardItemType;
  created_at: string;
  expires_at: string;
}
