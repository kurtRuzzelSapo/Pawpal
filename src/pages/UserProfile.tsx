import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { User } from "@supabase/supabase-js";

export const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");

  // Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (data?.user) {
        setUser(data.user);
        setNewUsername(data.user.user_metadata?.full_name || "");
        setPreviewImage(data.user.user_metadata?.avatar_url || "");
      }
    };

    fetchUser();
  }, []);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Update user profile metadata in Supabase Auth
  const updateProfile = async () => {
    if (!user) return;

    let avatarUrl = previewImage;

    // Upload new avatar if selected
    if (selectedFile) {
      const filePath = `avatars/${user.id}-${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error(uploadError.message);
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(filePath)
        .data.publicUrl;
    }

    // Update the user's metadata
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newUsername, avatar_url: avatarUrl },
    });

    if (error) {
      console.error("Profile update error:", error.message);
    } else {
      console.log("Profile updated successfully!");
      setUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              user_metadata: { full_name: newUsername, avatar_url: avatarUrl },
            }
          : null
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

      {/* Profile Picture */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={previewImage || "/default-avatar.png"}
          alt="Profile Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
        <label className="cursor-pointer bg-gray-700 px-3 py-2 rounded hover:bg-gray-600">
          Upload New
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Username Field */}
      <div className="mb-4">
        <label className="block font-medium">Username</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-600 bg-gray-900 rounded mt-1"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
      </div>

      {/* Update Button */}
      <button
        onClick={updateProfile}
        className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded"
      >
        Update Profile
      </button>
    </div>
  );
};
