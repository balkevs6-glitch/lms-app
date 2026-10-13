import { useState } from "react";
import { deleteProject, leaveProject, renameProject } from "./projects";

export default function ProjectHeader({ projectId, project, membership, onBack, onProjectChange }) {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState(project?.name || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function saveRename(event) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return setError("Project name cannot be empty.");
        if (trimmed.length > 80) return setError("Project name must be 80 characters or fewer.");
        if (trimmed === project.name) return setRenaming(false);
        setLoading(true); setError(null);
        const { data, error: requestError } = await renameProject(projectId, trimmed);
        setLoading(false);
        if (requestError) { console.error("Rename project error:", requestError); setError(requestError.message || "Could not rename the project."); return; }
        onProjectChange(typeof data === "string" ? data : trimmed);
        setRenaming(false);
    }

    async function action(request, message) {
        if (!window.confirm(message)) return;
        setLoading(true); setError(null);
        const { error: requestError } = await request(projectId);
        setLoading(false);
        if (requestError) { console.error("Project action error:", requestError); setError(requestError.message || "Could not complete the project action."); return; }
        onBack?.();
    }

    return <header style={styles.header}>
        <div style={styles.left}>
            {onBack && <button onClick={onBack} style={styles.button}>← Back</button>}
            <div>
                {renaming ? <form onSubmit={saveRename} style={styles.form}>
                    <input value={name} maxLength={80} autoFocus disabled={loading} onChange={(event) => setName(event.target.value)} style={styles.input} />
                    <button disabled={loading}>Save</button>
                    <button type="button" disabled={loading} onClick={() => { setRenaming(false); setName(project.name); setError(null); }}>Cancel</button>
                </form> : <h1 style={styles.title}>{project?.name}</h1>}
                <div style={styles.meta}><span>{membership?.role}</span>{project?.join_code && <span>Code: <strong>{project.join_code}</strong></span>}</div>
                {membership?.role === "maintainer" && !renaming && <div style={styles.actions}>
                    <button disabled={loading} onClick={() => { setName(project.name); setError(null); setRenaming(true); }}>Rename Project</button>
                    <button disabled={loading} onClick={() => action(deleteProject, `Permanently delete "${project.name}" for everyone? This action cannot be undone.`)} style={styles.danger}>Delete Project</button>
                </div>}
                {error && <p style={styles.error}>{error}</p>}
            </div>
        </div>
        <button disabled={loading} onClick={() => action(leaveProject, `Leave "${project.name}"? You can rejoin later with the join code.`)} style={styles.danger}>Leave Project</button>
    </header>;
}

const styles = {
    header: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "16px 32px", 
        backgroundColor: "#fff", 
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "#eaeaea"
    },
    left: { display: "flex", alignItems: "center", gap: 16 }, 
    title: { margin: "0 0 4px", fontSize: 18 },
    meta: { display: "flex", gap: 8, color: "#374151", fontSize: 11 }, 
    actions: { display: "flex", gap: 8, marginTop: 12 },
    form: { display: "flex", gap: 8 }, 
    input: { 
        width: 280, 
        maxWidth: "100%", 
        padding: 7, 
        fontSize: 18, 
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#d1d5db",
        borderRadius: 7 
    },
    button: { 
        padding: "7px 12px", 
        backgroundColor: "#fff", 
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#e5e7eb",
        borderRadius: 8 
    }, 
    danger: { 
        color: "#dc2626", 
        backgroundColor: "#fff", 
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#fecaca",
        borderRadius: 7, 
        padding: "8px 12px" 
    },
    error: { color: "#dc2626", fontSize: 13 },
};