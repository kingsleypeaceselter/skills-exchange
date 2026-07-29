"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, updateProfilePhone } from "../lib/services/authService";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        // Fix: Sign up returns the user directly in many setups
        const result = await signUp(email, password);
        
        // Check if result exists and has a user property directly
        if (result?.user && phone) {
          await updateProfilePhone(result.user.id, phone);
        }
      }
      router.push("/feed");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unexpected error occurred");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">{isLogin ? "Sign In" : "Sign Up"}</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mb-4 border rounded" />
      
      {!isLogin && (
        <input type="tel" placeholder="Mobile Number" onChange={(e) => setPhone(e.target.value)} className="w-full p-2 mb-4 border rounded" />
      )}

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        {isLogin ? "Sign In" : "Sign Up"}
      </button>
      <button type="button" onClick={() => setIsLogin(!isLogin)} className="mt-2 text-sm text-blue-500 underline">
        {isLogin ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </form>
  );
}