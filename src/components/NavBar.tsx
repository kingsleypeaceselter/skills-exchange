"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase/client";
import { getProfileById } from "../lib/services/profileService";

export default function NavBar() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Wrap profile fetching in try/catch so missing rows don't crash the app
        const profile = await getProfileById(user.id).catch(() => null);
        
        if (profile) {
          setAvatarUrl(profile.avatar_url || null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b p-4 flex justify-between items-center bg-white">
      <div className="font-bold text-xl">SkillExchange</div>
      <div className="flex gap-4 items-center">
        <Link href="/feed" className={pathname === "/feed" ? "font-bold text-blue-600" : ""}>Feed</Link>
        <Link href="/users" className={pathname === "/users" ? "font-bold text-blue-600" : ""}>Users</Link>
        <Link href="/chat" className={pathname === "/chat" ? "font-bold text-blue-600" : ""}>Chat</Link>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full" />
        ) : (
          <Link href="/profile">Profile</Link>
        )}
      </div>
    </nav>
  );
}