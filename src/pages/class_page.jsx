import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getClassPosts, createPost } from "../services/post";

export default function ClassPage({ classId, session, onBack }) {
    const [membership, setMembership] = useState(null);
    const [classInfo, setClassInfo] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Feed / Posts state
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState(null);

    // New post form state
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [postSubmitting, setPostSubmitting] = useState(false);
    const [postSubmitError, setPostSubmitError] = useState(null);

    const userId = session?.user?.id;

    // Load class details and verify membership
    useEffect(() => {
        async function loadClass() {
            if (!userId || !classId) return;

            setLoading(true);
            setError(null);

            // Check membership
            const { data: membershipData, error: membershipError } =
                await supabase
                    .from("class_members")
                    .select("role")
                    .eq("class_id", classId)
                    .eq("user_id", userId)
                    .single();

            if (membershipError) {
                setError("You are not a member of this class.");
                setLoading(false);
                return;
            }

            setMembership(membershipData);

            // Fetch class information
            const { data: classData, error: classError } =
                await supabase
                    .from("classes")
                    .select("id, name, join_code")
                    .eq("id", classId)
                    .single();

            if (classError) {
                setError("Class not found.");
                setLoading(false);
                return;
            }

            setClassInfo(classData);
            setLoading(false);
        }

        loadClass();
    }, [classId, userId]);

    // Load class feed posts
    async function loadPosts() {
        if (!classId) return;

        setPostsLoading(true);
        setPostsError(null);

        const { data, error } = await getClassPosts(classId);

        if (error) {
            console.error("Failed to load posts:", error);
            setPostsError(error.message);
        } else {
            setPosts(data || []);
        }

        setPostsLoading(false);
    }

    useEffect(() => {
        if (classId) {
            loadPosts();
        }
    }, [classId]);

    // Create a new post
    async function handleCreatePost(e) {
    e.preventDefault();

    if (!newTitle.trim() || !newContent.trim()) {
        setPostSubmitError("Title and content are required.");
        return;
    }

    setPostSubmitting(true);
    setPostSubmitError(null);

    const { data: authData, error: authError } =
        await supabase.auth.getUser();

    console.log("AUTH USER:", authData.user);
    console.log("AUTH ERROR:", authError);

    console.log("POST DATA:", {
        classId,
        userId,
        authorId: userId,
        membership,
    });

    const { data, error } = await createPost(
        classId,
        userId,
        newTitle.trim(),
        newContent.trim()
    );

    setPostSubmitting(false);

    if (error) {
        console.error("Create post error:", error);
        setPostSubmitError(error.message);
        return;
    }

    setNewTitle("");
    setNewContent("");
    loadPosts();
}

    if (loading) {
        return (
            <div style={styles.stateContainer}>
                <div style={styles.spinner} />
                <p style={styles.stateText}>Loading class...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.stateContainer}>
                <div style={styles.errorCard}>
                    <h3 style={{ margin: "0 0 8px", color: "#dc2626" }}>Error</h3>
                    <p style={{ margin: "0 0 16px", color: "#6b7280" }}>{error}</p>
                    {onBack && (
                        <button onClick={onBack} style={styles.secondaryBtn}>
                            ← Back to Dashboard
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    {onBack && (
                        <button onClick={onBack} style={styles.backBtn}>
                            ← Back
                        </button>
                    )}
                    <div>
                        <h1 style={styles.className}>{classInfo?.name}</h1>
                        <div style={styles.classMeta}>
                            <span style={styles.roleBadge}>
                                {membership?.role}
                            </span>
                            {classInfo?.join_code && (
                                <span style={styles.codeBadge}>
                                    Code: <strong>{classInfo.join_code}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Feed Section */}
                <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Feed & Announcements</h2>
                    </div>

                    {/* New Post Form (Teachers Only) */}
                    {membership?.role === "teacher" && (
                        <div style={styles.postFormCard}>
                            <h3 style={styles.formTitle}>Create Announcement</h3>

                            {postSubmitError && (
                                <div style={styles.formError}>{postSubmitError}</div>
                            )}

                            <form onSubmit={handleCreatePost}>
                                <div style={styles.field}>
                                    <input
                                        type="text"
                                        placeholder="Title / Topic"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        disabled={postSubmitting}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.field}>
                                    <textarea
                                        placeholder="Write an announcement or assignment for the class..."
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        rows={3}
                                        disabled={postSubmitting}
                                        style={styles.textarea}
                                    />
                                </div>

                                <div style={styles.formActions}>
                                    <button
                                        type="submit"
                                        disabled={postSubmitting}
                                        style={styles.submitBtn}
                                    >
                                        {postSubmitting ? "Posting..." : "Post Announcement"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Posts List */}
                    <div style={styles.postsList}>
                        {postsLoading ? (
                            <div style={styles.emptyState}>
                                <p style={styles.emptyText}>Loading posts...</p>
                            </div>
                        ) : postsError ? (
                            <div style={styles.emptyState}>
                                <p style={{ ...styles.emptyText, color: "#dc2626" }}>
                                    Could not load posts: {postsError}
                                </p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div style={styles.emptyState}>
                                <p style={styles.emptyText}>No posts yet.</p>
                                <p style={styles.emptySubtext}>
                                    Be the first to share an announcement with your class!
                                </p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <article key={post.id} style={styles.postCard}>
                                    <div style={styles.postHeader}>
                                        <h3 style={styles.postTitle}>{post.title}</h3>
                                        <span style={styles.postDate}>
                                            {new Date(post.created_at).toLocaleDateString(
                                                undefined,
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </span>
                                    </div>
                                    <p style={styles.postContent}>{post.content}</p>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#111827",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #eaeaea",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    backBtn: {
        background: "none",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "7px 12px",
        fontSize: "13px",
        fontWeight: "500",
        color: "#374151",
        cursor: "pointer",
    },
    className: {
        margin: "0 0 4px 0",
        fontSize: "18px",
        fontWeight: "600",
        letterSpacing: "-0.01em",
    },
    classMeta: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    roleBadge: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "500",
        textTransform: "capitalize",
    },
    codeBadge: {
        backgroundColor: "#eff6ff",
        color: "#1e40af",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        border: "1px solid #dbeafe",
    },
    main: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "32px 24px",
    },
    section: {
        marginBottom: "32px",
    },
    sectionHeader: {
        marginBottom: "16px",
    },
    sectionTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "600",
        letterSpacing: "-0.01em",
    },
    postFormCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
    },
    formTitle: {
        margin: "0 0 16px 0",
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
    },
    formError: {
        padding: "8px 12px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fee2e2",
        color: "#dc2626",
        borderRadius: "6px",
        fontSize: "13px",
        marginBottom: "14px",
    },
    field: {
        marginBottom: "12px",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    textarea: {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        resize: "vertical",
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
    },
    submitBtn: {
        padding: "8px 16px",
        backgroundColor: "#111827",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
    },
    postsList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    postCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
        padding: "20px 24px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
    },
    postHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "8px",
    },
    postTitle: {
        margin: 0,
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    postDate: {
        fontSize: "12px",
        color: "#9ca3af",
    },
    postContent: {
        margin: 0,
        fontSize: "14px",
        color: "#374151",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
    },
    emptyState: {
        backgroundColor: "#ffffff",
        border: "1px dashed #d1d5db",
        borderRadius: "12px",
        padding: "36px 20px",
        textAlign: "center",
    },
    emptyText: {
        margin: "0 0 4px 0",
        fontSize: "14px",
        fontWeight: "500",
        color: "#374151",
    },
    emptySubtext: {
        margin: 0,
        fontSize: "13px",
        color: "#9ca3af",
    },
    stateContainer: {
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    stateText: {
        marginTop: "12px",
        fontSize: "13px",
        color: "#6b7280",
    },
    spinner: {
        width: "28px",
        height: "28px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    errorCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #fee2e2",
        borderRadius: "12px",
        padding: "28px",
        textAlign: "center",
        maxWidth: "400px",
    },
    secondaryBtn: {
        padding: "8px 16px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        color: "#374151",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
    },
};