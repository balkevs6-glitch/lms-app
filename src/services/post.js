import { supabase } from "../supabaseClient";

export async function getClassPosts(classId) {
    const { data, error } = await supabase
        .from("posts")
        .select(`
            id,
            class_id,
            author_id,
            title,
            content,
            created_at
        `)
        .eq("class_id", classId)
        .order("created_at", {
            ascending: false,
        });

    return { data, error };
}

export async function createPost(
    classId,
    authorId,
    title,
    content
) {
    const { data, error } = await supabase
        .from("posts")
        .insert({
            class_id: classId,
            author_id: authorId,
            title: title,
            content: content,
        })
        .select()
        .single();

    return { data, error };
}