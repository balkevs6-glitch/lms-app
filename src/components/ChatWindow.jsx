import { useEffect, useRef, useState } from "react";
import { getMessages, sendMessage, subscribeToMessages } from "../services/chat";

// A project's private chat, shown in the project page's Chat tab.
//   <ChatWindow projectId={id} userId={userId} title="..." />
// (The global chat is a separate embed: see GlobalChatEmbed.jsx)
export default function ChatWindow({
    projectId,
    userId,
    title,
    emptyText = "No messages yet. Say hi!",
    height = 420,
}) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("CONNECTING");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);

    // Add messages without duplicates (a message can arrive both from the
    // realtime event and from our own send/history fetch)
    function addMessages(incoming) {
        setMessages((current) => {
            const byId = new Map(current.map((m) => [m.id, m]));
            for (const m of incoming) byId.set(m.id, m);
            return [...byId.values()].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
        });
    }

    useEffect(() => {
        let active = true;

        setMessages([]);
        setLoading(true);
        setError(null);
        setStatus("CONNECTING");

        // Subscribe first, then load history, so nothing sent in between is missed
        const unsubscribe = subscribeToMessages(
            projectId,
            (message) => {
                if (active) addMessages([message]);
            },
            (nextStatus) => {
                if (active) setStatus(nextStatus);
            }
        );

        getMessages(projectId).then(({ data, error }) => {
            if (!active) return;
            if (error) {
                console.error("Failed to load messages:", error);
                setError(error.message);
            } else {
                addMessages(data || []);
            }
            setLoading(false);
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [projectId]);

    // Keep the newest message in view
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    async function handleSend(e) {
        e.preventDefault();

        const text = draft.trim();
        if (!text || sending) return;

        setSending(true);
        setError(null);

        const { data, error } = await sendMessage(projectId, userId, text);

        setSending(false);

        if (error) {
            console.error("Failed to send message:", error);
            setError(error.message);
            return;
        }

        setDraft("");
        addMessages([data]);
    }

    const live = status === "SUBSCRIBED";

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3 style={styles.title}>{title}</h3>
                <span style={styles.status}>
                    <span
                        style={{
                            ...styles.dot,
                            backgroundColor: live ? "#16a34a" : "#d1d5db",
                        }}
                    />
                    {live ? "Live" : "Connecting..."}
                </span>
            </div>

            <div ref={listRef} style={{ ...styles.list, height }}>
                {loading ? (
                    <p style={styles.hint}>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p style={styles.hint}>{emptyText}</p>
                ) : (
                    messages.map((m) => {
                        const mine = m.sender_id === userId;
                        return (
                            <div
                                key={m.id}
                                style={{
                                    ...styles.row,
                                    alignItems: mine ? "flex-end" : "flex-start",
                                }}
                            >
                                <span style={styles.meta}>
                                    {mine ? "You" : m.users?.name || "Unknown"} ·{" "}
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                                <div
                                    style={{
                                        ...styles.bubble,
                                        ...(mine ? styles.bubbleMine : styles.bubbleTheirs),
                                    }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSend} style={styles.form}>
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message..."
                    maxLength={2000}
                    disabled={sending}
                    style={styles.input}
                />
                <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    style={{
                        ...styles.sendBtn,
                        opacity: sending || !draft.trim() ? 0.5 : 1,
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: "#ffffff",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #eaeaea",
    },
    title: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "600",
    },
    status: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "#6b7280",
    },
    dot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
    },
    list: {
        overflowY: "auto",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        backgroundColor: "#fafafa",
    },
    hint: {
        margin: "auto",
        fontSize: "13px",
        color: "#9ca3af",
        textAlign: "center",
    },
    row: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
    },
    meta: {
        fontSize: "11px",
        color: "#9ca3af",
    },
    bubble: {
        maxWidth: "75%",
        padding: "8px 12px",
        borderRadius: "10px",
        fontSize: "14px",
        lineHeight: "1.4",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
    },
    bubbleMine: {
        backgroundColor: "#111827",
        color: "#ffffff",
    },
    bubbleTheirs: {
        backgroundColor: "#ffffff",
        color: "#111827",
        border: "1px solid #eaeaea",
    },
    error: {
        padding: "8px 20px",
        backgroundColor: "#fef2f2",
        borderTop: "1px solid #fee2e2",
        color: "#dc2626",
        fontSize: "13px",
    },
    form: {
        display: "flex",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid #eaeaea",
    },
    input: {
        flex: 1,
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
    },
    sendBtn: {
        padding: "9px 16px",
        backgroundColor: "#111827",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
    },
};