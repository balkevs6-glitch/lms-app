import { useEffect, useState } from "react";
import { getUserClasses } from "../services/classes";
import { supabase } from "../supabaseClient";
import { getUserProfile } from "../services/users";

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);

  const userId = session?.user?.id;

  useEffect(() => {
    async function loadClasses() {
      const { data, error } = await getUserClasses(session.user.id);

      if (error) {
        console.error("Failed to load classes:", error);
        setClassesError(error.message);
        setClassesLoading(false);
        return;
      }

      setClasses(data || []);
      setClassesLoading(false);
    }

    loadClasses();
  }, [session.user.id]);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;

      setLoading(true);
      setError(null);

      const { data, error } = await getUserProfile(userId);

      if (error) {
        console.error("Error fetching public.users profile:", error);
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // Authoritative data from database (with fallback to user_metadata or email)
  const name =
    profile?.name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const role = profile?.role || session?.user?.user_metadata?.role || "student";
  const isActive = profile ? profile.is_active : true;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.stateCenter}>
          <div style={styles.spinner} />
          <p style={styles.stateText}>Loading profile from database...</p>
        </div>
      </div>
    );
  }

  // Account deactivated check
  if (!isActive) {
    return (
      <div style={styles.container}>
        <div style={styles.stateCenter}>
          <div style={styles.deactivatedCard}>
            <h2 style={{ ...styles.welcomeTitle, color: "#dc2626" }}>
              Account Deactivated
            </h2>
            <p style={styles.welcomeDesc}>
              Your account has been deactivated in the system. Please contact your school administrator.
            </p>
            <button
              onClick={handleSignOut}
              style={{ ...styles.signOutBtn, marginTop: "16px" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>S</div>
          <div>
            <h1 style={styles.appTitle}>School Platform</h1>
            <p style={styles.userSubtitle}>
              Signed in as <strong>{name}</strong>
              <span style={styles.roleBadge}>{role}</span>
            </p>
          </div>
        </div>

        <button onClick={handleSignOut} style={styles.signOutBtn}>
          Sign Out
        </button>
      </header>

      <main style={styles.main}>
        {error && (
          <div style={styles.errorBanner}>
            <strong>Notice:</strong> Could not load profile from <code>public.users</code> ({error}).
            Displaying cached session metadata.
          </div>
        )}

        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>Welcome back, {name}!</h2>
          <p style={styles.welcomeDesc}>
            This is your classes dashboard. You are logged in as a <strong>{role}</strong>.
          </p>
        </div>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Your Classes</h3>
          <button style={styles.actionBtn}>
            {role === "teacher" ? "+ Create Class" : "+ Join Class"}
          </button>
        </div>

        {classesLoading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading classes...</p>
          </div>
        ) : classesError ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Unable to load classes.</p>
            <p style={styles.emptySubtext}>{classesError}</p>
          </div>
        ) : classes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No classes joined yet.</p>
            <p style={styles.emptySubtext}>
              {role === "teacher"
                ? "Create your first class to invite students."
                : "Ask your teacher for a join code to get started."}
            </p>
          </div>
        ) : (
          <div>
            {classes.map((membership) => (
              <div key={membership.classes.id}>
                <h4>{membership.classes.name}</h4>
                <p>Role: {membership.role}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#fafafa",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #eaeaea",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  appTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },
  userSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  roleBadge: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  signOutBtn: {
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  welcomeCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #eaeaea",
    borderRadius: "12px",
    padding: "24px 28px",
    marginBottom: "28px",
  },
  welcomeTitle: {
    margin: "0 0 6px 0",
    fontSize: "20px",
    fontWeight: "600",
    letterSpacing: "-0.02em",
  },
  welcomeDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.5",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },
  actionBtn: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    border: "1px dashed #d1d5db",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyText: {
    margin: "0 0 6px 0",
    fontSize: "15px",
    fontWeight: "500",
    color: "#374151",
  },
  emptySubtext: {
    margin: 0,
    fontSize: "13px",
    color: "#9ca3af",
  },
  stateCenter: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  stateText: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#6b7280",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111827",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  deactivatedCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #fee2e2",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "420px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)",
  },
  errorBanner: {
    padding: "10px 14px",
    backgroundColor: "#fffbeb",
    border: "1px solid #fef3c7",
    color: "#92400e",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    lineHeight: "1.4",
  },
};