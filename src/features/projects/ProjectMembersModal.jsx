import { useEffect, useState } from "react";
import { getProjectMembers } from "./projects";

export default function ProjectMembersModal({ projectId, onClose }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadMembers() {
            const { data, error: requestError } = await getProjectMembers(projectId);
            if (!active) return;

            if (requestError) {
                console.error("Could not load project members:", requestError);
                setError(requestError.message || "Could not load project members.");
            } else {
                setMembers(data || []);
            }
            setLoading(false);
        }

        loadMembers();
        return () => {
            active = false;
        };
    }, [projectId]);

    return (
        <div style={styles.overlay} onClick={onClose}>
            <section style={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Project members</h2>
                        <p style={styles.subtitle}>View the people who can access this project.</p>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Close">
                        ×
                    </button>
                </div>

                {loading && <p style={styles.status}>Loading members...</p>}
                {error && <p style={styles.error}>{error}</p>}
                {!loading && !error && members.length === 0 && (
                    <p style={styles.status}>No members found.</p>
                )}
                {!loading && !error && members.length > 0 && (
                    <div style={styles.list}>
                        {members.map((membership) => {
                            const member = membership.users;
                            const name = member?.name || "Unnamed member";
                            return (
                                <div key={member?.id || `${membership.role}-${membership.joined_at}`} style={styles.member}>
                                    {member?.avatar_url ? (
                                        <img src={member.avatar_url} alt="" style={styles.avatar} />
                                    ) : (
                                        <div style={styles.avatarFallback}>{name[0]?.toUpperCase() || "?"}</div>
                                    )}
                                    <div style={styles.memberInfo}>
                                        <strong>{name}</strong>
                                        <span style={styles.detail}>{membership.role}</span>
                                        {member?.created_at && (
                                            <span style={styles.detail}>
                                                Member since {new Date(member.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(17, 24, 39, .45)",
    },
    modal: {
        width: "100%",
        maxWidth: 440,
        maxHeight: "80vh",
        overflowY: "auto",
        padding: 24,
        backgroundColor: "#fff",
        borderRadius: 14,
        boxShadow: "0 20px 50px rgba(0, 0, 0, .18)",
    },
    header: { display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20 },
    title: { margin: 0, fontSize: 19 },
    subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 13 },
    closeButton: { border: 0, background: "transparent", color: "#6b7280", fontSize: 26, cursor: "pointer", lineHeight: 1 },
    list: { display: "grid", gap: 12 },
    member: { display: "flex", alignItems: "center", gap: 12, padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 },
    avatar: { width: 42, height: 42, borderRadius: "50%", objectFit: "cover" },
    avatarFallback: { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111827", color: "#fff", fontWeight: 700 },
    memberInfo: { display: "grid", gap: 2 },
    detail: { color: "#6b7280", fontSize: 12 },
    status: { color: "#6b7280", fontSize: 14 },
    error: { color: "#b91c1c", fontSize: 14 },
};
