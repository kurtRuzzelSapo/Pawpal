import { PostList } from "../components/PostList";
import {
  FaPaw,
  FaSearch,
  FaMapMarkerAlt,
  FaRuler,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase-client";
import { Post } from "../components/PostList";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    petType: "",
    breed: "",
    location: "",
    size: "",
    ageMin: "",
    ageMax: "",
    vaccinationProof: "", // "all", "with", "without"
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("posts")
        .select("*")
        .in("status", ["approved", "adopted"]);

      if (filters.breed) {
        query = query.ilike("breed", `%${filters.breed}%`);
      }
      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }
      if (filters.petType) {
        query = query.eq("pet_type", filters.petType);
      }
      if (filters.size) {
        query = query.eq("size", filters.size);
      }
      if (filters.ageMin) {
        query = query.gte("age", filters.ageMin);
      }
      if (filters.ageMax) {
        query = query.lte("age", filters.ageMax);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      // Vaccination Proof filter (client-side, since health_info is a text field)
      let filteredPosts = data || [];
      if (filters.vaccinationProof === "with") {
        filteredPosts = filteredPosts.filter(
          (post) =>
            post.health_info &&
            post.health_info.startsWith("Vaccination Proof:")
        );
      }
      if (filters.vaccinationProof === "without") {
        filteredPosts = filteredPosts.filter(
          (post) =>
            !post.health_info ||
            post.health_info === "EMPTY" ||
            !post.health_info.startsWith("Vaccination Proof:")
        );
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts();
    }, 500); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [fetchPosts]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="pt-16 sm:pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-3 sm:px-4">
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

      {/* Filter Toggle Button (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-100 transition-transform"
        aria-label="Open filters"
      >
        <FaFilter className="w-5 h-5" />
      </button>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="lg:grid lg:grid-cols-[288px_1fr] lg:gap-8">
        {/* Sidebar */}
        <aside
          className={`
            ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            } lg:translate-x-0
            fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white/90 backdrop-blur-xl shadow-2xl z-50 p-6 transition-transform duration-300 ease-in-out
            lg:sticky lg:h-auto lg:shadow-md lg:rounded-2xl lg:top-24 lg:self-start
          `}
        >
          <div className="flex justify-between items-center mb-4 lg:mb-0">
            <h3 className="text-xl font-bold text-violet-800 font-['Quicksand']">
              Find Your Pal
            </h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 text-slate-600 hover:text-slate-800"
              aria-label="Close filters"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 lg:mt-4">
            {/* Filter by Pet Type */}
            <div>
              <label className="block text-sm font-medium text-violet-700 mb-2">
                Pet Type
              </label>
              <select
                name="petType"
                value={filters.petType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition appearance-none"
              >
                <option value="">Any Type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Bird">Bird</option>
                <option value="Guinea Pig">Guinea Pig</option>
                <option value="Hamster">Hamster</option>
              </select>
            </div>
            {/* Search by Breed */}
            <div>
              <label className="block text-sm font-medium text-violet-700 mb-2">
                Breed
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  name="breed"
                  value={filters.breed}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition"
                  placeholder="e.g., Golden Retriever"
                />
              </div>
            </div>

            {/* Search by Location */}
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
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition"
                  placeholder="e.g., New York"
                />
              </div>
            </div>

            {/* Filter by Size */}
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
                  value={filters.size}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition appearance-none"
                >
                  <option value="">Any Size</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Extra Large">Extra Large</option>
                </select>
              </div>
            </div>

            {/* Filter by Age */}
            <div>
              <label className="block text-sm font-medium text-violet-700 mb-2">
                Age (months)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="ageMin"
                  value={filters.ageMin}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition"
                  placeholder="Min"
                  min="0"
                />
                <input
                  type="number"
                  name="ageMax"
                  value={filters.ageMax}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>

            {/* Filter by Vaccination Proof */}
            <div>
              <label className="block text-sm font-medium text-violet-700 mb-2">
                Vaccination Proof
              </label>
              <select
                name="vaccinationProof"
                value={filters.vaccinationProof}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-violet-50 border-none rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 transition appearance-none"
              >
                <option value="">All</option>
                <option value="with">With Proof</option>
                <option value="without">Without Proof</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-md p-3 sm:p-4 md:p-6 w-full">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500"></div>
              </div>
            ) : (
              <PostList posts={posts} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
