import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileNode, EditorTab } from "@/types/editor";
import { toast } from "sonner";
import { getLanguageFromFilename } from "@/components/editor/FileIcons";

export const useEditor = (userId: string | undefined) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Find file by ID recursively
  const findFileById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Build file tree from flat list
  const buildFileTree = (flatFiles: FileNode[]): FileNode[] => {
    const map = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    flatFiles.forEach(file => {
      map.set(file.id, { ...file, children: [] });
    });

    flatFiles.forEach(file => {
      const node = map.get(file.id)!;
      if (file.parent_id) {
        const parent = map.get(file.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort: folders first, then alphabetically
    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(n => n.children && sortNodes(n.children));
    };
    sortNodes(roots);

    return roots;
  };

  // Load files
  const loadFiles = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('path');

      if (error) throw error;

      const tree = buildFileTree((data as FileNode[]) || []);
      setFiles(tree);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Create file or folder
  const createFile = async (parentId: string | null, name: string, type: 'file' | 'folder') => {
    if (!userId) return;

    // Find parent path by recursively searching the file tree
    let parentPath = '';
    if (parentId) {
      const parent = findFileById(files, parentId);
      parentPath = parent?.path || '';
    }
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          name,
          path,
          type,
          parent_id: parentId,
          language: type === 'file' ? getLanguageFromFilename(name) : null,
          content: type === 'file' ? '' : null,
        })
        .select()
        .single();

      if (error) throw error;

      await loadFiles();
      
      if (type === 'file' && data) {
        openFile(data as FileNode);
      }

      toast.success(`${type === 'folder' ? 'Folder' : 'File'} created`);
    } catch (error: any) {
      console.error('Error creating file:', error);
      toast.error(error.message?.includes('duplicate') ? 'File already exists' : 'Failed to create file');
    }
  };

  // Create file with content (for templates)
  const createFileWithContent = async (parentId: string | null, name: string, content: string) => {
    if (!userId) return;

    // Find parent path by recursively searching the file tree
    let parentPath = '';
    if (parentId) {
      const parent = findFileById(files, parentId);
      parentPath = parent?.path || '';
    }
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          name,
          path,
          type: 'file',
          parent_id: parentId,
          language: getLanguageFromFilename(name),
          content,
        })
        .select()
        .single();

      if (error) throw error;

      await loadFiles();
      
      if (data) {
        openFile(data as FileNode);
      }

      toast.success('File created with template');
    } catch (error: any) {
      console.error('Error creating file:', error);
      toast.error(error.message?.includes('duplicate') ? 'File already exists' : 'Failed to create file');
    }
  };

  // Delete file or folder
  const deleteFile = async (file: FileNode) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      // Close tab if open
      setTabs(prev => prev.filter(t => t.fileId !== file.id));
      if (activeTabId && tabs.find(t => t.id === activeTabId)?.fileId === file.id) {
        setActiveTabId(tabs.length > 1 ? tabs[0].id : null);
      }

      await loadFiles();
      toast.success('Deleted');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete');
    }
  };

  // Rename file
  const renameFile = async (file: FileNode, newName: string) => {
    const newPath = file.path.split('/').slice(0, -1).join('/') + '/' + newName;

    try {
      const { error } = await supabase
        .from('files')
        .update({ name: newName, path: newPath })
        .eq('id', file.id);

      if (error) throw error;

      // Update tab if open
      setTabs(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, name: newName, path: newPath, language: getLanguageFromFilename(newName) }
          : t
      ));

      await loadFiles();
      toast.success('Renamed');
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename');
    }
  };

  // Open file in tab
  const openFile = (file: FileNode) => {
    if (file.type === 'folder') return;

    const existingTab = tabs.find(t => t.fileId === file.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: EditorTab = {
      id: crypto.randomUUID(),
      fileId: file.id,
      name: file.name,
      path: file.path,
      language: file.language || getLanguageFromFilename(file.name),
      content: file.content || '',
      isDirty: false,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Close tab
  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) return;
    }

    setTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      const remaining = tabs.filter(t => t.id !== tabId);
      setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  // Update tab content
  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, content, isDirty: true } : t
    ));
  };

  // Save file
  const saveFile = async (tabId?: string) => {
    const tab = tabs.find(t => t.id === (tabId || activeTabId));
    if (!tab) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({ content: tab.content })
        .eq('id', tab.fileId);

      if (error) throw error;

      setTabs(prev => prev.map(t => 
        t.id === tab.id ? { ...t, isDirty: false } : t
      ));

      toast.success('Saved');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  return {
    files,
    tabs,
    activeTabId,
    activeTab,
    isSaving,
    isLoading,
    setActiveTabId,
    createFile,
    createFileWithContent,
    deleteFile,
    renameFile,
    openFile,
    closeTab,
    updateTabContent,
    saveFile,
    loadFiles,
  };
};
