import React, { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { User } from "@supabase/supabase-js";

export const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [modalUsername, setModalUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

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

  // Fetch profile info for modal
  const openEditModal = async () => {
    setProfileError("");
    if (!user) return;
    // Try to get from users table
    const { data: profile, error } = await supabase
      .from("users")
      .select("full_name, location")
      .eq("user_id", user.id)
      .maybeSingle();
    let fName = "";
    let lName = "";
    let uName = "";
    if (profile?.full_name) {
      const parts = profile.full_name.split(" ");
      fName = parts[0] || "";
      lName = parts.slice(1).join(" ") || "";
      uName = profile.full_name;
    } else if (user.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(" ");
      fName = parts[0] || "";
      lName = parts.slice(1).join(" ") || "";
      uName = user.user_metadata.full_name;
    }
    setFirstName(fName);
    setLastName(lName);
    setAddress(profile?.location || "");
    setModalUsername(uName);
    setShowEditModal(true);
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setProfileError("");
    const fullName = `${firstName} ${lastName}`.trim();
    // Update users table
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName, location: address })
      .eq("user_id", user.id);
    // Update auth metadata (for username)
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    if (error || authError) {
      setProfileError(
        error?.message || authError?.message || "Failed to update profile."
      );
    } else {
      setNewUsername(fullName);
      setShowEditModal(false);
      // Optionally, refetch user/profile here
    }
    setSaving(false);
  };

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

      {/* Edit Profile Button */}
      <button
        onClick={openEditModal}
        className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded mb-4"
      >
        Edit Profile
      </button>
      {/* Update Button */}
      <button
        onClick={updateProfile}
        className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded ml-2"
      >
        Update Profile
      </button>
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white text-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            {profileError && (
              <div className="mb-2 text-red-600 text-sm">{profileError}</div>
            )}
            <div className="mb-4">
              <label className="block font-medium">First Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Last Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Address</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Username</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                value={modalUsername}
                onChange={(e) => setModalUsername(e.target.value)}
                disabled
              />
              <div className="text-xs text-gray-500 mt-1">(Username is your full name)</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
