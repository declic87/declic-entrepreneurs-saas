'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { useState } from 'react';

export default function MessagesPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#123055] mb-8">Messagerie</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Liste conversations */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h3 className="font-bold text-[#123055] mb-4">Conversations</h3>

            <div className="space-y-2">
              <button className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} />
                  <span className="font-semibold text-sm">Expert fiscal</span>
                </div>
                <p className="text-xs text-slate-600 truncate">Votre dernier message...</p>
              </button>

              <button className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={16} />
                  <span className="font-semibold text-sm">Assistant IA</span>
                </div>
                <p className="text-xs text-slate-600 truncate">Questions rapides</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Zone de chat */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 pb-4 border-b mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <p className="font-bold text-[#123055]">Expert fiscal</p>
                <p className="text-xs text-green-600">En ligne</p>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto mb-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  E
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 max-w-md">
                  <p className="text-sm">Bonjour ! Je suis disponible pour répondre à vos questions.</p>
                  <span className="text-xs text-slate-500 mt-2 block">10:30</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-amber-500 text-white rounded-2xl rounded-tr-none p-4 max-w-md">
                  <p className="text-sm">Bonjour, j'ai une question sur le choix SASU/EURL</p>
                  <span className="text-xs text-amber-100 mt-2 block">10:32</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Écrivez votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Send size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}