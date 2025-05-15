import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Link } from "react-router-dom";
import {  FaUsers, FaCalendarAlt } from "react-icons/fa";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Community[];
};

export const CommunityList = () => {
  const { data, error, isLoading } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4  border-r-4 border-violet-300"></div>
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
    <div className="max-w-5xl mx-auto space-y-6">
      {data?.length === 0 && (
        <div className="text-center text-violet-600 py-8 font-['Poppins']">
          <FaUsers className="text-5xl mx-auto mb-4 text-violet-300" />
          <p className="text-xl mb-2">No communities found</p>
          <p className="text-sm text-violet-500 mb-4">Be the first to create a community!</p>
          <Link 
            to="/community/create"
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md inline-flex items-center gap-2"
          >
            <FaUsers /> Create Community
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.map((community) => (
          <Link
            key={community.id}
            to={`/community/${community.id}`}
            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="bg-gradient-to-r from-violet-100 to-blue-100 p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 bg-gradient-to-br from-violet-400 to-blue-400 text-white p-8 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <h3 className="text-2xl font-bold text-violet-800 font-['Quicksand'] relative z-10">
                {community.name}
              </h3>
              <div className="flex items-center text-violet-600 text-sm mt-2 relative z-10 font-['Poppins']">
                <FaCalendarAlt className="mr-1" />
                <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 font-['Poppins'] line-clamp-2">{community.description}</p>
              <div className="mt-4 text-violet-600 font-medium flex justify-between items-center font-['Poppins']">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-violet-400" />
                  <span>Join Community</span>
                </div>
                <span className="text-violet-500 group-hover:text-violet-700 transition-colors">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
