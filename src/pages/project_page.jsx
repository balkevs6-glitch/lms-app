import { useEffect, useState } from "react";

import { supabase } from "../supabaseClient";

import { getProjectPosts, createPost } from "../services/post";

import { renameProject, deleteProject, leaveProject } from "../services/projects";

import ChatWindow from "../components/ChatWindow";



const TABS = [

    { id: "feed", label: "Feed" },

    { id: "files", label: "Files", soon: "Upload and browse the project's code here." },

    { id: "chat", label: "Chat" },

    { id: "call", label: "Call", soon: "Start a video call with the project members here." },

];



export default function ProjectPage({ projectId, session, onBack }) {

    const [membership, setMembership] = useState(null);

    const [projectInfo, setProjectInfo] = useState(null);



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

    const [activeTab, setActiveTab] = useState("feed");

    const [showRenameInput, setShowRenameInput] = useState(false);

    const [newProjectName, setNewProjectName] = useState("");

    const [projectActionLoading, setProjectActionLoading] = useState(false);

    const [projectActionError, setProjectActionError] = useState(null);

    // Load project details and verify membership

    useEffect(() => {

        async function loadProject() {

            if (!userId || !projectId) return;



            setLoading(true);

            setError(null);



            // Check membership

            const { data: membershipData, error: membershipError } =

                await supabase

                    .from("project_members")

                    .select("role")

                    .eq("project_id", projectId)

                    .eq("user_id", userId)

                    .single();



            if (membershipError) {

                setError("You are not a member of this project.");

                setLoading(false);

                return;

            }



            setMembership(membershipData);



            // Fetch project information

            const { data: projectData, error: projectError } =

                await supabase

                    .from("projects")

                    .select("id, name, join_code")

                    .eq("id", projectId)

                    .single();



            if (projectError) {

                setError("Project not found.");

                setLoading(false);

                return;

            }



            setProjectInfo(projectData);

            setLoading(false);

        }



        loadProject();

    }, [projectId, userId]);



    // Load project feed posts

    async function loadPosts() {

        if (!projectId) return;



        setPostsLoading(true);

        setPostsError(null);



        const { data, error } = await getProjectPosts(projectId);



        if (error) {

            console.error("Failed to load posts:", error);

            setPostsError(error.message);

        } else {

            setPosts(data || []);

        }



        setPostsLoading(false);

    }



    useEffect(() => {

        if (projectId) {

            loadPosts();

        }

    }, [projectId]);



    // Create a new post

    async function handleCreatePost(e) {

    e.preventDefault();



    if (!newTitle.trim() || !newContent.trim()) {

        setPostSubmitError("Title and content are required.");

        return;

    }



    setPostSubmitting(true);

    setPostSubmitError(null);



    const { data, error } = await createPost(

        projectId,

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

    async function handleRenameProject(e) {

    e.preventDefault();



    const trimmedName = newProjectName.trim();



    if (!trimmedName) {

        setProjectActionError("Project name cannot be empty.");

        return;

    }



    if (trimmedName.length > 80) {

        setProjectActionError("Project name must be 80 characters or fewer.");

        return;

    }



    if (trimmedName === projectInfo?.name) {

        setShowRenameInput(false);

        return;

    }



    setProjectActionLoading(true);

    setProjectActionError(null);



    const { data, error } = await renameProject(projectId, trimmedName);



    setProjectActionLoading(false);



    if (error) {

        console.error("Rename project error:", error);

        setProjectActionError(error.message || "Could not rename the project.");

        return;

    }



    // Update the header immediately without reloading the page.

    setProjectInfo((current) => ({

        ...current,

        name: typeof data === "string" ? data : trimmedName,

    }));



    setNewProjectName("");

    setShowRenameInput(false);

}



    async function handleDeleteProject() {

        const confirmed = window.confirm(

            `Permanently delete "${projectInfo?.name}" for everyone? This action cannot be undone.`

        );



        if (!confirmed) return;



        setProjectActionLoading(true);

        setProjectActionError(null);



        const { error } = await deleteProject(projectId);



        setProjectActionLoading(false);



        if (error) {

            console.error("Delete project error:", error);

            setProjectActionError(error.message || "Could not delete the project.");

            return;

        }



        // Return to the dashboard after a successful deletion.

        onBack?.();

    }

    async function handleLeaveProject() {
        const confirmed = window.confirm(
            `Leave "${projectInfo?.name}"? You will lose access to its feed and chat. You can rejoin later with the join code.`
        );

        if (!confirmed) return;

        setProjectActionLoading(true);
        setProjectActionError(null);

        const { error } = await leaveProject(projectId);

        setProjectActionLoading(false);

        if (error) {
            console.error("Leave project error:", error);
            setProjectActionError(error.message || "Could not leave the project.");
            return;
        }

        // Back to the dashboard, which reloads your project list.
        onBack?.();
    }

    function cancelRename() {
        setShowRenameInput(false);
        setNewProjectName("");
        setProjectActionError(null);
    }

    if (loading) {

        return (

            <div style={styles.stateContainer}>

                <div style={styles.spinner} />

                <p style={styles.stateText}>Loading project...</p>

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
                        {showRenameInput ? (
                            <form
                                onSubmit={handleRenameProject}
                                style={styles.renameForm}
                            >
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") cancelRename();
                                    }}
                                    placeholder="Enter project name"
                                    maxLength={80}
                                    required
                                    autoFocus
                                    disabled={projectActionLoading}
                                    style={styles.renameInput}
                                />

                                <button
                                    type="submit"
                                    style={styles.saveRenameBtn}
                                    disabled={projectActionLoading}
                                >
                                    {projectActionLoading ? "Saving..." : "Save"}
                                </button>

                                <button
                                    type="button"
                                    style={styles.cancelRenameBtn}
                                    onClick={cancelRename}
                                    disabled={projectActionLoading}
                                >
                                    Cancel
                                </button>
                            </form>
                        ) : (
                            <h1 style={styles.projectName}>{projectInfo?.name}</h1>
                        )}

                        <div style={styles.projectMeta}>
                            <span style={styles.roleBadge}>
                                {membership?.role}
                            </span>

                            {projectInfo?.join_code && (
                                <span style={styles.codeBadge}>
                                    Code: <strong>{projectInfo.join_code}</strong>
                                </span>
                            )}
                        </div>

                        {membership?.role === "maintainer" && !showRenameInput && (
                            <div style={styles.projectActions}>
                                <button
                                    type="button"
                                    style={styles.renameBtn}
                                    onClick={() => {
                                        setNewProjectName(projectInfo?.name || "");
                                        setProjectActionError(null);
                                        setShowRenameInput(true);
                                    }}
                                    disabled={projectActionLoading}
                                >
                                    Rename Project
                                </button>

                                <button
                                    type="button"
                                    style={styles.deleteProjectBtn}
                                    onClick={handleDeleteProject}
                                    disabled={projectActionLoading}
                                >
                                    {projectActionLoading ? "Processing..." : "Delete Project"}
                                </button>
                            </div>
                        )}

                        {projectActionError && (
                            <p style={styles.projectActionError}>
                                {projectActionError}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    style={styles.leaveBtn}
                    onClick={handleLeaveProject}
                    disabled={projectActionLoading}
                >
                    Leave Project
                </button>
            </header>



            <nav style={styles.tabs}>

                {TABS.map((tab) => (

                    <button

                        key={tab.id}

                        type="button"

                        onClick={() => setActiveTab(tab.id)}

                        style={{

                            ...styles.tab,

                            ...(activeTab === tab.id ? styles.tabActive : {}),

                        }}

                    >

                        {tab.label}

                    </button>

                ))}

            </nav>



            <main style={styles.main}>

                {activeTab === "feed" && (

                    <section style={styles.section}>

                        <div style={styles.sectionHeader}>

                            <h2 style={styles.sectionTitle}>Feed & Updates</h2>

                        </div>



                        {/* New Post Form (Maintainers only) */}

                        {membership?.role === "maintainer" && (

                            <div style={styles.postFormCard}>

                                <h3 style={styles.formTitle}>Post an Update</h3>



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

                                            style={ styles.input}

                                        />

                                    </div>



                                    <div style={styles.field}>

                                        <textarea

                                            placeholder="Write an update for the project..."

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

                                            {postSubmitting ? "Posting..." : "Post Update"}

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

                                        Be the first to share an update with your project!

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

                )}



                {activeTab === "chat" && (

                    <ChatWindow

                        projectId={projectId}

                        userId={userId}

                        title={`${projectInfo?.name ?? "Project"} chat`}

                        emptyText="No messages yet. Start the conversation with your project members!"

                    />

                )}



                {activeTab !== "feed" && activeTab !== "chat" && (

                    <div style={styles.emptyState}>

                        <p style={styles.emptyText}>

                            {TABS.find((t) => t.id === activeTab)?.label} is coming soon.

                        </p>

                        <p style={styles.emptySubtext}>

                            {TABS.find((t) => t.id === activeTab)?.soon}

                        </p>

                    </div>

                )}

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

    projectName: {

        margin: "0 0 4px 0",

        fontSize: "18px",

        fontWeight: "600",

        letterSpacing: "-0.01em",

    },

    projectMeta: {

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

    tabs: {

        display: "flex",

        gap: "4px",

        padding: "0 32px",

        backgroundColor: "#ffffff",

        borderBottom: "1px solid #eaeaea",

    },

    tab: {

        padding: "12px 16px",

        background: "none",

        borderTop: "none",

        borderLeft: "none",

        borderRight: "none",

        borderBottom: "2px solid transparent",

        marginBottom: "-1px",

        fontSize: "13px",

        fontWeight: "500",

        color: "#6b7280",

        cursor: "pointer",

    },

    tabActive: {

        color: "#111827",

        borderBottom: "2px solid #111827",

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

    leaveBtn: {
        backgroundColor: "#ffffff",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "7px 12px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
    },

    renameBtn: {

        backgroundColor: "#f3f4f6",

        color: "#374151",

        border: "1px solid #d1d5db",

        borderRadius: "7px",

        padding: "8px 12px",

        fontSize: "13px",

        fontWeight: "500",

        cursor: "pointer",

    },

    renameInput: {
        width: "280px",
        maxWidth: "100%",
        padding: "6px 10px",
        border: "1px solid #d1d5db",
        borderRadius: "7px",
        fontSize: "18px",
        fontWeight: "600",
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
        outline: "none",
    },



    saveRenameBtn: {

        backgroundColor: "#2563eb",

        color: "#ffffff",

        border: "none",

        borderRadius: "7px",

        padding: "9px 12px",

        fontSize: "13px",

        cursor: "pointer",

    },



    cancelRenameBtn: {

        backgroundColor: "#ffffff",

        color: "#374151",

        border: "1px solid #d1d5db",

        borderRadius: "7px",

        padding: "9px 12px",

        fontSize: "13px",

        cursor: "pointer",

    },



    deleteProjectBtn: {

        backgroundColor: "#ffffff",

        color: "#dc2626",

        border: "1px solid #fecaca",

        borderRadius: "7px",

        padding: "8px 12px",

        fontSize: "13px",

        fontWeight: "500",

        cursor: "pointer",

    },




    projectActions: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "12px",
    },

    renameForm: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "4px",
    },

    projectActionError: {
        color: "#dc2626",
        fontSize: "13px",
        marginTop: "8px",
    },

};