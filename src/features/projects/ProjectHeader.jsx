
export default function ProjectHeader({ projectId, project, membership, onBack, onProjectChange }) {

    return <header style={styles.header}>
        <div style={styles.left}>
            {onBack && <button onClick={onBack} style={styles.button}>← Back</button>}
            <div>
                <h1 style={styles.title}>{project?.name}</h1>
                <div style={styles.meta}><span>{membership?.role}</span>{project?.join_code && <span>Code: <strong>{project.join_code}</strong></span>}</div>
            </div>
        </div>
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
    button: { 
        padding: "7px 12px", 
        backgroundColor: "#fff", 
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#e5e7eb",
        borderRadius: 8 
    }, 
};