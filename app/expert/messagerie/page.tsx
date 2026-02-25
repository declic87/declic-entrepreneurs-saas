"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Loader2, MessageCircle, Clock, Search } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_type: "client" | "expert" | "ai";
  sender_id: string | null;
  created_at: string;
  is_read: boolean;
}

interface ClientConversation {
  id: string;
  client_id: string;
  last_message_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  unread_count: number;
}

export default function ExpertMessagerieComplete() {
  const [expertId, setExpertId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadExpert();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (expertId) {
      loadConversations();
    }
  }, [expertId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadExpert() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (profile) {
        setExpertId(profile.id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations() {
    if (!expertId) return;

    try {
      const { data } = await supabase
        .from("conversations")
        .select(`
          id,
          client_id,
          last_message_at,
          client:client_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq("expert_id", expertId)
        .order("last_message_at", { ascending: false });

      if (data) {
        // Compter messages non lus pour chaque conversation
        const conversationsWithUnread = await Promise.all(
          data.map(async (conv) => {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .eq("is_read", false)
              .neq("sender_type", "expert");

            return {
              ...conv,
              unread_count: count || 0,
            };
          })
        );

        setConversations(conversationsWithUnread as any);

        // Auto-sélectionner la première
        if (conversationsWithUnread.length > 0 && !selectedClientId) {
          selectConversation(conversationsWithUnread[0]);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  function selectConversation(conv: any) {
    setSelectedClientId(conv.client_id);
    setConversationId(conv.id);
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
      
      // Marquer comme lus
      const unreadIds = data
        .filter(m => !m.is_read && m.sender_type !== "expert")
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
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-expert-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          
          // Marquer comme lu si pas envoyé par moi
          if (newMsg.sender_type !== "expert") {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !expertId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const { data: expertMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: expertId,
          sender_type: "expert",
          content: content,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, expertMsg]);

      await supabase
        .from("conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          last_expert_response_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      // Rafraîchir la liste
      loadConversations();

      toast.success("Message envoyé");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const filteredConversations = conversations.filter((conv) =>
    `${conv.client.first_name} ${conv.client.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find((c) => c.client_id === selectedClientId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* SIDEBAR - Liste clients */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            💬 Mes Clients ({conversations.length})
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Aucun client</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full p-4 border-b border-gray-100 text-left transition-colors ${
                  selectedClientId === conv.client_id
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600">
                    <AvatarFallback className="text-white font-bold text-sm">
                      {conv.client.first_name.charAt(0)}
                      {conv.client.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {conv.client.first_name} {conv.client.last_name}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(conv.last_message_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ZONE MESSAGES */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600">
                  <AvatarFallback className="text-white font-bold">
                    {selectedConv.client.first_name.charAt(0)}
                    {selectedConv.client.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selectedConv.client.first_name} {selectedConv.client.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedConv.client.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle size={64} className="mb-4 opacity-20" />
                  <p>Aucun message</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isExpert = msg.sender_type === "expert";
                  const isAI = msg.sender_type === "ai";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isExpert ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-3 ${
                          isExpert
                            ? "bg-blue-600 text-white"
                            : isAI
                            ? "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 text-gray-900"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        {isAI && (
                          <p className="text-xs text-purple-600 font-semibold mb-1">
                            🤖 Assistant IA
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isExpert ? "text-blue-100" : "text-gray-400"
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
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
              <p>Sélectionnez un client pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}