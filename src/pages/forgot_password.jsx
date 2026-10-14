import { useEffect, useState } from "react";
import { requestPasswordReset, isValidEmail } from "../features/auth/auth";

const COOLDOWN_SECONDS = 60;

export default function ForgotPassword({ onNavigateToLogin, initialError = "" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(
    initialError ? { type: "error", text: initialError } : null,
  );

  // Count the resend cooldown down once per second
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading || cooldown > 0) return;

    const trimmed = email.trim();

    if (!trimmed) {
      setMessage({ type: "error", text: "Enter your email address." });
      return;
    }

    if (!isValidEmail(trimmed)) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await requestPasswordReset(trimmed);

    setLoading(false);

    if (error) {
      console.error("Password reset request error:", error);

      const tooMany =
        error.status === 429 || /rate limit/i.test(error.message || "");

      setMessage({
        type: "error",
        text: tooMany
          ? "Too many requests. Please wait a few minutes and try again."
          : "We could not send the reset link. Please try again.",
      });

      if (tooMany) setCooldown(COOLDOWN_SECONDS);
      return;
    }

    // Same message whether or not the email has an account (no account enumeration).
    setMessage({
      type: "success",
      text: "If that email belongs to an account, a reset link is on its way. Check your inbox and spam folder. The link can only be used once.",
    });
    setCooldown(COOLDOWN_SECONDS);
  }

  const buttonLabel = loading
    ? "Sending..."
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Send reset link";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Reset your password</h2>
          <p style={styles.subtitle}>
            Enter your email and we will send you a link to choose a new one.
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
            <label style={styles.label} htmlFor="reset-email">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              placeholder="name@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            style={{
              ...styles.submitBtn,
              opacity: loading || cooldown > 0 ? 0.7 : 1,
              cursor: loading || cooldown > 0 ? "not-allowed" : "pointer",
            }}
          >
            {buttonLabel}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Remembered it?{" "}
            <button type="button" onClick={onNavigateToLogin} style={styles.linkBtn}>
              Back to Log In
            </button>
          </p>
        </div>
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
  footerText: { fontSize: "13px", color: "#6b7280", margin: 0 },
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