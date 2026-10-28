
import { useState } from "react";
import ProjectMembersModal from "./ProjectMembersModal";

export default function ProjectHeader({ projectId, project, membership, onBack, onProjectChange }) {
    const [showMembers, setShowMembers] = useState(false);

    return <>
        <header style={styles.header}>
            <div style={styles.left}>
                {onBack && <button onClick={onBack} style={styles.button}>← Back</button>}
                <div>
                    <h1 style={styles.title}>{project?.name}</h1>
                    <div style={styles.meta}><span>{membership?.role}</span>{project?.join_code && <span>Code: <strong>{project.join_code}</strong></span>}</div>
                </div>
            </div>
            <button type="button" onClick={() => setShowMembers(true)} style={styles.membersButton}>
                Members
            </button>
        </header>
        {showMembers && (
            <ProjectMembersModal
                projectId={projectId}
                currentUserId={membership?.user_id}
                canManageMembers={membership?.role === "maintainer"}
                onClose={() => setShowMembers(false)}
            />
        )}
    </>;
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
    button: { 
        padding: "7px 12px", 
        backgroundColor: "#fff", 
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#e5e7eb",
        borderRadius: 8 
    }, 
    membersButton: {
        padding: "8px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        backgroundColor: "#fff",
        color: "#374151",
        cursor: "pointer",
    },
};