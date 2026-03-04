"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Hash, Loader2, Search } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversation {
  id: string;
  name: string;
  type: string;
  members?: any[];
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  users: {
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
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
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
      console.log("🔍 Loading conversations for user:", currentUserId);

      const { data: memberData, error: memberError } = await supabase
        .from("staff_conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (memberError) {
        console.error("❌ Error loading members:", memberError);
        return;
      }

      console.log("📋 Member data:", memberData);

      if (!memberData || memberData.length === 0) {
        console.log("⚠️ No conversations found");
        setConversations([]);
        return;
      }

      const conversationIds = memberData.map(m => m.conversation_id);
      console.log("🆔 Conversation IDs:", conversationIds);

      const { data: convData, error: convError } = await supabase
        .from("staff_conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) {
        console.error("❌ Error loading conversations:", convError);
        return;
      }

      console.log("💬 Conversations:", convData);

      if (convData) {
        const enrichedConvs = await Promise.all(
          convData.map(async (conv) => {
            const { data: members } = await supabase
              .from("staff_conversation_members")
              .select("user_id, users(first_name, last_name, role)")
              .eq("conversation_id", conv.id);

            return { ...conv, members };
          })
        );

        console.log("✅ Enriched conversations:", enrichedConvs);
        setConversations(enrichedConvs);

        const general = enrichedConvs.find(c => c.name === '#general');
        if (general && !selectedConv) {
          setSelectedConv(general);
        } else if (enrichedConvs.length > 0 && !selectedConv) {
          setSelectedConv(enrichedConvs[0]);
        }
      }
    } catch (error) {
      console.error("❌ Error in loadConversations:", error);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      console.log("📨 Loading messages for:", conversationId);

      const { data, error } = await supabase
        .from("staff_messages")
        .select("*, users(first_name, last_name, role)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Error loading messages:", error);
        return;
      }

      console.log("✅ Messages loaded:", data?.length);
      if (data) {
        setMessages(data as any);
      }
    } catch (error) {
      console.error("❌ Error in loadMessages:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv || !currentUserId) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from("staff_messages")
        .insert({
          conversation_id: selectedConv.id,
          user_id: currentUserId,
          content: newMessage.trim(),
          is_read: false,
        });

      if (error) throw error;

      await supabase
        .from("staff_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConv.id);

      setNewMessage("");
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSending(false);
    }
  }

  function subscribeToMessages(conversationId: string) {
    const channel = supabase
      .channel(`staff_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name, role")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            users: userData,
          };

          setMessages((prev) => [...prev, newMsg as any]);
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
    if (conv.type === 'channel') {
      return conv.name;
    }
    const otherMembers = conv.members?.filter((m: any) => m.user_id !== currentUserId);
    if (otherMembers && otherMembers.length > 0) {
      return otherMembers.map((m: any) => 
        `${m.users.first_name} ${m.users.last_name}`
      ).join(', ');
    }
    return conv.name;
  }

  function getRoleColor(role: string) {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-700",
      HOS: "bg-purple-100 text-purple-700",
      CLOSER: "bg-blue-100 text-blue-700",
      SETTER: "bg-cyan-100 text-cyan-700",
      EXPERT: "bg-emerald-100 text-emerald-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  }

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <MessageSquare className="text-orange-500" />
            Messagerie Équipe
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-2">Ouvre la console (F12) pour voir les logs</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedConv?.id === conv.id
                    ? "bg-orange-50 border-l-4 border-l-orange-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {conv.type === 'channel' ? (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Hash size={20} className="text-orange-600" />
                    </div>
                  ) : (
                    <Avatar className="w-10 h-10 bg-blue-600">
                      <AvatarFallback className="text-white font-bold">
                        {getConversationName(conv).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {getConversationName(conv)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conv.members?.length || 0} membres
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 bg-white border-b">
              <div className="flex items-center gap-3">
                {selectedConv.type === 'channel' ? (
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                ) : (
                  <Avatar className="w-10 h-10 bg-blue-600">
                    <AvatarFallback className="text-white font-bold">
                      {getConversationName(selectedConv).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h3 className="font-bold">{getConversationName(selectedConv)}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedConv.members?.length || 0} membres
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>Aucun message pour l'instant</p>
                  <p className="text-sm mt-2">Soyez le premier à écrire !</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === currentUserId;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600">
                        <AvatarFallback className="text-white font-bold">
                          {msg.users.first_name.charAt(0)}
                          {msg.users.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 ${isMe ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!isMe && (
                            <>
                              <span className="font-semibold text-sm">
                                {msg.users.first_name} {msg.users.last_name}
                              </span>
                              <Badge className={`${getRoleColor(msg.users.role)} text-xs`}>
                                {msg.users.role}
                              </Badge>
                            </>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${
                            isMe
                              ? "bg-orange-500 text-white"
                              : "bg-white border text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
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
                  className="bg-orange-500 hover:bg-orange-600"
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
          <div className="flex-1 flex items-center justify-center text-gray-400">
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