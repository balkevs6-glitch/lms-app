import CreateProjectModal from "../features/projects/CreateProjectModal";
import JoinProjectModal from "../features/projects/JoinProjectModal";
import ProjectPage from "./project_page";
import EditProfileModal from "../features/auth/EditProfileModal";
import { useEffect, useRef, useState } from "react";
import { getUserProjects, renameProject, deleteProject, leaveProject } from "../features/projects/projects";
import { supabase } from "../supabaseClient";
import { getUserProfile } from "../features/auth/users";

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Three-dot menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Rename inline state
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);

  const userId = session?.user?.id;

  async function loadProjects() {
    if (!userId) return;

    setProjectsLoading(true);
    setProjectsError(null);

    const { data, error } = await getUserProjects(userId);

    if (error) {
      console.error("Failed to load projects:", error);
      setProjectsError(error.message);
      setProjects([]);
    } else {
      setProjects(data || []);
    }

    setProjectsLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, [userId]);

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

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRename(projectId, currentName) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (trimmed === currentName) { setRenamingId(null); return; }
    setActionLoading(true);
    const { error: err } = await renameProject(projectId, trimmed);
    setActionLoading(false);
    if (err) { alert("Could not rename: " + (err.message || err)); return; }
    setRenamingId(null);
    loadProjects();
  }

  async function handleDelete(projectId, projectName) {
    if (!window.confirm(`Permanently delete "${projectName}" for everyone? This cannot be undone.`)) return;
    setActionLoading(true);
    const { error: err } = await deleteProject(projectId);
    setActionLoading(false);
    if (err) { alert("Could not delete: " + (err.message || err)); return; }
    loadProjects();
  }

  async function handleLeave(projectId, projectName) {
    if (!window.confirm(`Leave "${projectName}"? You can rejoin later with the join code.`)) return;
    setActionLoading(true);
    const { error: err } = await leaveProject(projectId);
    setActionLoading(false);
    if (err) { alert("Could not leave: " + (err.message || err)); return; }
    loadProjects();
  }

  const name =
    profile?.name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = profile?.avatar_url || null;
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

  if (!isActive) {
    return (
      <div style={styles.container}>
        <div style={styles.stateCenter}>
          <div style={styles.deactivatedCard}>
            <h2 style={{ ...styles.welcomeTitle, color: "#dc2626" }}>
              Account Deactivated
            </h2>

            <p style={styles.welcomeDesc}>
              Your account has been deactivated in the system. Please contact a maintainer.
            </p>

            <button onClick={handleSignOut} style={{ ...styles.signOutBtn, marginTop: "16px" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProjectId) {
    return (
      <ProjectPage
        projectId={selectedProjectId}
        session={session}
        onBack={() => {
          setSelectedProjectId(null);
          loadProjects();
        }}
      />
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          {/* App logo */}
          <div style={styles.logoMark}>S</div>

          <div>
            <h1 style={styles.appTitle}>School Platform</h1>
            <p style={styles.userSubtitle}>Signed in as <strong>{name}</strong></p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Clickable avatar → opens Edit Profile */}
          <button
            onClick={() => setShowEditProfile(true)}
            style={styles.avatarBtn}
            title="Edit Profile"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={name} style={styles.avatarImg} />
              : <div style={styles.avatarInitial}>{name[0]?.toUpperCase() || "?"}</div>
            }
          </button>

          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
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
            This is your projects dashboard. Create a project to share your code,
            or join one with a code from a maintainer.
          </p>
        </div>

        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Your Projects</h3>

          <div style={styles.sectionActions}>
            <button onClick={() => setShowJoinModal(true)} style={styles.secondaryBtn}>
              Join Project
            </button>

            <button onClick={() => setShowCreateModal(true)} style={styles.actionBtn}>
              + Create Project
            </button>
          </div>
        </div>

        {projectsLoading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading projects...</p>
          </div>
        ) : projectsError ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Unable to load projects.</p>
            <p style={styles.emptySubtext}>{projectsError}</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No projects joined yet.</p>
            <p style={styles.emptySubtext}>
              Create your first project, or join one with a code from its maintainer.
            </p>
          </div>
        ) : (
          <div ref={menuRef}>
            {projects.map((membership) => {
              const proj = membership.projects;
              const isMaintainer = membership.role === "maintainer";
              const isMenuOpen = openMenuId === proj.id;
              const isRenaming = renamingId === proj.id;

              return (
                <div
                  key={proj.id}
                  style={{ ...styles.projectCard, cursor: "pointer", position: "relative" }}
                >
                  {/* Card click area */}
                  <div onClick={() => setSelectedProjectId(proj.id)}>
                    <div style={styles.projectCardHeader}>
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          disabled={actionLoading}
                          maxLength={80}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(proj.id, proj.name);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          style={styles.renameInput}
                        />
                      ) : (
                        <h4 style={styles.projectName}>{proj.name}</h4>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Three-dot button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : proj.id);
                          }}
                          style={styles.dotMenuBtn}
                          title="More options"
                        >
                          ⋯
                        </button>
                      </div>
                    </div>

                    <p style={styles.projectInfo}>Role: {membership.role}</p>

                    {isMaintainer && (
                      <p style={styles.projectInfo}>
                        Join Code: <strong>{proj.join_code}</strong>
                      </p>
                    )}
                  </div>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div style={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {isMaintainer && (
                        <button
                          style={styles.dropdownItem}
                          disabled={actionLoading}
                          onClick={() => {
                            setRenameValue(proj.name);
                            setRenamingId(proj.id);
                            setOpenMenuId(null);
                          }}
                        >
                          ✏️ Rename Project
                        </button>
                      )}
                      {isMaintainer && (
                        <button
                          style={{ ...styles.dropdownItem, ...styles.dropdownDanger }}
                          disabled={actionLoading}
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(proj.id, proj.name);
                          }}
                        >
                          🗑️ Delete Project
                        </button>
                      )}
                      <button
                        style={{ ...styles.dropdownItem, ...styles.dropdownDanger }}
                        disabled={actionLoading}
                        onClick={() => {
                          setOpenMenuId(null);
                          handleLeave(proj.id, proj.name);
                        }}
                      >
                        🚪 Leave Project
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}

      {showJoinModal && (
        <JoinProjectModal
          onClose={() => setShowJoinModal(false)}
          onJoined={() => {
            setShowJoinModal(false);
            loadProjects();
          }}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          userId={userId}
          currentName={name}
          currentAvatarUrl={avatarUrl}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => {
            setProfile((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}
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
  avatarBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "2px solid #e5e7eb",
    padding: 0,
    cursor: "pointer",
    background: "none",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
  },
  avatarInitial: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    borderRadius: "50%",
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
  sectionActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
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
  secondaryBtn: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "500",
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    border: "1px solid #eaeaea",
    borderRadius: "12px",
    padding: "32px 20px",
    textAlign: "center",
  },
  emptyText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
    color: "#374151",
  },
  emptySubtext: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },
  projectCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #eaeaea",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "12px",
    transition: "all 0.15s ease",
  },
  projectCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  projectName: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "600",
  },
  viewProjectLink: {
    fontSize: "12px",
    color: "#4f46e5",
    fontWeight: "600",
  },
  projectInfo: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },
  dotMenuBtn: {
    background: "none",
    border: "1px solid transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: "2px 6px",
    color: "#6b7280",
    transition: "background 0.15s",
  },
  dropdownMenu: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
    zIndex: 50,
    minWidth: "170px",
    padding: "6px 0",
    display: "flex",
    flexDirection: "column",
  },
  dropdownItem: {
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#111827",
  },
  dropdownDanger: {
    color: "#dc2626",
  },
  renameInput: {
    fontSize: "15px",
    fontWeight: "600",
    padding: "4px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    flex: 1,
  },
  errorBanner: {
    marginBottom: "16px",
    padding: "12px 14px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    color: "#991b1b",
    fontSize: "13px",
  },
  stateCenter: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    backgroundColor: "#fafafa",
    color: "#374151",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111827",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  stateText: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  deactivatedCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #fee2e2",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
    textAlign: "center",
  },
};
