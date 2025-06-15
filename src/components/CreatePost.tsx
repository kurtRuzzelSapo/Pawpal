import { ChangeEvent, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaImage, FaPaw, FaMapMarkerAlt, FaRuler, FaCalendarAlt, FaCheck, FaStethoscope, FaHeart, FaUsers, FaTrash } from "react-icons/fa";
import { Community, fetchCommunities } from "./CommunityList";
import { useQuery as useReactQuery } from '@tanstack/react-query';

interface PostInput {
  name: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  user_id?: string | null;
  age?: number;
  breed?: string;
  vaccination_status?: boolean;
  location?: string;
  size?: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  temperament?: string[];
  health_info?: string;
  status?: 'Available' | 'Pending' | 'Adopted';
  additional_photos?: string[];
}

const createPost = async (
  post: PostInput, 
  imageFile: File, 
  additionalFiles: File[],
  vaccinationProofFile: File | null
) => {
  const filePath = `${post.name}-${Date.now()}-${imageFile.name}`;

  // Upload main image
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicURLData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  // Upload vaccination proof if provided and update health_info
  let updatedHealthInfo = post.health_info || '';
  if (vaccinationProofFile) {
    const vaccinationFilePath = `vaccination-proof-${post.name}-${Date.now()}-${vaccinationProofFile.name}`;
    const { error: vaccinationUploadError } = await supabase.storage
      .from("post-images")
      .upload(vaccinationFilePath, vaccinationProofFile);

    if (vaccinationUploadError) throw new Error(vaccinationUploadError.message);

    const { data: vaccinationPublicURLData } = supabase.storage
      .from("post-images")
      .getPublicUrl(vaccinationFilePath);

    // Add vaccination proof URL to health_info
    updatedHealthInfo = `${updatedHealthInfo}\n\nVaccination Proof: ${vaccinationPublicURLData.publicUrl}`;
  }

  // Upload additional photos
  const additionalPhotosUrls: string[] = [];
  for (const file of additionalFiles) {
    const additionalFilePath = `${post.name}-${Date.now()}-${file.name}`;
    const { error: additionalUploadError } = await supabase.storage
      .from("post-images")
      .upload(additionalFilePath, file);

    if (additionalUploadError) throw new Error(additionalUploadError.message);

    const { data: additionalPublicURLData } = supabase.storage
      .from("post-images")
      .getPublicUrl(additionalFilePath);

    additionalPhotosUrls.push(additionalPublicURLData.publicUrl);
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ 
      name: post.name,
      content: post.content,
      image_url: publicURLData.publicUrl,
      avatar_url: post.avatar_url,
      community_id: post.community_id,
      age: post.age,
      breed: post.breed,
      vaccination_status: post.vaccination_status,
      location: post.location,
      user_id: post.user_id,
      size: post.size,
      temperament: post.temperament,
      health_info: updatedHealthInfo.trim(),
      status: post.status || 'Available',
      additional_photos: additionalPhotosUrls
    })
    .select('*')
    .single();

  if (error) throw new Error(error?.message);

  return data;
};

