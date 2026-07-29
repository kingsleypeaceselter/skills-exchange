import { supabase } from "./client";

export async function seedProfiles() {
  const profiles = [
    { full_name: "John Doe", skill: "Carpenter", country: "USA" },
    { full_name: "Maria Garcia", skill: "Web Developer", country: "Spain" },
    { full_name: "Ahmed Hassan", skill: "Plumber", country: "Egypt" },
    // ... add up to 15 here
  ];

  const { error } = await supabase.from('profiles').insert(profiles);
  if (error) console.error("Error seeding:", error);
  else console.log("Seeding successful!");
}