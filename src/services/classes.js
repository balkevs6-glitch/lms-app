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

export async function joinClass(userId, joinCode) {
    const cleanCode = joinCode.trim().toUpperCase();

    // 1. Find the class by join code
    const { data: classData, error: classError } = await supabase
        .from("classes")
        .select()
        .eq("join_code", cleanCode)
        .single();

    if (classError || !classData) {
        return {
            data: null,
            error: new Error("Class not found. Please check your join code."),
        };
    }

    // 2. Check if user is already a member
    const { data: existingMember } = await supabase
        .from("class_members")
        .select("role")
        .eq("class_id", classData.id)
        .eq("user_id", userId)
        .maybeSingle();

    if (existingMember) {
        return {
            data: null,
            error: new Error("You have already joined this class."),
        };
    }

    // 3. Add user as student member
    const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .insert({
            class_id: classData.id,
            user_id: userId,
            role: "student",
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