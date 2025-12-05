import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon, getFileTemplate } from "./FileIcons";
import { cn } from "@/lib/utils";

interface FileTypeOption {
  ext: string;
  name: string;
  description: string;
}

const fileTypes: FileTypeOption[] = [
  { ext: 'tsx', name: 'React TypeScript', description: 'React component with TypeScript' },
  { ext: 'ts', name: 'TypeScript', description: 'TypeScript file' },
  { ext: 'jsx', name: 'React JavaScript', description: 'React component with JavaScript' },
  { ext: 'js', name: 'JavaScript', description: 'JavaScript file' },
  { ext: 'html', name: 'HTML', description: 'HTML document' },
  { ext: 'css', name: 'CSS', description: 'Stylesheet' },
  { ext: 'scss', name: 'SCSS', description: 'Sass stylesheet' },
  { ext: 'json', name: 'JSON', description: 'JSON data file' },
  { ext: 'py', name: 'Python', description: 'Python script' },
  { ext: 'sql', name: 'SQL', description: 'SQL query file' },
  { ext: 'md', name: 'Markdown', description: 'Markdown document' },
  { ext: 'yaml', name: 'YAML', description: 'YAML configuration' },
  { ext: 'xml', name: 'XML', description: 'XML document' },
  { ext: 'txt', name: 'Plain Text', description: 'Text file' },
  { ext: 'sh', name: 'Shell Script', description: 'Bash/shell script' },
  { ext: 'env', name: 'Environment', description: 'Environment variables' },
];

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (filename: string, content: string) => void;
  parentPath?: string;
}

export const NewFileDialog = ({ 
  isOpen, 
  onClose, 
  onCreateFile,
  parentPath 
}: NewFileDialogProps) => {
  const [filename, setFilename] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleCreate = () => {
    if (!filename.trim()) return;
    
    const finalFilename = selectedType && !filename.includes('.') 
      ? `${filename}.${selectedType}` 
      : filename;
    
    const template = getFileTemplate(finalFilename);
    onCreateFile(finalFilename, template);
    
    setFilename("");
    setSelectedType(null);
    onClose();
  };

  const handleTypeSelect = (ext: string) => {
    setSelectedType(ext);
    if (!filename.includes('.')) {
      const baseName = filename || 'untitled';
      setFilename(`${baseName}.${ext}`);
    }
  };

  const handleFilenameChange = (value: string) => {
    setFilename(value);
    // Auto-detect type from extension
    const ext = value.split('.').pop()?.toLowerCase();
    if (ext && fileTypes.some(ft => ft.ext === ext)) {
      setSelectedType(ext);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            {parentPath ? `Creating in: ${parentPath}` : 'Creating in root directory'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2">
              {filename && <FileIcon filename={filename} size="md" />}
              <Input
                id="filename"
                value={filename}
                onChange={(e) => handleFilenameChange(e.target.value)}
                placeholder="Enter filename with extension..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>File Type Templates</Label>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="grid grid-cols-2 gap-1 p-2">
                {fileTypes.map((type) => (
                  <button
                    key={type.ext}
                    onClick={() => handleTypeSelect(type.ext)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent transition-colors",
                      selectedType === type.ext && "bg-accent ring-1 ring-primary"
                    )}
                  >
                    <FileIcon filename={`file.${type.ext}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{type.name}</div>
                      <div className="text-xs text-muted-foreground truncate">.{type.ext}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!filename.trim()}>
              Create File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
