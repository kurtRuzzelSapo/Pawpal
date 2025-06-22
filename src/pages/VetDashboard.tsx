import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaCheck } from "react-icons/fa";

interface Post {
  id: number;
  name: string;
  image_url?: string;
  status: string;
  owner_id: string;
  health_notes?: string;
  health_info?: string;
  content?: string;
  breed?: string;
  age?: string;
  location?: string;
  size?: string;
  temperament?: string | string[];
  vaccination_status?: boolean;
  additional_photos?: string[];
  created_at?: string;
  vet_id?: string;
}

const VetSidebar = ({ activeSection }: { activeSection: string }) => {
  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 flex flex-col pt-8">
      <nav className="flex flex-col gap-2 px-4">
        <span className="text-violet-700 font-semibold text-lg mb-4">
          Vet Menu
        </span>
        <a
          href="#pending"
          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
            activeSection === "pending"
              ? "bg-violet-200 text-violet-900"
              : "hover:bg-violet-50 text-violet-800"
          }`}
        >
          Pending Listings
        </a>
        <a
          href="#history"
          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
            activeSection === "history"
              ? "bg-violet-200 text-violet-900"
              : "hover:bg-violet-50 text-violet-800"
          }`}
        >
          Adoption History
        </a>
      </nav>
    </aside>
  );
};

const VetNavbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-violet-700 text-white flex items-center justify-between px-8 shadow z-50">
      <div className="font-bold text-lg tracking-wide">Pawpal Vet</div>
      <div className="flex items-center gap-4">
        <span className="font-medium">
          {user?.user_metadata?.full_name || user?.email || "Vet"}
        </span>
        <button
          onClick={() => {
            signOut();
            navigate("/login");
          }}
          className="bg-white text-violet-700 px-4 py-2 rounded font-semibold hover:bg-violet-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default function VetDashboard() {
  const { user, role } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [history, setHistory] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ [key: number]: string }>({});
  const [activeSection, setActiveSection] = useState("pending");
  const pendingRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (role !== "vet") return;
    fetchPendingPosts();
    fetchHistory();
    // eslint-disable-next-line
  }, [user, role]);

  // Scroll section highlight logic
  useEffect(() => {
    const handleScroll = () => {
      const pendingTop = pendingRef.current?.getBoundingClientRect().top ?? 0;
      const historyTop = historyRef.current?.getBoundingClientRect().top ?? 0;
      if (pendingTop <= 100 && historyTop > 200) {
        setActiveSection("pending");
      } else if (historyTop <= 100) {
        setActiveSection("history");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getVetId = (user: { user_id?: string; id?: string }) =>
    user?.user_id || user?.id;

  const fetchPendingPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "pending");
    if (error) toast.error("Failed to fetch posts");
    else setPendingPosts(data || []);
    setLoading(false);
  };

  const fetchHistory = async () => {
    if (!user) return;
    const vetId = getVetId(user);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("vet_id", vetId)
      .eq("status", "approved");
    if (!error) setHistory(data || []);
  };

  const handleApprove = async (postId: number) => {
    if (!user) return;
    const healthNote = note[postId] !== undefined ? note[postId] : "";
    const { data, error } = await supabase
      .from("posts")
      .update({
        status: "approved",
        vet_id: getVetId(user),
        health_info: healthNote,
      })
      .eq("id", postId);

    console.log("Update result:", { data, error });

    if (!error) {
      toast.success("Post approved!");
      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
      setLoading(true);
      await fetchPendingPosts();
      await fetchHistory();
      setLoading(false);
    } else {
      console.error(error);
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (postId: number) => {
    if (!user) return;
    const healthNote = note[postId] !== undefined ? note[postId] : "";
    const { error } = await supabase
      .from("posts")
      .update({
        status: "rejected",
        vet_id: getVetId(user),
        health_info: healthNote,
      })
      .eq("id", postId);
    if (!error) {
      toast.success("Post rejected.");
      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
      setLoading(true);
      await fetchPendingPosts();
      await fetchHistory();
      setLoading(false);
    } else toast.error("Failed to reject");
  };

  // Modal component
  const PostPreviewModal = ({
    post,
    onClose,
  }: {
    post: Post;
    onClose: () => void;
  }) => {
    // Extract image URLs from health_info (simple regex for http(s) links ending in .jpg/.jpeg/.png/.webp)
    let proofImages: string[] = [];
    if (post.health_info) {
      const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp))/gi;
      proofImages = [...post.health_info.matchAll(urlRegex)].map((m) => m[0]);
    }
    return (
      <>
        {/* Animation style for modal */}
        <style>{`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .fade-in-scale {
            animation: fadeInScale 0.3s ease;
          }
        `}</style>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred, semi-transparent background */}
          <div
            className="absolute inset-0 bg-white/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />
          {/* Modal content with animation */}
          <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-lg fade-in-scale">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-violet-800">
              {post.name}
            </h2>
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div className="flex-shrink-0 flex justify-center items-center">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.name}
                    className="w-40 h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center bg-gray-200 rounded text-gray-500">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0 break-words">
                <div>
                  <span className="font-medium">Content:</span>{" "}
                  <span className="text-gray-700">{post.content || "-"}</span>
                </div>
                <div>
                  <span className="font-medium">Breed:</span>{" "}
                  <span className="text-gray-700">{post.breed || "-"}</span>
                </div>
                <div>
                  <span className="font-medium">Age:</span>{" "}
                  <span className="text-gray-700">{post.age || "-"}</span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  <span className="text-gray-700">{post.location || "-"}</span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>{" "}
                  <span className="text-gray-700">{post.size || "-"}</span>
                </div>
                <div>
                  <span className="font-medium">Temperament:</span>{" "}
                  <span className="text-gray-700">
                    {Array.isArray(post.temperament)
                      ? post.temperament.join(", ")
                      : post.temperament || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Vaccination Status:</span>{" "}
                  <span className="text-gray-700">
                    {post.vaccination_status ? "Vaccinated" : "Not Vaccinated"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Health Info:</span>{" "}
                  <span className="text-gray-700">
                    {post.health_info
                      ? post.health_info
                          .replace(
                            /https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/gi,
                            ""
                          )
                          .replace(/\s+/g, " ")
                          .trim()
                      : "-"}
                  </span>
                </div>
                {proofImages.length > 0 && (
                  <div className="mt-2">
                    {/* <span className="font-medium">Vaccination Proof:</span> */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proofImages.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Vaccination Proof ${idx + 1}`}
                          className="w-32 h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="text-gray-700">{post.status}</span>
                </div>
                <div>
                  <span className="font-medium">Created At:</span>{" "}
                  <span className="text-gray-700">
                    {post.created_at
                      ? new Date(post.created_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
            {post.additional_photos && post.additional_photos.length > 0 && (
              <div className="mb-2">
                <span className="font-medium">Additional Photos:</span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {post.additional_photos.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Additional ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  if (role !== "vet")
    return <div className="p-8 text-center text-red-500">Access denied.</div>;

  return (
    <>
      <VetNavbar />
      <div className="flex min-h-screen bg-gray-50 pt-16">
        <VetSidebar activeSection={activeSection} />
        <main className="flex-1 ml-64 p-8">
          <div
            ref={pendingRef}
            id="pending"
            className="bg-white rounded-lg shadow-md p-8 mb-8 w-full"
          >
            <h1 className="text-2xl font-bold mb-6 text-violet-800">
              Vet Dashboard
            </h1>
            <h2 className="text-xl font-semibold mb-4 text-violet-700">
              Pending Pet Listings
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
              </div>
            ) : pendingPosts.length === 0 ? (
              <div className="text-gray-500">No pending posts.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-violet-50 rounded-lg shadow p-4 flex flex-col"
                  >
                    <div className="flex justify-center mb-2">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.name}
                          className="w-28 h-28 object-cover rounded"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center bg-gray-200 rounded text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-lg text-violet-900 text-center mb-2">
                      {post.name}
                    </div>
                    <textarea
                      className="border rounded p-2 w-full mb-3"
                      value={note[post.id] || ""}
                      onChange={(e) =>
                        setNote((n) => ({ ...n, [post.id]: e.target.value }))
                      }
                      placeholder="Add health notes..."
                    />
                    <div className="flex gap-2 mt-auto mb-2">
                      <button
                        onClick={() => handleApprove(post.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-1/2 flex items-center justify-center"
                        aria-label="Approve"
                      >
                        <FaCheck className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleReject(post.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-1/2 flex items-center justify-center"
                        aria-label="Reject"
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setShowModal(true);
                      }}
                      className="mt-2 bg-violet-600 text-white px-3 py-1 rounded hover:bg-violet-700 transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            ref={historyRef}
            id="history"
            className="bg-white rounded-lg shadow-md p-8 w-full"
          >
            <h2 className="text-xl font-semibold mb-4 text-violet-700">
              Adoption History
            </h2>
            {history.length === 0 ? (
              <div className="text-gray-500">No adoption history.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {history.map((post) => (
                  <div
                    key={post.id}
                    className="bg-violet-50 rounded-lg shadow p-4 flex flex-col"
                  >
                    <div className="flex justify-center mb-2">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.name}
                          className="w-28 h-28 object-cover rounded"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center bg-gray-200 rounded text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-lg text-violet-900 text-center mb-2">
                      {post.name}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Health Notes: </span>
                      <span className="text-gray-700">
                        {post.health_info || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Status: </span>
                      <span className="text-violet-700">{post.status}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setShowModal(true);
                      }}
                      className="mt-2 bg-violet-600 text-white px-3 py-1 rounded hover:bg-violet-700 transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {showModal && selectedPost && (
            <PostPreviewModal
              post={selectedPost}
              onClose={() => setShowModal(false)}
            />
          )}
        </main>
      </div>
    </>
  );
}
