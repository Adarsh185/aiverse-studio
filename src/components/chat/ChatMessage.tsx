import { User, Sparkles } from "lucide-react";
import { MessageContent } from "./MessageContent";
import { cn } from "@/lib/utils";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 animate-fade-in",
        isUser ? "bg-background" : "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm mb-1">{isUser ? "You" : "AIverse"}</p>
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Uploaded"
            className="max-w-xs rounded-lg mb-3 border border-border"
          />
        )}
        <div className="text-foreground">
          <MessageContent content={message.content} />
        </div>
      </div>
    </div>
  );
};
