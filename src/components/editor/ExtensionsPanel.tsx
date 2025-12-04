import { useState } from "react";
import { Search, Package, Download, Check, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: string;
  category: string;
  installed?: boolean;
}

const MOCK_EXTENSIONS: Extension[] = [
  {
    id: "prettier",
    name: "Prettier",
    description: "Code formatter using prettier",
    author: "Prettier",
    version: "10.1.0",
    downloads: "42M",
    category: "Formatters",
  },
  {
    id: "eslint",
    name: "ESLint",
    description: "Integrates ESLint into VS Code",
    author: "Microsoft",
    version: "2.4.4",
    downloads: "31M",
    category: "Linters",
  },
  {
    id: "python",
    name: "Python",
    description: "Python language support with extension access points",
    author: "Microsoft",
    version: "2024.0.1",
    downloads: "98M",
    category: "Languages",
  },
  {
    id: "gitlens",
    name: "GitLens",
    description: "Supercharge Git within VS Code",
    author: "GitKraken",
    version: "14.7.0",
    downloads: "28M",
    category: "Git",
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS IntelliSense",
    description: "Intelligent Tailwind CSS tooling",
    author: "Tailwind Labs",
    version: "0.10.5",
    downloads: "9M",
    category: "CSS",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "Your AI pair programmer",
    author: "GitHub",
    version: "1.156.0",
    downloads: "15M",
    category: "AI",
  },
  {
    id: "material-icon",
    name: "Material Icon Theme",
    description: "Material Design icons for VS Code",
    author: "Philipp Kief",
    version: "4.33.0",
    downloads: "21M",
    category: "Themes",
  },
  {
    id: "bracket-pair",
    name: "Bracket Pair Colorizer",
    description: "Colorizes matching brackets",
    author: "CoenraadS",
    version: "2.0.2",
    downloads: "8M",
    category: "Other",
  },
  {
    id: "live-server",
    name: "Live Server",
    description: "Launch a local dev server with live reload",
    author: "Ritwick Dey",
    version: "5.7.9",
    downloads: "45M",
    category: "Other",
  },
  {
    id: "docker",
    name: "Docker",
    description: "Docker support for VS Code",
    author: "Microsoft",
    version: "1.28.0",
    downloads: "25M",
    category: "Other",
  },
];

interface ExtensionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionsPanel = ({ isOpen, onClose }: ExtensionsPanelProps) => {
  const [search, setSearch] = useState("");
  const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(MOCK_EXTENSIONS.map(e => e.category))];

  const filteredExtensions = MOCK_EXTENSIONS.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleInstall = (extId: string) => {
    setInstalledExtensions(prev => {
      const next = new Set(prev);
      if (next.has(extId)) {
        next.delete(extId);
      } else {
        next.add(extId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-card border-r border-border w-72">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4" />
          <span className="text-sm font-semibold">Extensions</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extensions..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredExtensions.map(ext => {
            const isInstalled = installedExtensions.has(ext.id);
            return (
              <div
                key={ext.id}
                className={cn(
                  "p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors",
                  isInstalled && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{ext.name}</h4>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        v{ext.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {ext.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{ext.author}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {ext.downloads}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={isInstalled ? "outline" : "default"}
                    className="h-7 text-xs flex-1"
                    onClick={() => toggleInstall(ext.id)}
                  >
                    {isInstalled ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                  {isInstalled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => toggleInstall(ext.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredExtensions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No extensions found
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {installedExtensions.size} extension{installedExtensions.size !== 1 ? 's' : ''} installed
        </p>
      </div>
    </div>
  );
};
