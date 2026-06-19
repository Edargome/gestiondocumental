export interface File {
  fileData: FileData;
  versions: Version[];
}
export interface FileData {
  file_id: number;
  folder_id: number;
  name: string;
  extname: string;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  email: string;
  username: string;
  email_updated: string;
  username_updated: string;
}
export interface Version {
  version_number: number;
  original_name: string;
  extname: string;
  content: string;
  size: string;
  is_active: boolean;
  created_at: Date;
}

export interface Historyfile {
  history_id: number;
  file_id: number;
  user_id: number;
  action: string;
  timestamp: Date;
  version_number: number;
  username: string;
}
