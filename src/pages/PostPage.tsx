import { useParams, useNavigate } from "react-router-dom";
import { PostDetail } from "../components/PostDetail";
import { FaPaw, FaHome } from "react-icons/fa";

export const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-violet-100 max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full shadow-lg mb-6">
            <FaPaw className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-transparent bg-clip-text font-['Quicksand'] mb-4">
            Post Not Found
          </h2>
          <p className="text-gray-600 font-['Poppins'] mb-8">
            The pet post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 font-['Poppins'] group"
          >
            <FaHome className="text-lg group-hover:scale-110 transition-transform duration-300" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="pt-20">
        <PostDetail postId={id} />
      </div>
    </div>
  );
};
