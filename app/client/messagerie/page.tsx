"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_type: "client" | "expert" | "ai";
  sender_id: string | null;
  created_at: string;
  is_read: boolean;
}

export default function ClientMessagerieComplete() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [expertInfo, setExpertInfo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUserAndConversation();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiThinking]);

  async function loadUserAndConversation() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (!profile) return;
      setUserId(profile.id);

      let { data: conv } = await supabase
        .from("conversations")
        .select("*, expert:expert_id(first_name, last_name, email)")
        .eq("client_id", profile.id)
        .single();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ client_id: profile.id })
          .select("*, expert:expert_id(first_name, last_name, email)")
          .single();

        conv = newConv;
      }

      if (conv) {
        setConversationId(conv.id);
        if (conv.expert) {
          setExpertInfo(conv.expert);
        }
      }

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    if (!conversationId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      
      const unreadIds = data
        .filter(m => !m.is_read && m.sender_type !== "client")
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }
  }

  function subscribeToMessages() {
    if (!conversationId) return;
    
    // Nettoyer l'ancien channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("📨 Nouveau message reçu:", payload);
          const newMsg = payload.new as Message;
          
          setMessages((prev) => {
            // Éviter les doublons
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          
          setAiThinking(false);
          
          if (newMsg.sender_type !== "client") {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time status:", status);
      });
    
    channelRef.current = channel;
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !userId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      if (isAIMode) {
        // Mode IA - Insérer message client
        const { data: clientMsg, error: clientMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            sender_type: "client",
            content: content,
          })
          .select()
          .single();

        if (clientMsgError) throw clientMsgError;

        // Ajouter immédiatement à l'UI
        setMessages(prev => [...prev, clientMsg]);

        // Afficher loader IA
        setAiThinking(true);

        // Appeler API IA
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            userId: userId,
            conversationId: conversationId,
            conversationHistory: messages
              .filter(m => m.sender_type === "client" || m.sender_type === "ai")
              .slice(-10)
              .map(m => ({
                role: m.sender_type === "ai" ? "assistant" : "user",
                content: m.content,
              })),
          }),
        });

        const data = await response.json();
        if (data.error) {
          setAiThinking(false);
          throw new Error(data.error);
        }

      } else {
        // Mode Expert
        const { data: clientMsg, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            sender_type: "client",
            content: content,
          })
          .select()
          .single();

        if (error) throw error;

        // Ajouter immédiatement à l'UI
        setMessages(prev => [...prev, clientMsg]);

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);

        toast.success("Message envoyé à votre expert");
      }

    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'envoi");
      setAiThinking(false);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#123055]">💬 Messagerie</h1>
          <p className="text-slate-600 mt-1">
            {isAIMode ? "Assistant IA disponible 24/7" : "Contactez votre expert"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setIsAIMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              isAIMode
                ? "bg-white text-purple-600 shadow-sm font-semibold"
                : "text-slate-600"
            }`}
          >
            <Bot size={18} />
            IA
          </button>
          <button
            onClick={() => setIsAIMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              !isAIMode
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-slate-600"
            }`}
          >
            <User size={18} />
            Expert
          </button>
        </div>
      </div>

      {/* Info Expert */}
      {!isAIMode && expertInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600">
              <AvatarFallback className="text-white font-bold">
                {expertInfo.first_name?.charAt(0)}
                {expertInfo.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-blue-900">
                {expertInfo.first_name} {expertInfo.last_name}
              </p>
              <p className="text-xs text-blue-700">Votre expert dédié</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAIMode && !expertInfo && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-800">
              ⏳ Votre expert sera assigné après votre premier RDV
            </p>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="h-[500px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !aiThinking ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageCircle size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold">Aucun message</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.sender_type === "client";
                const isAI = msg.sender_type === "ai";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isMe
                          ? "bg-blue-600 text-white"
                          : isAI
                          ? "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 text-slate-900"
                          : "bg-emerald-100 border border-emerald-200 text-slate-900"
                      }`}
                    >
                      {isAI && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-purple-600 font-semibold">
                          <Bot size={14} />
                          Assistant IA
                        </div>
                      )}
                      {msg.sender_type === "expert" && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-emerald-600 font-semibold">
                          <User size={14} />
                          Expert
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                      <p
                        className={`text-[10px] mt-2 ${
                          isMe ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Loader IA */}
              {aiThinking && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="animate-spin text-purple-600" size={16} />
                    <span className="text-sm text-slate-700">
                      L&apos;IA réfléchit...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isAIMode ? "Posez votre question..." : "Écrivez à votre expert..."
              }
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}