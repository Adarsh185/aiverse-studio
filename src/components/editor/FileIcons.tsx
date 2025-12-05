import { 
  FileText, 
  FileCode, 
  FileJson,
  FileType,
  Image,
  FileSpreadsheet,
  Settings,
  Database,
  Globe,
  Palette,
  FileCode2,
  File,
  Braces,
  Hash,
  Terminal,
  BookOpen,
  Lock,
  Package,
  Cog
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const fileIconMap: Record<string, FileIconConfig> = {
  // JavaScript / TypeScript
  js: { icon: FileCode, color: "text-yellow-500" },
  jsx: { icon: FileCode, color: "text-cyan-500" },
  ts: { icon: FileCode2, color: "text-blue-500" },
  tsx: { icon: FileCode2, color: "text-blue-400" },
  mjs: { icon: FileCode, color: "text-yellow-500" },
  cjs: { icon: FileCode, color: "text-yellow-500" },
  
  // Web
  html: { icon: Globe, color: "text-orange-500" },
  htm: { icon: Globe, color: "text-orange-500" },
  css: { icon: Palette, color: "text-blue-400" },
  scss: { icon: Palette, color: "text-pink-500" },
  sass: { icon: Palette, color: "text-pink-500" },
  less: { icon: Palette, color: "text-indigo-500" },
  
  // Data / Config
  json: { icon: Braces, color: "text-yellow-400" },
  yaml: { icon: Settings, color: "text-red-400" },
  yml: { icon: Settings, color: "text-red-400" },
  toml: { icon: Settings, color: "text-gray-500" },
  xml: { icon: FileCode, color: "text-orange-400" },
  csv: { icon: FileSpreadsheet, color: "text-green-500" },
  
  // Python
  py: { icon: FileCode, color: "text-blue-500" },
  pyw: { icon: FileCode, color: "text-blue-500" },
  ipynb: { icon: BookOpen, color: "text-orange-500" },
  
  // Other Languages
  java: { icon: FileCode, color: "text-red-500" },
  c: { icon: FileCode, color: "text-blue-600" },
  cpp: { icon: FileCode, color: "text-blue-600" },
  h: { icon: FileCode, color: "text-purple-500" },
  hpp: { icon: FileCode, color: "text-purple-500" },
  cs: { icon: FileCode, color: "text-green-600" },
  go: { icon: FileCode, color: "text-cyan-500" },
  rs: { icon: FileCode, color: "text-orange-600" },
  rb: { icon: FileCode, color: "text-red-600" },
  php: { icon: FileCode, color: "text-purple-600" },
  swift: { icon: FileCode, color: "text-orange-500" },
  kt: { icon: FileCode, color: "text-purple-500" },
  
  // Shell / Scripts
  sh: { icon: Terminal, color: "text-green-500" },
  bash: { icon: Terminal, color: "text-green-500" },
  zsh: { icon: Terminal, color: "text-green-500" },
  ps1: { icon: Terminal, color: "text-blue-500" },
  bat: { icon: Terminal, color: "text-gray-500" },
  cmd: { icon: Terminal, color: "text-gray-500" },
  
  // Database
  sql: { icon: Database, color: "text-blue-500" },
  db: { icon: Database, color: "text-gray-500" },
  sqlite: { icon: Database, color: "text-blue-400" },
  
  // Documentation
  md: { icon: BookOpen, color: "text-blue-400" },
  mdx: { icon: BookOpen, color: "text-yellow-400" },
  txt: { icon: FileText, color: "text-gray-400" },
  rtf: { icon: FileText, color: "text-gray-400" },
  
  // Images
  png: { icon: Image, color: "text-purple-500" },
  jpg: { icon: Image, color: "text-purple-500" },
  jpeg: { icon: Image, color: "text-purple-500" },
  gif: { icon: Image, color: "text-purple-500" },
  svg: { icon: Image, color: "text-orange-500" },
  ico: { icon: Image, color: "text-purple-500" },
  webp: { icon: Image, color: "text-purple-500" },
  
  // Config files (special names)
  env: { icon: Lock, color: "text-yellow-600" },
  gitignore: { icon: Settings, color: "text-orange-400" },
  dockerignore: { icon: Settings, color: "text-blue-400" },
  editorconfig: { icon: Settings, color: "text-gray-400" },
  
  // Package managers
  lock: { icon: Lock, color: "text-gray-500" },
  
  // Default
  default: { icon: File, color: "text-gray-400" },
};

// Special filename mappings (full filename match)
const specialFileMap: Record<string, FileIconConfig> = {
  'package.json': { icon: Package, color: "text-green-500" },
  'package-lock.json': { icon: Lock, color: "text-red-400" },
  'tsconfig.json': { icon: Cog, color: "text-blue-500" },
  'vite.config.ts': { icon: Cog, color: "text-purple-500" },
  'vite.config.js': { icon: Cog, color: "text-purple-500" },
  'tailwind.config.ts': { icon: Cog, color: "text-cyan-500" },
  'tailwind.config.js': { icon: Cog, color: "text-cyan-500" },
  '.env': { icon: Lock, color: "text-yellow-600" },
  '.env.local': { icon: Lock, color: "text-yellow-600" },
  '.env.development': { icon: Lock, color: "text-yellow-600" },
  '.env.production': { icon: Lock, color: "text-yellow-600" },
  '.gitignore': { icon: Settings, color: "text-orange-400" },
  'Dockerfile': { icon: Settings, color: "text-blue-500" },
  'docker-compose.yml': { icon: Settings, color: "text-blue-500" },
  'README.md': { icon: BookOpen, color: "text-blue-500" },
  'LICENSE': { icon: FileText, color: "text-gray-400" },
};

export const getFileIconConfig = (filename: string): FileIconConfig => {
  // Check special filenames first
  const lowerFilename = filename.toLowerCase();
  if (specialFileMap[filename] || specialFileMap[lowerFilename]) {
    return specialFileMap[filename] || specialFileMap[lowerFilename];
  }
  
  // Get extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileIconMap[ext] || fileIconMap.default;
};

interface FileIconProps {
  filename: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FileIcon = ({ filename, className, size = 'sm' }: FileIconProps) => {
  const config = getFileIconConfig(filename);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return <Icon className={cn(sizeClasses[size], config.color, className)} />;
};

// Language detection for Monaco editor
export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    // JavaScript
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    
    // TypeScript
    ts: 'typescript',
    tsx: 'typescript',
    mts: 'typescript',
    cts: 'typescript',
    
    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    
    // Data
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'ini',
    xml: 'xml',
    
    // Python
    py: 'python',
    pyw: 'python',
    
    // Other languages
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    
    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    ps1: 'powershell',
    bat: 'bat',
    cmd: 'bat',
    
    // Database
    sql: 'sql',
    
    // Documentation
    md: 'markdown',
    mdx: 'markdown',
    txt: 'plaintext',
    
    // Config
    env: 'ini',
    gitignore: 'ignore',
    dockerignore: 'ignore',
  };
  
  return languageMap[ext] || 'plaintext';
};

// File templates for new file creation
export const fileTemplates: Record<string, string> = {
  tsx: `import React from 'react';

interface ComponentProps {
  // Define props here
}

export const Component: React.FC<ComponentProps> = ({}) => {
  return (
    <div>
      
    </div>
  );
};
`,
  ts: `// TypeScript file

export const main = () => {
  console.log('Hello, World!');
};
`,
  js: `// JavaScript file

function main() {
  console.log('Hello, World!');
}

main();
`,
  jsx: `import React from 'react';

function Component() {
  return (
    <div>
      
    </div>
  );
}

export default Component;
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  
</body>
</html>
`,
  css: `/* Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
`,
  py: `#!/usr/bin/env python3
"""
Python script
"""

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  json: `{
  
}
`,
  md: `# Title

## Description

`,
  sql: `-- SQL Query

SELECT * FROM table_name;
`,
  yaml: `# YAML Configuration

name: config
version: 1.0.0
`,
};

export const getFileTemplate = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileTemplates[ext] || '';
};
