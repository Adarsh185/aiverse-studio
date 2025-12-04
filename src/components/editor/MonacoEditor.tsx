import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "@/components/ThemeProvider";

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

export const MonacoEditor = ({ value, language, onChange, onSave }: MonacoEditorProps) => {
  const { theme } = useTheme();

  const handleMount: OnMount = (editor, monaco) => {
    // Add save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
    });
  };

  return (
    <Editor
      height="100%"
      language={language || 'plaintext'}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onChange={(val) => onChange(val || '')}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
      }}
      loading={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  );
};
