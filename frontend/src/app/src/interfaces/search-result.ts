export interface SearchResult {
  id: number;
  name: string;
  path: string;
  updated_at: string;
  type: 'folder' | 'file';
  target_folder_id: number;
}
