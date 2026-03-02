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

    try {
      const { data: clientConvs } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", userId);

      const { data: expertConvs } = await supabase
        .from("conversations")
        .select("id")
        .eq("expert_id", userId);

      const clientConvIds = clientConvs?.map((c) => c.id) || [];
      const expertConvIds = expertConvs?.map((c) => c.id) || [];
      const allConvIds = [...clientConvIds, ...expertConvIds];

      let totalUnread = 0;

      if (allConvIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", allConvIds)
          .eq("is_read", false)
          .neq("sender_id", userId);

        totalUnread = count || 0;
      }

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error loading unread messages:", error);
    }
  }

  function subscribeToMessages() {
    if (!userId) return;

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
          if (payload.new.sender_id !== userId) {
            setUnreadCount((prev) => prev + 1);
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
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();
  }

  return { unreadCount };
}