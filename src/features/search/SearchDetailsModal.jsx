import { useEffect, useState } from "react";
import { getUserProfile } from "../auth/users";

export default function SearchDetailsModal({ result, type, onClose, onOpenProject }) {
    const [creator, setCreator] = useState(null);
    const [creatorError, setCreatorError] = useState("");

    useEffect(() => {
        let active = true;
        if (type !== "project" || !result?.created_by) return undefined;

        getUserProfile(result.created_by).then(({ data, error }) => {
            if (!active) return;
            if (error) {
                console.error("Could not load project creator:", error);
                setCreatorError("Creator information is unavailable.");
            } else {
                setCreator(data);
            }
        });

        return () => {
            active = false;
        };
    }, [result, type]);

    if (!result) return null;

    const name = result.name || "Unnamed user";
    const avatar = result.avatar_url;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <section style={styles.modal} onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={onClose} style={styles.close} aria-label="Close">
                    ×
                </button>

                {type === "user" ? (
                    <>
                        <div style={styles.profileHeader}>
                            <Avatar url={avatar} name={name} size={72} />
                            <div>
                                <h2 style={styles.title}>{name}</h2>
                                <p style={styles.subtitle}>Platform user</p>
                            </div>
                        </div>
                        <div style={styles.infoCard}>
                            <strong>Profile</strong>
                            <p style={styles.infoText}>
                                This user can be a member of projects you have access to.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={styles.title}>{result.name}</h2>
                        <p style={styles.subtitle}>Project</p>
                        <div style={styles.infoCard}>
                            <strong>Description</strong>
                            <p style={styles.infoText}>
                                {result.description || "This project does not have a description yet."}
                            </p>
                            {creator && (
                                <div style={styles.creator}>
                                    <Avatar url={creator.avatar_url} name={creator.name} size={32} />
                                    <span>Created by <strong>{creator.name || "Unnamed user"}</strong></span>
                                </div>
                            )}
                            {creatorError && <p style={styles.muted}>{creatorError}</p>}
                        </div>
                        <button type="button" onClick={onOpenProject} style={styles.openButton}>
                            Open Project
                        </button>
                    </>
                )}
            </section>
        </div>
    );
}

function Avatar({ url, name, size }) {
    const avatarStyle = { width: size, height: size, ...styles.avatar };
    if (url) return <img src={url} alt="" style={avatarStyle} />;
    return <div style={{ ...avatarStyle, ...styles.avatarFallback }}>{name?.[0]?.toUpperCase() || "?"}</div>;
}

const styles = {
    overlay: { position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(17, 24, 39, .45)" },
    modal: { position: "relative", width: "100%", maxWidth: 430, padding: 26, backgroundColor: "#fff", borderRadius: 14, boxShadow: "0 20px 50px rgba(0, 0, 0, .18)" },
    close: { position: "absolute", top: 14, right: 16, border: 0, background: "transparent", color: "#6b7280", fontSize: 26, cursor: "pointer", lineHeight: 1 },
    profileHeader: { display: "flex", alignItems: "center", gap: 14, paddingRight: 20 },
    title: { margin: 0, fontSize: 20, color: "#111827" },
    subtitle: { margin: "5px 0 0", color: "#6b7280", fontSize: 13 },
    avatar: { borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
    avatarFallback: { display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111827", color: "#fff", fontWeight: 700 },
    infoCard: { marginTop: 22, padding: 14, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10 },
    infoText: { margin: "7px 0 0", color: "#4b5563", fontSize: 14, lineHeight: 1.5 },
    creator: { display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "#374151", fontSize: 13 },
    muted: { margin: "10px 0 0", color: "#6b7280", fontSize: 12 },
    openButton: { width: "100%", marginTop: 18, padding: "10px 14px", border: 0, borderRadius: 8, backgroundColor: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer" },
};
