"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, Send, Hash, User, Users, Plus, Loader2, Search
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversation {
  id: string;
  conversation_type: "dm" | "group";
  name: string;
  last_message_at: string;
  participant_1_id?: string;
  participant_2_id?: string;
  unread_count?: number;
  other_user?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export default function TeamMessagesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      subscribeToConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      markAsRead(selectedConv.id);
      subscribeToMessages(selectedConv.id);
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        if (userData) {
          setCurrentUserId(userData.id);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations() {
    try {
      // Charger les conversations où l'utilisateur est participant
      const { data: participantData } = await supabase
        .from("team_conversation_participants")
        .select("team_conversation_id")
        .eq("user_id", currentUserId);

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map(p => p.team_conversation_id);

      // Charger les détails des conversations
      const { data: convData } = await supabase
        .from("team_conversations")
        .select("*")
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false });

      if (convData) {
        // Pour les DM, charger les infos de l'autre utilisateur
        const enrichedConvs = await Promise.all(
          convData.map(async (conv) => {
            if (conv.conversation_type === "dm") {
              const otherUserId = 
                conv.participant_1_id === currentUserId 
                  ? conv.participant_2_id 
                  : conv.participant_1_id;

              const { data: otherUser } = await supabase
                .from("users")
                .select("first_name, last_name, role")
                .eq("id", otherUserId)
                .single();

              return { ...conv, other_user: otherUser };
            }
            return conv;
          })
        );

        // Charger le nombre de messages non lus par conversation
        const convsWithUnread = await Promise.all(
          enrichedConvs.map(async (conv) => {
            const { count } = await supabase
              .from("team_messages")
              .select("*", { count: "exact", head: true })
              .eq("team_conversation_id", conv.id)
              .eq("is_read", false)
              .neq("sender_id", currentUserId);

            return { ...conv, unread_count: count || 0 };
          })
        );

        setConversations(convsWithUnread);

        // Auto-sélectionner la première conversation
        if (convsWithUnread.length > 0 && !selectedConv) {
          setSelectedConv(convsWithUnread[0]);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const { data } = await supabase
        .from("team_messages")
        .select(`
          *,
          sender:sender_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq("team_conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data as any);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function markAsRead(conversationId: string) {
    try {
      await supabase
        .from("team_messages")
        .update({ is_read: true })
        .eq("team_conversation_id", conversationId)
        .neq("sender_id", currentUserId);

      // Recharger les conversations pour mettre à jour les badges
      loadConversations();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv || !currentUserId) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from("team_messages")
        .insert({
          team_conversation_id: selectedConv.id,
          sender_id: currentUserId,
          content: newMessage.trim(),
          is_read: false,
        });

      if (error) throw error;

      // Mettre à jour last_message_at
      await supabase
        .from("team_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConv.id);

      setNewMessage("");
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSending(false);
    }
  }

  function subscribeToConversations() {
    const channel = supabase
      .channel("team_conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_conversations",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function subscribeToMessages(conversationId: string) {
    const channel = supabase
      .channel(`team_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Charger le sender
          const { data: senderData } = await supabase
            .from("users")
            .select("first_name, last_name, role")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            sender: senderData,
          };

          setMessages((prev) => [...prev, newMsg as any]);

          // Marquer comme lu si c'est la conversation active
          if (payload.new.sender_id !== currentUserId) {
            markAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function getConversationName(conv: Conversation) {
    if (conv.conversation_type === "group") {
      return conv.name;
    }
    if (conv.other_user) {
      return `${conv.other_user.first_name} ${conv.other_user.last_name}`;
    }
    return "Conversation";
  }

  function getConversationIcon(conv: Conversation) {
    if (conv.conversation_type === "group") {
      return <Hash size={18} className="text-amber-500" />;
    }
    return (
      <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600">
        <AvatarFallback className="text-white text-xs font-bold">
          {conv.other_user?.first_name?.charAt(0) || "U"}
          {conv.other_user?.last_name?.charAt(0) || ""}
        </AvatarFallback>
      </Avatar>
    );
  }

  function getRoleColor(role: string) {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-700",
      HOS: "bg-purple-100 text-purple-700",
      COMMERCIAL: "bg-blue-100 text-blue-700",
      CLOSER: "bg-blue-100 text-blue-700",
      SETTER: "bg-green-100 text-green-700",
      EXPERT: "bg-orange-100 text-orange-700",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  }

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Header sidebar */}
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MessageSquare className="text-amber-500" />
            Messagerie Équipe
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                  selectedConv?.id === conv.id
                    ? "bg-amber-50 border-l-4 border-l-amber-500"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getConversationIcon(conv)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {getConversationName(conv)}
                      </p>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conv.other_user && (
                      <Badge className={`${getRoleColor(conv.other_user.role)} text-xs`}>
                        {conv.other_user.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header conversation */}
            <div className="p-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                {getConversationIcon(selectedConv)}
                <div>
                  <h3 className="font-bold text-slate-900">
                    {getConversationName(selectedConv)}
                  </h3>
                  {selectedConv.conversation_type === "group" && (
                    <p className="text-xs text-slate-500">
                      Canal d'équipe
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Liste messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600">
                      <AvatarFallback className="text-white font-bold">
                        {msg.sender.first_name.charAt(0)}
                        {msg.sender.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${isMe ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isMe && (
                          <>
                            <span className="font-semibold text-sm text-slate-900">
                              {msg.sender.first_name} {msg.sender.last_name}
                            </span>
                            <Badge className={`${getRoleColor(msg.sender.role)} text-xs`}>
                              {msg.sender.role}
                            </Badge>
                          </>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          isMe
                            ? "bg-amber-500 text-white"
                            : "bg-white border border-slate-200 text-slate-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}