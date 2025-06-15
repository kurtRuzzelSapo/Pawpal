import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { FaPaw, FaSearch, FaMapMarkerAlt, FaRuler, FaCalendarAlt, FaHeart, FaComment } from "react-icons/fa";
import {  useNavigate } from "react-router-dom";

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
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

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

  // Add a direct navigation function as a backup
  const handlePetClick = (id: number, event: React.MouseEvent) => {
    // Prevent default Link behavior and handle navigation programmatically
    event.preventDefault();
    navigate(`/post/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4 pt-20">
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
        <div className="text-center mb-10 reveal">
          <span className="bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-medium font-['Poppins'] mb-4 inline-block">Find a Pet</span>
          <h2 className="text-4xl md:text-5xl font-bold text-violet-800 font-['Quicksand']">
            Search for Pets
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-6"></div>
          <p className="text-gray-600 mt-4 max-w-xl mx-auto font-['Poppins']">
            Find your perfect furry companion using our advanced search filters
          </p>
        </div>
    
      {/* Search Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-md p-6 mb-8 reveal">
          <h3 className="text-xl font-bold text-violet-800 mb-6 font-['Quicksand']">Find Your Perfect Pet</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Breed
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaPaw />
                </span>
            <input
              type="text"
              name="breed"
              onChange={handleFilterChange}
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              placeholder="Enter breed..."
            />
              </div>
          </div>

            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Location
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaMapMarkerAlt />
                </span>
            <input
              type="text"
              name="location"
              onChange={handleFilterChange}
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              placeholder="Enter location..."
            />
              </div>
          </div>

            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Size
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaRuler />
                </span>
            <select
              name="size"
              onChange={handleFilterChange}
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
            >
              <option value="">Any Size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
            </select>
              </div>
          </div>

            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Minimum Age
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaCalendarAlt />
                </span>
            <input
              type="number"
              name="ageMin"
              onChange={handleFilterChange}
              min="0"
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
                  placeholder="Min age..."
            />
              </div>
          </div>

            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Maximum Age
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaCalendarAlt />
                </span>
            <input
              type="number"
              name="ageMax"
              onChange={handleFilterChange}
              min="0"
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
                  placeholder="Max age..."
            />
              </div>
          </div>

            <div className="group">
              <label className="block text-sm font-medium text-violet-700 mb-2 font-['Poppins']">
              Status
            </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 group-hover:text-violet-600 transition-colors">
                  <FaSearch />
                </span>
            <select
              name="status"
              onChange={handleFilterChange}
                  className="w-full px-10 py-3 bg-violet-50 border border-violet-100 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
            >
              <option value="">Any Status</option>
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Adopted">Adopted</option>
            </select>
              </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
          <div className="flex justify-center items-center py-10 reveal">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-r-4 border-violet-300"></div>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 reveal">
          {pets?.map((pet) => (
            <div 
              key={pet.id}
              className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg group"
              onClick={(e) => handlePetClick(pet.id, e)}
            >
              <div className="relative overflow-hidden h-52">
                <img
                  src={pet.image_url}
                  alt={pet.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-0 right-0 mt-3 mr-3">
                  <span className="px-4 py-1 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm rounded-full font-medium shadow-md">
                    {pet.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-violet-800 mb-2 font-['Quicksand']">{pet.name}</h3>
                <p className="text-violet-600 text-sm mb-3 flex items-center gap-2 font-['Poppins']">
                  <FaPaw className="text-violet-400" /> {pet.breed} • {pet.age} months
                  <span className="mx-1">•</span>
                  <FaMapMarkerAlt className="text-violet-400" /> {pet.location}
                </p>
                <p className="text-gray-600 line-clamp-2 mb-4 font-['Poppins']">{pet.content}</p>
                <div className="flex items-center text-sm text-violet-500 justify-between">
                  <div className="flex items-center gap-1">
                    <FaHeart className="text-pink-400" />
                    <span>{pet.like_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaComment className="text-blue-400" />
                    <span>{pet.comment_count}</span>
                  </div>
                  <span className="text-violet-500 hover:text-violet-700 transition-colors font-medium">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pets?.length === 0 && (
          <div className="text-center text-violet-600 py-10 bg-white/80 backdrop-blur-md rounded-xl p-10 shadow-md reveal font-['Poppins']">
            <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
            <p className="text-xl mb-2">No pets found matching your criteria.</p>
            <p className="text-sm text-violet-500">Try adjusting your search filters.</p>
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