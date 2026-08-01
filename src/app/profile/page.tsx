"use client";

import { Oval } from "react-loader-spinner";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { getPhoneById, getProfileById, updateProfile } from "../../lib/services/profileService";
import ReviewSection from "../../components/ReviewSection";

interface ProfileData {
  id?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  avatar_url?: string;
  skill: string;
  country: string;
  hourly_rate: number;
}

interface CloudinaryWidget {
  open: () => void;
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: object,
        callback: (error: Error | null, result: { event: string; info: { secure_url: string } }) => void
      ) => CloudinaryWidget;
    };
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    phone_number: "",
    email: "",
    skill: "",
    country: "",
    hourly_rate: 0,
    avatar_url: ""
  });
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const router = useRouter();

  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      console.error("Cloudinary widget script not loaded");
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dkadqbrv1",
        uploadPreset: "locallink_presets",
        sources: ["local", "url"],
        multiple: false,
        cropping: true,
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          console.log("Cloudinary Upload Success:", result.info.secure_url);
          setFormData((prev) => ({ ...prev, avatar_url: result.info.secure_url }));
        }
      }
    );
    widget.open();
  };

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No logged in user found");
        router.push("/login");
        return;
      }

      const data = await getProfileById(user.id);

      const profileData: ProfileData = {
        id: user.id,
        full_name: data?.full_name || "",
        phone_number: data?.phone_number || "",
        email: user.email || "",
        avatar_url: data?.avatar_url || "",
        skill: data?.skill || "",
        country: data?.country || "",
        hourly_rate: data?.hourly_rate || 0
      };

      setProfile(profileData);
      setFormData(profileData);
    } catch (err) {
      console.error("Error loading profile:", err);
      const fallbackData: ProfileData = {
        full_name: "",
        phone_number: "",
        email: "",
        skill: "",
        country: "",
        hourly_rate: 0,
        avatar_url: ""
      };
      setProfile(fallbackData);
      setFormData(fallbackData);
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      await loadProfile();
    })();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to save.");
        return;
      }

      console.log("Saving form data:", formData);
      await updateProfile(user.id, formData);
      
      alert("Profile updated successfully!");
      
      // Redirect to the Feed page immediately after a successful save
      router.push("/");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Error saving profile. Check console for details.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out.");
    }
  };

  const revealPhone = async () => {
    if (!profile || !profile.id) return;
    const phone = await getPhoneById(profile.id);
    setProfile((prev) => prev ? { ...prev, phone_number: phone } : null);
    setFormData((prev) => ({ ...prev, phone_number: phone }));
    setIsPhoneVisible(true);
  };

  if (!profile) return (
    <div className="flex justify-center items-center h-screen">
      <Oval visible={true} height="80" width="80" color="#3b82f6" />
    </div>
  );

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <Image
              src={formData.avatar_url || "https://via.placeholder.com/150"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border"
              alt="Avatar Preview"
              unoptimized
            />
            <button type="button" onClick={openCloudinaryWidget} className="text-blue-500 underline text-sm">
              Change Image
            </button>
          </div>
          
          <input className="border p-2 w-full rounded" placeholder="Email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="border p-2 w-full rounded" placeholder="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <input className="border p-2 w-full rounded" placeholder="Phone Number" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
          <input className="border p-2 w-full rounded" placeholder="Skill" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})} />
          <input className="border p-2 w-full rounded" placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
          <input className="border p-2 w-full rounded" type="number" placeholder="Hourly Rate" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: Number(e.target.value)})} />
          
          <div className="flex space-x-2">
            <button onClick={handleSave} className="bg-blue-500 text-white p-2 w-full rounded">Save</button>
            <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="bg-gray-300 p-2 w-full rounded">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Image
            src={profile.avatar_url || "https://via.placeholder.com/150"}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover border"
            alt="Avatar"
            unoptimized
          />
          <p><strong>Full Name:</strong> {profile.full_name || "Not set"}</p>
          <p><strong>Email:</strong> {profile.email || "Not set"}</p>
          <p><strong>Phone:</strong> {isPhoneVisible ? profile.phone_number : "••••••••"} {!isPhoneVisible && <button onClick={revealPhone} className="text-blue-500 underline ml-2">(Show)</button>}</p>
          <p><strong>Skill:</strong> {profile.skill || "Not set"}</p>
          <p><strong>Country:</strong> {profile.country || "Not set"}</p>
          <p><strong>Hourly Rate:</strong> ${profile.hourly_rate}/hr</p>
          
          <div className="flex space-x-3 pt-2">
            <button onClick={() => { setIsEditing(true); setFormData(profile); }} className="bg-gray-200 px-4 py-2 rounded font-medium hover:bg-gray-300">Edit Profile</button>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded font-medium hover:bg-red-600">Log Out</button>
          </div>
        </div>
      )}

      {/* Embedded Review Section */}
      {profile.id && <ReviewSection profileId={profile.id} />}
    </div>
  );
}