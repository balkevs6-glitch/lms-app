import CreateProjectModal from "../features/projects/CreateProjectModal";
import JoinProjectModal from "../features/projects/JoinProjectModal";
import ProjectPage from "./project_page";
import EditProfileModal from "../features/auth/EditProfileModal";
import { useEffect, useRef, useState } from "react";
import { getUserProjects, renameProject, deleteProject, leaveProject } from "../features/projects/projects";
import { supabase } from "../supabaseClient";
import { getUserProfile, searchUsers } from "../features/auth/users";
import SearchDetailsModal from "../features/search/SearchDetailsModal";

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
  const [searchType, setSearchType] = useState("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState("");
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [selectedSearchResultType, setSelectedSearchResultType] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

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
    if (searchType !== "users" || !searchQuery.trim()) {
      setUserResults([]);
      setUserSearchError("");
      setUserSearchLoading(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setUserSearchLoading(true);
      setUserSearchError("");
      const { data, error: requestError } = await searchUsers(searchQuery);
      if (!active) return;

      if (requestError) {
        console.error("Could not search users:", requestError);
        setUserResults([]);
        setUserSearchError(requestError.message || "Could not search users.");
      } else {
        setUserResults(data || []);
      }
      setUserSearchLoading(false);
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, searchType]);

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
  // Only an explicit false value means the account was deactivated.
  // Profile updates can temporarily omit is_active when the initial profile
  // query failed, and that must not lock the user out.
  const isActive = profile?.is_active !== false;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchedProjects = normalizedSearch
    ? projects.filter(({ projects: project }) =>
      project?.name?.toLowerCase().includes(normalizedSearch)
    )
    : projects;

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
      <style>{`
        @media (max-width: 640px) {
          .dashboard-header {
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px 14px;
          }

          .dashboard-brand {
            gap: 8px;
          }

          .dashboard-brand-copy {
            display: none;
          }

          .dashboard-header-search {
            order: 3;
            flex-basis: 100%;
            max-width: none;
            min-width: 0;
            margin: 2px 0 0;
          }

          .dashboard-search-bar {
            padding: 5px;
            gap: 5px;
          }

          .dashboard-search-select {
            max-width: 92px;
            padding: 7px 5px;
            font-size: 11px;
          }

          .dashboard-search-input {
            padding: 7px 5px;
            font-size: 13px;
          }

          .dashboard-account-actions {
            gap: 6px !important;
          }

          .dashboard-sign-out {
            padding: 6px 8px !important;
            font-size: 11px !important;
          }

          .dashboard-main {
            padding: 20px 14px !important;
          }

          .dashboard-welcome {
            padding: 16px 18px !important;
            margin-bottom: 20px !important;
          }

          .dashboard-welcome-title {
            font-size: 17px !important;
          }

          .dashboard-welcome-desc {
            font-size: 12px !important;
          }

          .dashboard-section-header {
            align-items: flex-start !important;
            gap: 8px;
          }

          .dashboard-section-actions {
            gap: 5px !important;
          }

          .dashboard-section-actions button {
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
      <header className="dashboard-header" style={styles.header}>
        <div className="dashboard-brand" style={styles.brand}>
          {/* App logo */}
          <div style={styles.logoMark}>S</div>

          <div className="dashboard-brand-copy">
            <h1 style={styles.appTitle}>School Platform</h1>
            <p style={styles.userSubtitle}>Signed in as <strong>{name}</strong></p>
          </div>
        </div>

        <div className="dashboard-header-search" style={styles.headerSearch}>
          <div className="dashboard-search-bar" style={styles.searchBar}>
            <div style={styles.searchLogo}>S</div>
            <select
              value={searchType}
              onChange={(event) => {
                setSearchType(event.target.value);
                setSearchQuery("");
              }}
              className="dashboard-search-select"
              style={styles.searchSelect}
              aria-label="Search category"
            >
              <option value="projects">Projects</option>
              <option value="users">Users</option>
            </select>
            <input
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                searchType === "projects"
                  ? "Search projects..."
                  : "Search users..."
              }
              className="dashboard-search-input"
              style={styles.searchInput}
              aria-label={`Search ${searchType}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={styles.clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {searchFocused && searchQuery.trim() && (
            <div style={styles.searchDropdown} onMouseDown={(event) => event.preventDefault()}>
              {searchType === "users" ? (
                userSearchLoading ? (
                  <p style={styles.searchStatus}>Searching users...</p>
                ) : userSearchError ? (
                  <p style={styles.searchError}>{userSearchError}</p>
                ) : userResults.length === 0 ? (
                  <p style={styles.searchStatus}>No users found.</p>
                ) : (
                  userResults.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      style={styles.dropdownResult}
                      onClick={() => {
                        setSelectedSearchResult(user);
                        setSelectedSearchResultType("user");
                        setSearchFocused(false);
                      }}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" style={styles.searchAvatar} />
                      ) : (
                        <div style={styles.searchAvatarFallback}>
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span>
                        <strong>{user.name || "Unnamed user"}</strong>
                        <small style={styles.resultType}>User</small>
                      </span>
                    </button>
                  ))
                )
              ) : searchedProjects.length === 0 ? (
                <p style={styles.searchStatus}>No matching projects.</p>
              ) : (
                searchedProjects.map(({ projects: project, role }) => (
                  <button
                    type="button"
                    key={project.id}
                    style={styles.dropdownResult}
                    onClick={() => {
                      setSelectedSearchResult(project);
                      setSelectedSearchResultType("project");
                      setSearchFocused(false);
                    }}
                  >
                    <div style={styles.projectAvatar}>S</div>
                    <span>
                      <strong>{project.name}</strong>
                      <small style={styles.resultType}>{role} project</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="dashboard-account-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

          <button className="dashboard-sign-out" onClick={handleSignOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main" style={styles.main}>
        {error && (
          <div style={styles.errorBanner}>
            <strong>Notice:</strong> Could not load profile from <code>public.users</code> ({error}).
            Displaying cached session metadata.
          </div>
        )}

        <div className="dashboard-welcome" style={styles.welcomeCard}>
          <h2 className="dashboard-welcome-title" style={styles.welcomeTitle}>Welcome back, {name}!</h2>

          <p className="dashboard-welcome-desc" style={styles.welcomeDesc}>
            This is your projects dashboard. Create a project to share your code,
            or join one with a code from a maintainer.
          </p>
        </div>

        <div className="dashboard-section-header" style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Your Projects</h3>

          <div className="dashboard-section-actions" style={styles.sectionActions}>
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
            <p style={styles.emptyText}>
              No projects joined yet.
            </p>
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

      {selectedSearchResult && (
        <SearchDetailsModal
          result={selectedSearchResult}
          type={selectedSearchResultType}
          onClose={() => {
            setSelectedSearchResult(null);
            setSelectedSearchResultType(null);
          }}
          onOpenProject={() => {
            setSelectedProjectId(selectedSearchResult.id);
            setSelectedSearchResult(null);
            setSelectedSearchResultType(null);
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
    gap: "24px",
    padding: "16px 32px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #eaeaea",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  headerSearch: {
    position: "relative",
    flex: 1,
    maxWidth: "520px",
    minWidth: "220px",
    margin: "0 auto",
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
  searchBar: {
    display: "flex",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(17, 24, 39, .06)",
  },
  searchLogo: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius: "7px",
    backgroundColor: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
  },
  searchSelect: {
    padding: "9px 10px",
    fontSize: "13px",
    color: "#374151",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    border: "none",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: "9px 10px",
    fontSize: "14px",
    color: "#111827",
    border: "none",
    borderRadius: "7px",
    outline: "none",
  },
  searchDropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 1000,
    display: "grid",
    gap: "2px",
    maxHeight: "360px",
    overflowY: "auto",
    padding: "6px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 12px 30px rgba(17, 24, 39, .14)",
  },
  dropdownResult: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    width: "100%",
    textAlign: "left",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  resultType: {
    display: "block",
    marginTop: "3px",
    color: "#6b7280",
    fontSize: "11px",
  },
  searchStatus: {
    margin: 0,
    padding: "12px 10px",
    color: "#6b7280",
    fontSize: "13px",
  },
  clearSearch: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: "20px",
    lineHeight: 1,
    cursor: "pointer",
  },
  projectAvatar: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "8px",
    backgroundColor: "#111827",
    color: "#ffffff",
    fontWeight: "700",
  },
  searchAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  searchAvatarFallback: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: "#111827",
    color: "#ffffff",
    fontWeight: "600",
  },
  searchError: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "13px",
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
