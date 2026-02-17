'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Send, Hash, User, Loader2, Users } from 'lucide-react';

interface MessagerieStaffProps {
  role: string;
  userId: string;
  userName: string;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

interface Message {
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

// Canaux disponibles par rôle
const CHANNELS_BY_ROLE: Record<string, string[]> = {
  admin: ['général', 'closers', 'setters', 'experts', 'hos-team'],
  commercial: ['général', 'closers'],
  setter: ['général', 'setters'],
  hos: ['général', 'closers', 'setters', 'hos-team'],
  expert: ['général', 'experts'],
  client: [], // Les clients n'ont pas accès aux canaux staff
};

export default function MessagerieStaff({ role, userId, userName }: MessagerieStaffProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadChannels();
  }, [role]);

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

  async function loadChannels() {
    setLoading(true);
    
    const allowedChannels = CHANNELS_BY_ROLE[role.toLowerCase()] || [];
    
    if (allowedChannels.length === 0) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('staff_channels')
      .select('*')
      .in('name', allowedChannels)
      .order('name');

    setChannels(data || []);
    if (data && data.length > 0) setActiveChannel(data[0]);
    setLoading(false);
  }

  async function loadMessages() {
    if (!activeChannel) return;
    
    const { data } = await supabase
      .from('staff_messages')
      .select(`*, sender:users!staff_messages_sender_id_fkey(first_name, last_name)`)
      .eq('channel_id', activeChannel.id)
      .order('created_at');
    
    setMessages(data || []);
  }

  function subscribeToChannel() {
    if (!activeChannel) return;
    
    supabase
      .channel(`staff:${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', payload.new.sender_id)
            .single();
          
          setMessages((prev) => [...prev, { ...payload.new, sender } as Message]);
        }
      )
      .subscribe();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !userId || !activeChannel) return;
    
    setSending(true);
    
    await supabase.from('staff_messages').insert([
      {
        channel_id: activeChannel.id,
        sender_id: userId,
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

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 font-medium">Aucun canal disponible pour votre rôle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Liste des canaux */}
      <div className="w-64 bg-[#0F172A] text-white p-4 flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">💬 Messagerie</h2>
          <p className="text-xs text-slate-400">{userName}</p>
        </div>
        
        <div className="space-y-1 flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
                activeChannel?.id === channel.id
                  ? 'bg-orange-500 text-white'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <Hash size={16} />
              <span className="font-medium">{channel.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>En ligne</span>
          </div>
        </div>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {/* Header du canal */}
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Hash size={20} className="text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900">{activeChannel?.name}</h3>
          </div>
          {activeChannel?.description && (
            <p className="text-sm text-gray-500 mt-1">{activeChannel.description}</p>
          )}
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
                <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                        {msg.sender?.first_name?.charAt(0) || '?'}
                      </div>
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
              placeholder={`Message #${activeChannel?.name}...`}
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