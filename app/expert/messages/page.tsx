"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Hash, Users, Loader2, Plus, X } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  channel_type: "general" | "project" | "private";
}

interface StaffMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export default function StaffMessagingPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
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
      loadChannels();
    }
  }, [userId]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages();
      subscribeToChannel();
    }

    return () => {
      supabase.removeAllChannels();
    };
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, first_name, last_name, role")
          .eq("auth_id", user.id)
          .single();

        if (userData) {
          setUserId(userData.id);
          setUserName(`${userData.first_name} ${userData.last_name}`);
        }
      }
    } catch (err) {
      console.error("Erreur fetchUser:", err);
    }
  }

  async function loadChannels() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("staff_channels")
        .select("*")
        .order("name", { ascending: true });

      setChannels(data || []);

      // Sélectionner le premier channel par défaut
      if (data && data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
    } catch (err) {
      console.error("Erreur loadChannels:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    if (!activeChannel) return;

    try {
      const { data } = await supabase
        .from("staff_messages")
        .select(
          `
          *,
          sender:users!staff_messages_sender_id_fkey (
            id,
            first_name,
            last_name,
            role
          )
        `
        )
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(100);

      setMessages(data || []);
    } catch (err) {
      console.error("Erreur loadMessages:", err);
    }
  }

  function subscribeToChannel() {
    if (!activeChannel) return;

    const channel = supabase
      .channel(`staff_messages:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          // Charger les infos du sender
          const { data: senderData } = await supabase
            .from("users")
            .select("id, first_name, last_name, role")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender: senderData,
          } as StaffMessage;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !userId || !activeChannel) return;

    setSending(true);

    try {
      const { error } = await supabase.from("staff_messages").insert([
        {
          channel_id: activeChannel.id,
          sender_id: userId,
          content: inputMessage.trim(),
        },
      ]);

      if (error) throw error;

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
      {/* Sidebar Channels */}
      <div className="w-64 bg-[#0F172A] text-white p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">💬 Staff</h2>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
            <Plus size={18} />
          </Button>
        </div>

        <div className="space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeChannel?.id === channel.id
                  ? "bg-amber-500 text-white font-semibold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Hash size={16} />
              {channel.name}
            </button>
          ))}
        </div>

        {/* User Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-xs font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{userName}</p>
              <p className="text-[10px] text-slate-400">En ligne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#123055] flex items-center gap-2">
              <Hash size={20} />
              {activeChannel?.name}
            </h3>
            {activeChannel?.description && (
              <p className="text-sm text-slate-500 mt-1">
                {activeChannel.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users size={18} />
            <span className="text-sm">{messages.length} messages</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Hash size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold">Aucun message</p>
              <p className="text-sm">
                Soyez le premier à démarrer la conversation !
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwnMessage = msg.sender_id === userId;
              const showSender =
                idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

              return (
                <div key={msg.id} className="space-y-1">
                  {showSender && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {msg.sender?.first_name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {msg.sender?.first_name} {msg.sender?.last_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`${
                      showSender ? "ml-8" : "ml-8"
                    } bg-white rounded-lg px-4 py-2 shadow-sm border inline-block max-w-[70%]`}
                  >
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
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
              placeholder={`Message dans #${activeChannel?.name}`}
              className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 outline-none"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}