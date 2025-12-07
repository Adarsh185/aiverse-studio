import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Send, UserPlus, Play, Bot, Circle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { CollaborationSession, SessionMessage, SessionParticipant, SessionInvite } from "@/hooks/useCollaborationSession";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CollaborativeWorkspaceProps {
  session: CollaborationSession;
  messages: SessionMessage[];
  participants: SessionParticipant[];
  invites: SessionInvite[];
  userId: string;
  userEmail: string;
  onLeave: () => void;
  onSendMessage: (content: string) => Promise<void>;
  onSendAIMessage: (content: string) => Promise<void>;
  onUpdateCode: (code: string) => Promise<void>;
  onUpdateLanguage: (language: string) => Promise<void>;
  onInvite: (email: string) => Promise<void>;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

export const CollaborativeWorkspace = ({
  session,
  messages,
  participants,
  invites,
  userId,
  userEmail,
  onLeave,
  onSendMessage,
  onSendAIMessage,
  onUpdateCode,
  onUpdateLanguage,
  onInvite,
}: CollaborativeWorkspaceProps) => {
  const [chatInput, setChatInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [localCode, setLocalCode] = useState(session.code_content);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setLocalCode(session.code_content);
  }, [session.code_content]);

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setLocalCode(value);

    // Debounce the update
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdateCode(value);
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const message = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    // Check for @ai mention
    if (message.toLowerCase().includes("@ai")) {
      await onSendMessage(message);
      setIsAITyping(true);

      try {
        // Get AI response
        const response = await supabase.functions.invoke("chat", {
          body: {
            messages: [
              ...messages.slice(-10).map((m) => ({
                role: m.is_ai_response ? "assistant" : "user",
                content: m.content,
              })),
              { role: "user", content: message.replace(/@ai/gi, "").trim() },
            ],
            stream: false,
          },
        });

        if (response.error) throw response.error;

        const aiContent = response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that request.";
        await onSendAIMessage(aiContent);
      } catch (error) {
        console.error("AI error:", error);
        await onSendAIMessage("Sorry, I encountered an error. Please try again.");
      } finally {
        setIsAITyping(false);
      }
    } else {
      await onSendMessage(message);
    }

    setIsSending(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await onInvite(inviteEmail.trim());
    setInviteEmail("");
    setIsInviteOpen(false);
  };

  const handleRunCode = () => {
    // Open new window with preview
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups to see the preview", variant: "destructive" });
      return;
    }

    const language = session.code_language;
    let htmlContent = "";

    if (language === "html") {
      htmlContent = localCode;
    } else if (language === "javascript" || language === "typescript") {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Code Preview</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a2e; color: #eee; }
    .output { white-space: pre-wrap; }
    .error { color: #ff6b6b; }
  </style>
</head>
<body>
  <h2>Console Output:</h2>
  <div class="output" id="output"></div>
  <script>
    const output = document.getElementById('output');
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      output.innerHTML += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      output.innerHTML += '<span class="error">' + args.join(' ') + '</span>\\n';
      originalError.apply(console, args);
    };
    
    try {
      ${localCode}
    } catch(e) {
      console.error('Error:', e.message);
    }
  </script>
</body>
</html>`;
    } else if (language === "python") {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Python Preview</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a2e; color: #eee; }
  </style>
</head>
<body>
  <h2>Python Code (Preview Only)</h2>
  <pre>${localCode}</pre>
  <p style="color: #888; margin-top: 20px;">Note: Python execution requires a backend. This is a code preview.</p>
</body>
</html>`;
    } else if (language === "css") {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>CSS Preview</title>
  <style>${localCode}</style>
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>Your styles are applied to this page.</p>
    <button>Sample Button</button>
    <div class="box" style="width:100px;height:100px;background:#ddd;margin:10px 0;"></div>
  </div>
</body>
</html>`;
    } else {
      htmlContent = `<pre>${localCode}</pre>`;
    }

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  };

  const participantCount = participants.length + 1; // +1 for host

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onLeave}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave
          </Button>
          <div>
            <h2 className="font-semibold">{session.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participantCount}/4 collaborators</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
              >
                {i + 1}
              </div>
            ))}
            {participantCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                +{participantCount - 3}
              </div>
            )}
          </div>

          {session.host_id === userId && participantCount < 4 && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Collaborator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Email address..."
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                  <Button onClick={handleInvite} className="w-full">
                    Send Invitation
                  </Button>

                  {invites.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Pending Invites</p>
                      {invites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                          <span>{inv.email}</span>
                          <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button onClick={handleRunCode} className="bg-green-600 hover:bg-green-700">
            <Play className="h-4 w-4 mr-2" />
            Run Code
          </Button>
        </div>
      </div>

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-border">
        {/* Code Editor */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-sm font-medium">Code Editor</span>
              <Select value={session.code_language} onValueChange={onUpdateLanguage}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={session.code_language}
                value={localCode}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat Panel */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-sm font-medium">Session Chat</span>
              <p className="text-xs text-muted-foreground">Use @ai to get AI assistance</p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.user_id === userId ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        msg.is_ai_response
                          ? "bg-primary text-primary-foreground"
                          : msg.user_id === userId
                          ? "bg-secondary"
                          : "bg-muted"
                      }`}
                    >
                      {msg.is_ai_response ? <Bot className="h-4 w-4" /> : msg.user_email[0]?.toUpperCase()}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${msg.user_id === userId ? "text-right" : ""}`}
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {msg.is_ai_response ? "AI Assistant" : msg.user_email}
                      </p>
                      <div
                        className={`inline-block p-3 rounded-lg text-sm ${
                          msg.is_ai_response
                            ? "bg-primary/10 border border-primary/20"
                            : msg.user_id === userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      </div>
                    </div>
                  </div>
                ))}

                {isAITyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <Circle className="h-2 w-2 fill-current animate-pulse" />
                        <Circle className="h-2 w-2 fill-current animate-pulse delay-100" />
                        <Circle className="h-2 w-2 fill-current animate-pulse delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message... (@ai for AI help)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
