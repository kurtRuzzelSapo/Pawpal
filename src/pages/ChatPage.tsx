import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { FaPaperPlane, FaUserCircle, FaPaw, FaArrowLeft } from "react-icons/fa";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Interface for chat messages
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
  sender_avatar?: string | null;
}

// Interface for conversation participants
interface Conversation {
  conversation_id: string;
  title: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string | null;
  last_message_sender?: string | null;
  other_user_id?: string | null;
  other_user_name?: string;
  other_user_avatar?: string | null;
  unread_count: number;
  pet_name?: string;
  post_id?: number | null;
  adopter_name?: string;
  owner_name?: string;
}

const ChatPage: React.FC = () => {
  // Get the conversation ID from URL params, or null if on main chat page
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State for messages, conversations, and new message input
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingConversation, setIsCreatingConversation] =
    useState<boolean>(false);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  } | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);
  const [hasRunCleanup, setHasRunCleanup] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check if we have an otherUserId from navigation state
  useEffect(() => {
    if (user) {
      // Create or ensure user profile exists
      const createUserProfile = async () => {
        // Check if profile exists
        const { error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (error) {
          // Profile doesn't exist, create one
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.email || `User ${user.id.substring(0, 6)}`,
            updated_at: new Date().toISOString(),
          });
        }
      };

      createUserProfile();

      // If we have an otherUserId in the location state, start a conversation with them
      if (location.state?.otherUserId) {
        startConversation(location.state.otherUserId);

        // Clear the state so we don't keep starting the same conversation
        navigate("/chat", { replace: true });
      }
    }
  }, [user, location.state]);

  // Setup scheduled cleanup when the component mounts
  useEffect(() => {
    if (!user) return;

    // Run initial cleanup silently when component mounts
    if (!hasRunCleanup) {
      // Small delay to not block initial render
      const initialCleanupTimeout = setTimeout(() => {
        cleanupDuplicateConversations(true);
        setHasRunCleanup(true);
      }, 3000);

      return () => clearTimeout(initialCleanupTimeout);
    }

    // Run periodic cleanup every 30 minutes while the chat page is open
    const cleanupInterval = setInterval(() => {
      // Only run if we're on the main chat page (not in a specific conversation)
      if (!conversationId) {
        console.log("Running scheduled cleanup check");
        cleanupDuplicateConversations(true);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(cleanupInterval);
  }, [user, conversationId, hasRunCleanup]);

  // Handle real-time subscription
  useEffect(() => {
    if (!user) return;

    // Always fetch conversations for the sidebar (show loading spinner on mount)
    fetchConversations(true);

    // Subscribe to conversation changes for the sidebar (no spinner on real-time updates)
    const sidebarSubscription = supabase
      .channel("conversation_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => fetchConversations(false)
      )
      .subscribe();

    // Subscribe to user_conversations updates for the sidebar (no spinner on real-time updates)
    const userConvoSubscription = supabase
      .channel("user_conversations_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchConversations(false)
      )
      .subscribe();

    // If in a specific conversation, also fetch messages and subscribe
    let messageSubscription: ReturnType<typeof supabase.channel> | undefined;
    if (conversationId) {
      fetchMessages();
      markMessagesAsRead();

      messageSubscription = supabase
        .channel(`room:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const newMessage = payload.new as Message;
            // Format the new message with sender info
            const formattedMessage = { ...newMessage };
            if (newMessage.sender_id === user.id) {
              formattedMessage.sender_name = "You";
              formattedMessage.sender_avatar = null;
            } else {
              const senderInfo = await getUserInfo(newMessage.sender_id);
              formattedMessage.sender_name = senderInfo.name;
              formattedMessage.sender_avatar = senderInfo.avatar;
            }
            setMessages((prevMessages) => [...prevMessages, formattedMessage]);
            // If this is not our message, mark it as read
            if (newMessage.sender_id !== user.id) {
              markMessagesAsRead();
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(sidebarSubscription);
      supabase.removeChannel(userConvoSubscription);
      if (messageSubscription) supabase.removeChannel(messageSubscription);
    };
  }, [user, conversationId, hasRunCleanup]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation details
  useEffect(() => {
    if (conversationId && user) {
      fetchConversationDetails();
    }
  }, [conversationId, user]);

  // Mark messages as read when viewing a conversation
  const markMessagesAsRead = async () => {
    if (!user || !conversationId) return;

    try {
      // Call the database function to mark messages as read
      await supabase.rpc("mark_messages_as_read", {
        conv_id: conversationId,
        user_uuid: user.id,
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Function to get user information with pet name focus
  const getUserInfo = async (userId: string) => {
    if (!userId) return { name: "Unknown", email: "", avatar: null };

    try {
      console.log(`Getting pet info for user ID: ${userId}`);

      // First try to check if this is an adoption conversation
      // Check if the current user has any approved adoption requests with this user
      if (user) {
        // Check for approved adoption requests where current user is requester and other user is owner
        const { data: adoptionData, error: adoptionError } = await supabase
          .from("adoption_requests")
          .select("pet_name, post_id")
          .eq("requester_id", user.id)
          .eq("owner_id", userId)
          .eq("status", "approved")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (
          !adoptionError &&
          adoptionData &&
          adoptionData.length > 0 &&
          adoptionData[0].pet_name
        ) {
          console.log(`Found adopted pet name: ${adoptionData[0].pet_name}`);
          return {
            name: adoptionData[0].pet_name,
            email: "",
            avatar: null,
          };
        }

        // Or check if other user is requester and current user is owner
        const { data: adoptionData2, error: adoptionError2 } = await supabase
          .from("adoption_requests")
          .select("pet_name, post_id")
          .eq("owner_id", user.id)
          .eq("requester_id", userId)
          .eq("status", "approved")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (
          !adoptionError2 &&
          adoptionData2 &&
          adoptionData2.length > 0 &&
          adoptionData2[0].pet_name
        ) {
          console.log(`Found adopted pet name: ${adoptionData2[0].pet_name}`);
          return {
            name: adoptionData2[0].pet_name,
            email: "",
            avatar: null,
          };
        }

        // If no approved adoption requests found, check for pending ones as well
        const { data: pendingData, error: pendingError } = await supabase
          .from("adoption_requests")
          .select("pet_name, post_id")
          .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
          .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (
          !pendingError &&
          pendingData &&
          pendingData.length > 0 &&
          pendingData[0].pet_name
        ) {
          console.log(
            `Found pending pet adoption name: ${pendingData[0].pet_name}`
          );
          return {
            name: pendingData[0].pet_name,
            email: "",
            avatar: null,
          };
        }
      }

      // First try to get pet name directly from posts table
      const { data: petData, error: petError } = await supabase
        .from("post")
        .select("name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!petError && petData && petData.length > 0 && petData[0].name) {
        console.log(`Found pet name from post table: ${petData[0].name}`);
        return {
          name: petData[0].name,
          email: "",
          avatar: null,
        };
      }

      // If no pet found with user_id, try with auth_users_id field
      const { data: petData2, error: petError2 } = await supabase
        .from("post")
        .select("name")
        .eq("auth_users_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!petError2 && petData2 && petData2.length > 0 && petData2[0].name) {
        console.log(`Found pet name using auth_users_id: ${petData2[0].name}`);
        return {
          name: petData2[0].name,
          email: "",
          avatar: null,
        };
      }

      // Fallback to email via the original function
      const { data: emailData, error: emailError } = await supabase.rpc(
        "get_user_email",
        { user_id: userId }
      );

      if (!emailError && emailData && emailData.email) {
        return {
          name: emailData.email,
          email: emailData.email,
          avatar: null,
        };
      }

      // Final fallback - use user ID
      return {
        name: `User ${userId.substring(0, 6)}`,
        email: "",
        avatar: null,
      };
    } catch (error) {
      console.error("Error getting user info:", error);
      return {
        name: `User ${userId.substring(0, 6)}`,
        email: "",
        avatar: null,
      };
    }
  };

  // Fetch conversation messages with email focus
  const fetchMessages = async () => {
    if (!user || !conversationId) return;

    try {
      setIsLoading(true);

      // First verify the conversation still exists
      const { error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .single();

      if (checkError) {
        // Only redirect if it's actually not found (code PGRST116)
        if (checkError.code === "PGRST116") {
          toast.error(
            "This conversation no longer exists. You will be redirected.",
            {
              id: "conversation-not-found",
              duration: 5000,
            }
          );

          // Wait a moment before redirecting
          setTimeout(() => {
            navigate("/chat");
          }, 2000);

          setIsLoading(false);
          return;
        }
        // For other errors, we can still try to load messages
      }

      // Check if we have the conversation data with pet name
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select("pet_name, title")
          .eq("id", conversationId)
          .single();

      // Get a pet name to use for messages
      let petName = null;
      if (!conversationError && conversationData && conversationData.pet_name) {
        petName = conversationData.pet_name;
      }

      // Get messages for this conversation
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          is_read
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        // Special handling for foreign key violation (conversation doesn't exist)
        if (error.code === "23503") {
          toast.error(
            "Unable to load messages. The conversation may have been deleted."
          );
          setTimeout(() => {
            navigate("/chat");
          }, 2000);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      // If we don't have a pet name from the conversation table, try looking it up
      if (!petName) {
        // Check if we have an adoption conversation
        let adoptedPetName = null;

        // Get the other user in this conversation
        const { data: members, error: membersError } = await supabase
          .from("user_conversations")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .neq("user_id", user.id);

        if (!membersError && members && members.length > 0) {
          const otherUserId = members[0].user_id;

          // Check for adoption requests between these users
          const { data: adoptionData, error: adoptionError } = await supabase
            .from("adoption_requests")
            .select("pet_name, post_id, status")
            .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
            .or(`requester_id.eq.${otherUserId},owner_id.eq.${otherUserId}`)
            .order("updated_at", { ascending: false })
            .limit(1);

          if (
            !adoptionError &&
            adoptionData &&
            adoptionData.length > 0 &&
            adoptionData[0].pet_name
          ) {
            // Found an adoption request with pet name
            adoptedPetName = adoptionData[0].pet_name;
            petName = adoptedPetName;

            // Update the conversation for future use
            await supabase
              .from("conversations")
              .update({
                pet_name: adoptedPetName,
                title: adoptedPetName,
              })
              .eq("id", conversationId);
          }
        }
      }

      // Format messages with sender info
      const formattedMessages = await Promise.all(
        data.map(async (msg: Message) => {
          // Your own messages
          if (msg.sender_id === user.id) {
            return {
              id: msg.id,
              conversation_id: msg.conversation_id,
              sender_id: msg.sender_id,
              content: msg.content,
              created_at: msg.created_at,
              is_read: msg.is_read,
              sender_name: "You",
              sender_avatar: null,
            };
          }

          // If we have a pet name, use it for the other person's messages
          if (petName) {
            return {
              id: msg.id,
              conversation_id: msg.conversation_id,
              sender_id: msg.sender_id,
              content: msg.content,
              created_at: msg.created_at,
              is_read: msg.is_read,
              sender_name: petName,
              sender_avatar: null,
            };
          }

          // Otherwise get the other user's info
          const senderInfo = await getUserInfo(msg.sender_id);

          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            is_read: msg.is_read,
            sender_name: senderInfo.name,
            sender_avatar: senderInfo.avatar,
          };
        })
      );

      setMessages(formattedMessages);
    } catch (error: unknown) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch conversation details to show the other user's info
  const fetchConversationDetails = async () => {
    if (!conversationId || !user) return;

    try {
      // First check if the conversation still exists
      const { error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .single();

      if (checkError) {
        // Only redirect for not found errors
        if (checkError.code === "PGRST116") {
          toast.error(
            "This conversation no longer exists. You will be redirected.",
            {
              id: "conversation-not-found",
              duration: 5000,
            }
          );

          // Wait a moment before redirecting
          setTimeout(() => {
            navigate("/chat");
          }, 2000);

          return;
        }
        // For other errors, continue trying
      }

      // First get the conversation itself
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

      if (conversationError) {
        // Special handling for not found
        if (conversationError.code === "PGRST116") {
          toast.error(
            "This conversation no longer exists. You will be redirected."
          );
          setTimeout(() => {
            navigate("/chat");
          }, 2000);
          return;
        }
        throw conversationError;
      }

      // Store the conversation data in state
      setConversationData(conversationData);

      // If we have pet_name directly in the conversation, use it
      if (conversationData.pet_name) {
        // We can set the other user info directly from conversation data
        setOtherUser({
          id: "", // We don't need this for display
          name: conversationData.pet_name,
          email: "",
          avatar: null,
        });

        // Update chat title in the document
        document.title = `Chat with ${conversationData.pet_name}`;
        return;
      }

      // Get the other user in this conversation
      const { data: members, error: membersError } = await supabase
        .from("user_conversations")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (membersError) throw membersError;

      if (members && members.length > 0) {
        const otherUserId = members[0].user_id;

        // Check for adoption requests between these users
        const { data: adoptionData, error: adoptionError } = await supabase
          .from("adoption_requests")
          .select("pet_name, post_id, status")
          .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
          .or(`requester_id.eq.${otherUserId},owner_id.eq.${otherUserId}`)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (
          !adoptionError &&
          adoptionData &&
          adoptionData.length > 0 &&
          adoptionData[0].pet_name
        ) {
          // Found an adoption request with pet name
          const userInfo = {
            name: adoptionData[0].pet_name,
            email: "",
            avatar: null,
          };

          setOtherUser({
            id: otherUserId,
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.avatar,
          });

          // Update chat title in the document
          document.title = `Chat with ${userInfo.name}`;

          // Store this info in the conversation for future use
          await supabase
            .from("conversations")
            .update({
              pet_name: adoptionData[0].pet_name,
              post_id: adoptionData[0].post_id,
            })
            .eq("id", conversationId);

          return;
        }

        // If no adoption request found, continue with existing logic
        // Get pet info directly from post table
        const { data: petData, error: petError } = await supabase
          .from("post")
          .select("name, id")
          .eq("user_id", otherUserId)
          .order("created_at", { ascending: false })
          .limit(1);

        let userInfo;

        if (!petError && petData && petData.length > 0 && petData[0].name) {
          // We have a pet name from the post table
          userInfo = {
            name: petData[0].name,
            email: "",
            avatar: null,
          };

          // Update the conversation with the pet info
          await supabase
            .from("conversations")
            .update({
              pet_name: petData[0].name,
              post_id: petData[0].id,
              title: petData[0].name,
            })
            .eq("id", conversationId);

          // Update the chat title in the document
          document.title = `Chat with ${petData[0].name}`;
        } else {
          // Try with auth_users_id
          const { data: petData2, error: petError2 } = await supabase
            .from("post")
            .select("name, id")
            .eq("auth_users_id", otherUserId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (
            !petError2 &&
            petData2 &&
            petData2.length > 0 &&
            petData2[0].name
          ) {
            userInfo = {
              name: petData2[0].name,
              email: "",
              avatar: null,
            };

            // Update the conversation with the pet info
            await supabase
              .from("conversations")
              .update({
                pet_name: petData2[0].name,
                post_id: petData2[0].id,
                title: petData2[0].name,
              })
              .eq("id", conversationId);

            // Update the chat title in the document
            document.title = `Chat with ${petData2[0].name}`;
          } else {
            // Fallback to user info
            userInfo = await getUserInfo(otherUserId);
          }
        }

        setOtherUser({
          id: otherUserId,
          name: userInfo.name,
          email: userInfo.email,
          avatar: userInfo.avatar,
        });

        // Update document title with pet name
        updateDocumentTitle(userInfo.name);
      }
    } catch (error) {
      console.error("Error fetching conversation details:", error);
    }
  };

  // Add debug logs for loading state
  useEffect(() => {
    console.log("Current loading state:", isLoading);
  }, [isLoading]);

  // Fetch all conversations for the current user
  const fetchConversations = async (showLoading: boolean = true) => {
    if (showLoading) setIsLoading(true);
    const start = Date.now();
    if (!user) return;

    try {
      console.log("Starting to fetch conversations...");

      // Get all conversations this user is part of
      const { data: userConvos, error: userConvosError } = await supabase
        .from("user_conversations")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (userConvosError) {
        console.error("Error fetching user conversations:", userConvosError);
        setIsLoading(false);
        return;
      }

      console.log("User conversations:", userConvos);

      if (!userConvos || userConvos.length === 0) {
        console.log("No conversations found");
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Get unique conversation IDs
      const uniqueConvoIds = [
        ...new Set(userConvos.map((uc) => uc.conversation_id)),
      ];
      console.log(`Found ${uniqueConvoIds.length} unique conversation IDs`);

      // Get details of those conversations
      const { data: convosData, error: convosError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", uniqueConvoIds);

      if (convosError) {
        console.error("Error fetching conversation details:", convosError);
        setIsLoading(false);
        return;
      }

      console.log("Conversation details:", convosData);

      try {
        // Process each conversation to get additional details
        const processedConvos = await Promise.all(
          convosData.map(async (convo) => {
            console.log(`Processing conversation ${convo.id}...`);
            try {
              // Get the other user in this conversation
              const { data: members, error: membersError } = await supabase
                .from("user_conversations")
                .select("user_id")
                .eq("conversation_id", convo.id)
                .neq("user_id", user.id);

              console.log(`Members for conversation ${convo.id}:`, members);

              if (membersError) {
                console.error(
                  `Error fetching members for conversation ${convo.id}:`,
                  membersError
                );
              }

              let otherUserId = null;
              let otherUserInfo = { name: "Unknown", email: "", avatar: null };

              // Set adopter_name and owner_name if they aren't already set
              if (convo.adopter_name === null && convo.owner_name === null) {
                // Try to determine adopter and owner (you are one of them)
                // This is a simplified approach
                const yourName = user.email || "You";

                if (members && members.length > 0) {
                  otherUserId = members[0].user_id;
                  const { data: otherUserEmailResult } = await supabase.rpc(
                    "get_user_email",
                    { user_id: otherUserId }
                  );

                  const otherUserEmail =
                    otherUserEmailResult?.email || "Other User";

                  // Update conversation with participant names
                  await supabase
                    .from("conversations")
                    .update({
                      adopter_name: yourName,
                      owner_name: otherUserEmail,
                    })
                    .eq("id", convo.id);

                  // Set values for current session
                  convo.adopter_name = yourName;
                  convo.owner_name = otherUserEmail;
                }
              }

              // If we already have a pet name in the conversation record, use it
              if (convo.pet_name) {
                otherUserInfo = {
                  name: convo.pet_name,
                  email: "",
                  avatar: null,
                };
                console.log(
                  `Using pet name from conversation: ${convo.pet_name}`
                );
              } else if (members && members.length > 0) {
                otherUserId = members[0].user_id;
                console.log(
                  `Other user ID for conversation ${convo.id}:`,
                  otherUserId
                );

                try {
                  // First check for adoption requests between these users
                  const { data: adoptionData, error: adoptionError } =
                    await supabase
                      .from("adoption_requests")
                      .select("pet_name, post_id, status")
                      .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
                      .or(
                        `requester_id.eq.${otherUserId},owner_id.eq.${otherUserId}`
                      )
                      .order("updated_at", { ascending: false })
                      .limit(1);

                  if (
                    !adoptionError &&
                    adoptionData &&
                    adoptionData.length > 0 &&
                    adoptionData[0].pet_name
                  ) {
                    // Found an adoption request with pet name
                    otherUserInfo = {
                      name: adoptionData[0].pet_name,
                      email: "",
                      avatar: null,
                    };
                    console.log(
                      `Found adopted pet name for ${otherUserId}:`,
                      adoptionData[0].pet_name
                    );

                    // Update the conversation record for future use
                    await supabase
                      .from("conversations")
                      .update({
                        pet_name: adoptionData[0].pet_name,
                        title: adoptionData[0].pet_name,
                        post_id: adoptionData[0].post_id,
                      })
                      .eq("id", convo.id);
                  } else {
                    // Get pet info using our new function
                    const { data: petInfo, error: petInfoError } =
                      await supabase.rpc("get_user_with_pet", {
                        user_uuid: otherUserId,
                      });

                    if (!petInfoError && petInfo && petInfo.pet_name) {
                      otherUserInfo = {
                        name: petInfo.pet_name,
                        email: petInfo.email || "",
                        avatar: null,
                      };
                      console.log(
                        `Found pet for ${otherUserId}:`,
                        petInfo.pet_name
                      );

                      // Update the conversation record for future use
                      await supabase
                        .from("conversations")
                        .update({
                          pet_name: petInfo.pet_name,
                          title: petInfo.pet_name,
                        })
                        .eq("id", convo.id);
                    } else {
                      // Fallback to regular user info
                      otherUserInfo = await getUserInfo(otherUserId);
                    }
                  }
                  console.log(
                    `Got user info for ${otherUserId}:`,
                    otherUserInfo
                  );
                } catch (userInfoError) {
                  console.error(
                    `Error getting user info for ${otherUserId}:`,
                    userInfoError
                  );
                }
              } else {
                console.log(
                  `No other members found for conversation ${convo.id}`
                );
              }

              // Get last message
              const { data: lastMessage, error: lastMessageError } =
                await supabase
                  .from("messages")
                  .select("content, created_at, sender_id")
                  .eq("conversation_id", convo.id)
                  .order("created_at", { ascending: false })
                  .limit(1);

              if (lastMessageError) {
                console.error(
                  `Error fetching last message for conversation ${convo.id}:`,
                  lastMessageError
                );
              }

              // Get unread count
              const { data: userConvo, error: userConvoError } = await supabase
                .from("user_conversations")
                .select("last_read")
                .eq("conversation_id", convo.id)
                .eq("user_id", user.id)
                .single();

              if (userConvoError) {
                console.error(
                  `Error fetching user_conversation for ${convo.id}:`,
                  userConvoError
                );
              }

              const lastReadTime = userConvo?.last_read;

              let unreadCount = 0;
              try {
                const { count, error: countError } = await supabase
                  .from("messages")
                  .select("id", { count: "exact", head: true })
                  .eq("conversation_id", convo.id)
                  .neq("sender_id", user.id)
                  .gt("created_at", lastReadTime || "1970-01-01");

                if (!countError && count !== null) {
                  unreadCount = count;
                }
              } catch (countError) {
                console.error(
                  `Error getting unread count for conversation ${convo.id}:`,
                  countError
                );
              }

              const processedConvo = {
                conversation_id: convo.id,
                title: convo.title || "Chat",
                is_group: convo.is_group || false,
                created_at: convo.created_at,
                updated_at: convo.updated_at,
                last_message:
                  lastMessage && lastMessage.length > 0
                    ? lastMessage[0].content
                    : "No messages yet",
                last_message_time:
                  lastMessage && lastMessage.length > 0
                    ? lastMessage[0].created_at
                    : null,
                last_message_sender:
                  lastMessage && lastMessage.length > 0
                    ? lastMessage[0].sender_id
                    : null,
                other_user_id: otherUserId,
                other_user_name: otherUserInfo.name || "User",
                other_user_avatar: otherUserInfo.avatar,
                pet_name: convo.pet_name || otherUserInfo.name,
                post_id: convo.post_id,
                adopter_name: convo.adopter_name,
                owner_name: convo.owner_name,
                unread_count: unreadCount || 0,
              } as Conversation;

              console.log("Processed conversation:", processedConvo);

              return processedConvo;
            } catch (convoError) {
              console.error(
                `Error processing conversation ${convo.id}:`,
                convoError
              );
              // Return a simplified version of the conversation to prevent the entire process from failing
              return {
                conversation_id: convo.id,
                title: convo.title || "Chat",
                is_group: convo.is_group || false,
                created_at: convo.created_at,
                updated_at: convo.updated_at,
                last_message: "Error loading message",
                other_user_name: "User",
                unread_count: 0,
              } as Conversation;
            }
          })
        );

        console.log("All processed conversations:", processedConvos);

        // Show all processed conversations (no deduplication)
        processedConvos.sort((a, b) => {
          const timeA = a.last_message_time
            ? new Date(a.last_message_time).getTime()
            : 0;
          const timeB = b.last_message_time
            ? new Date(b.last_message_time).getTime()
            : 0;
          return timeB - timeA; // Most recent first
        });
        setConversations(processedConvos);

        // Defensive: only set loading false after conversations are set
        if (showLoading) {
          const elapsed = Date.now() - start;
          setTimeout(() => setIsLoading(false), Math.max(0, 300 - elapsed));
        }
      } catch (processError) {
        console.error("Error processing conversations:", processError);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
      setIsLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !user || !conversationId) return;

    try {
      // First verify that the conversation exists
      const { error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .single();

      if (checkError) {
        // Only redirect if we get a real error finding the conversation
        // (not just if we get null, which might happen during async operations)
        if (checkError.code === "PGRST116") {
          toast.error(
            "This conversation no longer exists. You will be redirected.",
            {
              id: "conversation-not-found",
              duration: 5000,
            }
          );

          // Wait a moment before redirecting
          setTimeout(() => {
            navigate("/chat");
          }, 2000);

          return;
        }
      }

      const newMessage = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
      };

      // Insert the message
      const { error } = await supabase.from("messages").insert(newMessage);

      if (error) {
        if (error.code === "23503") {
          // Foreign key violation - conversation doesn't exist
          toast.error(
            "Message could not be sent. Conversation may have been deleted."
          );
          setTimeout(() => {
            navigate("/chat");
          }, 2000);
          return;
        }
        throw error;
      }

      // Update the conversation's last update time
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Clear the input
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Format timestamp to a readable format
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();

    // If message is from today, show only time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If message is from this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Start a new conversation with a user
  const startConversation = async (otherUserId: string) => {
    if (!user) return;

    try {
      setIsCreatingConversation(true);
      toast.loading("Starting conversation...", { id: "creating-convo" });

      // Get the pet name and post id from location state if available
      const petName = location.state?.petName || null;
      const postId = location.state?.postId || location.state?.post_id || null;

      // Get other user's profile information
      const { data: otherUserProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", otherUserId)
        .single();

      let otherUserName = "User";
      if (!profileError && otherUserProfile && otherUserProfile.full_name) {
        otherUserName = otherUserProfile.full_name;
      } else {
        // Fallback to email
        const { data: authUser, error: authError } = await supabase
          .from("users")
          .select("email")
          .eq("id", otherUserId)
          .single();

        if (!authError && authUser && authUser.email) {
          otherUserName = authUser.email;
        } else {
          otherUserName = `User ${otherUserId.substring(0, 6)}`;
        }
      }

      // Get current user's profile information
      const { data: currentUserProfile, error: currentProfileError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

      let currentUserName = "You";
      if (
        !currentProfileError &&
        currentUserProfile &&
        currentUserProfile.full_name
      ) {
        currentUserName = currentUserProfile.full_name;
      } else {
        // Fallback to email
        currentUserName = user.email || `User ${user.id.substring(0, 6)}`;
      }

      // Only check for an existing conversation if we're chatting about the same post
      // If postId is provided, we'll only find conversations about that exact post
      const { data: existingConversation, error: existingError } =
        await supabase.rpc("find_shared_conversation", {
          user_id_1: user.id,
          user_id_2: otherUserId,
          specific_post_id: postId,
        });

      // Check if we found an existing conversation for this specific post
      if (
        !existingError &&
        existingConversation &&
        existingConversation.length > 0
      ) {
        console.log(
          "Found existing conversation for this post:",
          existingConversation
        );
        const conversationId = existingConversation[0].conversation_id;

        // Update the conversation with the latest info
        if (petName) {
          await supabase
            .from("conversations")
            .update({
              title: petName,
              pet_name: petName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);
        }

        toast.success(
          `Continuing conversation about ${petName || "this pet"}`,
          { id: "creating-convo" }
        );
        navigate(`/chat/${conversationId}`);
        return;
      }

      // If we're here, we need to create a new conversation
      // Either because the RPC failed or there's no existing conversation for this post
      if (existingError) {
        console.error(
          "Error checking for existing conversation:",
          existingError
        );
      } else {
        console.log(
          "No existing conversation found for this post, creating new one"
        );
      }

      // Create a new conversation
      try {
        // Determine if current user is pet owner or adopter
        const isCurrentUserOwner = location.state?.petOwnerId === user.id;

        // Create a new conversation with pet information
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            title: petName || `Chat with ${otherUserName}`,
            pet_name: petName,
            post_id: postId,
            adopter_name: isCurrentUserOwner ? otherUserName : currentUserName,
            owner_name: isCurrentUserOwner ? currentUserName : otherUserName,
            is_group: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;

        // Verify the conversation was created
        if (!newConversation || !newConversation.id) {
          toast.error("Failed to create conversation. Please try again.", {
            id: "creating-convo",
          });
          setIsCreatingConversation(false);
          return;
        }

        // Add both users to the conversation (in a single insert for atomicity)
        const { error: userConvosError } = await supabase
          .from("user_conversations")
          .insert([
            {
              user_id: user.id,
              conversation_id: newConversation.id,
              joined_at: new Date().toISOString(),
              last_read: new Date().toISOString(),
            },
            {
              user_id: otherUserId,
              conversation_id: newConversation.id,
              joined_at: new Date().toISOString(),
              last_read: new Date().toISOString(),
            },
          ]);
        if (userConvosError) throw userConvosError;

        // Double-check that the conversation exists before navigating
        const { data: checkConvo, error: checkError } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", newConversation.id)
          .single();

        if (checkError || !checkConvo) {
          toast.error(
            "Error accessing the new conversation. Please try again.",
            { id: "creating-convo" }
          );
          setIsCreatingConversation(false);
          return;
        }

        const displayName = petName || otherUserName;
        toast.success(`Started new conversation with ${displayName}`, {
          id: "creating-convo",
        });

        // Put a small delay before navigating to ensure consistency
        setTimeout(() => {
          // Navigate to the new conversation
          navigate(`/chat/${newConversation.id}`);
        }, 500);
      } catch (error: unknown) {
        console.error("Error in conversation creation:", error);
        if (error instanceof Error) {
          if (error.message.includes("violates row-level security policy")) {
            toast.error(
              "Permission issue: Please check your security settings",
              {
                id: "creating-convo",
              }
            );
          } else {
            toast.error(`Error: ${error.message}`, { id: "creating-convo" });
          }
        } else {
          toast.error("An unknown error occurred", { id: "creating-convo" });
        }
      }
    } catch (error: unknown) {
      console.error("Error starting conversation:", error);
      if (error instanceof Error) {
        toast.error(`Failed to start conversation: ${error.message}`, {
          id: "creating-convo",
        });
      } else {
        toast.error("Failed to start conversation", { id: "creating-convo" });
      }
    } finally {
      // Add a delay before setting isCreatingConversation to false to avoid UI flicker
      setTimeout(() => {
        setIsCreatingConversation(false);
      }, 1000);
    }
  };

  // Check if a message is from the current user
  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  // Function to clean up duplicate conversations for the current user
  const cleanupDuplicateConversations = async (silent: boolean = false) => {
    if (!user) return;

    try {
      if (!silent) {
        toast.loading("Cleaning up duplicate conversations...", {
          id: "cleanup-convos",
        });
      }

      // Get all conversations this user is part of
      const { data: userConvos, error: userConvosError } = await supabase
        .from("user_conversations")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (userConvosError) {
        throw userConvosError;
      }

      if (!userConvos || userConvos.length === 0) {
        if (!silent) {
          toast.success("No conversations to clean up", {
            id: "cleanup-convos",
          });
        }
        return;
      }

      // Get unique conversation IDs
      const uniqueConvoIds = [
        ...new Set(userConvos.map((uc) => uc.conversation_id)),
      ];

      // If a conversation is currently being viewed, protect it from cleanup
      let currentlyViewedConversation = null;
      if (conversationId) {
        currentlyViewedConversation = conversationId;
      }

      // Get details of those conversations
      const { data: convosData, error: convosError } = await supabase
        .from("conversations")
        .select("id, title, pet_name, post_id, created_at")
        .in("id", uniqueConvoIds);

      if (convosError) {
        throw convosError;
      }

      // Find potential duplicate sets by matching pet_name or post_id
      const petNameGroups: Record<string, string[]> = {};
      const postIdGroups: Record<string, string[]> = {};

      // Group conversations by pet_name and post_id
      convosData.forEach((convo) => {
        if (convo.pet_name) {
          if (!petNameGroups[convo.pet_name]) {
            petNameGroups[convo.pet_name] = [];
          }
          petNameGroups[convo.pet_name].push(convo.id);
        }

        if (convo.post_id) {
          const postIdKey = convo.post_id.toString();
          if (!postIdGroups[postIdKey]) {
            postIdGroups[postIdKey] = [];
          }
          postIdGroups[postIdKey].push(convo.id);
        }
      });

      // Find which groups have duplicates
      const petNameDuplicates = Object.entries(petNameGroups)
        .filter(([_, ids]) => ids.length > 1)
        .map(([petName, ids]) => ({ petName, ids }));

      const postIdDuplicates = Object.entries(postIdGroups)
        .filter(([_, ids]) => ids.length > 1)
        .map(([postId, ids]) => ({ postId, ids }));

      // If no duplicates found, just return
      if (petNameDuplicates.length === 0 && postIdDuplicates.length === 0) {
        if (!silent) {
          toast.success("No duplicate conversations found", {
            id: "cleanup-convos",
          });
        }
        return;
      }

      // Process post_id duplicates first (more specific)
      let mergedCount = 0;
      let currentConversationMerged = false;
      let redirectToConversationId = null;

      for (const { ids } of postIdDuplicates) {
        // Get the oldest conversation first based on created_at
        const relevantConvos = convosData
          .filter((convo) => ids.includes(convo.id))
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

        if (!relevantConvos || relevantConvos.length < 2) continue;

        // The first conversation is the keeper (oldest one)
        const keepConversationId = relevantConvos[0].id;
        // The rest are duplicates to be merged
        const duplicateIds = relevantConvos.slice(1).map((c) => c.id);

        // Check if currently viewed conversation is among duplicates
        if (
          currentlyViewedConversation &&
          duplicateIds.includes(currentlyViewedConversation)
        ) {
          currentConversationMerged = true;
          redirectToConversationId = keepConversationId;
        }

        // If we're currently viewing the keeper, no need to redirect
        if (
          currentlyViewedConversation &&
          currentlyViewedConversation === keepConversationId
        ) {
          currentConversationMerged = false;
        }

        // For each duplicate, move its messages to the keeper
        for (const dupId of duplicateIds) {
          // Update messages to point to the keeper conversation
          const { error: updateError } = await supabase
            .from("messages")
            .update({ conversation_id: keepConversationId })
            .eq("conversation_id", dupId);

          if (updateError) {
            console.error(`Error moving messages from ${dupId}:`, updateError);
            continue;
          }

          // Delete the user_conversation entries
          await supabase
            .from("user_conversations")
            .delete()
            .eq("conversation_id", dupId);

          // Delete the conversation
          await supabase.from("conversations").delete().eq("id", dupId);

          mergedCount++;
        }
      }

      // Only process pet_name duplicates that weren't already handled by post_id
      // (Skip this for simplicity in this version)

      if (mergedCount > 0) {
        if (!silent) {
          toast.success(`Merged ${mergedCount} duplicate conversations`, {
            id: "cleanup-convos",
          });
        } else {
          console.log(
            `Auto-cleanup: Merged ${mergedCount} duplicate conversations`
          );
        }

        // If the current conversation was merged, redirect to the keeper
        if (currentConversationMerged && redirectToConversationId) {
          toast.success("You are being redirected to the merged conversation", {
            id: "redirect-notice",
            duration: 5000,
          });

          setTimeout(() => {
            navigate(`/chat/${redirectToConversationId}`);
          }, 1500);
        } else {
          // Refresh the conversation list
          fetchConversations();
        }
      } else if (!silent) {
        toast.success("No duplicates were merged", { id: "cleanup-convos" });
      }
    } catch (error) {
      console.error("Error cleaning up conversations:", error);
      if (!silent) {
        toast.error("Failed to clean up conversations", {
          id: "cleanup-convos",
        });
      }
    }
  };

  // Helper to get the best display name with pet name focus
  const getDisplayName = (convo: Conversation) => {
    // Use the pet_name field from the conversations table first if available
    if (convo.pet_name) {
      return convo.pet_name;
    }

    // For adoption conversations, pet_name would be set from adoption_requests
    if (convo.pet_name) {
      return convo.pet_name;
    }

    // Otherwise use other_user_name if it's not an email
    if (convo.other_user_name && !convo.other_user_name.includes("@")) {
      return convo.other_user_name;
    }

    // Try conversation title if not an email address
    if (
      convo.title &&
      !convo.title.includes("@") &&
      !convo.title.startsWith("Chat with")
    ) {
      return convo.title;
    }

    // Fallback
    return "Pet";
  };

  // Function to update the document title based on pet name
  const updateDocumentTitle = (petName: string | undefined) => {
    if (petName) {
      document.title = `Chat with ${petName}`;
    } else {
      document.title = "SmartPet Chat";
    }
  };

  // Render the chat interface or conversation list
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-violet-700 mb-4">
            Please Sign In
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access the chat feature.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-600 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isCreatingConversation) {
    return (
      <div className="flex justify-center items-center py-10 h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-opacity-100 border-r-4 border-opacity-50 mx-auto mb-4"></div>
          <p className="text-violet-700 font-medium">
            {isCreatingConversation ? "Starting conversation..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#f5f6fa] overflow-hidden fixed inset-0">
      {/* Mobile menu button - only visible on small screens */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileMenuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar: Conversations */}
      <aside
        className={`fixed lg:static inset-0 z-40 w-[340px] min-w-[260px] max-w-[340px] h-full bg-[#f0f2f5] border-r border-gray-200 flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Chats</h1>
          <input
            type="text"
            placeholder="Search messenger..."
            className="w-full px-4 py-2 rounded-full bg-[#e4e6eb] border-none focus:outline-none focus:ring-2 focus:ring-[#0084ff] text-sm placeholder-gray-500"
            disabled
          />
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-violet-500 border-opacity-100 border-r-4 border-opacity-50"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No conversations yet
            </div>
          ) : (
            conversations.map((convo) => (
              <div
                key={convo.conversation_id}
                onClick={() => {
                  navigate(`/chat/${convo.conversation_id}`);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-xl mx-2 mb-1 ${
                  conversationId === convo.conversation_id
                    ? "bg-[#0084ff] text-white"
                    : "hover:bg-[#e4e6eb] text-gray-900"
                }`}
              >
                <div className="relative">
                  {convo.other_user_avatar ? (
                    <img
                      src={convo.other_user_avatar}
                      alt={convo.other_user_name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        conversationId === convo.conversation_id
                          ? "bg-white"
                          : "bg-[#d1d5db]"
                      }`}
                    >
                      <FaUserCircle
                        className={`text-3xl ${
                          conversationId === convo.conversation_id
                            ? "text-[#0084ff]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  )}
                  {convo.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {convo.unread_count > 9 ? "9+" : convo.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold truncate ${
                        conversationId === convo.conversation_id
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {getDisplayName(convo)}
                    </span>
                    {convo.last_message_time && (
                      <span
                        className={`text-xs ml-2 ${
                          conversationId === convo.conversation_id
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTime(convo.last_message_time)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`block text-sm truncate ${
                      conversationId === convo.conversation_id
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {convo.last_message || "No messages yet"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        {conversationId ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-4 px-4 lg:px-8 py-5 bg-white border-b border-gray-200 shadow-sm">
              <Link to="/home">
                <button
                  className="mr-2 p-2 rounded-full hover:bg-[#f0f2f5] text-gray-500"
                  aria-label="Back"
                >
                  <FaArrowLeft className="text-2xl" />
                </button>
              </Link>

              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#e4e6eb] rounded-full flex items-center justify-center">
                {conversationData && conversationData.other_user_avatar ? (
                  <img
                    src={conversationData.other_user_avatar}
                    alt="avatar"
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-3xl lg:text-4xl text-[#0084ff]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg lg:text-xl text-gray-900 truncate">
                  {conversationData && conversationData.pet_name
                    ? conversationData.pet_name
                    : otherUser?.name || "Pet"}
                </h2>
                {conversationData &&
                  conversationData.adopter_name &&
                  conversationData.owner_name && (
                    <p className="text-xs text-gray-500 truncate">
                      Pet Owner:{" "}
                      {conversationData.adopter_name === user?.email
                        ? "You"
                        : conversationData.adopter_name.split("@")[0]}{" "}
                    </p>
                  )}
              </div>
              <div className="flex gap-2 items-center">
                {/* Placeholder icons for Messenger header actions (not functional) */}
                <button className="p-2 rounded-full hover:bg-[#f0f2f5] text-gray-500">
                  <svg width="20" height="20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="#b0b3b8"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-[#f0f2f5] text-gray-500">
                  <svg width="20" height="20">
                    <rect
                      x="4"
                      y="7"
                      width="12"
                      height="6"
                      rx="2"
                      fill="none"
                      stroke="#b0b3b8"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 flex flex-col gap-3 bg-white"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No messages yet</p>
                  <p className="text-sm">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isCurrentUser(msg.sender_id)
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {!isCurrentUser(msg.sender_id) && (
                      <div className="mr-2 flex-shrink-0">
                        {msg.sender_avatar ? (
                          <img
                            src={msg.sender_avatar}
                            alt={msg.sender_name}
                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#e4e6eb] rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-xl lg:text-2xl text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="max-w-[85%] lg:max-w-[70%]">
                      <div
                        className={`px-4 lg:px-5 py-2 lg:py-3 rounded-2xl text-sm lg:text-base shadow-sm ${
                          isCurrentUser(msg.sender_id)
                            ? "bg-[#0084ff] text-white rounded-br-md"
                            : "bg-[#f0f2f5] text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <span>{msg.content}</span>
                      </div>
                      <div
                        className={`flex items-center mt-1 ${
                          isCurrentUser(msg.sender_id)
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <span className="text-xs text-gray-400">
                          {formatTime(msg.created_at)}
                        </span>
                        {isCurrentUser(msg.sender_id) && (
                          <span className="ml-1 text-xs text-green-500">
                            {msg.is_read ? "• Read" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCurrentUser(msg.sender_id) && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#e4e6eb] rounded-full flex items-center justify-center">
                          <FaUserCircle className="text-xl lg:text-2xl text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={sendMessage}
              className="px-4 lg:px-8 py-4 lg:py-5 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-3"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                className="flex-1 px-4 lg:px-5 py-2 lg:py-3 rounded-full border-none bg-white focus:outline-none focus:ring-2 focus:ring-[#0084ff] text-sm lg:text-base shadow-sm"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 lg:p-3 bg-[#0084ff] text-white rounded-full disabled:opacity-50 hover:bg-[#006fd6] transition-all duration-300 shadow-md"
              >
                <FaPaperPlane className="text-sm lg:text-base" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaPaw className="text-5xl lg:text-6xl mb-4 text-blue-200" />
            <p className="text-base lg:text-lg font-semibold text-center px-4">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
