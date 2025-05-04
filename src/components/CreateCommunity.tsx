import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../supabase-client";
import { FaPaw, FaUsers, FaPencilAlt } from "react-icons/fa";

interface CommunityInput {
  name: string;
  description: string;
}

const createCommunity = async (community: CommunityInput) => {
  const { error, data } = await supabase.from("communities").insert(community);

  if (error) throw new Error(error.message);
  return data;
};

export const CreateCommunity = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      navigate("/communities");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name, description });
  };

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-md border border-violet-100 transform hover:scale-[1.01] transition-all duration-300">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label htmlFor="name" className="block mb-2 text-lg font-medium text-violet-700 font-['Poppins']">
                Community Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-violet-50 border border-violet-100 text-violet-800 p-4 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-300 pl-12 group-hover:border-violet-300 font-['Poppins']"
                  required
                  placeholder="Enter community name"
                />
                <FaUsers className="absolute left-4 top-1/2 transform -translate-y-1/2 text-violet-400 text-xl" />
              </div>
            </div>

            <div className="relative group">
              <label htmlFor="description" className="block mb-2 text-lg font-medium text-violet-700 font-['Poppins']">
                Description
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-violet-50 border border-violet-100 text-violet-800 p-4 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-300 pl-12 min-h-[120px] group-hover:border-violet-300 font-['Poppins']"
                  placeholder="Describe your community..."
                />
                <FaPencilAlt className="absolute left-4 top-4 text-violet-400 text-xl" />
              </div>
              <p className="mt-2 text-sm text-gray-600 font-['Poppins']">
                Share what makes your community special and what members can expect
              </p>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-violet-600 hover:to-blue-600 transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-['Poppins']"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Creating Community...</span>
                  </>
                ) : (
                  <>
                    <FaPaw className="text-2xl" />
                    <span>Create Community</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {isError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-['Poppins']">
                Error creating community. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
