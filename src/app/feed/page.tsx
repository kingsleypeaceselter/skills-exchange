"use client";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AddSkillForm from "../../components/AddSkillForm";

interface ProfileCard {
  id: string;
  full_name: string;
  email?: string;
  skill: string;
  country: string;
  hourly_rate: number;
  avatar_url?: string;
  isHardcoded?: boolean;
}

const PAGE_SIZE = 6;

const getCountryCode = (countryName: string): string => {
  const normalized = countryName?.trim().toUpperCase();
  const codes: { [key: string]: string } = {
    "USA": "us", "GERMANY": "de", "JAPAN": "jp", "MOROCCO": "ma",
    "IRELAND": "ie", "GHANA": "gh", "EGYPT": "eg", "SPAIN": "es",
    "UK": "gb", "CANADA": "ca", "NIGERIA": "ng",
    "RUSSIA": "ru", "SOUTH KOREA": "kr", "FRANCE": "fr", 
    "SAUDI ARABIA": "sa", "INDIA": "in", "BRAZIL": "br"
  };
  return codes[normalized] || "";
};

export default function FeedPage() {
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
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

      const formattedProfiles: ProfileCard[] = (data || []).map(p => ({
        id: p.id,
        full_name: p.full_name || "Anonymous User",
        email: p.email || "",
        skill: p.skill || "General Skill",
        country: p.country || "Not specified",
        hourly_rate: p.hourly_rate || 0,
        avatar_url: p.avatar_url || "https://via.placeholder.com/150",
        isHardcoded: p.email?.includes('mock') || p.email?.endsWith('@locallink.dev') || false,
      }));

      if (formattedProfiles.length < PAGE_SIZE) {
        setHasMore(false);
      }

      // Updated state setter to prevent duplicates
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

  const handleCardClick = (profile: ProfileCard) => {
    if (profile.isHardcoded) {
      alert("This user is not available at the moment.");
      return;
    }

    if (!currentUser) {
      router.push("/login");
      return;
    }

    router.push(`/chat?userId=${profile.id}`);
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-linear-to-b from-gray-50/50 to-white">
      {/* Shining Hero Header with Outstanding Menu */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Community Experts Feed ✨
          </h1>
          <p className="text-sm text-gray-500">Discover and connect with top local talent instantly.</p>
        </div>
        
        {/* Outstanding Header Navigation Actions */}
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
          filteredProfiles.map((profile, index) => {
            const countryCode = getCountryCode(profile.country);

            return (
              <div 
                key={`${profile.id}-${index}`} 
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition border border-gray-200 flex flex-col items-center text-center"
              >
                <Image
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt={profile.full_name}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full object-cover mb-4 border"
                />
                <h3 className="text-xl font-bold text-gray-800">{profile.full_name}</h3>
                
                <p className="text-sm text-gray-500 mt-0.5">{profile.email || "No email provided"}</p>
                
                <p className="text-blue-600 font-medium mt-1">{profile.skill}</p>
                
                <div className="flex items-center justify-center gap-2 mt-1">
                  {countryCode && (
                    <Image
                      src={`https://flagcdn.com/24x18/${countryCode}.png`}
                      alt={profile.country}
                      width={24}
                      height={18}
                      className="w-6 h-4 rounded-sm"
                    />
                  )}
                  <span className="text-sm text-gray-500">{profile.country}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 w-full flex justify-between items-center text-sm">
                  <span className="text-gray-600">Rate:</span>
                  <span className="text-green-600 font-bold">${profile.hourly_rate}/hr</span>
                </div>

                <button 
                  onClick={() => handleCardClick(profile)}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition font-medium"
                >
                 <span>💬</span> Message
                </button>
              </div>
            );
          })
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