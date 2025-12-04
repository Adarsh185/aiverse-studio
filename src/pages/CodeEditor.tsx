import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { FileExplorer } from "@/components/editor/FileExplorer";
import { EditorTabs } from "@/components/editor/EditorTabs";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { StatusBar } from "@/components/editor/StatusBar";
import { Terminal } from "@/components/editor/Terminal";
import { CommandPalette } from "@/components/editor/CommandPalette";
import { ExtensionsPanel } from "@/components/editor/ExtensionsPanel";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { 
  Command, 
  Terminal as TerminalIcon, 
  ArrowLeft,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Blocks,
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";

const CodeEditor = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'files' | 'extensions' | null>('files');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const {
    files,
    tabs,
    activeTabId,
    activeTab,
    isSaving,
    isLoading,
    setActiveTabId,
    createFile,
    deleteFile,
    renameFile,
    openFile,
    closeTab,
    updateTabContent,
    saveFile,
  } = useEditor(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      // Cmd/Ctrl + S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      // Cmd/Ctrl + ` - Toggle terminal
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
      // Cmd/Ctrl + Shift + X - Extensions
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'x') {
        e.preventDefault();
        setSidebarView(prev => prev === 'extensions' ? 'files' : 'extensions');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  const lineCount = activeTab?.content.split('\n').length || 0;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">AIverse Code Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setIsCommandOpen(true)}
          >
            <Command className="h-3 w-3" />
            <span className="hidden sm:inline">Command</span>
            <kbd className="ml-1 text-[10px] text-muted-foreground">⌘P</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          >
            <TerminalIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Activity Bar */}
        <div className="w-12 bg-muted/30 border-r border-border flex flex-col items-center py-2 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              sidebarView === 'files' && "bg-accent text-accent-foreground"
            )}
            onClick={() => setSidebarView(sidebarView === 'files' ? null : 'files')}
            title="Explorer (⌘E)"
          >
            <FolderTree className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              sidebarView === 'extensions' && "bg-accent text-accent-foreground"
            )}
            onClick={() => setSidebarView(sidebarView === 'extensions' ? null : 'extensions')}
            title="Extensions (⌘⇧X)"
          >
            <Blocks className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar + Editor */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {sidebarView && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                  {sidebarView === 'files' ? (
                    <FileExplorer
                      files={files}
                      onFileSelect={openFile}
                      onCreateFile={createFile}
                      onDeleteFile={deleteFile}
                      onRenameFile={renameFile}
                      selectedFileId={activeTab?.fileId || null}
                    />
                  ) : (
                    <ExtensionsPanel
                      isOpen={true}
                      onClose={() => setSidebarView('files')}
                    />
                  )}
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel defaultSize={80}>
              <div className="h-full flex flex-col">
                <EditorTabs
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabSelect={setActiveTabId}
                  onTabClose={closeTab}
                />
                <div className="flex-1 overflow-hidden">
                  {activeTab ? (
                    <MonacoEditor
                      value={activeTab.content}
                      language={activeTab.language}
                      onChange={(value) => updateTabContent(activeTab.id, value)}
                      onSave={() => saveFile()}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Command className="h-16 w-16 mb-4 opacity-20" />
                      <p className="text-lg">No file open</p>
                      <p className="text-sm mt-2">
                        Open a file from the explorer or press{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘P</kbd>{" "}
                        to search
                      </p>
                    </div>
                  )}
                </div>
                <Terminal
                  isOpen={isTerminalOpen}
                  onClose={() => setIsTerminalOpen(false)}
                  currentFile={activeTab ? {
                    name: activeTab.name,
                    content: activeTab.content,
                    path: activeTab.path
                  } : null}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        activeTab={activeTab}
        isSaving={isSaving}
        lineCount={lineCount}
        cursorPosition={cursorPosition}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        files={files}
        onFileSelect={openFile}
        onSaveFile={() => saveFile()}
        onNewFile={() => createFile(null, 'untitled.txt', 'file')}
        onNewFolder={() => createFile(null, 'new-folder', 'folder')}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        onRunFile={() => setIsTerminalOpen(true)}
      />
    </div>
  );
};

export default CodeEditor;
