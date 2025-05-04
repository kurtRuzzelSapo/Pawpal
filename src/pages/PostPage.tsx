import { useParams } from "react-router-dom";
import { PostDetail } from "../components/PostDetail";
import { FaPaw } from "react-icons/fa";

export const PostPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center text-violet-600 py-10 font-['Poppins'] bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-md max-w-md mx-auto">
        <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
        <p className="text-xl mb-2">Post not found</p>
        <a 
          href="/home" 
          className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2 mt-4"
        >
          Return Home
        </a>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4">
      <PostDetail postId={id} />
    </div>
  );
};
