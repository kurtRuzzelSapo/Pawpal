import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaMapMarkerAlt, FaPaw, FaHeart, FaShieldAlt, FaChartPie, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaPlusCircle, FaEye, FaDownload, FaFile, FaFileImage } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface UserData {
  id: string;
  bio: string;
  location: string;
  is_shelter: boolean;
  verified: boolean;
  adoption_history: string[];
  favorites: string[];
  username?: string;
  avatar_url?: string;
}

interface Badge {
  id: number;
  badge_type: string;
  awarded_at: string;
}

interface Post {
  id: number;
  name: string;
  image_url: string;
  status: string;
  created_at: string;
  breed: string;
  content: string;
  adoption_count?: number;
  request_count?: number;
}

interface UserStats {
  total_posts: number;
  available_pets: number;
  adopted_pets: number;
  pending_pets: number;
  adoption_rate: number;
}

interface UserDocument {
  name: string;
  created_at: string;
  url: string;
  size: number;
  content_type?: string;
  isUserFolder?: boolean;
  bucket?: string;
  fromDatabase?: boolean;
  full_path?: string;
  user_id?: string | null;
}



// Fetch user posts with adoption request counts
const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  // Get all posts by this user
  const { data, error } = await supabase
    .from("post")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // For each post, get adoption request counts
  if (data && data.length > 0) {
    for (const post of data) {
      // Get adoption request count
      const { count: requestCount, error: requestError } = await supabase
        .from("adoption_requests")
        .select("*", { count: 'exact', head: true })
        .eq("post_id", post.id);
        
      if (!requestError) {
        post.request_count = requestCount || 0;
      }
      
      // Get approved adoption count
      const { count: adoptionCount, error: adoptionError } = await supabase
        .from("adoption_requests")
        .select("*", { count: 'exact', head: true })
        .eq("post_id", post.id)
        .eq("status", "approved");
        
      if (!adoptionError) {
        post.adoption_count = adoptionCount || 0;
      }
    }
  }
  
  return data || [];
};

// Calculate user stats based on posts and adoption requests
const calculateUserStats = (posts: Post[]): UserStats => {
  const total_posts = posts.length;
  const available_pets = posts.filter(post => post.status === "Available").length;
  const adopted_pets = posts.filter(post => post.status === "Adopted").length;
  const pending_pets = posts.filter(post => post.status === "Pending").length;
  
  // Calculate adoption rate (approved adoptions / total posts with requests)
  const postsWithRequests = posts.filter(post => (post.request_count || 0) > 0).length;
  const adoption_rate = postsWithRequests > 0 
    ? (adopted_pets / postsWithRequests) * 100 
    : 0;
    
  return {
    total_posts,
    available_pets,
    adopted_pets,
    pending_pets,
    adoption_rate
  };
};

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
      favorites: [],
      username: "",
      avatar_url: ""
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

