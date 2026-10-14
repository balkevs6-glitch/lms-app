import { useState } from "react";
import {
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
  updatePassword,
} from "../features/auth/auth";

// Shown after the person opens the reset link from their email.
// app.jsx decides when to show this; it only runs while a recovery session is active.
export default function ResetPassword({ onDone, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading || done) return;

    const problem = validateNewPassword(password, confirm);

    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await updatePassword(password);

    setLoading(false);

    if (error) {
      console.error("Update password error:", error);

      const expired = /session/i.test(error.message || "");

      setMessage({
        type: "error",
        text: expired
          ? "Your reset link has expired. Cancel and request a new one."
          : error.message || "Could not update your password. Please try again.",
      });
      return;
    }

    setDone(true);
    setMessage({
      type: "success",
      text: "Password updated. Taking you to your dashboard...",
    });

    setTimeout(onDone, 1200);
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const inputType = showPasswords ? "text" : "password";
  const locked = loading || done;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Choose a new password</h2>
          <p style={styles.subtitle}>
            Pick a password you have not used on this platform before.
          </p>
        </div>

        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
            style={{
              ...styles.alert,
              ...(message.type === "error" ? styles.alertError : styles.alertSuccess),
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type={inputType}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              disabled={locked}
              style={styles.input}
            />
            <span style={styles.hint}>At least {MIN_PASSWORD_LENGTH} characters.</span>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type={inputType}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={locked}
              style={styles.input}
            />
            {mismatch && (
              <span style={styles.hintError}>The passwords do not match yet.</span>
            )}
          </div>

          <label style={styles.showRow}>
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            Show passwords
          </label>

          <button
            type="submit"
            disabled={locked}
            style={{
              ...styles.submitBtn,
              opacity: locked ? 0.7 : 1,
              cursor: locked ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>

        {!done && (
          <div style={styles.footer}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={styles.linkBtn}
            >
              Cancel and sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    backgroundColor: "#ffffff",
    border: "1px solid #eaeaea",
    borderRadius: "14px",
    padding: "32px 28px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  },
  header: { marginBottom: "24px", textAlign: "center" },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 6px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.5" },
  alert: {
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "18px",
    lineHeight: "1.4",
  },
  alertError: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2" },
  alertSuccess: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #dcfce7" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "500", color: "#374151", letterSpacing: "-0.01em" },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  hint: { fontSize: "12px", color: "#9ca3af" },
  hintError: { fontSize: "12px", color: "#dc2626" },
  showRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "8px",
    padding: "11px 0",
    backgroundColor: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  footer: { marginTop: "20px", textAlign: "center" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
    fontSize: "13px",
    textDecoration: "underline",
  },
};