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
    console.log("🔔 useUnreadMessages - UserId:", userId);
    
    if (!userId) {
      console.log("❌ Pas de userId, skip");
      return;
    }

    loadUnreadCount();
    subscribeToMessages();

    return () => {
      supabase.removeAllChannels();
    };
  }, [userId]);

  async function loadUnreadCount() {
    if (!userId) return;

    try {
      console.log("📊 Chargement des messages non lus pour userId:", userId);

      // 1. Conversations où l'user est client
      const { data: clientConvs, error: clientError } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", userId);

      console.log("👤 Conversations client:", clientConvs);

      // 2. Conversations où l'user est expert
      const { data: expertConvs, error: expertError } = await supabase
        .from("conversations")
        .select("id")
        .eq("expert_id", userId);

      console.log("👨‍💼 Conversations expert:", expertConvs);

      const clientConvIds = clientConvs?.map((c) => c.id) || [];
      const expertConvIds = expertConvs?.map((c) => c.id) || [];
      const allConvIds = [...clientConvIds, ...expertConvIds];

      console.log("📝 Toutes les conversations IDs:", allConvIds);

      let totalUnread = 0;

      if (allConvIds.length > 0) {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", allConvIds)
          .eq("is_read", false)
          .neq("sender_id", userId);

        console.log("📬 Messages non lus trouvés:", count);
        console.log("❌ Erreur?", error);

        totalUnread = count || 0;
      }

      console.log("✅ Total messages non lus:", totalUnread);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
    }
  }

  function subscribeToMessages() {
    if (!userId) return;

    console.log("🔔 Abonnement temps réel activé");

    supabase
      .channel("unread-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🆕 Nouveau message:", payload);
          if (payload.new.sender_id !== userId) {
            setUnreadCount((prev) => {
              console.log("➕ Incrémentation:", prev, "→", prev + 1);
              return prev + 1;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🔄 Message mis à jour:", payload);
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => {
              console.log("➖ Décrémentation:", prev, "→", Math.max(0, prev - 1));
              return Math.max(0, prev - 1);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Statut subscription:", status);
      });
  }

  console.log("🎯 Hook retourne unreadCount:", unreadCount);
  return { unreadCount };
}