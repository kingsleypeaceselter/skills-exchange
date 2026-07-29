"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client";

export default function AddSkillForm({ onSkillAdded }: { onSkillAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeFor, setExchangeFor] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check if user is logged in before allowing submission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be registered and logged in to add a skill.");
      router.push("/login");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("skills")
      .insert([{ 
        title, 
        description, 
        skill_type: type, 
        exchange_for: exchangeFor, 
        category,
        price_per_hour: parseFloat(price) || 0
      }]);

    if (error) {
      console.error("Error adding skill:", error);
      alert("Failed to add skill: " + error.message);
    } else {
      alert("Skill added successfully!");
      setTitle("");
      setDescription("");
      setType("");
      setExchangeFor("");
      setCategory("");
      setPrice("");
      onSkillAdded();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
      <h2 className="text-xl font-bold mb-4">Add a New Skill</h2>
      
      <input 
        className="block w-full p-3 mb-3 border rounded" 
        placeholder="Skill Title" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        required 
      />

      <input 
        type="number"
        className="block w-full p-3 mb-3 border rounded" 
        placeholder="Price per hour (e.g., 20)" 
        value={price} 
        onChange={(e) => setPrice(e.target.value)} 
      />

      <input 
        className="block w-full p-3 mb-3 border rounded" 
        placeholder="What do you want in exchange?" 
        value={exchangeFor} 
        onChange={(e) => setExchangeFor(e.target.value)} 
        required 
      />

      <input 
        className="block w-full p-3 mb-3 border rounded" 
        placeholder="Type (e.g., Coding, Design)" 
        value={type} 
        onChange={(e) => setType(e.target.value)} 
        required 
      />

      <select 
        className="block w-full p-3 mb-3 border rounded" 
        value={category} 
        onChange={(e) => setCategory(e.target.value)} 
        required
      >
        <option value="" disabled>Select Category</option>
        <option value="Money">Money</option>
        <option value="Time">Time</option>
        <option value="Skill-for-Skill">Skill-for-Skill</option>
      </select>

      <textarea 
        className="block w-full p-3 mb-3 border rounded" 
        placeholder="Description" 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        required 
      />

      <button 
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Adding..." : "Add Skill"}
      </button>
    </form>
  );
}