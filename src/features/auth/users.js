import { supabase } from "../../supabaseClient";

export async function getUserProfile(userId) {
    return supabase
        .from("users")
        .select("id, name, is_active, avatar_url")
        .eq("id", userId)
        .single();
}

export async function searchUsers(searchTerm) {
    const term = searchTerm.trim();
    if (!term) return { data: [], error: null };

    return supabase
        .from("users")
        .select("id, name, avatar_url, is_active")
        .ilike("name", `%${term}%`)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(20);
}

export async function updateUserName(userId, name) {
    return supabase
        .from("users")
        .update({ name })
        .eq("id", userId);
}

export async function uploadAvatar(userId, file) {
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError };

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl + "?t=" + Date.now(); // cache-bust

    const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId)
        .select("id, avatar_url")
        .maybeSingle();

    if (updateError) return { error: updateError };
    if (!updatedUser) {
        return {
            error: new Error("Avatar was uploaded, but your profile could not be updated."),
        };
    }

    return { error: null, url: updatedUser.avatar_url };
}