// Fetch user data for default location
const fetchUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('location')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const CreatePost = () => {
  const [name, setName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [vaccinationProofFile, setVaccinationProofFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [vaccinationPreview, setVaccinationPreview] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [age, setAge] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [vaccinationStatus, setVaccinationStatus] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("");
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
  const [temperament, setTemperament] = useState<string[]>([]);
  const [healthInfo, setHealthInfo] = useState<string>("");
  const [status, setStatus] = useState<'Available' | 'Pending' | 'Adopted'>('Available');
  
  const { user } = useAuth();

  const { data: communities } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  }); 

  const navigate = useNavigate();

  // Fetch userData for default location
  const { data: userData } = useReactQuery({
    queryKey: ["userData", user?.id],
    queryFn: () => user && fetchUserData(user.id),
    enabled: !!user,
  });

  // Set default location if userData.location exists and location is empty
  useEffect(() => {
    if (userData && userData.location && !location) {
      setLocation(userData.location);
    }
  }, [userData, location]);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: { 
      post: PostInput; 
      imageFile: File; 
      additionalFiles: File[];
      vaccinationProofFile: File | null;
    }) =>
      createPost(
        data.post, 
        data.imageFile, 
        data.additionalFiles,
        data.vaccinationProofFile
      ),
    onSuccess: () => {
      // Clear fields and preview
      setName("");
      setContent("");
      setSelectedFile(null);
      setAdditionalFiles([]);
      setVaccinationProofFile(null);
      setPreview(null);
      setAdditionalPreviews([]);
      setVaccinationPreview(null);
      setAge("");
      setBreed("");
      setVaccinationStatus(false);
      setLocation("");
      setSize('Medium');
      setTemperament([]);
      setHealthInfo("");
      setStatus('Available');

      // Redirect to home page
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    if (!user) {
      alert("You must be logged in to create a post");
      return;
    }

    if (vaccinationStatus && !vaccinationProofFile) {
      alert("Please upload vaccination proof");
      return;
    }

    mutate({
      post: {
        name,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
        user_id: user.id,
        age: age ? parseInt(age) : undefined,
        breed,
        vaccination_status: vaccinationStatus,
        location,
        size,
        temperament,
        health_info: healthInfo,
        status,
      },
      imageFile: selectedFile,
      additionalFiles,
      vaccinationProofFile,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleVaccinationProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVaccinationProofFile(e.target.files[0]);
      setVaccinationPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAdditionalFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAdditionalFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setAdditionalPreviews(previews);
    }
  };

  const handleTemperamentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTemperament(value.split(',').map(item => item.trim()));
  };

  const handleCommunityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCommunityId(value ? Number(value) : null);
  };

  const sizeOptions = [
    { value: 'Small', label: 'Small (0-15 lbs)' },
    { value: 'Medium', label: 'Medium (16-40 lbs)' },
    { value: 'Large', label: 'Large (41-100 lbs)' },
    { value: 'Extra Large', label: 'Extra Large (100+ lbs)' }
  ];

  const statusOptions = [
    { value: 'Available', label: 'Available - Ready for Adoption' },
    { value: 'Pending', label: 'Pending - In Process' },
    { value: 'Adopted', label: 'Adopted - Found Forever Home' }
  ];

  // --- Add delete handlers ---
  const handleDeleteMainImage = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleDeleteVaccinationProof = () => {
    setVaccinationProofFile(null);
    setVaccinationPreview(null);
  };

  const handleDeleteAdditionalImage = (index: number) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Basic Info */}
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="name" className=" mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaPaw className="text-violet-500" />
              Pet Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              required
              placeholder="Enter your pet's name"
            />
          </div>

          <div className="group">
            <label htmlFor="content" className=" mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaHeart className="text-violet-500" />
              Description
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              rows={5}
              required
              placeholder="Describe your pet's personality, story, and why they need a home..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="age" className=" mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" />
                Age (months)
              </label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
                placeholder="0"
              />
            </div>

            <div className="group">
              <label htmlFor="breed" className=" mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
                <FaPaw className="text-violet-500" />
                Breed
              </label>
              <input
                type="text"
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
                placeholder="Golden Retriever"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="location" className=" mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
                <FaMapMarkerAlt className="text-violet-500" />
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
                placeholder="City"
              />
            </div>

            <div className="group">
              <label htmlFor="size" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
                <FaRuler className="text-violet-500" />
                Size
              </label>
              <select
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value as 'Small' | 'Medium' | 'Large' | 'Extra Large')}
                className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              >
                {sizeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="group">
            <label htmlFor="status" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaCheck className="text-violet-500" />
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Available' | 'Pending' | 'Adopted')}
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right column - Health & Images */}
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="temperament" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaHeart className="text-violet-500" />
              Temperament (comma-separated)
            </label>
            <input
              type="text"
              id="temperament"
              value={temperament.join(', ')}
              onChange={handleTemperamentChange}
              placeholder="Friendly, Playful, Calm"
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
            />
          </div>

          <div className="group">
            <label htmlFor="healthInfo" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaStethoscope className="text-violet-500" />
              Health Information
            </label>
            <textarea
              id="healthInfo"
              value={healthInfo}
              onChange={(e) => setHealthInfo(e.target.value)}
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
              rows={3}
              placeholder="Describe any health conditions, special needs, or medical history..."
            />
          </div>

          <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="vaccinationStatus"
                checked={vaccinationStatus}
                onChange={(e) => setVaccinationStatus(e.target.checked)}
                className="rounded border-violet-300 text-violet-600 focus:ring-violet-400"
              />
              <label htmlFor="vaccinationStatus" className="font-medium text-violet-700 font-['Poppins']">
                Vaccinated
              </label>
            </div>

            {vaccinationStatus && (
              <div className="mt-4">
                <label htmlFor="vaccinationProof" className="mb-2 font-medium text-violet-700 font-['Poppins'] text-sm flex items-center gap-2">
                  Upload Vaccination Proof
                </label>
                <input
                  type="file"
                  id="vaccinationProof"
                  accept="image/*"
                  onChange={handleVaccinationProofChange}
                  className="hidden"
                  required
                />
                <div className="w-full flex items-center justify-center p-4 border-2 border-dashed border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100/50 transition bg-white">
                  <label htmlFor="vaccinationProof" className="flex flex-col items-center cursor-pointer">
                    <FaImage className="text-3xl text-violet-400" />
                    <span className="text-sm text-violet-500 mt-2 text-center font-['Poppins']">
                      Click to upload vaccination proof
                    </span>
                  </label>
                </div>
                {vaccinationPreview && (
                  <div className="mt-2 relative">
                    <img
                      src={vaccinationPreview}
                      alt="Vaccination Proof"
                      className="max-w-full h-40 object-cover rounded-lg border border-violet-200"
                    />
                    <button
                      type="button"
                      onClick={handleDeleteVaccinationProof}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow text-white text-xs flex items-center justify-center"
                      aria-label="Delete vaccination proof"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="group">
            <label className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaUsers className="text-violet-500" />
              Select Community
            </label>
            <select
              id="community"
              onChange={handleCommunityChange}
              className="w-full border border-violet-100 bg-violet-50 p-3 rounded-xl text-violet-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all group-hover:border-violet-300 font-['Poppins']"
            >
              <option value="">
                -- Choose a Community --
              </option>
              {communities?.map((community) => (
                <option
                  key={community.id}
                  value={community.id}
                >
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="group">
            <label htmlFor="image" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
              <FaImage className="text-violet-500" />
              Main Pet Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
            />
            <div className="w-full flex items-center justify-center p-6 border-2 border-dashed border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100/50 transition bg-white">
              <label htmlFor="image" className="flex flex-col items-center cursor-pointer">
                <FaImage className="text-4xl text-violet-400" />
                <span className="text-sm text-violet-500 mt-2 text-center font-['Poppins']">
                  Click to upload main image
                </span>
              </label>
            </div>
            {preview && (
              <div className="mt-3 relative">
                <img
                  src={preview}
                  alt="Pet Preview"
                  className="w-full h-56 object-cover rounded-lg border border-violet-200"
                />
                <button
                  type="button"
                  onClick={handleDeleteMainImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow text-white text-xs flex items-center justify-center"
                  aria-label="Delete main image"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="group mt-8">
        <label htmlFor="additionalImages" className="mb-2 font-medium text-violet-700 font-['Poppins'] flex items-center gap-2">
          <FaImage className="text-violet-500" />
          Additional Images (optional)
        </label>
        <input
          type="file"
          id="additionalImages"
          accept="image/*"
          multiple
          onChange={handleAdditionalFilesChange}
          className="hidden"
        />
        <div className="w-full flex items-center justify-center p-4 border-2 border-dashed border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100/50 transition bg-white">
          <label htmlFor="additionalImages" className="flex flex-col items-center cursor-pointer">
            <FaImage className="text-3xl text-violet-400" />
            <span className="text-sm text-violet-500 mt-2 text-center font-['Poppins']">
              Click to upload additional images
            </span>
          </label>
        </div>
        {additionalPreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {additionalPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Additional Pet Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-violet-200"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteAdditionalImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow text-white text-xs flex items-center justify-center"
                  aria-label={`Delete additional image ${index + 1}`}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-['Poppins'] w-full max-w-md"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-r-2 border-white"></div>
              <span>Creating Post...</span>
            </>
          ) : (
            <>
              <FaPaw className="text-xl" />
              <span>Create Pet Post</span>
            </>
          )}
        </button>
      </div>

      {isError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-['Poppins']">
          Error creating post. Please try again.
        </div>
      )}
    </form>
  );
};
