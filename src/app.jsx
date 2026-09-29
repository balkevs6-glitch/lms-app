import { useEffect, useState } from "react";
import Login from "./pages/login";
import SignUp from "./pages/sign_up";
import Dashboard from "./pages/dashboard";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (session) {
    return <Dashboard session={session} />;
  }

  if (view === "signup") {
    return <SignUp onNavigateToLogin={() => setView("login")} />;
  }

  return <Login onNavigateToSignUp={() => setView("signup")} />;
}

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111827",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default App;