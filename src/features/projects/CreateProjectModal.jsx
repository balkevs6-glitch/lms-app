import { useState } from "react";
import { createProject } from "./projects";

export default function CreateProjectModal({ onClose, onCreated }) {
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function submit(event) {
        event.preventDefault();
        const value = name.trim();
        if (!value) {
            setError("Please enter a project name.");
            return;
        }
        setLoading(true);
        setError(null);
        const { data, error: requestError } = await createProject(value);
        setLoading(false);
        if (requestError) {
            console.error("Create project error:", requestError);
            setError(requestError.message);
            return;
        }
        onCreated?.(data);
    }

    return (
        <div style={styles.overlay}>
            <form onSubmit={submit} style={styles.modal}>
                <h2 style={styles.title}>Create Project</h2>
                <p style={styles.subtitle}>Create a project and share its join code.</p>
                {error && <div style={styles.error}>{error}</div>}
                <input autoFocus value={name} onChange={(event) => setName(event.target.value)}
                    placeholder="Project name" disabled={loading} style={styles.input} />
                <div style={styles.actions}>
                    <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
                    <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Project"}</button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 },
    modal: { width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,.15)" },
    title: { margin: 0, fontSize: 18 }, subtitle: { color: "#6b7280", fontSize: 13 },
    input: { width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #d1d5db", borderRadius: 8 },
    error: { color: "#dc2626", margin: "12px 0", fontSize: 13 },
    actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 },
};
