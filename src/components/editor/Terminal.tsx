import { useState, useRef, useEffect } from "react";
import { Play, Trash2, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerminalOutput } from "@/types/editor";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile: { name: string; content: string; path: string } | null;
}

export const Terminal = ({ isOpen, onClose, currentFile }: TerminalProps) => {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    setOutputs(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const runCurrentFile = async () => {
    if (!currentFile) {
      addOutput('stderr', 'No file selected to run');
      return;
    }

    const ext = currentFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !['js', 'ts', 'jsx', 'tsx', 'py', 'html'].includes(ext)) {
      addOutput('stderr', `Cannot run .${ext} files. Supported: js, ts, jsx, tsx, py, html`);
      return;
    }

    setIsRunning(true);
    addOutput('info', `> Running ${currentFile.name}...`);

    try {
      const { data, error } = await supabase.functions.invoke('run-code', {
        body: {
          filename: currentFile.name,
          content: currentFile.content,
          language: ext
        }
      });

      if (error) throw error;

      if (data.stdout) {
        addOutput('stdout', data.stdout);
      }
      if (data.stderr) {
        addOutput('stderr', data.stderr);
      }
      addOutput('info', `> Process exited with code ${data.exitCode || 0}`);
    } catch (error) {
      addOutput('stderr', `Error: ${error instanceof Error ? error.message : 'Failed to run code'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    addOutput('info', `$ ${command}`);
    
    if (command === 'clear') {
      setOutputs([]);
    } else if (command === 'help') {
      addOutput('stdout', 'Available commands:\n  clear - Clear terminal\n  run - Run current file\n  help - Show this help');
    } else if (command === 'run') {
      await runCurrentFile();
    } else {
      addOutput('stderr', `Command not found: ${command}. Type 'help' for available commands.`);
    }

    setCommand('');
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "flex flex-col bg-card border-t border-border",
      isMaximized ? "h-[60%]" : "h-48"
    )}>
      <div className="flex items-center justify-between px-3 py-1 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium">Terminal</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={runCurrentFile}
            disabled={isRunning || !currentFile}
            title="Run current file"
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setOutputs([])}
            title="Clear terminal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div
        ref={outputRef}
        className="flex-1 overflow-auto p-2 font-mono text-xs bg-background"
      >
        {outputs.map((output, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap",
              output.type === 'stderr' && "text-destructive",
              output.type === 'info' && "text-muted-foreground",
              output.type === 'stdout' && "text-foreground"
            )}
          >
            {output.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="flex border-t border-border">
        <span className="px-2 py-1 text-xs text-muted-foreground font-mono">$</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type command..."
          className="flex-1 h-7 border-0 rounded-none text-xs font-mono focus-visible:ring-0"
        />
      </form>
    </div>
  );
};
