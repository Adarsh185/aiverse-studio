import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string | null;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }
    setConversations(data || []);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }
    setMessages(data?.map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      image_url: m.image_url,
    })) || []);
  }, []);

  // Select conversation
  const selectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    await loadMessages(id);
  }, [loadMessages]);

  // Create new chat
  const createNewChat = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "New Chat" })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new chat",
      });
      return;
    }

    setConversations(prev => [data, ...prev]);
    setCurrentConversationId(data.id);
    setMessages([]);
  }, [userId, toast]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting conversation:", error);
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [currentConversationId]);

  // Update conversation title
  const updateTitle = useCallback(async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);

    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!userId) return;

    let conversationId = currentConversationId;

    // Create new conversation if needed
    if (!conversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: content.slice(0, 50) })
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create conversation",
        });
        return;
      }

      conversationId = data.id;
      setCurrentConversationId(conversationId);
      setConversations(prev => [data, ...prev]);
    }

    // Add user message
    const userMessage: Message = { role: "user", content, image_url: imageUrl };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to DB
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content,
      image_url: imageUrl,
    });

    // Update title if first message
    if (messages.length === 0) {
      updateTitle(conversationId, content);
    }

    setLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map(m => {
        if (m.image_url) {
          return {
            role: m.role,
            content: [
              { type: "text", text: m.content },
              { type: "image_url", image_url: { url: m.image_url } },
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }

      // Save assistant message to DB
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantContent,
      });

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get response",
      });
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [userId, currentConversationId, messages, toast, updateTitle]);

  return {
    conversations,
    currentConversationId,
    messages,
    loading,
    selectConversation,
    createNewChat,
    deleteConversation,
    sendMessage,
  };
};
