/** Reflète la table `shared_files` (supabase/schema.sql). */
export interface SharedFile {
  id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
  expires_at: string;
}

export const FILES_BUCKET = "shared-files";
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo — miroir du bucket Supabase
