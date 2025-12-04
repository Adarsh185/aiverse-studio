import { GitBranch, Check, AlertCircle } from "lucide-react";
import { EditorTab } from "@/types/editor";

interface StatusBarProps {
  activeTab: EditorTab | null;
  isSaving: boolean;
  lineCount: number;
  cursorPosition: { line: number; column: number };
}

export const StatusBar = ({ activeTab, isSaving, lineCount, cursorPosition }: StatusBarProps) => {
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-primary text-primary-foreground text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>
        {isSaving ? (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {activeTab && (
          <>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span>{lineCount} lines</span>
            <span className="uppercase">{activeTab.language || 'Plain Text'}</span>
            <span>UTF-8</span>
          </>
        )}
      </div>
    </div>
  );
};
