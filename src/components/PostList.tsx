import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {  FaPaw, FaMapMarkerAlt, FaCalendarAlt, FaRuler } from "react-icons/fa";
import { MdPets } from "react-icons/md";

export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  auth_users_id: string;
  image_url?: string;
  additional_photos?: string[];
  age?: number;
  breed?: string;
  vaccination_status?: boolean;
  location?: string;
  size?: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  temperament?: string[];
  health_info?: string;
  status?: 'Available' | 'Pending' | 'Adopted';
  name?: string;
  user_id?: string;
  avatar_url?: string;
  community_id?: number;
  comments?: { id: number }[];
  likes?: { id: number }[];
}

export const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      console.log("Fetching posts...");
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Posts data:", postsData);
      console.log("Posts error:", postsError);

      if (postsError) throw postsError;

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Transform the data to include counts
      const enrichedPosts = postsData.map(post => ({
        ...post,
        like_count: 0,
        comment_count: 0
      }));

      console.log("Enriched posts:", enrichedPosts);
      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'from-green-400 to-teal-400';
      case 'Pending':
        return 'from-yellow-400 to-amber-400';
      case 'Adopted':
        return 'from-blue-400 to-sky-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4  border-opacity-100 border-r-4 border-violet-300 border-opacity-50"></div>
      </div>
    );
  }

  return (
    <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {posts.length === 0 && !loading ? (
        <div className="text-center text-violet-600 py-10 col-span-full font-['Poppins']">
          <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
          <p className="text-xl mb-2">No posts found</p>
          <p className="text-violet-500 mb-4">Be the first to create a post!</p>
          <Link 
            to="/create"
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2"
          >
            <FaPaw /> Create Post
          </Link>
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="group"
          >
            <Link to={`/post/${post.id}`} className="block">
              <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg group-hover:translate-y-[-5px] border border-violet-100">
                {/* Header: Title and Status */}
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="text-xl leading-snug font-bold text-violet-800 font-['Quicksand']">
                        {post.name || "Unnamed Pet"}
                      </div>
                      {post.breed && (
                        <div className="text-sm text-violet-600 font-['Poppins'] flex items-center">
                          <MdPets className="mr-1 text-violet-400" />
                          {post.breed}
                        </div>
                      )}
                    </div>
                  </div>
                  {post.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor(post.status)} shadow-sm font-['Poppins']`}>
                      {post.status}
                    </span>
                  )}
                </div>

                {/* Image Banner */}
                <div className="mt-4 relative overflow-hidden">
                  <img
                    src={post.image_url || '/default-pet.jpg'}
                    alt={post.name || "Pet"}
                    className="w-full object-cover h-52 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Pet Details */}
                <div className="p-5 space-y-3">
                  {/* Location and Age */}
                  <div className="flex justify-between text-sm font-['Poppins']">
                    {post.location && (
                      <span className="flex items-center text-violet-700">
                        <FaMapMarkerAlt className="mr-1 text-violet-500" />
                        {post.location}
                      </span>
                    )}
                    {post.age !== undefined && post.age !== null && (
                      <span className="flex items-center text-violet-700">
                        <FaCalendarAlt className="mr-1 text-violet-500" />
                        {post.age} months
                      </span>
                    )}
                  </div>

                  {/* Size */}
                  {post.size && (
                    <div className="flex items-center text-violet-700 text-sm font-['Poppins']">
                      <FaRuler className="mr-1 text-violet-500" />
                      <span>{post.size}</span>
                    </div>
                  )}

                  {/* Temperament */}
                  {post.temperament && post.temperament.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.temperament.map((trait, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-violet-100 rounded-full text-xs text-violet-700 font-['Poppins']"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description Preview */}
                  {post.content && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2 font-['Poppins']">
                      {post.content}
                    </p>
                  )}
                </div>

                {/* Interaction Stats */}
                {/* <div className="flex justify-between items-center mt-2 px-5 pb-5">
                  <div className="flex gap-4">
                    <span className="flex items-center text-pink-500 text-sm font-medium font-['Poppins']">
                      <FaHeart className="mr-1" />
                      {post.like_count ?? 0}
                    </span>
                    <span className="flex items-center text-blue-500 text-sm font-medium font-['Poppins']">
                      <FaComment className="mr-1" />
                      {post.comment_count ?? 0}
                    </span>
                  </div>
                  <span className="text-violet-600 text-sm font-medium hover:text-violet-800 transition-colors font-['Poppins']">
                    View Details →
                  </span>
                </div> */}
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};
