"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  User,
  Loader2,
  MessageCircle,
  Users,
} from "lucide-react";

interface Conversation {
  id: string;
  client_id: string;
  expert_id: string | null;
  status: string;
  last_message_at: string;
  client?: {
    first_name: string;
    last_name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "client" | "expert" | "ai";
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function ExpertMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages();
      subscribeToMessages();
    }

    return () => {
      supabase.removeAllChannels();
    };
  }, [selectedConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand la conversation change
  useEffect(() => {
    if (selectedConv && userId) {
      markMessagesAsRead();
    }
  }, [selectedConv]);

  async function fetchUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (userData) {
        setUserId(userData.id);
      }
    }
    setLoading(false);
  }

  async function loadConversations() {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        client:users!conversations_client_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq("status", "active")
      .order("last_message_at", { ascending: false });

    setConversations(data || []);

    if (data && data.length > 0 && !selectedConv) {
      setSelectedConv(data[0]);
    }
  }

  async function loadMessages() {
    if (!selectedConv) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConv.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  function subscribeToMessages() {
    if (!selectedConv) return;

    const channel = supabase
      .channel(`messages:${selectedConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();
  }

  async function markMessagesAsRead() {
    if (!selectedConv || !userId) return;
    
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", selectedConv.id)
      .neq("sender_id", userId);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !userId || !selectedConv) return;

    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: selectedConv.id,
          sender_id: userId,
          sender_type: "expert",
          content: inputMessage.trim(),
          is_read: false,
        },
      ]);

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConv.id);

      setInputMessage("");
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Conversations */}
      <div className="w-80 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
          <Users size={20} />
          Conversations Clients
        </h2>

        {conversations.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            Aucune conversation pour le moment
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedConv?.id === conv.id
                    ? "bg-amber-50 border-2 border-amber-500"
                    : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                }`}
              >
                <div className="font-semibold text-[#123055]">
                  {conv.client?.first_name} {conv.client?.last_name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(conv.last_message_at).toLocaleDateString("fr-FR")}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
              <h3 className="text-xl font-bold text-[#123055]">
                💬 {selectedConv.client?.first_name}{" "}
                {selectedConv.client?.last_name}
              </h3>
              <p className="text-sm text-slate-500">Expert • Client</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageCircle size={64} className="mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucun message</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === "expert"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === "expert"
                          ? "bg-emerald-500 text-white"
                          : msg.sender_type === "ai"
                          ? "bg-gradient-to-br from-purple-50 to-blue-50 text-slate-900 border border-purple-200"
                          : "bg-slate-200 text-slate-900"
                      }`}
                    >
                      {msg.sender_type === "client" && (
                        <div className="text-xs text-slate-600 font-semibold mb-1">
                          <User size={12} className="inline mr-1" />
                          Client
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-2 ${
                          msg.sender_type === "expert"
                            ? "text-white/70"
                            : "text-slate-500"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Répondre au client..."
                  className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 ring-emerald-500/20 outline-none"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">
                Sélectionnez une conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}