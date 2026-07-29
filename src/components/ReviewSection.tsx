"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../lib/supabase/client";

interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface ReviewSectionProps {
  profileId: string; // The ID of the user profile being viewed/reviewed
}

export default function ReviewSection({ profileId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Fetch reviews for this profile along with reviewer details
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_id (full_name, avatar_url)
        `)
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching reviews:", error);
      else setReviews(data || []);
      
      setLoading(false);
    };

    void fetchUserAndReviews();
  }, [profileId]);

  const handleAddReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !currentUserId) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        profile_id: profileId,
        reviewer_id: currentUserId,
        rating,
        comment,
      })
      .select(`
        *,
        profiles:reviewer_id (full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error submitting review:", error);
    } else if (data) {
      setReviews([data, ...reviews]);
      setComment("");
      setRating(5);
    }
    setSubmitting(false);
  };

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "No ratings yet";

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Reviews & Ratings</h2>
        <div className="bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full text-sm font-semibold text-yellow-700">
          ⭐ {averageRating} {reviews.length > 0 && `(${reviews.length} reviews)`}
        </div>
      </div>

      {/* Review Submission Form (Only if logged in and not reviewing oneself) */}
      {currentUserId && currentUserId !== profileId && (
        <form onSubmit={handleAddReview} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Leave a Review</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rating:</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none"
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Terrible</option>
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your feedback about this user..."
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Post Review"}
          </button>
        </form>
      )}

      {/* Display List of Reviews */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet for this user.</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="border border-gray-100 bg-white p-4 rounded-xl shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-800">
                  {rev.profiles?.full_name || "Anonymous User"}
                </span>
                <span className="text-xs text-yellow-600 font-bold">
                  {"⭐".repeat(rev.rating)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{rev.comment}</p>
              <span className="text-[10px] text-gray-400">
                {new Date(rev.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}