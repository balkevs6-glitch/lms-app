import { supabase } from "../../supabaseClient";

export async function getProjectPosts(projectId) {
    return supabase
        .from("posts")
        .select("id, project_id, author_id, title, content, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
}

export async function createPost(projectId, authorId, title, content) {
    return supabase
        .from("posts")
        .insert({ project_id: projectId, author_id: authorId, title, content })
        .select()
        .single();
}
