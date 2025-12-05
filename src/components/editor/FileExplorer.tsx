import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Edit2, FilePlus } from "lucide-react";
import { FileNode } from "@/types/editor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileIcon } from "./FileIcons";
import { NewFileDialog } from "./NewFileDialog";

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onCreateFileWithContent?: (parentId: string | null, name: string, content: string) => void;
  onDeleteFile: (file: FileNode) => void;
  onRenameFile: (file: FileNode, newName: string) => void;
  selectedFileId: string | null;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onCreateFileWithContent?: (parentId: string | null, name: string, content: string) => void;
  onDeleteFile: (file: FileNode) => void;
  onRenameFile: (file: FileNode, newName: string) => void;
  selectedFileId: string | null;
}

const FileTreeItem = ({ 
  node, 
  depth, 
  onFileSelect, 
  onCreateFile,
  onCreateFileWithContent,
  onDeleteFile, 
  onRenameFile,
  selectedFileId 
}: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      onRenameFile(node, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCreate = () => {
    if (newItemName.trim() && isCreating) {
      onCreateFile(node.type === 'folder' ? node.id : node.parent_id, newItemName.trim(), isCreating);
    }
    setIsCreating(null);
    setNewItemName('');
  };

  const isFolder = node.type === 'folder';
  const isSelected = selectedFileId === node.id;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm text-sm",
              isSelected && "bg-accent"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                setIsExpanded(!isExpanded);
              } else {
                onFileSelect(node);
              }
            }}
          >
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                ) : (
                  <Folder className="h-4 w-4 text-amber-500" />
                )}
              </>
            ) : (
              <>
                <span className="w-4" />
                <FileIcon filename={node.name} />
              </>
            )}
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="h-5 text-xs py-0 px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isFolder && (
            <>
              <ContextMenuItem onClick={() => { setShowNewFileDialog(true); setIsExpanded(true); }}>
                <FilePlus className="h-4 w-4 mr-2" /> New File (with template)
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setIsCreating('file'); setIsExpanded(true); }}>
                <Plus className="h-4 w-4 mr-2" /> New Empty File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setIsCreating('folder'); setIsExpanded(true); }}>
                <Folder className="h-4 w-4 mr-2" /> New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => { setIsRenaming(true); setRenameValue(node.name); }}>
            <Edit2 className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDeleteFile(node)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder && isExpanded && (
        <div>
          {isCreating && (
            <div 
              className="flex items-center gap-1 px-2 py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              <span className="w-4" />
              {isCreating === 'folder' ? (
                <Folder className="h-4 w-4 text-amber-500" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={handleCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(null); setNewItemName(''); }
                }}
                placeholder={isCreating === 'folder' ? 'folder name' : 'filename.ext'}
                className="h-5 text-xs py-0 px-1"
                autoFocus
              />
            </div>
          )}
          {node.children?.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateFileWithContent={onCreateFileWithContent}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              selectedFileId={selectedFileId}
            />
          ))}
        </div>
      )}

      <NewFileDialog
        isOpen={showNewFileDialog}
        onClose={() => setShowNewFileDialog(false)}
        onCreateFile={(filename, content) => {
          if (onCreateFileWithContent) {
            onCreateFileWithContent(node.type === 'folder' ? node.id : node.parent_id, filename, content);
          } else {
            onCreateFile(node.type === 'folder' ? node.id : node.parent_id, filename, 'file');
          }
        }}
        parentPath={node.path}
      />
    </div>
  );
};

export const FileExplorer = ({
  files,
  onFileSelect,
  onCreateFile,
  onCreateFileWithContent,
  onDeleteFile,
  onRenameFile,
  selectedFileId,
}: FileExplorerProps) => {
  const [isCreatingRoot, setIsCreatingRoot] = useState<'file' | 'folder' | null>(null);
  const [newRootName, setNewRootName] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  const handleCreateRoot = () => {
    if (newRootName.trim() && isCreatingRoot) {
      onCreateFile(null, newRootName.trim(), isCreatingRoot);
    }
    setIsCreatingRoot(null);
    setNewRootName('');
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Explorer</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setShowNewFileDialog(true)}
            title="New File with Template"
          >
            <FilePlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsCreatingRoot('file')}
            title="New Empty File"
          >
            <File className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsCreatingRoot('folder')}
            title="New Folder"
          >
            <Folder className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {isCreatingRoot && (
          <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: '8px' }}>
            {isCreatingRoot === 'folder' ? (
              <Folder className="h-4 w-4 text-amber-500" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            <Input
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              onBlur={handleCreateRoot}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateRoot();
                if (e.key === 'Escape') { setIsCreatingRoot(null); setNewRootName(''); }
              }}
              placeholder={isCreatingRoot === 'folder' ? 'folder name' : 'filename.ext'}
              className="h-5 text-xs py-0 px-1"
              autoFocus
            />
          </div>
        )}
        {files.map((file) => (
          <FileTreeItem
            key={file.id}
            node={file}
            depth={0}
            onFileSelect={onFileSelect}
            onCreateFile={onCreateFile}
            onCreateFileWithContent={onCreateFileWithContent}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
            selectedFileId={selectedFileId}
          />
        ))}
        {files.length === 0 && !isCreatingRoot && (
          <div className="px-4 py-8 text-center text-muted-foreground text-xs">
            No files yet. Create one to get started.
          </div>
        )}
      </div>

      <NewFileDialog
        isOpen={showNewFileDialog}
        onClose={() => setShowNewFileDialog(false)}
        onCreateFile={(filename, content) => {
          if (onCreateFileWithContent) {
            onCreateFileWithContent(null, filename, content);
          } else {
            onCreateFile(null, filename, 'file');
          }
        }}
        parentPath="/"
      />
    </div>
  );
};
