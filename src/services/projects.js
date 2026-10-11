import { supabase } from "../supabaseClient";

// Any member can create a project. The database function create_project()
// generates a unique join code and makes the creator the project's maintainer.
export async function createProject(name, description = null) {
    const { data, error } = await supabase.rpc("create_project", {
        p_name: name,
        p_description: description,
    });

    return { data, error };
}

// Always joins as a contributor. The role is decided in the database,
// not by anything the browser sends.
export async function joinProject(code) {
    const { data, error } = await supabase.rpc("join_project", {
        code: code.trim().toUpperCase(),
    });

    if (error) {
        // 23505 = unique violation: already a member (primary key on project_members)
        if (error.code === "23505") {
            return {
                data: null,
                error: { message: "You're already in this project." },
            };
        }
        if (error.message?.includes("No project found")) {
            return {
                data: null,
                error: { message: "No project found with that code." },
            };
        }
    }

    return { data, error };
}

// Projects the user belongs to, with their role in each (for the dashboard)
export async function getUserProjects(userId) {
    const { data, error } = await supabase
        .from("project_members")
        .select("role, projects(id, name, description, join_code)")
        .eq("user_id", userId);

    return { data, error };
}

// Rename a project. The database function checks maintainer permissions.
export async function renameProject(projectId, newName) {
    const { data, error } = await supabase.rpc("rename_project", {
        p_project_id: projectId,
        p_name: newName.trim(),
    });

    return { data, error };
}

// Delete a project. The database function checks maintainer permissions.
export async function deleteProject(projectId) {
    const { data, error } = await supabase.rpc("delete_project", {
        p_project_id: projectId,
    });

    return { data, error };
}

// Leave a project. The database checks the rules; the browser can't remove memberships itself.
export async function leaveProject(projectId) {
    const { data, error } = await supabase.rpc("leave_project", {
        p_project_id: projectId,
    });

    return { data, error };
}