import { useEffect, useRef, useState } from "react";
import {
    listProjectFiles,
    uploadProjectFile,
    createProjectFolder,
    renameProjectItem,
    deleteProjectItem,
    downloadProjectFile,
} from "./files";

export default function FilesTab({ projectId, userId, membership }) {
    const fileInputRef = useRef(null);
    const [currentFolder, setCurrentFolder] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showUploadPermissionModal, setShowUploadPermissionModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Rename state
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const canManageFolders = membership?.role === "maintainer";

    // Load files from Supabase Storage
    async function loadFiles() {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await listProjectFiles(projectId, currentFolder);
        if (fetchError) {
            console.error("Failed to load project files:", fetchError);
            setError(fetchError.message || "Failed to load files.");
            setFiles([]);
        } else {
            setFiles(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadFiles();
    }, [projectId, currentFolder]);

    // Close three-dot menu when clicking outside anywhere
    useEffect(() => {
        function handleGlobalClick() {
            setActiveMenuId(null);
        }
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    // Handle Upload - Prompt for permission first
    function handleUploadClick() {
        setShowUploadPermissionModal(true);
    }

    function handleConfirmUploadPermission() {
        setShowUploadPermissionModal(false);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    async function handleFileSelected(event) {
        const uploadedFiles = Array.from(event.target.files || []);
        if (uploadedFiles.length === 0) return;

        setUploading(true);
        setError(null);

        const total = uploadedFiles.length;
        for (let i = 0; i < total; i++) {
            const file = uploadedFiles[i];
            setUploadProgress({ current: i + 1, total, fileName: file.name });
            const { error: uploadError } = await uploadProjectFile(projectId, currentFolder, file);
            if (uploadError) {
                console.error("Upload error:", uploadError);
                setError(uploadError.message || `Failed to upload ${file.name}`);
                break;
            }
        }

        setUploading(false);
        setUploadProgress(null);
        event.target.value = "";
        await loadFiles();
    }

    // Handle New Folder
    async function handleCreateFolder(e) {
        e.preventDefault();
        const trimmed = newFolderName.trim();
        if (!trimmed) return;

        setActionLoading(true);
        setError(null);
        const { error: folderError } = await createProjectFolder(projectId, currentFolder, trimmed);
        setActionLoading(false);

        if (folderError) {
            console.error("Create folder error:", folderError);
            setError(folderError.message || "Failed to create folder.");
            return;
        }

        setNewFolderName("");
        setShowNewFolderModal(false);
        await loadFiles();
    }

    // Handle Rename
    async function handleSaveRename(item) {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === item.name) {
            setRenamingId(null);
            return;
        }

        setActionLoading(true);
        const { error: renameError } = await renameProjectItem(
            projectId,
            currentFolder,
            item.name,
            trimmed,
            item.type === "folder"
        );
        setActionLoading(false);

        if (renameError) {
            console.error("Rename error:", renameError);
            alert("Could not rename: " + (renameError.message || renameError));
            return;
        }

        setRenamingId(null);
        setRenameValue("");
        await loadFiles();
    }

    // Handle Delete
    async function handleDeleteItem(item) {
        const confirmMsg =
            item.type === "folder"
                ? `Delete folder "${item.name}" and all its contents?`
                : `Delete file "${item.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        const { error: deleteError } = await deleteProjectItem(projectId, currentFolder, item);
        setActionLoading(false);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            alert("Could not delete: " + (deleteError.message || deleteError));
            return;
        }

        setActiveMenuId(null);
        await loadFiles();
    }

    // Handle Download
    async function handleDownload(fileName) {
        setActiveMenuId(null);
        await downloadProjectFile(projectId, currentFolder, fileName);
    }

    // Navigate up folder hierarchy
    function handleNavigateBack() {
        if (!currentFolder) return;
        setSearchQuery("");
        const parts = currentFolder.split("/").filter(Boolean);
        parts.pop();
        setCurrentFolder(parts.join("/"));
    }

    const filteredFiles = files.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.card}>
            <style>{`
                @keyframes filesSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            {/* Top Toolbar / Folder Path & Search */}
            <div style={styles.header}>
                <div style={styles.breadcrumb}>
                    {currentFolder ? (
                        <>
                            <button
                                type="button"
                                onClick={handleNavigateBack}
                                style={styles.backBtn}
                            >
                                ← Back
                            </button>
                            <span style={styles.pathText}>
                                {currentFolder}
                            </span>
                        </>
                    ) : null}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {currentFolder && (
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={uploading || actionLoading}
                            style={styles.iconBtn}
                            title={uploading ? "Uploading..." : "Upload file"}
                        >
                            {uploading ? (
                                <div style={styles.miniSpinner} />
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSearch(!showSearch);
                        }}
                        style={styles.iconBtn}
                        title="Search files"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.errorBanner}>
                    <span>{error}</span>
                </div>
            )}

            {/* Optional search input */}
            {showSearch && (
                <div style={styles.searchContainer} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            currentFolder
                                ? `Search inside ${currentFolder}...`
                                : "Search files or folders..."
                        }
                        style={styles.searchInput}
                        autoFocus
                    />
                </div>
            )}

            {/* Minimalist Action Buttons with Sharp Corners (Only shown at root level) */}
            {!currentFolder && canManageFolders && (
                <div style={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={uploading || actionLoading}
                        style={styles.actionBtn}
                    >
                        {uploading ? (
                            <div style={styles.btnSpinner} />
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={styles.btnIcon}
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        )}
                        <span style={styles.btnLabel}>
                            {uploading
                                ? uploadProgress?.total > 1
                                    ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                                    : "Uploading..."
                                : "Upload files"}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowNewFolderModal(true)}
                        disabled={uploading || actionLoading}
                        style={styles.actionBtn}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={styles.btnIcon}
                        >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            <line x1="12" y1="11" x2="12" y2="17" />
                            <line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                        <span style={styles.btnLabel}>New folder</span>
                    </button>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelected}
                style={{ display: "none" }}
            />

            {/* Permission Confirmation Modal before browsing local storage */}
            {showUploadPermissionModal && (
                <div style={styles.modalOverlay} onClick={() => setShowUploadPermissionModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h4 style={styles.modalTitle}>Upload Permission</h4>
                        <p style={styles.modalDesc}>
                            Allow this app to access and select files from your computer to upload to{" "}
                            <strong>{currentFolder ? `folder "${currentFolder}"` : "this project"}</strong>?
                        </p>
                        <div style={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setShowUploadPermissionModal(false)}
                                style={styles.modalCancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUploadPermission}
                                style={styles.modalCreateBtn}
                            >
                                Allow & Browse
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for creating a new folder */}
            {showNewFolderModal && (
                <div style={styles.modalOverlay} onClick={() => setShowNewFolderModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h4 style={styles.modalTitle}>New Folder</h4>
                        <form onSubmit={handleCreateFolder}>
                            <input
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                style={styles.modalInput}
                                disabled={actionLoading}
                            />
                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewFolderModal(false)}
                                    style={styles.modalCancelBtn}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newFolderName.trim() || actionLoading}
                                    style={styles.modalCreateBtn}
                                >
                                    {actionLoading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Live Upload Progress Indicator */}
            {uploading && (
                <div style={styles.uploadProgressCard}>
                    <div style={styles.uploadSpinner} />
                    <div style={styles.uploadProgressDetails}>
                        <div style={styles.uploadProgressTitle}>
                            Adding {uploadProgress?.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : "file"} to {currentFolder ? `"${currentFolder}"` : "project"}...
                        </div>
                        {uploadProgress?.fileName && (
                            <div style={styles.uploadProgressFileName}>
                                {uploadProgress.fileName}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Files List */}
            <div style={styles.list}>
                {loading ? (
                    <div style={styles.empty}>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                            Loading files from Supabase Storage...
                        </p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div style={styles.empty}>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                            {searchQuery
                                ? "No matching files found."
                                : currentFolder
                                ? "This folder is empty. Upload files or create a subfolder above."
                                : "No files or folders yet. Upload files or create a new folder above."}
                        </p>
                    </div>
                ) : (
                    filteredFiles.map((item) => (
                        <div key={item.id} style={styles.itemRow}>
                            <div
                                style={{
                                    ...styles.itemLeft,
                                    cursor: item.type === "folder" ? "pointer" : "default",
                                }}
                                onClick={() => {
                                    if (item.type === "folder" && renamingId !== item.id) {
                                        setSearchQuery("");
                                        setCurrentFolder(
                                            currentFolder
                                                ? `${currentFolder}/${item.name}`
                                                : item.name
                                        );
                                    }
                                }}
                            >
                                <div style={styles.itemIconWrapper}>
                                    {item.type === "folder" ? (
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                    ) : item.type === "archive" ? (
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    )}
                                </div>

                                <div style={styles.itemDetails}>
                                    {renamingId === item.id ? (
                                        <div
                                            style={styles.renameContainer}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                autoFocus
                                                value={renameValue}
                                                disabled={actionLoading}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveRename(item);
                                                    if (e.key === "Escape") setRenamingId(null);
                                                }}
                                                style={styles.renameInput}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveRename(item)}
                                                disabled={actionLoading}
                                                style={styles.renameSaveBtn}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRenamingId(null)}
                                                disabled={actionLoading}
                                                style={styles.renameCancelBtn}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={styles.itemName}>
                                                {item.name}
                                                {item.type === "folder" && (
                                                    <span style={styles.folderHint}> (click to open)</span>
                                                )}
                                            </div>
                                            <div style={styles.itemSubtitle}>
                                                {item.type === "folder"
                                                    ? "Folder"
                                                    : item.size
                                                    ? `${(item.size / 1024).toFixed(1)} KB`
                                                    : "File"}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={styles.itemRight}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                    }}
                                    style={styles.moreBtn}
                                    title="Options"
                                >
                                    ⋯
                                </button>

                                {activeMenuId === item.id && (
                                    <div
                                        style={styles.dropdownMenu}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {(item.type !== "folder" || canManageFolders) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRenameValue(item.name);
                                                    setRenamingId(item.id);
                                                    setActiveMenuId(null);
                                                }}
                                                style={styles.dropdownItemBtn}
                                            >
                                                Rename
                                            </button>
                                        )}
                                        {item.type !== "folder" && (
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(item.name)}
                                                style={styles.dropdownItemBtn}
                                            >
                                                Download
                                            </button>
                                        )}
                                        {(item.type !== "folder" || canManageFolders) && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteItem(item)}
                                                style={styles.dropdownDeleteBtn}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: "#ffffff",
        color: "#111827",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
        padding: "24px 28px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        marginBottom: "14px",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
    },
    breadcrumb: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    backBtn: {
        background: "transparent",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#111827",
        cursor: "pointer",
    },
    pathText: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#374151",
    },
    iconBtn: {
        background: "transparent",
        border: "none",
        color: "#6b7280",
        cursor: "pointer",
        padding: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    errorBanner: {
        padding: "10px 14px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fee2e2",
        borderRadius: "4px",
        color: "#dc2626",
        fontSize: "13px",
        marginBottom: "14px",
    },
    uploadProgressCard: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 16px",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        marginBottom: "16px",
    },
    uploadSpinner: {
        width: "18px",
        height: "18px",
        border: "2px solid #e5e7eb",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "filesSpin 0.75s linear infinite",
        flexShrink: 0,
    },
    btnSpinner: {
        width: "18px",
        height: "18px",
        border: "2px solid #d1d5db",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "filesSpin 0.75s linear infinite",
    },
    miniSpinner: {
        width: "14px",
        height: "14px",
        border: "2px solid #d1d5db",
        borderTopColor: "#111827",
        borderRadius: "50%",
        animation: "filesSpin 0.75s linear infinite",
    },
    uploadProgressDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    uploadProgressTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#111827",
    },
    uploadProgressFileName: {
        fontSize: "12px",
        color: "#6b7280",
    },
    searchContainer: {
        marginBottom: "16px",
    },
    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 14px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "0px", // Minimalist sharp corners
        color: "#111827",
        fontSize: "14px",
        outline: "none",
    },
    buttonGroup: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "24px",
    },
    // Minimalist buttons with NO rounded edges
    actionBtn: {
        borderRadius: "0px", // NO round edge as requested
        border: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        color: "#111827",
        padding: "18px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
    },
    btnIcon: {
        color: "#4b5563",
    },
    btnLabel: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#111827",
        letterSpacing: "0.01em",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    itemRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
        position: "relative",
    },
    itemLeft: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flex: 1,
    },
    itemIconWrapper: {
        color: "#4b5563",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    itemDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: 1,
    },
    itemName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
    },
    folderHint: {
        fontSize: "12px",
        fontWeight: "normal",
        color: "#9ca3af",
    },
    itemSubtitle: {
        fontSize: "12px",
        color: "#6b7280",
    },
    renameContainer: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        maxWidth: "360px",
    },
    renameInput: {
        flex: 1,
        padding: "6px 10px",
        fontSize: "13px",
        border: "1px solid #d1d5db",
        borderRadius: "0px",
        outline: "none",
    },
    renameSaveBtn: {
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: "#111827",
        color: "#ffffff",
        border: "none",
        borderRadius: "0px",
        cursor: "pointer",
    },
    renameCancelBtn: {
        padding: "6px 10px",
        fontSize: "12px",
        backgroundColor: "transparent",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        cursor: "pointer",
    },
    itemRight: {
        position: "relative",
    },
    moreBtn: {
        background: "transparent",
        border: "none",
        color: "#9ca3af",
        fontSize: "20px",
        cursor: "pointer",
        padding: "4px 8px",
        lineHeight: "1",
    },
    dropdownMenu: {
        position: "absolute",
        right: 0,
        top: "28px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        padding: "4px 0",
        zIndex: 20,
        minWidth: "140px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
    },
    dropdownItemBtn: {
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        color: "#111827",
        padding: "8px 14px",
        fontSize: "13px",
        cursor: "pointer",
        borderRadius: "0px",
    },
    dropdownDeleteBtn: {
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        color: "#dc2626",
        padding: "8px 14px",
        fontSize: "13px",
        cursor: "pointer",
        borderRadius: "0px",
    },
    empty: {
        padding: "36px 20px",
        textAlign: "center",
        backgroundColor: "#fafafa",
        border: "1px dashed #e5e7eb",
        borderRadius: "8px",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    modalContent: {
        backgroundColor: "#ffffff",
        border: "1px solid #eaeaea",
        borderRadius: "0px", // Minimalist sharp corners
        padding: "24px",
        width: "320px",
        color: "#111827",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    },
    modalTitle: {
        margin: "0 0 16px 0",
        fontSize: "16px",
        fontWeight: "600",
    },
    modalDesc: {
        fontSize: "13px",
        color: "#6b7280",
        lineHeight: "1.5",
        margin: "0 0 20px 0",
    },
    modalInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        backgroundColor: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: "0px",
        color: "#111827",
        fontSize: "14px",
        outline: "none",
        marginBottom: "16px",
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
    },
    modalCancelBtn: {
        background: "transparent",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        color: "#6b7280",
        padding: "8px 14px",
        fontSize: "13px",
        cursor: "pointer",
    },
    modalCreateBtn: {
        background: "#111827",
        border: "none",
        borderRadius: "0px",
        color: "#ffffff",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
    },
};
