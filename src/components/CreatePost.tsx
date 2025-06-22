import { ChangeEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaImage,
  FaPaw,
  FaMapMarkerAlt,
  FaRuler,
  FaCalendarAlt,
  FaCheck,
  FaStethoscope,
  FaHeart,
  FaTrash,
  FaPlus,
  FaUpload,
  FaCamera,
  FaFileUpload,
} from "react-icons/fa";
// import { Community, fetchCommunities } from "./CommunityList";

interface PostInput {
  name: string;
  content: string;
  avatar_url: string | null;
  user_id?: string | null;
  age?: number;
  breed?: string;
  vaccination_status?: boolean;
  location?: string;
  size?: "Small" | "Medium" | "Large" | "Extra Large";
  temperament?: string[];
  health_info?: string;
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
  let updatedHealthInfo = post.health_info || "";
  if (vaccinationProofFile) {
    const vaccinationFilePath = `vaccination-proof-${post.name}-${Date.now()}-${
      vaccinationProofFile.name
    }`;
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
      age: post.age,
      breed: post.breed,
      vaccination_status: post.vaccination_status,
      location: post.location,
      user_id: post.user_id,
      size: post.size,
      temperament: post.temperament,
      health_info: updatedHealthInfo.trim(),
      status: "pending",
      additional_photos: additionalPhotosUrls,
    })
    .select("*")
    .single();

  if (error) throw new Error(error?.message);

  return data;
};

