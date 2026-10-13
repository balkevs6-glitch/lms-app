import { useEffect, useState } from "react";
import { createPost, getProjectPosts } from "./posts";

export default function FeedTab({ projectId, userId, canPost }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    async function loadPosts() {
        setLoading(true);
        setError(null);
        const { data, error: requestError } = await getProjectPosts(projectId);
        if (requestError) {
            console.error("Failed to load posts:", requestError);
            setError(requestError.message);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    }

    useEffect(() => { if (projectId) loadPosts(); }, [projectId]);

    async function submit(event) {
        event.preventDefault();
        if (!title.trim() || !content.trim()) {
            setSubmitError("Title and content are required.");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        const { data, error: requestError } = await createPost(
            projectId, userId, title.trim(), content.trim()
        );
        setSubmitting(false);
        if (requestError) {
            console.error("Create post error:", requestError);
            setSubmitError(requestError.message);
            return;
        }
        setTitle("");
        setContent("");
        setPosts((current) => [data, ...current]);
    }

    return (
        <section style={styles.section}>
            <h2 style={styles.heading}>Feed & Updates</h2>
            {canPost && (
                <form onSubmit={submit} style={styles.card}>
                    <h3 style={styles.formTitle}>Post an Update</h3>
                    {submitError && <div style={styles.error}>{submitError}</div>}
                    <input value={title} onChange={(event) => setTitle(event.target.value)}
                        placeholder="Title / Topic" disabled={submitting} style={styles.input} />
                    <textarea value={content} onChange={(event) => setContent(event.target.value)}
                        placeholder="Write an update for the project..." rows={3}
                        disabled={submitting} style={styles.textarea} />
                    <button type="submit" disabled={submitting} style={styles.submit}>
                        {submitting ? "Posting..." : "Post Update"}
                    </button>
                </form>
            )}
            {loading ? <Empty text="Loading posts..." /> : error ? <Empty text="Unable to load posts." subtext={error} /> :
                posts.length === 0 ? <Empty text="No posts yet." subtext="Be the first to share an update with your project!" /> :
                    <div style={styles.list}>{posts.map((post) => (
                        <article key={post.id} style={styles.card}>
                            <div style={styles.postHeader}>
                                <h3 style={styles.postTitle}>{post.title}</h3>
                                <span style={styles.date}>{new Date(post.created_at).toLocaleDateString(undefined, {
                                    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                                })}</span>
                            </div>
                            <p style={styles.content}>{post.content}</p>
                        </article>
                    ))}</div>}
        </section>
    );
}

function Empty({ text, subtext }) {
    return <div style={styles.empty}><p>{text}</p>{subtext && <small>{subtext}</small>}</div>;
}

// 1. Defined at file level (outside component scope)
const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    font: "inherit"
};

// 2. Safely spread inside styles object
const styles = {
    section: { marginBottom: 32 }, 
    heading: { margin: "0 0 16px", fontSize: 16 },
    card: { backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "20px 24px", marginBottom: 14 },
    formTitle: { margin: "0 0 16px", fontSize: 14 }, 
    input: { ...fieldStyle, marginBottom: 12 },
    textarea: { ...fieldStyle, resize: "vertical", marginBottom: 12 }, 
    submit: { float: "right", padding: "8px 16px", backgroundColor: "#111827", color: "#fff", border: 0, borderRadius: 8 },
    error: { color: "#dc2626", fontSize: 13, marginBottom: 12 }, 
    list: { display: "flex", flexDirection: "column", gap: 14 },
    postHeader: { display: "flex", justifyContent: "space-between", gap: 12 }, 
    postTitle: { margin: 0, fontSize: 15 },
    date: { color: "#9ca3af", fontSize: 12 }, 
    content: { color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6, marginBottom: 0 },
    empty: { backgroundColor: "#fff", border: "1px dashed #d1d5db", borderRadius: 12, padding: 36, textAlign: "center", color: "#6b7280" }
};