import { useEffect, useRef, useState } from "react";
import { getMessages, sendMessage, subscribeToMessages } from "./chat";

export default function ChatWindow({ projectId, userId, title, emptyText = "No messages yet. Say hi!" }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("CONNECTING");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);

    function addMessages(incoming) {
        setMessages((current) => {
            const byId = new Map(current.map((message) => [message.id, message]));
            incoming.forEach((message) => byId.set(message.id, message));
            return [...byId.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
    }

    useEffect(() => {
        let active = true;
        setMessages([]); setLoading(true); setError(null); setStatus("CONNECTING");
        const unsubscribe = subscribeToMessages(projectId, (message) => {
            if (active) addMessages([message]);
        }, (nextStatus) => active && setStatus(nextStatus));
        getMessages(projectId).then(({ data, error: requestError }) => {
            if (!active) return;
            if (requestError) { console.error("Failed to load messages:", requestError); setError(requestError.message); }
            else addMessages(data || []);
            setLoading(false);
        });
        return () => { active = false; unsubscribe(); };
    }, [projectId]);

    useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

    async function submit(event) {
        event.preventDefault();
        const text = draft.trim();
        if (!text || sending) return;
        setSending(true); setError(null);
        const { data, error: requestError } = await sendMessage(projectId, userId, text);
        setSending(false);
        if (requestError) { console.error("Failed to send message:", requestError); setError(requestError.message); return; }
        setDraft(""); addMessages([data]);
    }

    return <div style={styles.card}>
        <header style={styles.header}><h3>{title}</h3><span>{status === "SUBSCRIBED" ? "● Live" : "○ Connecting..."}</span></header>
        <div ref={listRef} style={styles.list}>{loading ? <p>Loading messages...</p> : messages.length === 0 ? <p>{emptyText}</p> :
            messages.map((message) => <div key={message.id} style={{ ...styles.row, alignItems: message.sender_id === userId ? "flex-end" : "flex-start" }}>
                <small>{message.sender_id === userId ? "You" : message.users?.name || "Unknown"} · {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                <div style={{ ...styles.bubble, backgroundColor: message.sender_id === userId ? "#111827" : "#fff", color: message.sender_id === userId ? "#fff" : "#111827" }}>{message.content}</div>
            </div>)}</div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={submit} style={styles.form}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." maxLength={2000} disabled={sending} style={styles.input} /><button disabled={sending || !draft.trim()}>Send</button></form>
    </div>;
}

const styles = {
    card: { backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" },
    header: { display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #eaeaea" },
    list: { height: 420, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, backgroundColor: "#fafafa" },
    row: { display: "flex", flexDirection: "column", gap: 3 }, bubble: { maxWidth: "75%", padding: "8px 12px", borderRadius: 10, whiteSpace: "pre-wrap" },
    error: { padding: 10, color: "#dc2626", backgroundColor: "#fef2f2" }, form: { display: "flex", gap: 8, padding: 12 },
    input: { flex: 1, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 },
};
