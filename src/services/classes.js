import { supabase } from "../supabaseClient";

export async function getUserClasses(userId) {
    const { data, error } = await supabase
        .from("class_members")
        .select(`
            role,
            joined_at,
            classes (
                id,
                name,
                join_code,
                created_by,
                created_at
            )
        `)
        .eq("user_id", userId);

    return { data, error };
}