// Function to ensure the user's folder exists in the documents bucket
const ensureUserFolderExists = async (userId: string): Promise<void> => {
  try {
    // We don't need to create folders explicitly in Supabase storage
    // They're created automatically when files are uploaded to a path
    // But we can check if the folder exists by listing its contents
    const { data, error } = await supabase.storage
      .from('documents')
      .list('', { // List root folder instead of user folder
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    console.log("Storage bucket contents:", data); // Debug output
    
    // If we get a "not found" error, we'll create an empty folder marker
    if (error && error.message.includes("Not Found")) {
      // No need to create a folder if listing the root
      console.log("Root folder not found, but this shouldn't happen");
    }
  } catch (error) {
    console.error("Error checking storage bucket:", error);
    // We'll continue anyway and let the upload handle any errors
  }
};

const fetchUserDocuments = async (userId: string): Promise<UserDocument[]> => {
  try {
    console.log("Fetching documents for user:", userId);
    
    // List all files in the bucket without filtering by user_id path
    const { data: filesData, error: filesError } = await supabase.storage
      .from('documents')
      .list('', {
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (filesError) {
      console.error("Error listing files:", filesError);
      return [];
    }
    
    if (!filesData || filesData.length === 0) {
      console.log("No files found in storage");
      return [];
    }
    
    console.log("Files found in storage:", filesData);
    
    // For each file, get a public URL
    const documents = await Promise.all(
      filesData.map(async (file) => {
        const { data: publicUrlData } = await supabase.storage
          .from('documents')
          .getPublicUrl(file.name);
          
        console.log(`Generated URL for ${file.name}:`, publicUrlData.publicUrl);
        
        return {
          name: file.name,
          full_path: file.name,
          created_at: file.created_at || new Date().toISOString(),
          url: publicUrlData.publicUrl,
          size: file.metadata?.size || 0,
          content_type: file.metadata?.mimetype || guessContentType(file.name),
          bucket: 'documents',
          user_id: extractUserIdFromFilename(file.name) // Extract user ID from filename
        };
      })
    );
    
    // Filter to only show files that belong to this user
    const userDocuments = documents.filter(doc => {
      // Check if filename contains user ID indicators
      const belongsToUser = 
        (doc.name.includes(`user_upload_`) && doc.name.includes(`_${userId}_`)) || // New format with user ID
        (doc.name.includes(`user_upload_`) && doc.user_id === userId) || // Extract user ID if possible
        doc.name.includes(`${userId}`); // Direct user ID in filename
        
      return belongsToUser;
    });
    
    console.log("Filtered user documents:", userDocuments);
    
    return userDocuments;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

// Helper function to extract user ID from filename if present
const extractUserIdFromFilename = (filename: string): string | null => {
  // Check if filename contains user ID pattern like "user_upload_UID_123456_filename.jpg"
  const userIdMatch = filename.match(/user_upload_([a-zA-Z0-9-]+)_/);
  return userIdMatch ? userIdMatch[1] : null;
};

// Helper function to guess content type from filename
const guessContentType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

interface UserProfileProps {
  profileId?: string; // Optional profile ID to view someone else's profile
}

export const UserProfile = ({ profileId }: UserProfileProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'analytics'>('profile');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showImagesGallery, setShowImagesGallery] = useState(false);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which user profile to show - current user or requested profile
  const targetUserId = profileId || (user?.id || "");
  
  // Check if viewing own profile
  const isOwnProfile = !profileId || (user && profileId === user.id);

  useEffect(() => {
    // Make all reveal elements visible immediately on load
    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => {
      el.classList.add('visible');
    });
  }, [activeTab]);

  const { data: userData, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery<UserData, Error>({
    queryKey: ["userData", targetUserId],
    queryFn: () => fetchUserData(targetUserId),
    enabled: targetUserId !== "",
    retry: 1
  });

  // Initialize bio from userData when it loads
  useEffect(() => {
    if (userData) {
      setNewBio(userData.bio || "");
    }
  }, [userData]);

  // Function to update bio
  const updateBio = async () => {
    if (!user || !isOwnProfile) return;
    
    try {
      const { error } = await supabase
        .from("users")
        .update({ bio: newBio })
        .eq("id", user.id);
        
      if (error) throw error;
      
      // Refresh user data
      refetchUser();
      setIsEditingBio(false);
      setUploadMessage("Bio updated successfully!");
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating bio:", error);
      setUploadMessage("Failed to update bio: " + error.message);
    }
  };

  // Function to handle document upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !isOwnProfile) return;
    
    try {
      setIsUploading(true);
      setUploadMessage("Uploading image...");
      
      // Check if the file is an image
      if (!file.type.includes('image/')) {
        setUploadMessage("Please select an image file (JPG, PNG, GIF, etc.)");
        setIsUploading(false);
        return;
      }
      
      // Create a unique filename WITH USER ID to ensure proper filtering
      const fileName = `user_upload_${user.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      // Using a generic path that doesn't require user_id in path for RLS
      const filePath = fileName;
      
      console.log(`Uploading image: ${filePath}, type: ${file.type}`);
      
      // Upload to the documents bucket that exists in your project
      // without relying on user_id in the path (which might be causing RLS issues)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        // Check if it's an RLS error and provide specific guidance
        if (uploadError.message?.includes("row-level security") || 
            uploadError.message?.includes("Unauthorized") ||
            uploadError.message?.includes("403")) {
          console.error("RLS policy violation during upload:", uploadError);
          setUploadMessage("Upload failed due to permission settings. Please check Supabase RLS policies.");
          return;
        }
        
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      // Get the public URL of the uploaded file
      const { data: publicURLData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      console.log("Upload successful:", uploadData, "Public URL:", publicURLData);
      
      // Skip inserting to the database entirely - this avoids RLS issues
      // We'll just rely on storage for files
      
      setUploadMessage("Image uploaded successfully!");
      
      // Close the upload panel after a short delay and refresh files
      setTimeout(() => {
        setIsUploadingDoc(false);
        refetchFilesDirectly();
      }, 1500);
      
    } catch (error: any) {
      console.error("Error uploading image:", error);
      
      // Provide specific guidance for RLS errors
      if (error.message?.includes("row-level security") || 
          error.message?.includes("Unauthorized") ||
          error.message?.includes("403")) {
        setUploadMessage("Permission error: The application doesn't have rights to upload files.");
      } else {
        setUploadMessage(`Upload failed: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Clear message after a delay (unless it's an error)
      if (!uploadMessage.includes("failed") && !uploadMessage.includes("error")) {
        setTimeout(() => setUploadMessage(""), 5000);
      }
    }
  };

  // Add a new function to directly fetch and display files from storage
  const refetchFilesDirectly = async () => {
    if (!user) return;
    
    try {
      // Just list all files in the documents bucket without filtering by user
      const { data: allFiles, error } = await supabase.storage
        .from('documents')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.error("Error listing files:", error);
        return;
      }
      
      // Process files and update UI directly without going through the query system
      if (allFiles && allFiles.length > 0) {
        const processedFiles = await Promise.all(
          allFiles.map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from('documents')
              .getPublicUrl(file.name);
              
            return {
              name: file.name,
              created_at: file.created_at || new Date().toISOString(),
              url: urlData.publicUrl,
              size: file.metadata?.size || 0,
              content_type: file.metadata?.mimetype || guessContentType(file.name)
            };
          })
        );
        
        // Force a refresh of the documents query
        refetchDocuments();
      }
    } catch (err) {
      console.error("Error refreshing files:", err);
    }
  };

  // Function to delete a document - simplified to avoid RLS issues
  const handleDeleteDocument = async (fileName: string, fullPath?: string) => {
    if (!user || !isOwnProfile) return;
    
    try {
      setUploadMessage("Deleting document...");
      // Just use the filename directly - no user path
      const filePath = fullPath || fileName;
      console.log(`Attempting to delete file: ${filePath}`);
      
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      if (error) {
        console.error("Error deleting file:", error);
        throw error;
      }
      
      setUploadMessage("Document deleted successfully!");
      
      // Refresh files
      refetchFilesDirectly();
      
      // Close the modal if it's open
      if (showDocumentModal) {
        setShowDocumentModal(false);
      }
      
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setUploadMessage(`Delete failed: ${error.message}`);
    } finally {
      // Clear success message after 5 seconds
      if (uploadMessage.includes("success")) {
        setTimeout(() => setUploadMessage(""), 5000);
      }
    }
  };

  // Query for user documents - only fetch for own profile
  const { data: userDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<UserDocument[], Error>({
    queryKey: ["userDocuments", targetUserId],
    queryFn: () => fetchUserDocuments(targetUserId),
    enabled: targetUserId !== "" && (isOwnProfile === true),
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Filter documents to only show images with proper typing
  const imageDocuments = (userDocuments || []).filter((doc: UserDocument) => {
    const isImage = doc.content_type?.includes('image');
    console.log(`File ${doc.name}: content_type=${doc.content_type}, isImage=${isImage}`);
    return isImage;
  });

  useEffect(() => {
    // Debug output whenever image documents change
    console.log("Image documents:", imageDocuments);
  }, [imageDocuments]);

  // Query for user posts
  const { data: userPosts, isLoading: postsLoading } = useQuery<Post[], Error>({
    queryKey: ["userPosts", targetUserId],
    queryFn: () => fetchUserPosts(targetUserId),
    enabled: !!targetUserId,
  });
  
  // Calculate user stats from posts
  const userStats: UserStats | undefined = userPosts ? calculateUserStats(userPosts) : undefined;

  const { data: badges, isLoading: badgesLoading } = useQuery<Badge[], Error>({
    queryKey: ["userBadges", targetUserId],
    queryFn: () => fetchUserBadges(targetUserId),
    enabled: !!targetUserId,
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

  if (userLoading || badgesLoading || postsLoading || documentsLoading) {
    return (
      <div className="flex justify-center items-center py-10 min-h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500 border-r-4 border-violet-300"></div>
      </div>
    );
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-500 bg-green-50 border-green-100';
      case 'Pending':
        return 'text-yellow-500 bg-yellow-50 border-yellow-100';
      case 'Adopted':
        return 'text-blue-500 bg-blue-50 border-blue-100';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white w-full">
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        {/* Document Preview Modal */}
        {showDocumentModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowDocumentModal(false)}>
            <div className="bg-white rounded-xl overflow-hidden shadow-lg max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 bg-violet-100 flex justify-between items-center">
                <h3 className="text-violet-800 font-medium">
                  {selectedDocument.name.includes('_') 
                    ? selectedDocument.name.split('_').slice(1).join('_') // Show the original filename
                    : selectedDocument.name}
                </h3>
                <button 
                  onClick={() => setShowDocumentModal(false)}
                  className="text-violet-800 hover:text-violet-950"
                >
                  ✕
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[70vh]">
                {selectedDocument.content_type?.includes('image') ? (
                  <img 
                    src={selectedDocument.url} 
                    alt=""
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error(`Error loading image in modal: ${selectedDocument.url}`);
                      e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Loading+Error';
                    }}
                  />
                ) : selectedDocument.content_type?.includes('pdf') ? (
                  <iframe 
                    src={`${selectedDocument.url}#view=FitH`} 
                    title={selectedDocument.name}
                    className="w-full h-[70vh]"
                  />
                ) : (
                  <div className="text-center p-10">
                    <FaFile className="text-6xl text-blue-500 mx-auto mb-4" />
                    <p>This document type cannot be previewed</p>
                    <a 
                      href={selectedDocument.url} 
                      download 
                      className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 flex justify-between">
                <span className="text-sm text-gray-600">
                  Uploaded: {new Date(selectedDocument.created_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <a 
                    href={selectedDocument.url} 
                    download
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaDownload size={14} /> Download
                  </a>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeleteDocument(selectedDocument.name, selectedDocument.full_path)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <FaTimesCircle size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Images Gallery Modal */}
        {showImagesGallery && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={() => setShowImagesGallery(false)}>
            <div className="p-4 flex justify-between items-center bg-violet-800/30 backdrop-blur-sm">
              <h3 className="text-white font-medium text-xl">
                {isOwnProfile ? "Your Images Gallery" : "Images Gallery"}
              </h3>
              <button 
                onClick={() => setShowImagesGallery(false)}
                className="text-white hover:text-violet-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
              {imageDocuments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageDocuments.map((image: UserDocument, index: number) => (
                    <div 
                      key={index}
                      className="relative group rounded-xl overflow-hidden shadow-lg bg-violet-900/20 hover:shadow-xl transition-all duration-300"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-48 object-cover object-center"
                        onClick={() => {
                          setSelectedDocument(image);
                          setShowImagesGallery(false);
                          setShowDocumentModal(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-white text-sm font-medium truncate">{image.name}</p>
                        <p className="text-white/70 text-xs">{new Date(image.created_at).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          <a 
                            href={image.url} 
                            download
                            className="p-1.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaDownload size={14} />
                          </a>
                          {isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(image.name, image.full_path);
                              }}
                              className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                              <FaTimesCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <FaFileImage className="text-6xl mb-4 text-violet-300" />
                  <p className="text-xl mb-2">No images uploaded yet</p>
                  {isOwnProfile && (
                    <>
                      <p className="text-sm opacity-70 mb-6">Upload images to view them in this gallery</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImagesGallery(false);
                          setIsUploadingDoc(true);
                        }}
                        className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transition-all"
                      >
                        Upload Images
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-violet-800 font-['Quicksand']">
            {isOwnProfile ? "Your Account" : "User Profile"}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto mt-2 mb-4"></div>
        </div>

        {/* Tab Navigation - only show all tabs for own profile */}
        <div className="mb-6 bg-white/90 backdrop-blur-lg rounded-xl overflow-hidden shadow-sm">
          <div className={`grid ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-2 flex items-center justify-center gap-2 font-medium transition-all ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white' 
                  : 'bg-transparent text-violet-700 hover:bg-violet-50'
              }`}
            >
              <FaUser className="text-lg" /> 
              <span className="text-sm md:text-base">Profile</span>
            </button>
            
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-3 px-2 flex items-center justify-center gap-2 font-medium transition-all ${
                    activeTab === 'posts' 
                      ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white' 
                      : 'bg-transparent text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  <FaPaw className="text-lg" /> 
                  <span className="text-sm md:text-base">Your Posts</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-3 px-2 flex items-center justify-center gap-2 font-medium transition-all ${
                    activeTab === 'analytics' 
                      ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white' 
                      : 'bg-transparent text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  <FaChartPie className="text-lg" /> 
                  <span className="text-sm md:text-base">Analytics</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main content container */}
        <div className="min-h-[calc(100vh-180px)]">
          {/* Profile Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6 visible">
              {/* Profile Header */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
                <div className="flex items-start justify-between flex-wrap md:flex-nowrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full opacity-75 blur-sm"></div>
                      {userData?.avatar_url ? (
                        <img 
                          src={userData.avatar_url} 
                          alt="User Avatar" 
                          className="w-20 h-20 rounded-full object-cover relative border-2 border-white"
                        />
                      ) : user?.user_metadata?.avatar_url && isOwnProfile ? (
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
                        {isOwnProfile ? 
                          (user?.user_metadata?.full_name || user?.email) : 
                          (userData?.username || "User")}
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

                {/* Bio with Edit button */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-violet-800 font-['Quicksand']">About Me</h3>
                    {isOwnProfile && (
                      <button 
                        onClick={() => setIsEditingBio(!isEditingBio)}
                        className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-1"
                      >
                        <span>{isEditingBio ? "Cancel" : "Edit"}</span>
                        {!isEditingBio && <span>✏️</span>}
                      </button>
                    )}
                  </div>
                  
                  {isOwnProfile && isEditingBio ? (
                    <div>
                      <textarea
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        className="w-full p-4 rounded-xl bg-violet-50 border border-violet-200 focus:border-violet-400 font-['Poppins'] min-h-[120px]"
                        placeholder="Tell others about yourself..."
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={updateBio}
                          className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 bg-violet-50 p-4 rounded-xl font-['Poppins']">
                      {userData?.bio || "No bio provided"}
                    </p>
                  )}
                </div>
              </div>

              {/* Image Gallery Section - Enhanced UI - Only show for own profile */}
              {isOwnProfile && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-violet-800 flex items-center font-['Quicksand']">
                      <FaFileImage className="mr-2 text-violet-500" />
                      My Images {imageDocuments ? `(${imageDocuments.length})` : '(0)'}
                    </h2>
                    <button
                      onClick={() => setIsUploadingDoc(true)}
                      className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:from-violet-600 hover:to-blue-600 transition-all flex items-center gap-1"
                    >
                      <FaPlusCircle className="text-sm" /> Upload New Image
                    </button>
                  </div>
                  
                  {uploadMessage && (
                    <div className={`p-3 rounded-lg mb-4 text-center ${
                      uploadMessage.includes("success") 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : uploadMessage.includes("failed") || uploadMessage.includes("Error")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {uploadMessage}
                    </div>
                  )}

                  {isUploadingDoc && (
                    <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                      <h3 className="text-lg font-medium text-violet-800 mb-2">Upload Image</h3>
                      <p className="text-sm text-violet-600 mb-4">
                        Upload an image to your profile. Supported formats: JPG, PNG, GIF, WebP.
                      </p>
                      
                      <input
                        type="file"
                        id="imageUpload"
                        ref={fileInputRef}
                        onChange={handleDocUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="w-full flex items-center justify-center p-6 border-2 border-dashed border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100/50 transition bg-white">
                        <label htmlFor="imageUpload" className="flex flex-col items-center cursor-pointer">
                          <FaFileImage className="text-4xl text-violet-400" />
                          <span className="text-sm text-violet-500 mt-2 text-center font-['Poppins']">
                            Click to select an image
                          </span>
                          {isUploading && (
                            <div className="mt-3 flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-violet-600 mr-2"></div>
                              <span className="text-sm text-violet-600">Uploading...</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {imageDocuments && imageDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imageDocuments.map((image: UserDocument, index: number) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow border border-violet-100"
                        >
                          <div className="relative aspect-square">
                            <img 
                              src={image.url} 
                              alt=""
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => {
                                setSelectedDocument(image);
                                setShowDocumentModal(true);
                              }}
                              onError={(e) => {
                                console.error(`Error loading image: ${image.url}`);
                                e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Error';
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-500">
                                {new Date(image.created_at).toLocaleDateString()}
                              </p>
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => {
                                    setSelectedDocument(image);
                                    setShowDocumentModal(true);
                                  }}
                                  className="p-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-all"
                                  title="View image"
                                >
                                  <FaEye size={14} />
                                </button>
                                <a 
                                  href={image.url} 
                                  download
                                  className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                                  title="Download image"
                                >
                                  <FaDownload size={14} />
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(image.name, image.full_path)}
                                  className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                                  title="Delete image"
                                >
                                  <FaTimesCircle size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-violet-50 rounded-xl mt-4">
                      <FaFileImage className="text-5xl mx-auto mb-4 text-violet-300" />
                      <p className="text-xl mb-2 text-violet-700">No images uploaded yet</p>
                      <button
                        onClick={() => setIsUploadingDoc(true)}
                        className="mt-4 inline-block bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md flex items-center gap-2 mx-auto"
                      >
                        <FaPlusCircle /> Upload Your First Image
                      </button>
                    </div>
                  )}
                  
                  {imageDocuments && imageDocuments.length > 0 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowImagesGallery(true)}
                        className="text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1.5 mx-auto"
                      >
                        <FaEye size={16} /> View All Images in Gallery
                      </button>
                    </div>
                  )}
                </div>
              )}

             

              {/* Adoption History */}
              {userData?.adoption_history && userData.adoption_history.length > 0 ? (
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
              ) : (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 reveal border border-violet-100">
                  <h2 className="text-xl font-bold text-violet-800 mb-4 flex items-center font-['Quicksand']">
                    <FaPaw className="mr-2 text-violet-500" />
                    Adoption History
                  </h2>
                  <div className="text-center py-8 text-violet-600">
                    <p>You haven't adopted any pets yet</p>
                    <p className="text-sm mt-2">Your adoption history will appear here</p>
                  </div>
                </div>
              )}

              {/* Favorites */}
              {userData?.favorites && userData.favorites.length > 0 ? (
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
              ) : (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 reveal border border-violet-100">
                  <h2 className="text-xl font-bold text-violet-800 mb-4 flex items-center font-['Quicksand']">
                    <FaHeart className="mr-2 text-pink-500" />
                    Favorite Pets
                  </h2>
                  <div className="text-center py-8 text-violet-600">
                    <p>You don't have any favorite pets yet</p>
                    <p className="text-sm mt-2">Like pets to add them to your favorites!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="visible">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 border border-violet-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-violet-800 flex items-center font-['Quicksand']">
                    <FaPaw className="mr-2 text-violet-500" />
                    Your Pet Listings
                  </h2>
                  <Link to="/create" className="bg-gradient-to-r from-violet-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-violet-600 hover:to-blue-600 transition-all duration-300 flex items-center">
                    <FaPlusCircle className="mr-2" /> New Post
                  </Link>
                </div>

                {userPosts && userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPosts.map(post => (
                      <Link 
                        to={`/post/${post.id}`}
                        key={post.id}
                        className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow border border-violet-100 hover:border-violet-200"
                      >
                        <div className="relative h-40">
                          <img
                            src={post.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt={post.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Unavailable';
                            }}
                          />
                          <div className="absolute top-0 right-0 m-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </div>
                          {(post.request_count || 0) > 0 && (
                            <div className="absolute bottom-0 right-0 m-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-violet-800 border border-violet-100">
                              {post.request_count} {post.request_count === 1 ? 'Request' : 'Requests'}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-violet-800 truncate">{post.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">{post.content}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-violet-50 rounded-xl">
                    <FaPaw className="text-5xl mx-auto mb-4 text-violet-300" />
                    <p className="text-xl mb-2 text-violet-700">You haven't posted any pets yet</p>
                    <Link 
                      to="/create"
                      className="mt-4 inline-block bg-gradient-to-r from-violet-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md"
                    >
                      Create Your First Post
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && userStats && (
            <div className="visible">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-md p-6 mb-6 border border-violet-100">
                <h2 className="text-xl font-bold text-violet-800 flex items-center font-['Quicksand'] mb-6">
                  <FaChartPie className="mr-2 text-violet-500" />
                  Your Pet Adoption Analytics
                </h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-violet-50 to-blue-50 p-4 rounded-xl border border-violet-100 text-center">
                    <h3 className="text-sm font-medium text-violet-700 mb-2">Total Pets</h3>
                    <p className="text-3xl font-bold text-violet-800">{userStats.total_posts}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 text-center">
                    <h3 className="text-sm font-medium text-green-700 mb-2">Available</h3>
                    <p className="text-3xl font-bold text-green-800">{userStats.available_pets}</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100 text-center">
                    <h3 className="text-sm font-medium text-yellow-700 mb-2">Pending</h3>
                    <p className="text-3xl font-bold text-yellow-800">{userStats.pending_pets}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-100 text-center">
                    <h3 className="text-sm font-medium text-blue-700 mb-2">Adopted</h3>
                    <p className="text-3xl font-bold text-blue-800">{userStats.adopted_pets}</p>
                  </div>
                </div>

                {/* Adoption Success Rate */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-violet-100 mb-8">
                  <h3 className="text-lg font-medium text-violet-800 mb-4">Adoption Success Rate</h3>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                      style={{ width: `${userStats.adoption_rate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>0%</span>
                    <span className="font-medium text-violet-800">{userStats.adoption_rate.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Posts by Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-violet-100">
                  <h3 className="text-lg font-medium text-violet-800 mb-4">Posts by Status</h3>
                  <div className="flex items-center gap-4 justify-center">
                    {/* Visual chart representation */}
                    <div className="flex h-60 items-end gap-8 mt-2">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-20 bg-green-400 rounded-t-lg relative hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ height: `${(userStats.available_pets / Math.max(userStats.total_posts, 1)) * 200}px` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 font-bold">
                            {userStats.available_pets}
                          </span>
                        </div>
                        <span className="mt-2 text-sm font-medium flex items-center gap-1 text-green-700">
                          <FaCheckCircle /> Available
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-20 bg-yellow-400 rounded-t-lg relative hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ height: `${(userStats.pending_pets / Math.max(userStats.total_posts, 1)) * 200}px` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 font-bold">
                            {userStats.pending_pets}
                          </span>
                        </div>
                        <span className="mt-2 text-sm font-medium flex items-center gap-1 text-yellow-700">
                          <FaHourglassHalf /> Pending
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-20 bg-blue-400 rounded-t-lg relative hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ height: `${(userStats.adopted_pets / Math.max(userStats.total_posts, 1)) * 200}px` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 font-bold">
                            {userStats.adopted_pets}
                          </span>
                        </div>
                        <span className="mt-2 text-sm font-medium flex items-center gap-1 text-blue-700">
                          <FaHeart /> Adopted
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Animation styles - modified to show content right away */}
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
              opacity: 1; /* Start visible */
              transform: translateY(0); /* Start in final position */
              transition: all 0.3s ease-out;
            }
            .reveal.visible {
              opacity: 1;
              transform: translateY(0);
            }
            /* Full screen styling */
            html, body, #root {
              height: 100%;
              margin: 0;
              padding: 0;
              overflow-x: hidden;
            }
          `}
        </style>
      </div>
    </div>
  );
}; 