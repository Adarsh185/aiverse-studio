import { X } from "lucide-react";
import { EditorTab } from "@/types/editor";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcons";

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export const EditorTabs = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
}: EditorTabsProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-muted/50 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-0 max-w-[200px] group",
            activeTabId === tab.id
              ? "bg-background text-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          <FileIcon filename={tab.name} />
          <span className="text-sm truncate">{tab.name}</span>
          {tab.isDirty && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
