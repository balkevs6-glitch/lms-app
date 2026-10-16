import { useRef, useState } from "react";
import { updateUserName, uploadAvatar } from "../auth/users";

export default function EditProfileModal({ userId, currentName, currentAvatarUrl, onClose, onSaved }) {
    const [name, setName] = useState(currentName || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(currentAvatarUrl || null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("Please pick an image file."); return; }
        if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2 MB."); return; }
        setError(null);
        setAvatarFile(file);
        setPreview(URL.createObjectURL(file));
    }

    async function handleSave(e) {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) { setError("Name cannot be empty."); return; }
        if (trimmedName.length > 80) { setError("Name must be 80 characters or fewer."); return; }
        setSaving(true);
        setError(null);

        let newAvatarUrl = currentAvatarUrl;

        // Upload avatar first if a new file was picked
        if (avatarFile) {
            const { error: uploadError, url } = await uploadAvatar(userId, avatarFile);
            if (uploadError) {
                setError("Could not upload avatar: " + (uploadError.message || uploadError));
                setSaving(false);
                return;
            }
            newAvatarUrl = url;
        }

        // Update name if changed
        if (trimmedName !== currentName) {
            const { error: nameError } = await updateUserName(userId, trimmedName);
            if (nameError) {
                setError("Could not update name: " + (nameError.message || nameError));
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        onSaved({ name: trimmedName, avatar_url: newAvatarUrl });
        onClose();
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.title}>Edit Profile</h2>

                {/* Avatar picker */}
                <div style={styles.avatarSection}>
                    <button
                        type="button"
                        style={styles.avatarWrap}
                        onClick={() => fileInputRef.current?.click()}
                        title="Click to change avatar"
                    >
                        {preview
                            ? <img src={preview} alt="avatar" style={styles.avatarImg} />
                            : <div style={styles.avatarPlaceholder}>{(name[0] || "?").toUpperCase()}</div>
                        }
                        <div style={styles.avatarOverlay}>📷</div>
                    </button>
                    <p style={styles.avatarHint}>Click to upload photo<br /><span style={{ color: "#9ca3af" }}>Max 2 MB · JPG / PNG / GIF</span></p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                </div>

                <form onSubmit={handleSave}>
                    {/* Name field */}
                    <label style={styles.label}>Display Name</label>
                    <input
                        value={name}
                        maxLength={80}
                        disabled={saving}
                        onChange={(e) => setName(e.target.value)}
                        style={styles.input}
                        placeholder="Your name"
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" style={styles.saveBtn} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
    },
    title: { margin: "0 0 24px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
    avatarSection: {
        display: "flex", alignItems: "center", gap: 20, marginBottom: 24,
    },
    avatarWrap: {
        position: "relative",
        width: 80, height: 80,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        overflow: "hidden",
        background: "none",
    },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" },
    avatarPlaceholder: {
        width: 80, height: 80,
        borderRadius: "50%",
        backgroundColor: "#111827",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 700,
    },
    avatarOverlay: {
        position: "absolute", inset: 0,
        borderRadius: "50%",
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        opacity: 0,
        transition: "opacity 0.15s",
        // We rely on CSS hover — use inline approach via onMouseEnter/Leave instead below if needed
    },
    avatarHint: { fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
    input: {
        width: "100%", boxSizing: "border-box",
        padding: "9px 12px", fontSize: 14,
        border: "1px solid #d1d5db", borderRadius: 8,
        outline: "none", marginBottom: 16,
    },
    error: { fontSize: 13, color: "#dc2626", margin: "-8px 0 12px" },
    actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
    cancelBtn: {
        padding: "9px 18px", fontSize: 13, fontWeight: 500,
        border: "1px solid #e5e7eb", borderRadius: 8,
        backgroundColor: "#fff", cursor: "pointer",
    },
    saveBtn: {
        padding: "9px 18px", fontSize: 13, fontWeight: 500,
        border: "none", borderRadius: 8,
        backgroundColor: "#111827", color: "#fff", cursor: "pointer",
    },
};

