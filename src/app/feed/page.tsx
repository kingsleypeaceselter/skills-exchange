"use client";

import { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AddSkillForm from "../../components/AddSkillForm";
import UserCard from "../../components/UserCard";
import { Profile } from "../../types/profile";

const PAGE_SIZE = 6;

export default function FeedPage() {
  const [profiles, setProfiles] = useState<(Profile & { id: string; email?: string })[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const fetchProfiles = useCallback(async (pageNumber: number, reset = false) => {
    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .range(from, to);
      
      if (error) throw error;

      const formattedProfiles = (data || []).map(p => ({
        ...p,
        full_name: p.full_name || "Anonymous User",
        email: p.email || "",
        skill: p.skill || "General Skill",
        country: p.country || "Not specified",
        hourly_rate: p.hourly_rate || 0,
        avatar_url: p.avatar_url || "https://via.placeholder.com/150",
      }));

      if (formattedProfiles.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setProfiles(prev => {
        const combined = reset ? formattedProfiles : [...prev, ...formattedProfiles];
        return combined.filter((profile, index, self) => 
          index === self.findIndex(p => p.id === profile.id)
        );
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchProfiles(0, true));
  }, [fetchProfiles]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        if (hasMore && !loadingMore && searchTerm === "") {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProfiles(nextPage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, page, fetchProfiles, searchTerm]);

  const filteredProfiles = profiles.filter(profile =>
    profile.skill?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-linear-to-b from-gray-50/50 to-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Community Experts Feed ✨
          </h1>
          <p className="text-sm text-gray-500">Discover and connect with top local talent instantly.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <button 
                onClick={() => router.push("/chat")}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 transition shadow-xs"
              >
                <span>💬</span> Messages
              </button>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                <span>🚪</span> Sign Out
              </button>
            </>
          ) : (
            <button 
              onClick={() => router.push("/login")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Register / Sign In
            </button>
          )}
        </div>
      </div>
      
      {currentUser ? (
        <AddSkillForm onSkillAdded={() => {
          setPage(0);
          setHasMore(true);
          fetchProfiles(0, true);
        }} />
      ) : (
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Want to share your skills with the community?</h3>
          <p className="text-gray-600 mb-4">Create an account or sign in to list your skills and chat with other members.</p>
          <button 
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Create an Account
          </button>
        </div>
      )}

      <div className="mb-8">
        <input 
          type="text"
          placeholder="Search by skill (e.g. Chef, Developer, Designer)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile, index) => (
            <UserCard key={`${profile.id}-${index}`} profile={profile} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-8">No experts found matching that skill.</p>
        )}
      </div>

      {loadingMore && (
        <div className="text-center py-8 text-gray-400 font-medium animate-pulse text-sm">
          Loading more experts... ✨
        </div>
      )}
    </div>
  );
}