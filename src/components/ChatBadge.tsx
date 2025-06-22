import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaComment } from "react-icons/fa";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

export const ChatBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Get all conversations this user is part of with their unread counts
        const { data: userConvos, error: userConvosError } = await supabase
          .from("user_conversations")
          .select(
            `
            conversation_id,
            last_read,
            conversations!inner (
              id,
              updated_at
            )
          `
          )
          .eq("user_id", user.id);

        if (userConvosError) throw userConvosError;

        if (!userConvos || userConvos.length === 0) {
          setUnreadCount(0);
          setIsLoading(false);
          return;
        }

        // Calculate total unread messages efficiently
        let totalUnread = 0;

        const unreadPromises = userConvos.map((convo) =>
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", convo.conversation_id)
            .neq("sender_id", user.id)
            .gt("created_at", convo.last_read || "1970-01-01")
        );

        const results = await Promise.all(unreadPromises);

        results.forEach(({ count }) => {
          if (count) totalUnread += count;
        });

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Error fetching unread message count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up subscription for new messages
    const messageSubscription = supabase
      .channel("chat_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id.neq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Also listen for conversation updates (when messages are read)
    const conversationSubscription = supabase
      .channel("conversation_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(conversationSubscription);
    };
  }, [user]);

  return (
    <Link
      to="/chat"
      className="relative p-2 text-violet-700 hover:bg-violet-50 rounded-full transition-colors"
      aria-label={`Chat messages${
        unreadCount > 0 ? ` (${unreadCount} unread)` : ""
      }`}
    >
      <FaComment
        className={`text-xl ${unreadCount > 0 ? "text-violet-600" : ""}`}
      />
      {!isLoading && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
};
