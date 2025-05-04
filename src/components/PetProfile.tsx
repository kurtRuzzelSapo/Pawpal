import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { AdoptionApplication } from "./AdoptionApplication";
import { useAuth } from "../context/AuthContext";
import { MessageButton } from "./MessageButton";
import { useState } from "react";
import { FaHeart, FaPaw, FaMapMarkerAlt, FaSyringe } from "react-icons/fa";

interface Pet {
  id: number;
  name: string;
  content: string;
  age: number;
  breed: string;
  vaccination_status: boolean;
  location: string;
  image_url: string;
  additional_photos: string[];
  size: string;
  temperament: string[];
  health_info: string;
  status: string;
  auth_users_id: string;
}

const fetchPetById = async (id: number): Promise<Pet> => {
  const { data, error } = await supabase
    .from("post")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Pet;
};

interface Props {
  petId: number;
}

export const PetProfile = ({ petId }: Props) => {
  const { user } = useAuth();
  const [showApplication, setShowApplication] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: pet, error, isLoading } = useQuery<Pet, Error>({
    queryKey: ["pet", petId],
    queryFn: () => fetchPetById(petId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
    );
  }

  if (!pet) {
    return <div className="text-center">Pet not found</div>;
  }

  const nextPhoto = () => {
    if (pet.additional_photos) {
      setCurrentPhotoIndex((prev) => 
        prev === pet.additional_photos.length ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (pet.additional_photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? pet.additional_photos.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      {/* Photo Gallery */}
      <div className="relative h-96">
        <img
          src={currentPhotoIndex === 0 ? pet.image_url : pet.additional_photos[currentPhotoIndex - 1]}
          alt={pet.name}
          className="w-full h-full object-cover"
        />
        {pet.additional_photos && pet.additional_photos.length > 0 && (
          <div className="absolute bottom-4 right-4 space-x-2">
            <button
              onClick={prevPhoto}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              ←
            </button>
            <button
              onClick={nextPhoto}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Pet Information */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-white mb-2">{pet.name}</h1>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm">
              {pet.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <FaPaw className="text-purple-400" />
              <span>Breed: {pet.breed}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <FaHeart className="text-purple-400" />
              <span>Age: {pet.age} years</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <FaMapMarkerAlt className="text-purple-400" />
              <span>Location: {pet.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <FaSyringe className="text-purple-400" />
              <span>
                Vaccination Status: {pet.vaccination_status ? "Vaccinated" : "Not Vaccinated"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-gray-300">
              <h3 className="font-semibold text-purple-400 mb-1">Size</h3>
              <p>{pet.size}</p>
            </div>
            <div className="text-gray-300">
              <h3 className="font-semibold text-purple-400 mb-1">Temperament</h3>
              <div className="flex flex-wrap gap-2">
                {pet.temperament?.map((trait, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-800 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-purple-400 mb-2">Health Information</h3>
          <p className="text-gray-300">{pet.health_info}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-purple-400 mb-2">About</h3>
          <p className="text-gray-300">{pet.content}</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          {user && user.id !== pet.auth_users_id && pet.status === "Available" && (
            <>
              <button
                onClick={() => setShowApplication(true)}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition"
              >
                Apply to Adopt
              </button>
              <MessageButton receiverId={pet.auth_users_id} postId={pet.id} />
            </>
          )}
        </div>
      </div>

      {/* Adoption Application Modal */}
      {showApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AdoptionApplication
              petId={pet.id}
              onClose={() => setShowApplication(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 