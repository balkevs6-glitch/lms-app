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

function generateJoinCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(
            Math.random() * characters.length
        );

        code += characters[randomIndex];
    }

    return code;
}


export async function createClass(userId, name) {
    const joinCode = generateJoinCode();

    const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert({
            name: name,
            join_code: joinCode,
            created_by: userId,
        })
        .select()
        .single();

    if (classError) {
        return {
            data: null,
            error: classError,
        };
    }

    const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .insert({
            class_id: classData.id,
            user_id: userId,
            role: "teacher",
        })
        .select()
        .single();

    if (memberError) {
        return {
            data: null,
            error: memberError,
        };
    }

    return {
        data: {
            class: classData,
            membership: memberData,
        },
        error: null,
    };
}