export const CreatePost = () => {
  const [name, setName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [vaccinationProofFile, setVaccinationProofFile] = useState<File | null>(
    null
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [vaccinationPreview, setVaccinationPreview] = useState<string | null>(
    null
  );
  const [age, setAge] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [vaccinationStatus, setVaccinationStatus] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("");
  const [size, setSize] = useState<
    "Small" | "Medium" | "Large" | "Extra Large"
  >("Medium");
  const [temperament, setTemperament] = useState<string[]>([]);
  const [healthInfo, setHealthInfo] = useState<string>("");

  const { user } = useAuth();

  const navigate = useNavigate();

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
      setSize("Medium");
      setTemperament([]);
      setHealthInfo("");

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
        user_id: user.id,
        age: age ? parseInt(age) : undefined,
        breed,
        vaccination_status: vaccinationStatus,
        location,
        size,
        temperament,
        health_info: healthInfo,
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
      const previews = files.map((file) => URL.createObjectURL(file));
      setAdditionalPreviews(previews);
    }
  };

  const handleTemperamentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTemperament(value.split(",").map((item) => item.trim()));
  };

  const sizeOptions = [
    { value: "Small", label: "Small (0-15 lbs)" },
    { value: "Medium", label: "Medium (16-40 lbs)" },
    { value: "Large", label: "Large (41-100 lbs)" },
    { value: "Extra Large", label: "Extra Large (100+ lbs)" },
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full shadow-lg mb-6">
            <FaPaw className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-transparent bg-clip-text font-['Quicksand'] mb-4">
            Create Pet Post
          </h1>
          <p className="text-lg text-gray-600 font-['Poppins'] max-w-2xl mx-auto">
            Share your beloved pet's story and help them find their perfect
            forever home
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Left Column - Images & Health Docs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Upload Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-violet-100 h-fit">
              <h2 className="text-2xl font-bold text-violet-800 font-['Quicksand'] mb-8 flex items-center gap-3">
                <FaCamera className="text-violet-500" />
                Pet Photos
              </h2>

              <div className="space-y-8">
                {/* Main Image */}
                <div className="space-y-4">
                  <label className="font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2">
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
                  <div className="w-full flex items-center justify-center p-12 border-2 border-dashed border-violet-300 rounded-2xl cursor-pointer hover:bg-white/50 transition-all duration-300 bg-white/30 group">
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <FaCamera className="text-5xl text-violet-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-lg text-violet-600 mt-4 text-center font-['Poppins'] font-medium">
                        Click to upload main image
                      </span>
                    </label>
                  </div>
                  {preview && (
                    <div className="relative group">
                      <img
                        src={preview}
                        alt="Pet Preview"
                        className="w-full h-80 object-cover rounded-2xl border-2 border-violet-200 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteMainImage}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 rounded-full p-3 shadow-lg text-white transition-all duration-300 transform hover:scale-110"
                        aria-label="Delete main image"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Images */}
                <div className="space-y-4">
                  <label className="font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2">
                    <FaPlus className="text-violet-500" />
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
                  <div className="w-full flex items-center justify-center p-12 border-2 border-dashed border-violet-300 rounded-2xl cursor-pointer hover:bg-white/50 transition-all duration-300 bg-white/30 group">
                    <label
                      htmlFor="additionalImages"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <FaImage className="text-5xl text-violet-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-lg text-violet-600 mt-4 text-center font-['Poppins'] font-medium">
                        Click to upload additional images
                      </span>
                    </label>
                  </div>
                  {additionalPreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {additionalPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Additional Pet Image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-2xl border-2 border-violet-200 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteAdditionalImage(index)}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg text-white transition-all duration-300 transform hover:scale-110"
                            aria-label={`Delete additional image ${index + 1}`}
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Docs */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-violet-100 h-fit">
              <h2 className="text-2xl font-bold text-violet-800 font-['Quicksand'] mb-8 flex items-center gap-3">
                <FaStethoscope className="text-violet-500" />
                Health & Vaccination
              </h2>
              <div className="p-8 bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border-2 border-violet-200">
                <div className="flex items-center space-x-3 mb-6">
                  <input
                    type="checkbox"
                    id="vaccinationStatus"
                    checked={vaccinationStatus}
                    onChange={(e) => setVaccinationStatus(e.target.checked)}
                    className="w-6 h-6 rounded border-violet-300 text-violet-600 focus:ring-violet-400 focus:ring-2"
                  />
                  <label
                    htmlFor="vaccinationStatus"
                    className="font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                  >
                    <FaCheck className="text-green-500" />
                    Vaccinated
                  </label>
                </div>

                {vaccinationStatus && (
                  <div className="space-y-6">
                    <label
                      htmlFor="vaccinationProof"
                      className="font-semibold text-violet-700 font-['Poppins'] text-lg flex items-center gap-2"
                    >
                      <FaFileUpload className="text-violet-500" />
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
                    <div className="w-full flex items-center justify-center p-8 border-2 border-dashed border-violet-300 rounded-2xl cursor-pointer hover:bg-white/50 transition-all duration-300 bg-white/30 group">
                      <label
                        htmlFor="vaccinationProof"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <FaUpload className="text-4xl text-violet-500 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-lg text-violet-600 mt-4 text-center font-['Poppins'] font-medium">
                          Click to upload vaccination proof
                        </span>
                      </label>
                    </div>
                    {vaccinationPreview && (
                      <div className="relative group">
                        <img
                          src={vaccinationPreview}
                          alt="Vaccination Proof"
                          className="w-full h-48 object-cover rounded-2xl border-2 border-violet-200 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteVaccinationProof}
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 rounded-full p-3 shadow-lg text-white transition-all duration-300 transform hover:scale-110"
                          aria-label="Delete vaccination proof"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Text Inputs */}
          <div className="lg:col-span-3 space-y-8">
            {/* Basic Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-violet-100">
              <h2 className="text-2xl font-bold text-violet-800 font-['Quicksand'] mb-8 flex items-center gap-3">
                <FaHeart className="text-violet-500" />
                Basic Information
              </h2>

              <div className="space-y-8">
                <div className="group">
                  <label
                    htmlFor="name"
                    className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                  >
                    <FaPaw className="text-violet-500" />
                    Pet Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 text-lg"
                    required
                    placeholder="Enter your pet's name"
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="content"
                    className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                  >
                    <FaHeart className="text-violet-500" />
                    Description
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 resize-none text-lg"
                    rows={6}
                    required
                    placeholder="Describe your pet's personality, story, and why they need a home..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="age"
                      className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                    >
                      <FaCalendarAlt className="text-violet-500" />
                      Age (months)
                    </label>
                    <input
                      type="number"
                      id="age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 text-lg"
                      placeholder="0"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="breed"
                      className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                    >
                      <FaPaw className="text-violet-500" />
                      Breed
                    </label>
                    <input
                      type="text"
                      id="breed"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 text-lg"
                      placeholder="Golden Retriever"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="location"
                      className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                    >
                      <FaMapMarkerAlt className="text-violet-500" />
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 text-lg"
                      placeholder="City"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="size"
                      className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                    >
                      <FaRuler className="text-violet-500" />
                      Size
                    </label>
                    <select
                      id="size"
                      value={size}
                      onChange={(e) =>
                        setSize(
                          e.target.value as
                            | "Small"
                            | "Medium"
                            | "Large"
                            | "Extra Large"
                        )
                      }
                      className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] text-lg"
                    >
                      {sizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-violet-100">
              <h2 className="text-2xl font-bold text-violet-800 font-['Quicksand'] mb-8 flex items-center gap-3">
                <FaStethoscope className="text-violet-500" />
                Additional Details
              </h2>
              <div className="space-y-8">
                <div className="group">
                  <label
                    htmlFor="temperament"
                    className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                  >
                    <FaHeart className="text-violet-500" />
                    Temperament
                  </label>
                  <input
                    type="text"
                    id="temperament"
                    value={temperament.join(", ")}
                    onChange={handleTemperamentChange}
                    placeholder="Friendly, Playful, Calm"
                    className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 text-lg"
                  />
                </div>

                <div className="group">
                  <label
                    htmlFor="healthInfo"
                    className="mb-4 font-semibold text-violet-700 font-['Poppins'] flex items-center gap-2 text-lg"
                  >
                    <FaStethoscope className="text-violet-500" />
                    Health Information
                  </label>
                  <textarea
                    id="healthInfo"
                    value={healthInfo}
                    onChange={(e) => setHealthInfo(e.target.value)}
                    className="w-full border-2 border-violet-200 bg-white/80 p-5 rounded-2xl text-violet-800 focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all duration-300 group-hover:border-violet-300 font-['Poppins'] placeholder-violet-400 resize-none text-lg"
                    rows={4}
                    placeholder="Describe any health conditions, special needs, or medical history..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-5 flex justify-center">
            <button
              type="submit"
              disabled={isPending}
              className="px-16 py-6 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-3xl font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-4 font-['Poppins'] w-full max-w-lg group text-xl"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-white"></div>
                  <span>Creating Post...</span>
                </>
              ) : (
                <>
                  <FaPaw className="text-2xl group-hover:scale-110 transition-transform duration-300" />
                  <span>Create Pet Post</span>
                </>
              )}
            </button>
          </div>

          {isError && (
            <div className="lg:col-span-5 mt-8 bg-red-50 border-2 border-red-200 text-red-600 p-8 rounded-3xl text-center font-['Poppins'] shadow-xl text-lg">
              Error creating post. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
