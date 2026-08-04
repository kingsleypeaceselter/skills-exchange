"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import { Profile } from '../types/profile'; 

const getCountryCode = (countryName: string): string => {
  
  const normalized = countryName.trim().toLowerCase();
  
  const codes: { [key: string]: string } = {
    "usa": "us",
    "united states": "us",
    "germany": "de",
    "japan": "jp",
    "morocco": "ma",
    "ireland": "ie",
    "ghana": "gh",
    "egypt": "eg",
    "spain": "es",
    "uk": "gb",
    "united kingdom": "gb",
    "canada": "ca",
    "nigeria": "ng",
    "russia": "ru",
    "south korea": "kr",
    "korea": "kr",
    "france": "fr",
    "saudi arabia": "sa",
    "india": "in",
    "brazil": "br"
  };
  
  return codes[normalized] || "";
};

export default function UserCard({ profile }: { profile: Profile & { id?: string; email?: string } }) {
  const router = useRouter();
  const countryCode = getCountryCode(profile.country);

  const handleMessageClick = async () => {
    const isHardcoded = profile.email?.includes('mock') || profile.email?.endsWith('@locallink.dev') || false;

    if (isHardcoded) {
      alert("This user is not available at the moment.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (profile.id) {
      router.push(`/chat?userId=${profile.id}`);
    }
  };

  return (
    <div className="border p-4 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
      <Image
        src={profile.avatar_url || ''}
        alt={profile.full_name}
        width={80}
        height={80}
        className="w-20 h-20 rounded-full mb-4 object-cover border"
        unoptimized
      />
      <h2 className="font-bold text-lg">{profile.full_name}</h2>
      
      <p className="text-sm text-gray-500 mt-0.5">{profile.email || "No email provided"}</p>
      
      <p className="text-blue-600 mt-1">{profile.skill}</p>
      
      <div className="flex items-center justify-center gap-2 mt-2">
        {countryCode && (
          <Image
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            alt={profile.country}
            width={40}
            height={30}
            className="w-10 h-7 rounded-sm"
            unoptimized
          />
        )}
        <span className="text-sm text-gray-500">{profile.country}</span>
      </div>

      <p className="mt-2 font-semibold text-gray-700">
        ${profile.hourly_rate}/hr
      </p>
      
      <button 
        onClick={handleMessageClick}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition font-medium"
      >
        Message
      </button>
    </div>
  );
}