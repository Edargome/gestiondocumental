export interface NodeTree {
  id: number;
  name: string;
  type?: string;
  children?: NodeTree[];
}

export interface FolderTree {
  folderTree: NodeTree[];
}

export interface Path {
  folderPath: FolderPath[] | [];
}
export interface FolderPath {
  folder_id: number;
  name: string;
  parent_folder_id: number;
}
