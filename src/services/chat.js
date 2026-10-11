import { supabase } from "../supabaseClient";

// Project chat only. Each project has its own private chat; row level
// security means you can only read or send messages in projects you belong to.

const MESSAGE_FIELDS = "id, project_id, sender_id, content, created_at, users(name)";

export async function getMessages(projectId, limit = 50) {
    const { data, error } = await supabase
        .from("messages")
        .select(MESSAGE_FIELDS)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(limit);

    // Newest first from the database, oldest first for display
    return { data: data ? [...data].reverse() : null, error };
}

export async function sendMessage(projectId, senderId, content) {
    const { data, error } = await supabase
        .from("messages")
        .insert({
            project_id: projectId,
            sender_id: senderId,
            content: content.trim(),
        })
        .select(MESSAGE_FIELDS)
        .single();

    return { data, error };
}

// Calls onMessage(message) for every new message in this project's chat.
// Returns an unsubscribe function. Realtime only sends the raw row, so we
// fetch it again with the sender's name; that fetch also goes through RLS.
export function subscribeToMessages(projectId, onMessage, onStatus) {
    // Unique topic per subscription so React's double-mount in dev can't clash
    const topic = `chat-${projectId}-${crypto.randomUUID()}`;

    const channel = supabase
        .channel(topic)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `project_id=eq.${projectId}`,
            },
            async (payload) => {
                const { data } = await supabase
                    .from("messages")
                    .select(MESSAGE_FIELDS)
                    .eq("id", payload.new.id)
                    .single();

                if (data) onMessage(data);
            }
        )
        .subscribe((status) => onStatus?.(status));

    return () => {
        supabase.removeChannel(channel);
    };
}