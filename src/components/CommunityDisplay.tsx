import { useQuery } from "@tanstack/react-query";
import { Post } from "./PostList";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { FaPaw, FaUsers } from "react-icons/fa";
import { useState, useEffect } from "react";

interface Props {
  communityId: number;
}

interface PostWithCommunity extends Post {
  communities: {
    name: string;
    description: string;
  };
}

export const fetchCommunityPost = async (
  communityId: number
): Promise<PostWithCommunity[]> => {
  const { data, error } = await supabase
    .from("post")
    .select("*, communities(name, description)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PostWithCommunity[];
};

export const CommunityDisplay = ({ communityId }: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Add scroll animation for elements
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const { data, error, isLoading } = useQuery<PostWithCommunity[], Error>({
    queryKey: ["communityPost", communityId],
    queryFn: () => fetchCommunityPost(communityId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-r-4 border-violet-300"></div>
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center text-red-500 py-4 bg-red-50 rounded-xl p-6 shadow-md font-['Poppins']">
        <p className="text-xl font-medium mb-2">Oops! Something went wrong</p>
        <p>Error: {error.message}</p>
      </div>
    );

  return (
    <div className="min-h-screen">
      {/* Animated Paw Prints Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <FaPaw
            key={i}
            className="absolute text-violet-600 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 2 + 1}rem`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      
      <div className={`relative z-10 max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {data && data.length > 0 ? (
          <>
            <div className="text-center mb-10 reveal">
              <span className="bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Community</span>
              <h2 className="text-4xl md:text-5xl font-bold text-violet-800 font-['Quicksand']">
                {data[0]?.communities?.name}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
              <p className="text-gray-600 mt-4 max-w-xl mx-auto font-['Poppins']">
                {data[0]?.communities?.description || "A community for pet lovers"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center w-full reveal">
              {data.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-20 reveal">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-md p-10 max-w-lg">
              <FaUsers className="text-5xl mx-auto mb-4 text-violet-300" />
              <h2 className="text-4xl font-bold mb-4 text-violet-800 font-['Quicksand']">
                Community Posts
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto my-4"></div>
              <p className="text-violet-600 mb-6 font-['Poppins']">No posts in this community yet.</p>
              <p className="text-gray-600 mb-6 font-['Poppins']">Be the first to share your pet with this community!</p>
              <a 
                href="/create" 
                className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2 font-['Poppins']"
              >
                <FaPaw /> Create Post
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Add animation style for floating paws */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(var(--rotation)); }
            50% { transform: translateY(-20px) rotate(var(--rotation)); }
          }
          .animate-float {
            --rotation: 0deg;
            animation: float 8s ease-in-out infinite;
          }
          .reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease-out;
          }
          .reveal.visible {
            opacity: 1;
            transform: translateY(0);
          }
        `}
      </style>
    </div>
  );
};
