export interface ContentFolder {
  folders?: FolterContent[];
  files?: FileContent[];
}

export interface FolterContent {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  type: string;
}

export interface FileContent {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  type: string;
}
