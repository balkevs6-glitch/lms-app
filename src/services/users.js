import { supabase } from "../supabaseClient";

/**
 * Fetches user profile from public.users table by their auth ID.
 * @param {string} userId - auth.users UUID
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, is_active")
    .eq("id", userId)
    .single();

  return { data, error };
}