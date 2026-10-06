import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onNavigateToSignUp, notice = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    notice ? { type: "success", text: notice } : null,
  );

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({
      type: "success",
      text: "Logged in successfully!",
    });
    console.log("Logged in user:", data.user);
    console.log("Session:", data.session);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Log in to access your classes</p>
        </div>

        {message && (
          <div
            style={{
              ...styles.alert,
              ...(message.type === "error" ? styles.alertError : styles.alertSuccess),
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="name@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              style={styles.linkBtn}
            >
              Sign Up
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
  header: {
    marginBottom: "24px",
    textAlign: "center",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 6px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  alert: {
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "18px",
    lineHeight: "1.4",
  },
  alertError: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fee2e2",
  },
  alertSuccess: {
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #dcfce7",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
    letterSpacing: "-0.01em",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#111827",
    transition: "border-color 0.15s ease",
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
    transition: "background-color 0.15s ease",
  },
  footer: {
    marginTop: "20px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
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
