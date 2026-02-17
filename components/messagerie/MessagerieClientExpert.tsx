'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Send, User, Loader2, MessageCircle } from 'lucide-react';

interface MessagerieClientExpertProps {
  userId: string;
  userName: string;
  userRole: 'client' | 'expert';
  expertId?: string; // Pour le client : ID de son expert assigné
  clientId?: string; // Pour l'expert : ID du client sélectionné
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

interface ClientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function MessagerieClientExpert({
  userId,
  userName,
  userRole,
  expertId,
  clientId,
}: MessagerieClientExpertProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myClients, setMyClients] = useState<ClientInfo[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(clientId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (userRole === 'expert') {
      loadMyClients();
    } else {
      setActiveClientId(null); // Pour client, pas besoin de sélection
      loadMessages();
    }
  }, [userRole]);

  useEffect(() => {
    if (activeClientId || userRole === 'client') {
      loadMessages();
      subscribeToMessages();
    }
    return () => {
      supabase.removeAllChannels();
    };
  }, [activeClientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMyClients() {
    // Charger la liste des clients de cet expert
    const { data } = await supabase
      .from('clients')
      .select('id, user_id, users!inner(first_name, last_name, email)')
      .eq('expert_id', userId);

    if (data) {
      const clientsList = data.map((c: any) => ({
        id: c.user_id,
        first_name: c.users.first_name,
        last_name: c.users.last_name,
        email: c.users.email,
      }));
      
      setMyClients(clientsList);
      if (clientsList.length > 0 && !activeClientId) {
        setActiveClientId(clientsList[0].id);
      }
    }
    
    setLoading(false);
  }

  async function loadMessages() {
    const conversationUserId = userRole === 'client' ? expertId : activeClientId;
    
    if (!conversationUserId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('expert_client_messages')
      .select(`*, sender:users!expert_client_messages_sender_id_fkey(first_name, last_name)`)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},receiver_id.eq.${userId})`)
      .order('created_at');

    setMessages(data || []);
    setLoading(false);
  }

  function subscribeToMessages() {
    const conversationUserId = userRole === 'client' ? expertId : activeClientId;
    
    if (!conversationUserId) return;

    supabase
      .channel(`messages:${userId}:${conversationUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expert_client_messages',
        },
        async (payload) => {
          // Vérifier que le message concerne cette conversation
          const msg = payload.new;
          if (
            (msg.sender_id === userId && msg.receiver_id === conversationUserId) ||
            (msg.sender_id === conversationUserId && msg.receiver_id === userId)
          ) {
            const { data: sender } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();

            setMessages((prev) => [...prev, { ...msg, sender } as Message]);
          }
        }
      )
      .subscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const receiverId = userRole === 'client' ? expertId : activeClientId;
    
    if (!receiverId) return;

    setSending(true);

    await supabase.from('expert_client_messages').insert([
      {
        sender_id: userId,
        receiver_id: receiverId,
        content: inputMessage.trim(),
      },
    ]);

    setInputMessage('');
    setSending(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (userRole === 'expert' && myClients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <MessageCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 font-medium">Aucun client assigné</p>
        </div>
      </div>
    );
  }

  const activeClient = myClients.find((c) => c.id === activeClientId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Liste des clients (pour expert seulement) */}
      {userRole === 'expert' && (
        <div className="w-64 bg-white border-r p-4 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mes Clients</h2>
          
          <div className="space-y-2 flex-1 overflow-y-auto">
            {myClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setActiveClientId(client.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                  activeClientId === client.id
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {client.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs opacity-70 truncate">{client.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
              {userRole === 'client' ? 'E' : activeClient?.first_name.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {userRole === 'client' ? 'Mon Expert' : `${activeClient?.first_name} ${activeClient?.last_name}`}
              </h3>
              <p className="text-sm text-gray-500">Conversation privée</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isOwnMessage = msg.sender_id === userId;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%]`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {msg.sender?.first_name} {msg.sender?.last_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isOwnMessage
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>

                  {isOwnMessage && (
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}