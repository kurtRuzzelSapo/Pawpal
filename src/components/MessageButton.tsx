import { useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { FaEnvelope } from "react-icons/fa";

interface Props {
  receiverId: string;
  postId: number;
}

interface MessageInput {
  sender_id: string;
  receiver_id: string;
  content: string;
  related_post_id: number;
}

interface MessageResponse {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  related_post_id: number;
  created_at: string;
}

const sendMessage = async (message: MessageInput): Promise<MessageResponse[]> => {
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select();

  if (error) throw new Error(error.message);
  return data || [];
};

export const MessageButton = ({ receiverId, postId }: Props) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const mutation: UseMutationResult<MessageResponse[], Error, MessageInput> = useMutation({
    mutationFn: (data: MessageInput) => sendMessage(data),
    onSuccess: () => {
      setTimeout(() => {
        setShowModal(false);
        setMessage("");
      }, 2000);
    },
  });

  const { mutate } = mutation;
  const isLoading = mutation.isPending;
  const isError = mutation.isError;
  const isSuccess = mutation.isSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    mutate({
      sender_id: user.id,
      receiver_id: receiverId,
      content: message.trim(),
      related_post_id: postId,
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
      >
        <FaEnvelope />
        <span>Message</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Send Message</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isSuccess ? (
              <div className="text-green-400 text-center p-4">
                Message sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    placeholder="Write your message here..."
                  />
                </div>

                {isError && (
                  <div className="text-red-500 text-center">
                    Failed to send message. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 