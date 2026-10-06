import { useEffect, useState } from "react";
import Login from "./pages/login";
import SignUp from "./pages/sign_up";
import Dashboard from "./pages/dashboard";
import { supabase } from "./supabaseClient";

function App() {
    const [session, setSession] = useState(null);
    const [view, setView] = useState("login");
    const [loginNotice, setLoginNotice] = useState("");
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        let active = true;

        supabase.auth.getSession()
            .then(({ data, error }) => {
                if (!active) return;

                if (error) {
                    setAuthError(error.message);
                } else {
                    setSession(data.session);
                }
                setAuthLoading(false);
            })
            .catch((error) => {
                if (!active) return;
                setAuthError(error.message || "Could not restore your login session.");
                setAuthLoading(false);
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            setSession(session);
            setAuthLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    if (authLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p>Loading your account...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div style={styles.errorContainer} role="alert">
                <h1>Unable to load your account</h1>
                <p>{authError}</p>
                <button type="button" onClick={() => window.location.reload()}>
                    Try again
                </button>
            </div>
        );
    }

    if (session) {
        return <Dashboard session={session} />;
    }

    if (view === "signup") {
        return (
            <SignUp
                onNavigateToLogin={() => setView("login")}
                onSignupComplete={({ session: signupSession, notice }) => {
                    if (signupSession) {
                        setSession(signupSession);
                        return;
                    }

                    setLoginNotice(notice);
                    setView("login");
                }}
            />
        );
    }

    return (
        <Login
            notice={loginNotice}
            onNavigateToSignUp={() => {
                setLoginNotice("");
                setView("signup");
            }}
        />
    );
}

const styles = {
    loadingContainer: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        backgroundColor: "#fafafa",
        color: "#374151",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    spinner: {
        width: "28px",
        height: "28px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    errorContainer: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        backgroundColor: "#fafafa",
        color: "#111827",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: "center",
    },
};

export default App;