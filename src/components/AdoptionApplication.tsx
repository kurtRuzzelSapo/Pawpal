import { useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface Props {
  petId: number;
  onClose: () => void;
}

interface ApplicationInput {
  post_id: number;
  applicant_id: string;
  home_situation: string;
  experience: string;
  why_this_pet: string;
  additional_info: string;
}

const createApplication = async (application: ApplicationInput) => {
  const { data, error } = await supabase
    .from("adoption_applications")
    .insert(application);

  if (error) throw new Error(error.message);
  return data;
};

export const AdoptionApplication = ({ petId, onClose }: Props) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    home_situation: "",
    experience: "",
    why_this_pet: "",
    additional_info: "",
  });

  const mutation: UseMutationResult<any, Error, ApplicationInput> = useMutation({
    mutationFn: (data: ApplicationInput) => createApplication(data),
    onSuccess: () => {
      setTimeout(() => {
        onClose();
      }, 2000);
    },
  });

  const { mutate } = mutation;
  const isLoading = mutation.isPending;
  const isError = mutation.isError;
  const isSuccess = mutation.isSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    mutate({
      ...formData,
      post_id: petId,
      applicant_id: user.id,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Adoption Application</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {isSuccess ? (
        <div className="text-center text-green-400 p-4">
          Your application has been submitted successfully! We will review it and get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="home_situation"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Describe your home situation
            </label>
            <textarea
              id="home_situation"
              name="home_situation"
              value={formData.home_situation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Type of home, yard space, other pets, family members, etc."
            />
          </div>

          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Previous pet experience
            </label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Tell us about your experience with pets"
            />
          </div>

          <div>
            <label
              htmlFor="why_this_pet"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Why this pet?
            </label>
            <textarea
              id="why_this_pet"
              name="why_this_pet"
              value={formData.why_this_pet}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Why do you want to adopt this specific pet?"
            />
          </div>

          <div>
            <label
              htmlFor="additional_info"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Additional Information
            </label>
            <textarea
              id="additional_info"
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Any additional information you'd like to share"
            />
          </div>

          {isError && (
            <div className="text-red-500 text-center">
              There was an error submitting your application. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}
    </div>
  );
}; 