import { supabase } from "../../supabaseClient";

export async function getProject(projectId, userId) {
    const { data: membership, error: membershipError } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

    if (membershipError) {
        return { data: null, error: membershipError, reason: "membership" };
    }

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, name, join_code")
        .eq("id", projectId)
        .single();

    if (projectError) {
        return { data: null, error: projectError, reason: "project" };
    }

    return { data: { membership, project }, error: null };
}

export async function getProjectMembers(projectId) {
    return supabase
        .from("project_members")
        .select("role, joined_at, users(id, name, avatar_url, created_at)")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true });
}

export async function createProject(name, description = null) {
    return supabase.rpc("create_project", {
        p_name: name,
        p_description: description,
    });
}

export async function joinProject(code) {
    const { data, error } = await supabase.rpc("join_project", {
        code: code.trim().toUpperCase(),
    });

    if (error?.code === "23505") {
        return { data: null, error: { message: "You're already in this project." } };
    }
    if (error?.message?.includes("No project found")) {
        return { data: null, error: { message: "No project found with that code." } };
    }

    return { data, error };
}

export async function getUserProjects(userId) {
    return supabase
        .from("project_members")
        .select("role, projects(id, name, description, join_code, created_by)")
        .eq("user_id", userId);
}

export async function renameProject(projectId, name) {
    return supabase.rpc("rename_project", {
        p_project_id: projectId,
        p_name: name.trim(),
    });
}

export async function deleteProject(projectId) {
    return supabase.rpc("delete_project", { p_project_id: projectId });
}

export async function leaveProject(projectId) {
    return supabase.rpc("leave_project", { p_project_id: projectId });
}
