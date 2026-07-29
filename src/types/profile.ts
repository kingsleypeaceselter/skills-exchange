// src/types/profile.ts
export interface Profile {
  full_name: string;
  skill: string;
  country: string;
  avatar_url: string;
  hourly_rate: number; // Use 'number', and we will handle nulls safely
}