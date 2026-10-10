import { supabase } from "../supabaseClient";

export async function getProjectPosts(projectId) {
    const { data, error } = await supabase
        .from("posts")
        .select(`
            id,
            project_id,
            author_id,
            title,
            content,
            created_at
        `)
        .eq("project_id", projectId)
        .order("created_at", {
            ascending: false,
        });

    return { data, error };
}

export async function createPost(
    projectId,
    authorId,
    title,
    content
) {
    const { data, error } = await supabase
        .from("posts")
        .insert({
            project_id: projectId,
            author_id: authorId,
            title: title,
            content: content,
        })
        .select()
        .single();

    return { data, error };
}