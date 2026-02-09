"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "client" | "expert" | "ai";
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  client_id: string;
  expert_id: string | null;
  status: "active" | "closed" | "archived";
  last_message_at: string;
  created_at: string;
}

export function useMessaging(userId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!userId) return;

    loadConversation();
    subscribeToMessages();

    return () => {
      supabase.removeAllChannels();
    };
  }, [userId]);

  async function loadConversation() {
    try {
      setLoading(true);

      // Récupérer ou créer la conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", userId) // userId est maintenant UUID
        .single();

      if (convError && convError.code !== "PGRST116") {
        console.error("Erreur conversation:", convError);
        setLoading(false);
        return;
      }

      let conversationId: string;

      if (!convData) {
        // Créer une nouvelle conversation avec UUID
        const { data: newConv } = await supabase.rpc(
          "create_conversation_if_not_exists",
          { p_client_id: userId } // userId est UUID
        );
        conversationId = newConv;

        // Récupérer la conversation créée
        const { data: createdConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        setConversation(createdConv);
      } else {
        conversationId = convData.id;
        setConversation(convData);
      }

      // Charger les messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
    } catch (err) {
      console.error("Erreur loadConversation:", err);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();
  }

  async function sendMessage(content: string, senderType: "client" | "expert" = "client") {
    if (!conversation || !userId) return;

    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: conversation.id,
          sender_id: userId,
          sender_type: senderType,
          content,
          is_read: false,
        },
      ]);

      if (error) throw error;

      // Mettre à jour last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    } catch (err) {
      console.error("Erreur sendMessage:", err);
      throw err;
    } finally {
      setSending(false);
    }
  }

  async function markAsRead(messageId: string) {
    await supabase.from("messages").update({ is_read: true }).eq("id", messageId);

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg))
    );
  }

  return {
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refresh: loadConversation,
  };
}