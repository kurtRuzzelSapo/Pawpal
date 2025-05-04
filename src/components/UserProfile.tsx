import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { FaMedal, FaUser, FaMapMarkerAlt, FaPaw, FaHeart, FaIdCard, FaShieldAlt } from "react-icons/fa";
import { useState, useEffect } from "react";

interface UserData {
  id: string;
  bio: string;
  location: string;
  is_shelter: boolean;
  verified: boolean;
  adoption_history: string[];
  favorites: string[];
}

interface Badge {
  id: number;
  badge_type: string;
  awarded_at: string;
}

const fetchUserData = async (userId: string): Promise<UserData> => {
  // Try to get existing user
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  // If no error but no data, or if error is about no rows, create new user
  if ((!error && !data) || (error && error.message.includes("no rows"))) {
    const defaultUserData = {
      id: userId,
      bio: "",
      location: "",
      is_shelter: false,
      verified: false,
      adoption_history: [],
      favorites: []
    };

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([defaultUserData])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newUser;
  }

  if (error) {
    throw error;
  }

  return data;
};

const fetchUserBadges = async (userId: string): Promise<Badge[]> => {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data || [];
};

export const UserProfile = () => {
  const { user } = useAuth();
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

  const { data: userData, isLoading: userLoading, error: userError } = useQuery<UserData, Error>({
    queryKey: ["userData", user?.id],
    queryFn: () => fetchUserData(user!.id),
    enabled: !!user,
    retry: 1
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<Badge[], Error>({
    queryKey: ["userBadges", user?.id],
    queryFn: () => fetchUserBadges(user!.id),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center text-violet-600 py-10 font-['Poppins'] bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-md max-w-md mx-auto">
        <FaUser className="text-5xl mx-auto mb-4 text-violet-300" />
        <p className="text-xl mb-2">Please log in to view your profile</p>
        <a 
          href="/login" 
          className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2 mt-4"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="text-center text-red-500 py-4 bg-red-50 rounded-xl p-6 shadow-md font-['Poppins'] max-w-md mx-auto">
        <p className="text-xl font-medium mb-2">Oops! Something went wrong</p>
        <p>Error loading profile: {userError.message}</p>
      </div>
    );
  }

  if (userLoading || badgesLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-r-4 border-violet-300"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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

      <div className="text-center mb-10 reveal">
        <span className="bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Profile</span>
        <h2 className="text-4xl md:text-5xl font-bold text-violet-800 font-['Quicksand']">
          Your Account
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
        <p className="text-gray-600 mt-4 max-w-xl mx-auto font-['Poppins']">
          Manage your personal information and track your pet adoption journey
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
        <div className="flex items-start justify-between flex-wrap md:flex-nowrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full opacity-75 blur-sm"></div>
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User Avatar" 
                  className="w-20 h-20 rounded-full object-cover relative border-2 border-white"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full flex items-center justify-center relative border-2 border-white">
                  <FaUser className="text-4xl text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-violet-800 font-['Quicksand'] flex items-center">
                {user.user_metadata?.full_name || user.email}
                {userData?.verified && (
                  <span className="ml-2 text-blue-500 text-sm bg-blue-100 px-2 py-0.5 rounded-full font-['Poppins'] flex items-center">
                    <FaShieldAlt className="mr-1" /> Verified
                  </span>
                )}
              </h1>
              <div className="flex items-center text-violet-600 mt-1 font-['Poppins']">
                <FaMapMarkerAlt className="mr-1 text-violet-400" />
                <span>{userData?.location || "Location not set"}</span>
              </div>
            </div>
          </div>
          {userData?.is_shelter && (
            <span className="px-4 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm shadow-md font-['Poppins'] flex items-center">
              <FaShieldAlt className="mr-2" />
              Shelter Account
            </span>
          )}
        </div>

        <p className="text-gray-600 mt-4 bg-violet-50 p-4 rounded-xl font-['Poppins']">{userData?.bio || "No bio provided"}</p>
      </div>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
          <h2 className="text-xl font-bold text-violet-800 mb-4 flex items-center font-['Quicksand']">
            <FaMedal className="mr-2 text-amber-400" />
            Your Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl flex items-center space-x-3 border border-amber-100 hover:shadow-md transition-shadow duration-300"
              >
                <FaMedal className="text-2xl text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-700 font-['Quicksand']">
                    {badge.badge_type}
                  </div>
                  <div className="text-sm text-amber-600 font-['Poppins']">
                    {new Date(badge.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adoption History */}
      {userData?.adoption_history && userData.adoption_history.length > 0 && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
          <h2 className="text-xl font-bold text-violet-800 mb-4 flex items-center font-['Quicksand']">
            <FaPaw className="mr-2 text-violet-500" />
            Adoption History
          </h2>
          <div className="space-y-4">
            {userData.adoption_history.map((adoption, index) => (
              <div
                key={index}
                className="bg-violet-50 p-4 rounded-xl text-violet-700 border border-violet-100 font-['Poppins']"
              >
                {adoption}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {userData?.favorites && userData.favorites.length > 0 && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 reveal border border-violet-100">
          <h2 className="text-xl font-bold text-violet-800 mb-4 flex items-center font-['Quicksand']">
            <FaHeart className="mr-2 text-pink-500" />
            Favorite Pets
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userData.favorites.map((favorite, index) => (
              <div
                key={index}
                className="bg-pink-50 p-4 rounded-xl text-pink-700 border border-pink-100 hover:shadow-md transition-shadow duration-300 font-['Poppins']"
              >
                {favorite}
              </div>
            ))}
          </div>
        </div>
      )}

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