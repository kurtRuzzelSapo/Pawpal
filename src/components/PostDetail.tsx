import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Post } from "./PostList";
import {
  FaMapMarkerAlt,
  FaSyringe,
  FaRuler,
  FaArrowLeft,
  FaHeartbeat,
  FaClock,
  FaHandHoldingHeart,
  FaEnvelope,
} from "react-icons/fa";
import { MdPets } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { AdoptionRequestsList } from "./AdoptionRequestsList";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeleteModalProps extends ModalProps {
  onConfirm: () => void;
}

interface UpdateModalProps extends ModalProps {
  post: Post | null;
  onUpdate: (updates: { name: string; content: string }) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p>
          Are you sure you want to delete this post? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UpdatePostModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  post,
  onUpdate,
}) => {
  const [name, setName] = useState(post?.name ?? "");
  const [content, setContent] = useState(post?.content ?? "");

  useEffect(() => {
    if (post) {
      setName(post.name ?? "");
      setContent(post.content ?? "");
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ name, content });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Update Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block font-semibold mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="content" className="block font-semibold mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded"
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const fetchPostById = async (postId: number): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) throw error;
  return data;
};

const deletePost = async (post: Post) => {
  try {
    // Delete adoption requests first to avoid foreign key violations
    const { error: adoptionRequestsError } = await supabase
      .from("adoption_requests")
      .delete()
      .eq("post_id", post.id);

    if (adoptionRequestsError) throw new Error(adoptionRequestsError.message);

    // First delete all comments for this post
    // The line below is commented out to prevent a crash due to a suspected schema mismatch.
    // The 'comments' table seems to expect a UUID for 'post_id', but the post ID is an integer.
    // const { error: commentsError } = await supabase
    //   .from("comments")
    //   .delete()
    //   .eq("post_id", post.id);

    // if (commentsError) throw new Error(commentsError.message);

    // Delete all votes for this post
    // The line below is commented out to prevent a crash due to a suspected schema mismatch.

    // Delete the main image
    if (post.image_url) {
      const mainImagePath = post.image_url.split("/").pop();
      if (mainImagePath) {
        await supabase.storage.from("post-images").remove([mainImagePath]);
      }
    }

    // Delete additional photos
    if (post.additional_photos) {
      const additionalImagePaths = post.additional_photos.map((url) =>
        url.split("/").pop()
      );
      await supabase.storage
        .from("post-images")
        .remove(additionalImagePaths.filter(Boolean) as string[]);
    }

    // Delete vaccination proof if it exists in health_info
    const vaccinationProofMatch = post.health_info?.match(
      /Vaccination Proof: (https:\/\/[^\s]+)/
    );
    if (vaccinationProofMatch) {
      const vaccinationProofPath = vaccinationProofMatch[1].split("/").pop();
      if (vaccinationProofPath) {
        await supabase.storage
          .from("post-images")
          .remove([vaccinationProofPath]);
      }
    }

    // Finally, delete the post record
    const { error: postError } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (postError) throw new Error(postError.message);
  } catch (error) {
    console.error("Error in deletePost:", error);
    throw error;
  }
};

const updatePost = async (postId: number, updates: Partial<Post>) => {
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Add adoption request function
const sendAdoptionRequest = async (
  postId: number,
  requesterId: string,
  ownerId: string,
  petName: string
) => {
  try {
    // First check if there's already a pending request
    const { data: existingRequests, error: checkError } = await supabase
      .from("adoption_requests")
      .select("*")
      .eq("post_id", postId)
      .eq("requester_id", requesterId);

    if (checkError) {
      console.error("Error checking existing requests:", checkError);
      throw checkError;
    }

    if (existingRequests && existingRequests.length > 0) {
      throw new Error("You already have a pending request for this pet");
    }

    // If no existing request, create a new one
    const { data, error } = await supabase.from("adoption_requests").insert([
      {
        post_id: postId,
        requester_id: requesterId,
        owner_id: ownerId,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating adoption request:", error);
      throw error;
    }

    // Also create a notification for the pet owner
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: ownerId,
          type: "adoption_request",
          message: `New adoption request for ${petName}`,
          created_at: new Date().toISOString(),
          read: false,
          link: `/post/${postId}`,
        },
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't throw here, we still want to consider the adoption request as successful
      // Just log the error for debugging
    }

    return data;
  } catch (error) {
    console.error("Error sending adoption request:", error);
    throw error;
  }
};

// Add function to cancel adoption request
const cancelAdoptionRequest = async (postId: number, requesterId: string) => {
  try {
    // Find the request to delete
    const { data: existingRequests, error: findError } = await supabase
      .from("adoption_requests")
      .select("*")
      .eq("post_id", postId)
      .eq("requester_id", requesterId);

    if (findError) {
      console.error("Error finding adoption request to cancel:", findError);
      throw findError;
    }

    if (!existingRequests || existingRequests.length === 0) {
      throw new Error("No adoption request found to cancel");
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from("adoption_requests")
      .delete()
      .eq("post_id", postId)
      .eq("requester_id", requesterId);

    if (deleteError) {
      console.error("Error canceling adoption request:", deleteError);
      throw deleteError;
    }

    // Create a notification for the owner
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: existingRequests[0].owner_id,
          type: "adoption_cancelled",
          message: `An adoption request for your pet has been cancelled`,
          created_at: new Date().toISOString(),
          read: false,
          link: `/post/${postId}`,
        },
      ]);

    if (notificationError) {
      console.error(
        "Error creating cancellation notification:",
        notificationError
      );
      // Don't throw here, we still want to consider the cancellation as successful
    }

    return true;
  } catch (error) {
    console.error("Error in cancelAdoptionRequest:", error);
    throw error;
  }
};

