import { supabase } from "../supabase/client";

export type ProfileRow = {
  full_name: string | null;
  phone_number: string | null; 
  skill: string | null;
  country: string | null;
  hourly_rate: number | null;
  avatar_url?: string;
};

export const getProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, full_name, phone_number, skill, country, hourly_rate")
    .eq("id", userId)
    .maybeSingle(); // Safe if row doesn't exist yet

  if (error) throw error;
  return data as ProfileRow | null;
};

export const getPhoneById = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("phone_number") // Make sure this matches your exact database column name
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.phone_number as string || "";
};

export const updateProfile = async (
  userId: string, 
  data: { full_name: string; phone_number: string; skill: string; country: string; hourly_rate: number; avatar_url?: string }
) => {
  const { error } = await supabase
    .from("profiles")
    .upsert({ 
      id: userId, // Upsert ensures it creates the row if it's missing!
      full_name: data.full_name,
      phone_number: data.phone_number,
      skill: data.skill,
      country: data.country,
      hourly_rate: data.hourly_rate,
      avatar_url: data.avatar_url,
    });

  if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", userId);

  if (updateError) throw updateError;
  return data.publicUrl;
};