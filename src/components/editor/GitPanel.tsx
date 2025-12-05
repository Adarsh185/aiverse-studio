import { useState } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Plus, 
  Minus, 
  RefreshCw,
  Check,
  Upload,
  Download,
  MoreHorizontal,
  FileText,
  FilePlus,
  FileEdit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GitChange {
  id: string;
  filename: string;
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'untracked';
  staged: boolean;
}

interface GitPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitPanel = ({ isOpen, onClose }: GitPanelProps) => {
  const [currentBranch, setCurrentBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [stagedOpen, setStagedOpen] = useState(true);
  const [changesOpen, setChangesOpen] = useState(true);
  
  // Simulated git changes - in real implementation, this would come from actual git status
  const [changes, setChanges] = useState<GitChange[]>([
    { id: '1', filename: 'index.tsx', path: 'src/pages/index.tsx', status: 'modified', staged: false },
    { id: '2', filename: 'App.css', path: 'src/App.css', status: 'modified', staged: false },
    { id: '3', filename: 'newComponent.tsx', path: 'src/components/newComponent.tsx', status: 'added', staged: true },
  ]);

  const stagedChanges = changes.filter(c => c.staged);
  const unstagedChanges = changes.filter(c => !c.staged);

  const stageFile = (id: string) => {
    setChanges(prev => prev.map(c => 
      c.id === id ? { ...c, staged: true } : c
    ));
  };

  const unstageFile = (id: string) => {
    setChanges(prev => prev.map(c => 
      c.id === id ? { ...c, staged: false } : c
    ));
  };

  const stageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: true })));
  };

  const unstageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: false })));
  };

  const discardChanges = (id: string) => {
    setChanges(prev => prev.filter(c => c.id !== id));
    toast.success("Changes discarded");
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message");
      return;
    }
    if (stagedChanges.length === 0) {
      toast.error("No staged changes to commit");
      return;
    }

    setIsCommitting(true);
    // Simulate commit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setChanges(prev => prev.filter(c => !c.staged));
    setCommitMessage("");
    setIsCommitting(false);
    toast.success(`Committed ${stagedChanges.length} file(s)`);
  };

  const handlePush = async () => {
    setIsPushing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPushing(false);
    toast.success("Pushed to remote");
  };

  const handlePull = async () => {
    setIsPulling(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPulling(false);
    toast.success("Pulled from remote");
  };

  const getStatusIcon = (status: GitChange['status']) => {
    switch (status) {
      case 'added':
        return <FilePlus className="h-3.5 w-3.5 text-green-500" />;
      case 'modified':
        return <FileEdit className="h-3.5 w-3.5 text-amber-500" />;
      case 'deleted':
        return <Trash2 className="h-3.5 w-3.5 text-red-500" />;
      case 'untracked':
        return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: GitChange['status']) => {
    switch (status) {
      case 'added': return 'A';
      case 'modified': return 'M';
      case 'deleted': return 'D';
      case 'untracked': return 'U';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Source Control</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handlePull}
            disabled={isPulling}
          >
            <Download className={cn("h-3 w-3", isPulling && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handlePush}
            disabled={isPushing}
          >
            <Upload className={cn("h-3 w-3", isPushing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => toast.success("Refreshed")}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                {currentBranch}
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setCurrentBranch("main")}>
                <GitBranch className="h-4 w-4 mr-2" /> main
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentBranch("develop")}>
                <GitBranch className="h-4 w-4 mr-2" /> develop
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentBranch("feature/new-feature")}>
                <GitBranch className="h-4 w-4 mr-2" /> feature/new-feature
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Commit Message */}
      <div className="px-3 py-2 border-b border-border">
        <Textarea
          placeholder="Commit message"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
        />
        <Button
          className="w-full mt-2"
          size="sm"
          onClick={handleCommit}
          disabled={isCommitting || stagedChanges.length === 0}
        >
          {isCommitting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Commit {stagedChanges.length > 0 && `(${stagedChanges.length})`}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Staged Changes */}
        <Collapsible open={stagedOpen} onOpenChange={setStagedOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Staged Changes</span>
                {stagedChanges.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                    {stagedChanges.length}
                  </span>
                )}
              </div>
              {stagedChanges.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => { e.stopPropagation(); unstageAll(); }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {stagedChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/30 group text-sm"
              >
                {getStatusIcon(change.status)}
                <span className="flex-1 truncate text-xs">{change.filename}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {getStatusLabel(change.status)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => unstageFile(change.id)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {stagedChanges.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No staged changes
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Unstaged Changes */}
        <Collapsible open={changesOpen} onOpenChange={setChangesOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Changes</span>
                {unstagedChanges.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5">
                    {unstagedChanges.length}
                  </span>
                )}
              </div>
              {unstagedChanges.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => { e.stopPropagation(); stageAll(); }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {unstagedChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/30 group text-sm"
              >
                {getStatusIcon(change.status)}
                <span className="flex-1 truncate text-xs">{change.filename}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {getStatusLabel(change.status)}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => discardChanges(change.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => stageFile(change.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {unstagedChanges.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No changes
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </div>
  );
};
