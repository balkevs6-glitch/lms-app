import { useEffect, useState } from "react";
import { getProject } from "../features/projects/projects";
import ProjectHeader from "../features/projects/ProjectHeader";
import FeedTab from "../features/feed/FeedTab";
import ChatWindow from "../features/chat/ChatWindow";
import FilesTab from "../features/files/FilesTab";

const tabs = [
    { id: "feed", label: "Feed" },
    { id: "files", label: "Files", soon: "Upload and browse the project's code here." },
    { id: "chat", label: "Chat" },
    { id: "call", label: "Call", soon: "Start a video call with the project members here." },
];

export default function ProjectPage({ projectId, session, onBack }) {
    const [project, setProject] = useState(null);
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("feed");
    const userId = session?.user?.id;

    useEffect(() => {
        let active = true;
        async function load() {
            if (!projectId || !userId) return;
            setLoading(true); setError(null);
            const result = await getProject(projectId, userId);
            if (!active) return;
            if (result.error) setError(result.reason === "membership" ? "You are not a member of this project." : "Project not found.");
            else { setMembership(result.data.membership); setProject(result.data.project); }
            setLoading(false);
        }
        load();
        return () => { active = false; };
    }, [projectId, userId]);

    if (loading) return <State text="Loading project..." />;
    if (error) return <State text={error} onBack={onBack} error />;

    return <div style={styles.container}>
        <ProjectHeader projectId={projectId} project={project} membership={membership} onBack={onBack}
            onProjectChange={(name) => setProject((current) => ({ ...current, name }))} />
        <nav style={styles.tabs}>{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.activeTab : {}) }}>{tab.label}</button>)}</nav>
        <main style={styles.main}>
            {activeTab === "feed" && <FeedTab projectId={projectId} userId={userId} canPost={membership?.role === "maintainer"} />}
            {activeTab === "files" && <FilesTab projectId={projectId} userId={userId} membership={membership} />}
            {activeTab === "chat" && <ChatWindow projectId={projectId} userId={userId}
                title={`${project?.name || "Project"} chat`} emptyText="No messages yet. Start the conversation with your project members!" />}
            {activeTab !== "feed" && activeTab !== "files" && activeTab !== "chat" && <div style={styles.empty}>
                <p>{tabs.find((tab) => tab.id === activeTab)?.label} is coming soon.</p>
                <small>{tabs.find((tab) => tab.id === activeTab)?.soon}</small>
            </div>}
        </main>
    </div>;
}

function State({ text, onBack, error }) {
    return <div style={styles.state}><div style={error ? styles.errorCard : undefined}>
        {error && <h3 style={{ color: "#dc2626" }}>Error</h3>}<p>{text}</p>
        {onBack && <button onClick={onBack}>← Back to Dashboard</button>}
    </div></div>;
}

const styles = {
    container: { minHeight: "100vh", backgroundColor: "#fafafa", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: "#111827" },
    tabs: { 
        display: "flex", 
        gap: 4, 
        padding: "0 32px", 
        backgroundColor: "#fff", 
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#eaeaea" 
    },
    // ✅ Split borderBottom into individual longhand properties:
    tab: { 
        padding: "12px 16px", 
        background: "none", 
        border: 0, 
        borderBottomWidth: "2px",
        borderBottomStyle: "solid",
        borderBottomColor: "transparent", 
        color: "#6b7280", 
        cursor: "pointer" 
    },
    activeTab: { 
        color: "#111827", 
        borderBottomColor: "#111827" 
    }, 
    main: { maxWidth: 800, margin: "0 auto", padding: "32px 24px" },
    empty: { backgroundColor: "#fff", border: "1px dashed #d1d5db", borderRadius: 12, padding: 36, textAlign: "center", color: "#6b7280" },
    state: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
    errorCard: { padding: 28, textAlign: "center", border: "1px solid #fee2e2", borderRadius: 12, backgroundColor: "#fff" },
};