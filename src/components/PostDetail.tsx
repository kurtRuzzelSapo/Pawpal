// import { PostList } from "../components/PostList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Post } from "./PostList";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { FaPaw, FaMapMarkerAlt, FaSyringe, FaRuler, FaArrowLeft, FaTrash, FaCalendarAlt, FaHeartbeat, FaClock, FaHeart, FaHandHoldingHeart } from "react-icons/fa";
import { MdPets } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { AdoptionRequestsList } from "./AdoptionRequestsList";

const fetchPostById = async (postId: number): Promise<Post> => {
  const { data, error } = await supabase
    .from("post")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) throw error;
  return data;
};

const deletePost = async (post: Post) => {
  try {
    // First delete all comments for this post
    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .eq("post_id", post.id);

    if (commentsError) throw new Error(commentsError.message);

    // Delete all votes for this post
    const { error: votesError } = await supabase
      .from("votes")
      .delete()
      .eq("post_id", post.id);

    if (votesError) throw new Error(votesError.message);

    // Delete the main image
    if (post.image_url) {
      const mainImagePath = post.image_url.split('/').pop();
      if (mainImagePath) {
        await supabase.storage
          .from("post-images")
          .remove([mainImagePath]);
      }
    }

    // Delete additional photos
    if (post.additional_photos) {
      const additionalImagePaths = post.additional_photos.map(url => url.split('/').pop());
      await supabase.storage
        .from("post-images")
        .remove(additionalImagePaths.filter(Boolean) as string[]);
    }

    // Delete vaccination proof if it exists in health_info
    const vaccinationProofMatch = post.health_info?.match(/Vaccination Proof: (https:\/\/[^\s]+)/);
    if (vaccinationProofMatch) {
      const vaccinationProofPath = vaccinationProofMatch[1].split('/').pop();
      if (vaccinationProofPath) {
        await supabase.storage
          .from("post-images")
          .remove([vaccinationProofPath]);
      }
    }

    // Finally, delete the post record
    const { error: postError } = await supabase
      .from("post")
      .delete()
      .eq("id", post.id);

    if (postError) throw new Error(postError.message);
  } catch (error) {
    console.error("Error in deletePost:", error);
    throw error;
  }
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
    const { data, error } = await supabase
      .from("adoption_requests")
      .insert([
        {
          post_id: postId,
          requester_id: requesterId,
          owner_id: ownerId,
          status: "pending",
          created_at: new Date().toISOString()
        }
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
          message: `New adoption request for pet ID ${postId}`,
          created_at: new Date().toISOString(),
          read: false,
          link: `/post/${postId}`
        }
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
const cancelAdoptionRequest = async (
  postId: number,
  requesterId: string
) => {
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
          link: `/post/${postId}`
        }
      ]);

    if (notificationError) {
      console.error("Error creating cancellation notification:", notificationError);
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
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  
  // Create refs for sections we want to scroll to
  const adoptionRequestsRef = useRef<HTMLDivElement>(null);

  // Check if the user has already requested this pet
  useEffect(() => {
    if (user) {
      checkExistingRequest();
    }
  }, [user, postId]);

  const checkExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("adoption_requests")
        .select("*, status")
        .eq("post_id", parseInt(postId))
        .eq("requester_id", user?.id);

      if (error) {
        console.error("Error checking adoption request:", error);
        return;
      }

      if (data && data.length > 0) {
        setHasRequested(true);
        setRequestStatus(data[0].status);
      }
    } catch (error) {
      console.error("Error checking adoption request:", error);
    }
  };

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

  const { data, error, isLoading } = useQuery<Post, Error>({
    queryKey: ["PostID", postId],
    queryFn: () => fetchPostById(parseInt(postId)),
  });

  // Add effect to handle tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    if (tab === 'requests' && adoptionRequestsRef.current) {
      // Scroll to adoption requests section with a slight delay to ensure content is loaded
      setTimeout(() => {
        adoptionRequestsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.search, data]);

  const handleDelete = async () => {
    if (!data || !user || user.id !== data.user_id) {
      alert("You don't have permission to delete this post");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deletePost(data);
      // Invalidate queries and redirect to home
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleAdoptionRequest = async () => {
    if (!user) {
      toast.error("Please log in to request adoption");
      return;
    }
    
    if (!data || !data.user_id) {
      toast.error("Unable to process request. Missing pet information.");
      return;
    }

    try {
      setIsRequesting(true);
      await sendAdoptionRequest(
        parseInt(postId), 
        user.id, 
        data.user_id,
        data.name || "this pet"
      );
      setHasRequested(true);
      toast.success("Adoption request sent successfully! The owner will be notified.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send adoption request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user) {
      toast.error("Please log in to cancel your request");
      return;
    }
    
    if (!data) {
      toast.error("Unable to process request. Missing pet information.");
      return;
    }

    // Prevent cancellation if request is approved
    if (requestStatus === 'approved') {
      toast.error("Cannot cancel an approved adoption request. Please contact the pet owner.");
      return;
    }

    try {
      setIsRequesting(true);
      await cancelAdoptionRequest(parseInt(postId), user.id);
      setHasRequested(false);
      setRequestStatus(null);
      toast.success("Adoption request cancelled successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  // Function to get status color
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

  // Function to extract vaccination proof URL from health_info
  const extractVaccinationProof = (healthInfo: string) => {
    if (!healthInfo) return null;
    const match = healthInfo.match(/Vaccination Proof: (https:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  // Function to get clean health info without the vaccination proof URL
  const getCleanHealthInfo = (healthInfo: string) => {
    if (!healthInfo) return '';
    return healthInfo.replace(/Vaccination Proof: https:\/\/[^\s]+/g, '').trim();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-r-4 border-violet-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4 bg-red-50 rounded-xl p-6 shadow-md font-['Poppins']">
        <p className="text-xl font-medium mb-2">Oops! Something went wrong</p>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  const vaccinationProofUrl = data?.health_info ? extractVaccinationProof(data.health_info) : null;
  const cleanHealthInfo = data?.health_info ? getCleanHealthInfo(data.health_info) : '';
  
  // Determine if the adoption button should be visible
  const showAdoptionButton = user && data && 
    user.id !== data.user_id && // User is not the owner
    data.status === 'Available'; // Pet status is available

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

      {/* Navigation and Action Buttons */}
      <div className="flex justify-between items-center mb-6 reveal">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md font-['Poppins']"
        >
          <FaArrowLeft />
          <span>Back to Posts</span>
        </button>

        {user && data && user.id === data.user_id && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-md font-['Poppins']"
          >
            <FaTrash />
            <span>Delete Post</span>
          </button>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100 relative z-10">
        {/* Header with Avatar and Status */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {data?.avatar_url ? (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full opacity-75 blur-sm"></div>
              <img
                src={data.avatar_url}
                alt="User Avatar"
                  className="w-16 h-16 rounded-full object-cover relative border-2 border-white"
              />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-400 to-blue-400 flex items-center justify-center">
                <FaPaw className="text-white text-2xl" />
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold text-violet-800 font-['Quicksand']">{data?.name}</h2>
              {data?.breed && (
                <div className="text-violet-600 flex items-center font-['Poppins']">
                  <MdPets className="mr-1 text-violet-400" />
                  {data.breed}
                </div>
              )}
            </div>
          </div>
          {data?.status && (
            <span className={`px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getStatusColor(data.status)} shadow-md font-['Poppins']`}>
              {data.status}
            </span>
          )}
        </div>

        {/* Main Image */}
        {data?.image_url && (
          <div className="mb-6 rounded-xl overflow-hidden shadow-md">
            <img
              src={data.image_url}
              alt={data.name}
              className="w-full h-[400px] object-cover"
            />
          </div>
        )}

        {/* Pet Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-violet-800 mb-4 font-['Quicksand']">About {data?.name}</h3>
          <p className="text-gray-600 mb-6 font-['Poppins'] whitespace-pre-line">{data?.content}</p>
        </div>

        {/* Additional Photos Gallery */}
        {data?.additional_photos && data.additional_photos.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-violet-800 mb-4 font-['Quicksand'] flex items-center">
              <FaPaw className="mr-2 text-violet-400" />
              Additional Photos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.additional_photos.map((photo: string, index: number) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Additional photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-violet-100"
                />
              ))}
            </div>
          </div>
        )}

        {/* Pet Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-100">
            <h3 className="text-lg font-semibold text-violet-800 mb-4 font-['Quicksand']">Pet Details</h3>
          {/* Location and Age */}
            <div className="space-y-3 font-['Poppins']">
            {data?.location && (
                <div className="flex items-center text-violet-700">
                  <FaMapMarkerAlt className="mr-2 text-violet-500" />
                  <span><strong>Location:</strong> {data.location}</span>
              </div>
            )}
            {data?.age && (
                <div className="flex items-center text-violet-700">
                  <FaCalendarAlt className="mr-2 text-violet-500" />
                  <span><strong>Age:</strong> {data.age} months</span>
              </div>
            )}
            {data?.size && (
                <div className="flex items-center text-violet-700">
                  <FaRuler className="mr-2 text-violet-500" />
                  <span><strong>Size:</strong> {data.size}</span>
              </div>
            )}
            {data?.vaccination_status !== undefined && (
                <div className="flex items-center text-violet-700">
                  <FaSyringe className="mr-2 text-violet-500" />
                  <span><strong>Vaccination Status:</strong> {data.vaccination_status ? 'Vaccinated' : 'Not vaccinated'}</span>
                </div>
              )}
              {data?.created_at && (
                <div className="flex items-center text-violet-700">
                  <FaClock className="mr-2 text-violet-500" />
                  <span><strong>Posted:</strong> {new Date(data.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Health Info and Temperament */}
          <div className="space-y-6">
            {/* Health Info */}
            {cleanHealthInfo && (
              <div className="bg-violet-50 p-5 rounded-xl border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-800 mb-3 font-['Quicksand'] flex items-center">
                  <FaHeartbeat className="mr-2 text-violet-500" />
                  Health Information
                </h3>
                <p className="text-gray-600 whitespace-pre-line font-['Poppins']">{cleanHealthInfo}</p>
          </div>
        )}

            {/* Temperament */}
        {data?.temperament && data.temperament.length > 0 && (
              <div className="bg-violet-50 p-5 rounded-xl border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-800 mb-3 font-['Quicksand']">Temperament</h3>
            <div className="flex flex-wrap gap-2">
                  {data.temperament.map((trait, index) => (
                <span
                  key={index}
                      className="px-3 py-1 bg-white rounded-full text-violet-700 border border-violet-200 shadow-sm font-['Poppins'] text-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}
          </div>
        </div>

        {/* Vaccination Proof */}
        {vaccinationProofUrl && data?.vaccination_status && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-violet-800 mb-3 font-['Quicksand'] flex items-center">
              <FaSyringe className="mr-2 text-violet-500" />
              Vaccination Proof
            </h3>
            <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
              <img
                src={vaccinationProofUrl}
                alt="Vaccination Proof"
                className="max-w-full max-h-80 object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="mt-8 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Like Button */}
          <div>
            <LikeButton postId={parseInt(postId)} />
          </div>

          {/* Request Adoption Button - only shown if user is not the owner and pet is available */}
          {showAdoptionButton && (
            <div>
              {!hasRequested ? (
                <button
                  onClick={handleAdoptionRequest}
                  disabled={isRequesting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium font-['Poppins'] text-white transition-all duration-300 shadow-md bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transform hover:scale-105"
                >
                  <FaHandHoldingHeart className="text-xl" />
                  {isRequesting ? 'Sending Request...' : 'Request for Adoption'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className={`text-white rounded-lg p-3 flex items-center gap-2 font-['Poppins'] ${
                    requestStatus === 'approved' ? 'bg-green-500' : 
                    requestStatus === 'rejected' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}>
                    <FaHandHoldingHeart className="text-white" />
                    <span>
                      {requestStatus === 'approved' ? 'Adoption Request Approved!' : 
                       requestStatus === 'rejected' ? 'Adoption Request Rejected' :
                       'Adoption Requested'}
                    </span>
                  </div>
                  
                  {requestStatus === 'pending' && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={isRequesting}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium font-['Poppins'] text-white transition-all duration-300 shadow-md bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    >
                      {isRequesting ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                  
                  {requestStatus === 'approved' && (
                    <p className="text-green-600 text-xs text-center font-['Poppins']">
                      Your request has been approved! The owner will contact you soon.
                    </p>
                  )}
                  
                  {requestStatus === 'rejected' && (
                    <p className="text-red-600 text-xs text-center font-['Poppins']">
                      Your request has been rejected by the owner.
                    </p>
                  )}
                  
                  {requestStatus === 'pending' && (
                    <p className="text-yellow-600 text-xs text-center font-['Poppins']">
                      Your request is pending. The owner will review it soon.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-violet-800 mb-4 font-['Quicksand']">Comments</h3>
          <CommentSection postId={parseInt(postId)} />
        </div>

        {/* Adoption Requests Section - Only visible to post owner */}
        {user && data && user.id === data.user_id && (
          <div className="mt-8" ref={adoptionRequestsRef}>
            <AdoptionRequestsList postId={parseInt(postId)} ownerId={user.id} />
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