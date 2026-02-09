"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useMessaging } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function ClientMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isAIMode, setIsAIMode] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { conversation, messages, loading, sending, sendMessage } = useMessaging(userId);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();

      if (userData) {
        setUserId(userData.id);
        setUserRole(userData.role);
      }
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !userId) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");

    try {
      if (isAIMode) {
        // Mode IA : appeler l'API chatbot
        setAiLoading(true);

        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageContent,
            userId,
            conversationHistory: messages
              .filter((m) => m.sender_type !== "expert")
              .map((m) => ({
                role: m.sender_type === "ai" ? "assistant" : "user",
                content: m.content,
              })),
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Le message utilisateur et la réponse IA sont déjà insérés côté API
        setAiLoading(false);
      } else {
        // Mode Expert : envoyer directement
        await sendMessage(messageContent, "client");
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
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
            Discutez avec notre IA ou contactez votre expert
          </p>
        </div>

        {/* Toggle IA / Expert */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setIsAIMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              isAIMode
                ? "bg-white text-amber-600 shadow-sm font-semibold"
                : "text-slate-600"
            }`}
          >
            <Bot size={18} />
            Assistant IA
          </button>
          <button
            onClick={() => setIsAIMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              !isAIMode
                ? "bg-white text-emerald-600 shadow-sm font-semibold"
                : "text-slate-600"
            }`}
          >
            <User size={18} />
            Expert
          </button>
        </div>
      </div>

      {/* Info Mode */}
      {isAIMode ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="text-amber-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-sm">
                Assistant IA disponible 24/7
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                Posez vos questions fiscales basiques. Pour des conseils
                personnalisés, passez en mode Expert.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-start gap-3">
            <MessageCircle className="text-emerald-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 text-sm">
                Contact direct avec un expert
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                Votre message sera traité par un expert sous 24h ouvrées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de messages */}
      <Card className="h-[500px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <MessageCircle size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold">Aucun message</p>
              <p className="text-sm">
                Démarrez la conversation en envoyant un message !
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_type === "client" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.sender_type === "client"
                      ? "bg-amber-500 text-white"
                      : msg.sender_type === "ai"
                      ? "bg-gradient-to-br from-purple-50 to-blue-50 text-slate-900 border border-purple-200"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {/* Badge type */}
                  {msg.sender_type === "ai" && (
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
                      msg.sender_type === "client"
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

          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="animate-spin text-purple-600" size={16} />
                <span className="text-sm text-slate-700">
                  L&apos;IA réfléchit...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isAIMode
                  ? "Posez votre question à l'IA..."
                  : "Écrivez votre message..."
              }
              className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 outline-none"
              disabled={sending || aiLoading}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || sending || aiLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6"
            >
              {sending || aiLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Suggestions IA */}
      {isAIMode && messages.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          {[
            "Quelle est la différence entre SASU et EURL ?",
            "Comment optimiser mes IK ?",
            "Dividendes ou rémunération ?",
            "Comment fonctionne la TVA ?",
          ].map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setInputMessage(suggestion)}
              className="text-left p-4 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-amber-50 hover:to-orange-50 border border-slate-200 hover:border-amber-300 rounded-xl text-sm transition-all"
            >
              💡 {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}