import { useParams, useNavigate } from "react-router-dom";
import { PostDetail } from "../components/PostDetail";
import { FaPaw } from "react-icons/fa";
import { useState, useEffect } from "react";

export const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Force a render after a short delay to ensure everything is properly mounted
  useEffect(() => {
    console.log("PostPage mounted with ID:", id);
    setMounted(true);
    
    // Reset loading state
    setLoading(true);
    setError(false);
    
    // Set a timeout to force transition from loading to content
    const timer = setTimeout(() => {
      console.log("Timeout complete, showing content for ID:", id);
      setLoading(false);
    }, 1000); // 1 second delay
    
    return () => {
      clearTimeout(timer);
      console.log("PostPage unmounted");
    };
  }, [id]);

  // Handle retry
  const handleRetry = () => {
    console.log("Retry requested for ID:", id);
    setLoading(true);
    setError(false);
    
    // Force a reload of the current page
    window.location.reload();
  };

  if (!id) {
    console.log("No ID provided");
    return (
      <div className="text-center text-violet-600 py-10 font-['Poppins'] bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-md max-w-md mx-auto mt-20">
        <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
        <p className="text-xl mb-2">Post not found</p>
        <button 
          onClick={() => navigate('/home')}
          className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2 mt-4"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (error) {
    console.log("Error state showing for ID:", id);
    return (
      <div className="text-center text-violet-600 py-10 font-['Poppins'] bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-md max-w-md mx-auto mt-20">
        <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
        <p className="text-xl mb-2">Something went wrong loading this post</p>
        <div className="flex flex-col md:flex-row gap-3 justify-center mt-4">
          <button 
            onClick={handleRetry}
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center justify-center gap-2"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/home')}
            className="bg-white text-violet-600 border border-violet-200 px-6 py-3 rounded-xl font-medium hover:bg-violet-50 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center justify-center gap-2"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (loading || !mounted) {
    console.log("Loading state showing for ID:", id);
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4">
        <div className="max-w-4xl mx-auto p-6 bg-white/90 rounded-xl shadow-md backdrop-blur-md flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-r-4 border-violet-300 mb-4"></div>
          <p className="text-violet-700 font-medium">Loading pet details...</p>
        </div>
      </div>
    );
  }

  console.log("Rendering PostDetail for ID:", id);
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4">
      <PostDetail postId={id} />
    </div>
  );
};
