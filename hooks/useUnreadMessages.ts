"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!userId) return;

    loadUnreadCount();
    subscribeToMessages();

    return () => {
      supabase.removeAllChannels();
    };
  }, [userId]);

  async function loadUnreadCount() {
    if (!userId) return;

    // Compter les messages non lus pour cet utilisateur
    // 1. Messages dans les conversations où l'utilisateur est client
    const { data: clientConvs } = await supabase
      .from("conversations")
      .select("id")
      .eq("client_id", userId);

    const clientConvIds = clientConvs?.map((c) => c.id) || [];

    // 2. Messages dans les conversations où l'utilisateur est expert
    const { data: expertConvs } = await supabase
      .from("conversations")
      .select("id")
      .eq("expert_id", userId);

    const expertConvIds = expertConvs?.map((c) => c.id) || [];

    const allConvIds = [...clientConvIds, ...expertConvIds];

    if (allConvIds.length === 0) {
      setUnreadCount(0);
      return;
    }

    // Compter les messages non lus dans ces conversations
    const { count: clientMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", allConvIds)
      .eq("is_read", false)
      .neq("sender_id", userId); // Ne pas compter ses propres messages

    // Compter les messages non lus dans les channels staff
    const { count: staffMessages } = await supabase
      .from("staff_messages")
      .select("*", { count: "exact", head: true })
      .neq("sender_id", userId)
      .gt("created_at", await getLastReadTime()); // Seulement les nouveaux

    const total = (clientMessages || 0) + (staffMessages || 0);
    setUnreadCount(total);
  }

  function subscribeToMessages() {
    if (!userId) return;

    // S'abonner aux nouveaux messages
    supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Si le message n'est pas de l'utilisateur, incrémenter
          if (payload.new.sender_id !== userId) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_messages",
        },
        (payload) => {
          // Si le message n'est pas de l'utilisateur, incrémenter
          if (payload.new.sender_id !== userId) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();
  }

  async function getLastReadTime() {
    // Récupérer la dernière connexion de l'utilisateur
    // Pour simplifier, on prend les messages des dernières 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  }

  async function markAllAsRead() {
    setUnreadCount(0);
  }

  return { unreadCount, markAllAsRead };
}