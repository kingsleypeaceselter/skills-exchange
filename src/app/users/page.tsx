"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import UserCard from "../../components/UserCard";
import { Profile } from "../../types/profile";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<(Profile & { id?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, skill, country, avatar_url, hourly_rate");

      if (error) {
        console.error("Error fetching profiles:", error.message);
      } else {
        const typedProfiles = (data || []).map(p => ({
          ...p,
          email: p.email || "",
          hourly_rate: p.hourly_rate ?? 20 
        }));
        setProfiles(typedProfiles);
      }
      setLoading(false);
    }

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile =>
    profile.skill?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center">Loading community members...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Community Members</h1>
      
      {/* Search Input Filter */}
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Search by skill (e.g. Electrician, Carpenter)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile, index) => (
            <UserCard key={profile.id || index} profile={profile} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-8">No community members found matching that skill.</p>
        )}
      </div>
    </div>
  );
}