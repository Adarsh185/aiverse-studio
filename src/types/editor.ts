export interface FileNode {
  id: string;
  user_id: string;
  name: string;
  path: string;
  content: string;
  type: 'file' | 'folder';
  parent_id: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  children?: FileNode[];
}

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'info';
  content: string;
  timestamp: Date;
}
