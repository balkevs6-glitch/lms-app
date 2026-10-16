import { supabase } from "../../supabaseClient";

export async function getUserProfile(userId) {
    return supabase
        .from("users")
        .select("id, name, is_active, avatar_url")
        .eq("id", userId)
        .single();
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

    const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

    return { error: updateError, url: avatarUrl };
}
