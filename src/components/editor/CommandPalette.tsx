import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  File, 
  Save, 
  FolderPlus, 
  Settings, 
  Terminal as TerminalIcon,
  Play,
  Moon,
  Sun
} from "lucide-react";
import { FileNode } from "@/types/editor";
import { useTheme } from "@/components/ThemeProvider";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onSaveFile: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onToggleTerminal: () => void;
  onRunFile: () => void;
}

export const CommandPalette = ({
  isOpen,
  onClose,
  files,
  onFileSelect,
  onSaveFile,
  onNewFile,
  onNewFolder,
  onToggleTerminal,
  onRunFile,
}: CommandPaletteProps) => {
  const { theme, setTheme } = useTheme();

  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    const traverse = (items: FileNode[]) => {
      items.forEach(item => {
        if (item.type === 'file') {
          result.push(item);
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const allFiles = flattenFiles(files);

  const commands = [
    { id: 'save', label: 'Save File', icon: Save, action: onSaveFile, shortcut: '⌘S' },
    { id: 'new-file', label: 'New File', icon: File, action: onNewFile },
    { id: 'new-folder', label: 'New Folder', icon: FolderPlus, action: onNewFolder },
    { id: 'terminal', label: 'Toggle Terminal', icon: TerminalIcon, action: onToggleTerminal, shortcut: '⌘`' },
    { id: 'run', label: 'Run Current File', icon: Play, action: onRunFile, shortcut: 'F5' },
    { 
      id: 'theme', 
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`, 
      icon: theme === 'dark' ? Sun : Moon, 
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
    },
  ];

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Type a command or search files..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => {
                cmd.action();
                onClose();
              }}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">{cmd.shortcut}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        {allFiles.length > 0 && (
          <CommandGroup heading="Files">
            {allFiles.map((file) => (
              <CommandItem
                key={file.id}
                onSelect={() => {
                  onFileSelect(file);
                  onClose();
                }}
              >
                <File className="mr-2 h-4 w-4" />
                <span>{file.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{file.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
