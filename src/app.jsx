import { useEffect, useState } from "react";
import Login from "./pages/login";
import SignUp from "./pages/sign_up";
import Dashboard from "./pages/dashboard";
import ForgotPassword from "./pages/forgot_password";
import ResetPassword from "./pages/reset_pasword";
import { supabase } from "./supabaseClient";

// A refresh during recovery must not drop the person onto the dashboard,
// so we remember "recovery pending" in sessionStorage until it is finished.
const RECOVERY_KEY = "password_recovery_pending";

function readRecoveryFlag() {
    try {
        if (window.location.hash.includes("type=recovery")) return true;
        return sessionStorage.getItem(RECOVERY_KEY) === "1";
    } catch {
        return false;
    }
}

function saveRecoveryFlag(on) {
    try {
        if (on) sessionStorage.setItem(RECOVERY_KEY, "1");
        else sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
        // storage can be blocked; recovery still works for this page load
    }
}

// An expired or already-used link comes back as ?error=... or #error=...
function readLinkProblem() {
    const params = new URLSearchParams(
        window.location.hash.replace(/^#/, "") + "&" + window.location.search.replace(/^\?/, "")
    );

    if (!params.get("error") && !params.get("error_code")) return "";

    return "That email link has expired or was already used. If you were resetting your password, request a new link below.";
}

function App() {
    const [session, setSession] = useState(null);
    const [linkProblem, setLinkProblem] = useState(readLinkProblem);
    const [view, setView] = useState(() => (readLinkProblem() ? "forgot" : "login"));
    const [recovering, setRecovering] = useState(readRecoveryFlag);
    const [loginNotice, setLoginNotice] = useState("");
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        let active = true;

        // Remove the error from the address bar so a refresh does not show it again
        if (readLinkProblem()) {
            window.history.replaceState(null, "", window.location.pathname);
        }

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
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;

            if (event === "PASSWORD_RECOVERY") {
                saveRecoveryFlag(true);
                setRecovering(true);
            }

            if (event === "SIGNED_OUT") {
                saveRecoveryFlag(false);
                setRecovering(false);
            }

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

    // Must come BEFORE the dashboard check: the reset link signs the person in,
    // and without this they would land on the dashboard without choosing a password.
    if (recovering && session) {
        return (
            <ResetPassword
                onDone={() => {
                    saveRecoveryFlag(false);
                    setRecovering(false);
                    window.history.replaceState(null, "", window.location.pathname);
                }}
                onCancel={async () => {
                    saveRecoveryFlag(false);
                    setRecovering(false);
                    setView("login");
                    await supabase.auth.signOut();
                }}
            />
        );
    }

    if (session) {
        return <Dashboard session={session} />;
    }

    if (view === "forgot") {
        return (
            <ForgotPassword
                initialError={linkProblem}
                onNavigateToLogin={() => {
                    setLinkProblem("");
                    setView("login");
                }}
            />
        );
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
            onNavigateToForgot={() => {
                setLoginNotice("");
                setView("forgot");
            }}
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
        color: "#374151",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    spinner: {
        width: "24px",
        height: "24px",
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
        padding: "20px",
        color: "#374151",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: "center",
    },
};

export default App;