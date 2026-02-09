"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Send, Hash, Users, Loader2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

interface StaffMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("auth_id", user.id)
        .single();
      if (userData) {
        setUserId(userData.id);
        setUserName(`${userData.first_name} ${userData.last_name}`);
      }
    }
  }

  async function loadChannels() {
    setLoading(true);
    const { data } = await supabase
      .from("staff_channels")
      .select("*")
      .in("name", ["setters", "général", "hos-team"])
      .order("name");
    setChannels(data || []);
    if (data && data.length > 0) setActiveChannel(data[0]);
    setLoading(false);
  }

  async function loadMessages() {
    if (!activeChannel) return;
    const { data } = await supabase
      .from("staff_messages")
      .select(`*, sender:users!staff_messages_sender_id_fkey(first_name, last_name)`)
      .eq("channel_id", activeChannel.id)
      .order("created_at");
    setMessages(data || []);
  }

  function subscribeToChannel() {
    if (!activeChannel) return;
    supabase
      .channel(`staff:${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "staff_messages", filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
        const { data: sender } = await supabase.from("users").select("first_name, last_name").eq("id", payload.new.sender_id).single();
        setMessages((prev) => [...prev, { ...payload.new, sender } as StaffMessage]);
      })
      .subscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !userId || !activeChannel) return;
    setSending(true);
    await supabase.from("staff_messages").insert([{ channel_id: activeChannel.id, sender_id: userId, content: inputMessage.trim() }]);
    setInputMessage("");
    setSending(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-[#0F172A] text-white p-4">
        <h2 className="text-xl font-bold mb-6">💬 Staff</h2>
        <div className="space-y-1">
          {channels.map((ch) => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)} className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${activeChannel?.id === ch.id ? "bg-amber-500" : "hover:bg-white/5"}`}>
              <Hash size={16} /> {ch.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Hash size={20} /> {activeChannel?.name}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="text-sm font-semibold">{msg.sender?.first_name} {msg.sender?.last_name}</div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm inline-block">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Message..." className="flex-1 px-4 py-3 border rounded-xl" disabled={sending} />
            <Button type="submit" disabled={!inputMessage.trim() || sending} className="bg-amber-500">{sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}