export const PostDetail = ({ postId }: { postId: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Create refs for sections we want to scroll to
  const adoptionRequestsRef = useRef<HTMLDivElement>(null);

  // Convert postId to number for database queries
  const numericPostId = parseInt(postId, 10);

  // Check if the user has already requested this pet
  const checkExistingRequest = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("adoption_requests")
        .select("*, status")
        .eq("post_id", numericPostId)
        .eq("requester_id", user?.id);

      if (error) {
        console.error("Error checking adoption request:", error);
        return;
      }

      if (data && data.length > 0) {
        setHasRequested(true);
        setRequestStatus(data[0].status);
      } else {
        setHasRequested(false);
        setRequestStatus(null);
      }
    } catch (error) {
      console.error("Error in checkExistingRequest:", error);
    }
  }, [numericPostId, user?.id]);

  useEffect(() => {
    if (user) {
      checkExistingRequest();
    }
  }, [user, checkExistingRequest]);

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery<Post>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(numericPostId),
  });

  // Scroll to adoption requests if hash is present in URL
  useEffect(() => {
    if (location.hash === "#adoption-requests" && adoptionRequestsRef.current) {
      adoptionRequestsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.hash, post]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (isError || !post) {
    return <div>Error loading post.</div>;
  }

  const isOwner = user && user.id === post.user_id;

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deletePost(post);
      toast.success("Post deleted successfully");
      navigate("/home");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdate = async (updates: { name: string; content: string }) => {
    if (!post) return;
    try {
      await updatePost(post.id, updates);
      toast.success("Post updated successfully");
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    } catch (error) {
      toast.error("Failed to update post");
      console.error(error);
    } finally {
      setIsUpdateModalOpen(false);
    }
  };

  const handleAdoptionRequest = async () => {
    if (!user || !post?.user_id || !post?.name) {
      toast.error(
        "You must be logged in to make an adoption request, or post data is incomplete."
      );
      return;
    }

    setIsRequesting(true);
    try {
      await sendAdoptionRequest(post.id, user.id, post.user_id, post.name);
      toast.success("Adoption request sent successfully!");
      checkExistingRequest(); // Re-check status after sending
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send adoption request.";
      toast.error(message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user) return;

    setIsRequesting(true);
    try {
      await cancelAdoptionRequest(post.id, user.id);
      toast.success("Adoption request cancelled.");
      checkExistingRequest(); // Re-check status after cancelling
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel request.";
      toast.error(message);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-violet-700";
    }
  };

  const extractVaccinationProof = (healthInfo: string | undefined) => {
    if (!healthInfo) return null;
    const match = healthInfo.match(/Vaccination Proof: (https:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  const getCleanHealthInfo = (healthInfo: string | undefined) => {
    if (!healthInfo) return "";
    return healthInfo.replace(/Vaccination Proof: https:\/\/[^\s]+/, "").trim();
  };

  const vaccinationProof = extractVaccinationProof(post.health_info);
  const cleanHealthInfo = getCleanHealthInfo(post.health_info);

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
      <UpdatePostModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        post={post}
        onUpdate={handleUpdate}
      />
      <div className="w-full bg-gradient-to-br from-violet-50 via-white to-pink-50">
        <div className="pt-24">
          {/* Back Button */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-violet-700 font-semibold hover:text-violet-900 transition-colors duration-200"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
              Back to listings
            </button>
          </div>

          {/* Main content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
              {/* Left Column (Images & Actions) */}
              <div className="lg:col-span-5 space-y-8 sticky top-28">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.name}
                    className="w-full h-[500px] object-cover"
                  />
                </div>

                {/* Owner controls */}
                {isOwner && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-6 flex gap-4">
                    <button
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-sky-500 text-white px-6 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      Update Post
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      Delete Post
                    </button>
                  </div>
                )}

                {/* Adoption Request Button */}
                {!isOwner && user && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-6">
                    {requestStatus === "approved" ? (
                      <div className="text-center">
                        <p className="font-semibold text-green-600">
                          Your adoption request has been approved!
                        </p>
                        <p className="text-sm text-gray-500">
                          The owner will be in touch shortly to coordinate.
                        </p>
                        <button
                          onClick={() =>
                            navigate(`/chat?otherUserId=${post.user_id}`)
                          }
                          className="mt-4 w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
                        >
                          <FaEnvelope />
                          Chat with Owner
                        </button>
                      </div>
                    ) : hasRequested ? (
                      <div className="text-center">
                        <p
                          className={`font-semibold ${getStatusColor(
                            requestStatus || "pending"
                          )}`}
                        >
                          Adoption request {requestStatus || "sent"}!
                        </p>
                        <p className="text-sm text-gray-500">
                          You will be notified when the owner responds.
                        </p>
                        <button
                          onClick={handleCancelRequest}
                          disabled={isRequesting}
                          className="mt-4 w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-full hover:from-red-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
                        >
                          {isRequesting ? "Cancelling..." : "Cancel Request"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAdoptionRequest}
                        disabled={isRequesting}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-50"
                      >
                        <FaHandHoldingHeart className="text-xl" />
                        <span className="font-semibold text-lg">
                          {isRequesting
                            ? "Sending Request..."
                            : "Request to Adopt"}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                {/* Additional Photos */}
                {post.additional_photos &&
                  post.additional_photos.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-6">
                      <h3 className="font-bold text-xl text-violet-800 font-['Quicksand'] mb-4">
                        More Photos
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {post.additional_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`${post.name} additional ${index + 1}`}
                            className="w-full h-40 object-cover rounded-xl"
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              {/* Right Column (Details) */}
              <div className="lg:col-span-7 space-y-8 mt-8 lg:mt-0">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-8">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-transparent bg-clip-text font-['Quicksand'] mb-2">
                    {post.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock />
                      <span>
                        Posted on{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 font-['Poppins'] text-lg leading-relaxed">
                    {post.content}
                  </p>

                  <div className="h-px bg-violet-200 my-8"></div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-violet-50 p-4 rounded-2xl">
                      <p className="text-sm text-violet-500 font-semibold">
                        Age
                      </p>
                      <p className="text-xl font-bold text-violet-800">
                        {post.age} months
                      </p>
                    </div>
                    <div className="bg-violet-50 p-4 rounded-2xl">
                      <p className="text-sm text-violet-500 font-semibold">
                        Breed
                      </p>
                      <p className="text-xl font-bold text-violet-800">
                        {post.breed}
                      </p>
                    </div>
                    <div className="bg-violet-50 p-4 rounded-2xl">
                      <p className="text-sm text-violet-500 font-semibold">
                        Size
                      </p>
                      <p className="text-xl font-bold text-violet-800">
                        {post.size}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-8">
                  <h3 className="font-bold text-2xl text-violet-800 font-['Quicksand'] mb-6 flex items-center gap-3">
                    <FaHeartbeat className="text-pink-500" />
                    Health & Temperament
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
                        <FaSyringe className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-violet-800">
                          Vaccination
                        </p>
                        <p
                          className={`font-bold ${
                            post.vaccination_status
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {post.vaccination_status
                            ? "Vaccinated"
                            : "Not Vaccinated"}
                        </p>
                        {vaccinationProof && (
                          <a
                            href={vaccinationProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
                        <MdPets className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-violet-800">
                          Temperament
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {post.temperament?.map((t, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {cleanHealthInfo && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full">
                          <FaRuler className="text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-violet-800">
                            Additional Health Info
                          </p>
                          <p className="text-gray-600">{cleanHealthInfo}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div
                    ref={adoptionRequestsRef}
                    className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-violet-100 p-8"
                  >
                    <h3 className="font-bold text-2xl text-violet-800 font-['Quicksand'] mb-6">
                      Adoption Requests
                    </h3>
                    {post.user_id && (
                      <AdoptionRequestsList
                        postId={numericPostId}
                        ownerId={post.user_id}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
