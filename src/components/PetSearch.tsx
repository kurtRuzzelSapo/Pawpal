import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import {
  FaPaw,
  FaMapMarkerAlt,
  FaRuler,
  FaCalendarAlt,
  FaHeart,
  FaComment,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SearchFilters {
  breed?: string;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  size?: string;
  status?: string;
}

interface Pet {
  id: number;
  name: string;
  content: string;
  age: number;
  breed: string;
  location: string;
  image_url: string;
  size: string;
  status: string;
  like_count: number;
  comment_count: number;
}

const fetchFilteredPets = async (filters: SearchFilters): Promise<Pet[]> => {
  try {
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.breed) {
      query = query.ilike("breed", `%${filters.breed}%`);
    }
    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.size) {
      query = query.eq("size", filters.size);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.ageMin !== undefined) {
      query = query.gte("age", filters.ageMin);
    }
    if (filters.ageMax !== undefined) {
      query = query.lte("age", filters.ageMax);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error("Error fetching filtered pets:", error);
    return [];
  }
};

export const PetSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { data: pets, isLoading } = useQuery<Pet[], Error>({
    queryKey: ["filteredPets", filters],
    queryFn: () => fetchFilteredPets(filters),
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePetClick = (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    navigate(`/post/${id}`);
  };

  return (
    <div className="flex w-full min-h-screen bg-white overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white w-72 border-r border-gray-200 flex-shrink-0 transition-transform duration-300 z-30
          relative md:static top-0 left-0 h-full md:h-auto md:translate-x-0 mr-4
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex items-center justify-between mb-8 md:hidden">
          <span className="text-xl font-bold text-violet-700">Filters</span>
          <button
            className="text-violet-700 text-2xl"
            onClick={() => setSidebarOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="space-y-6 p-4">
          <div>
            <label className="block text-sm font-medium text-violet-700 mb-2">
              Breed
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaPaw />
              </span>
              <input
                type="text"
                name="breed"
                onChange={handleFilterChange}
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                placeholder="Enter breed..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700 mb-2">
              Location
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaMapMarkerAlt />
              </span>
              <input
                type="text"
                name="location"
                onChange={handleFilterChange}
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                placeholder="Enter location..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700 mb-2">
              Size
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaRuler />
              </span>
              <select
                name="size"
                onChange={handleFilterChange}
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              >
                <option value="">Any Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700 mb-2">
              Minimum Age
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaCalendarAlt />
              </span>
              <input
                type="number"
                name="ageMin"
                onChange={handleFilterChange}
                min="0"
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                placeholder="Min age..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700 mb-2">
              Maximum Age
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaCalendarAlt />
              </span>
              <input
                type="number"
                name="ageMax"
                onChange={handleFilterChange}
                min="0"
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                placeholder="Max age..."
              />
            </div>
          </div>
          <div>
            {/* <label className="block text-sm font-medium text-violet-700 mb-2">
              Status
            </label> */}
            {/* <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                <FaSearch />
              </span>
              <select
                name="status"
                onChange={handleFilterChange}
                className="w-full px-10 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              >
                <option value="">Any Status</option>
                <option value="Available">Available</option>
                <option value="Pending">Pending</option>
                <option value="Adopted">Adopted</option>
              </select>
            </div> */}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Topbar for mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white shadow sticky top-0 z-10">
          <span className="text-xl font-bold text-violet-700">Find a Pet</span>
          <button
            className="text-violet-700 text-2xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaPaw />
          </button>
        </div>
        <div className="flex-1 w-full overflow-x-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-r-4 border-violet-300"></div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pets?.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group flex flex-col mr-1"
                  onClick={(e) => handlePetClick(pet.id, e)}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={pet.image_url}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs rounded-full font-medium shadow">
                        {pet.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-violet-800 mb-1 font-['Quicksand']">
                      {pet.name}
                    </h3>
                    <p className="text-violet-600 text-xs mb-2 flex items-center gap-2 font-['Poppins']">
                      <FaPaw className="text-violet-400" /> {pet.breed} •{" "}
                      {pet.age} months
                      <span className="mx-1">•</span>
                      <FaMapMarkerAlt className="text-violet-400" />{" "}
                      {pet.location}
                    </p>
                    <p className="text-gray-600 line-clamp-2 mb-2 font-['Poppins']">
                      {pet.content}
                    </p>
                    <div className="flex items-center text-xs text-violet-500 gap-4 mt-auto">
                      <span className="flex items-center gap-1">
                        <FaHeart className="text-pink-400" /> {pet.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaComment className="text-blue-400" />{" "}
                        {pet.comment_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pets?.length === 0 && !isLoading && (
            <div className="text-center text-violet-600 py-10 bg-white/80 backdrop-blur-md rounded-xl p-10 shadow-md font-['Poppins']">
              <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
              <p className="text-xl mb-2">
                No pets found matching your criteria.
              </p>
              <p className="text-sm text-violet-500">
                Try adjusting your search filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
