import { useAuth } from "../context/AuthContext";
import { FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  receiverId: string;
  postId: number;
  petName?: string;
}

export const MessageButton = ({ receiverId, postId, petName }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMessageClick = () => {
    if (!user) {
      // Handle not logged in case
      return;
    }

    // Navigate to chat page with the receiver ID and post info
    navigate("/chat", {
      state: {
        otherUserId: receiverId,
        postId: postId,
        petName: petName,
      },
    });
  };

  return (
    <button
      onClick={handleMessageClick}
      className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
    >
      <FaEnvelope className="text-xl" />
      <span className="font-semibold text-lg">Message Owner</span>
    </button>
  );
};
