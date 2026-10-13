import { supabase } from "../../supabaseClient";

export async function getUserProfile(userId) {
    return supabase
        .from("users")
        .select("id, name, is_active")
        .eq("id", userId)
        .single();
}
