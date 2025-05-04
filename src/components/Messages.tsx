import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  related_post_id: number;
}

interface Conversation {
  otherUserId: string;
  otherUserEmail: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

const fetchMessages = async (userId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

const markAsRead = async (messageIds: number[]) => {
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .in("id", messageIds);

  if (error) throw new Error(error.message);
};

export const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: messages, isLoading } = useQuery<Message[], Error>({
    queryKey: ["messages", user?.id],
    queryFn: () => fetchMessages(user!.id),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedUser || !content.trim()) return;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUser,
        content: content.trim(),
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-10">
        Please log in to view your messages.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Process messages into conversations
  const conversations = messages?.reduce((acc: { [key: string]: Conversation }, message) => {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        otherUserId,
        otherUserEmail: "User " + otherUserId.slice(0, 8), // You might want to fetch actual user emails
        lastMessage: message.content,
        lastMessageDate: message.created_at,
        unreadCount: message.receiver_id === user.id && !message.read ? 1 : 0,
      };
    } else if (message.receiver_id === user.id && !message.read) {
      acc[otherUserId].unreadCount++;
    }

    return acc;
  }, {});

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  const conversationMessages = messages?.filter(
    (message) =>
      (message.sender_id === user.id && message.receiver_id === selectedUser) ||
      (message.receiver_id === user.id && message.sender_id === selectedUser)
  );

  // Mark messages as read when viewing them
  if (selectedUser && conversationMessages) {
    const unreadMessageIds = conversationMessages
      .filter((m) => m.receiver_id === user.id && !m.read)
      .map((m) => m.id);
    
    if (unreadMessageIds.length > 0) {
      markAsReadMutation.mutate(unreadMessageIds);
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Conversations List */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Conversations</h2>
        <div className="space-y-2">
          {Object.values(conversations || {}).map((conversation) => (
            <button
              key={conversation.otherUserId}
              onClick={() => setSelectedUser(conversation.otherUserId)}
              className={`w-full p-3 rounded-lg text-left transition ${
                selectedUser === conversation.otherUserId
                  ? "bg-purple-500"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-white">
                  {conversation.otherUserEmail}
                </span>
                {conversation.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-300 truncate">
                {conversation.lastMessage}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(conversation.lastMessageDate), "MMM d, h:mm a")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="col-span-2 bg-gray-900 rounded-lg p-4 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {conversationMessages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_id === user.id
                        ? "bg-purple-500 text-white"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}; 