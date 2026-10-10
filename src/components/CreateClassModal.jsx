import { useState } from "react";
import { createClass } from "../services/classes";

export default function CreateClassModal({ onClose, onCreated, userId }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!name.trim()) {
            setError("Please enter a class name.");
            return;
        }

        setLoading(true);
        setError(null);

        const { data, error } = await createClass(userId, name.trim());

        setLoading(false);

        if (error) {
            console.error("Create class error:", error);
            setError(error.message);
            return;
        }

        if (onCreated) {
            onCreated(data);
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Create Class</h2>
                        <p style={styles.subtitle}>Create a class and share the join code with students.</p>
                    </div>

                    <button type="button" onClick={onClose} style={styles.closeButton}>×</button>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.field}>
                        <label style={styles.label}>Class name</label>
                        <input
                            type="text"
                            placeholder="e.g. Algebra 101"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            style={styles.input}
                            autoFocus
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} disabled={loading} style={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={loading} style={styles.createButton}>
                            {loading ? "Creating..." : "Create Class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
    },
    modal: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "24px",
    },
    title: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "600",
    },
    subtitle: {
        margin: "5px 0 0",
        fontSize: "13px",
        color: "#6b7280",
    },
    closeButton: {
        border: "none",
        background: "transparent",
        fontSize: "24px",
        color: "#6b7280",
        cursor: "pointer",
        lineHeight: 1,
    },
    error: {
        padding: "10px 12px",
        marginBottom: "16px",
        borderRadius: "8px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fee2e2",
        color: "#dc2626",
        fontSize: "13px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#374151",
    },
    input: {
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        marginTop: "24px",
    },
    cancelButton: {
        padding: "9px 14px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        color: "#374151",
        borderRadius: "8px",
        cursor: "pointer",
    },
    createButton: {
        padding: "9px 14px",
        border: "none",
        backgroundColor: "#111827",
        color: "#ffffff",
        borderRadius: "8px",
        cursor: "pointer",
    },
};
