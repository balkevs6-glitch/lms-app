import { supabase } from "../../supabaseClient";

const BUCKET = "project-files";

export function getFullPath(projectId, currentPath = "", fileName = "") {
    const parts = [projectId];
    if (currentPath) parts.push(currentPath);
    if (fileName) parts.push(fileName);
    return parts.join("/");
}

// List all files and folders in the current project directory
export async function listProjectFiles(projectId, currentPath = "") {
    const folderPath = currentPath ? `${projectId}/${currentPath}` : `${projectId}`;
    
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
            sortBy: { column: "name", order: "asc" },
        });

    if (error) {
        console.error("Error listing files:", error);
        return { data: [], error };
    }

    // Filter out internal placeholder files like .keep
    const filtered = (data || []).filter((item) => item.name !== ".keep");

    const items = filtered.map((item) => {
        // Folders in Supabase Storage have id === null or metadata === null
        const isFolder = item.id === null || !item.metadata || item.metadata.mimetype === undefined;
        const isZip =
            item.name.endsWith(".zip") ||
            item.name.endsWith(".tar") ||
            item.name.endsWith(".rar") ||
            item.name.endsWith(".gz");

        let type = "file";
        if (isFolder) type = "folder";
        else if (isZip) type = "archive";

        return {
            id: item.id || `folder-${item.name}`,
            name: item.name,
            type,
            size: item.metadata?.size || 0,
            updatedAt: item.updated_at || item.created_at,
            metadata: item.metadata,
        };
    });

    return { data: items, error: null };
}

// Upload a single or multiple files
export async function uploadProjectFile(projectId, currentPath, file) {
    const path = getFullPath(projectId, currentPath, file.name);
    return supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
    });
}

// Create an empty folder using a hidden .keep file
export async function createProjectFolder(projectId, currentPath, folderName) {
    const keepPath = getFullPath(projectId, currentPath ? `${currentPath}/${folderName}` : folderName, ".keep");
    const placeholder = new Blob([""], { type: "text/plain" });

    return supabase.storage.from(BUCKET).upload(keepPath, placeholder, {
        upsert: true,
        contentType: "text/plain",
    });
}

// Rename a file or folder
export async function renameProjectItem(projectId, currentPath, oldName, newName, isFolder = false) {
    const oldPath = getFullPath(projectId, currentPath, oldName);
    const newPath = getFullPath(projectId, currentPath, newName);

    if (!isFolder) {
        return supabase.storage.from(BUCKET).move(oldPath, newPath);
    }

    // For folders, move all files within the folder
    const { data: contents } = await supabase.storage.from(BUCKET).list(oldPath);
    if (!contents || contents.length === 0) {
        // Move placeholder if exists
        return supabase.storage.from(BUCKET).move(`${oldPath}/.keep`, `${newPath}/.keep`);
    }

    const errors = [];
    for (const item of contents) {
        const itemOld = `${oldPath}/${item.name}`;
        const itemNew = `${newPath}/${item.name}`;
        const { error } = await supabase.storage.from(BUCKET).move(itemOld, itemNew);
        if (error) errors.push(error);
    }

    return { error: errors.length > 0 ? errors[0] : null };
}

// Delete a file or an entire folder
export async function deleteProjectItem(projectId, currentPath, item) {
    const targetPath = getFullPath(projectId, currentPath, item.name);

    if (item.type !== "folder") {
        return supabase.storage.from(BUCKET).remove([targetPath]);
    }

    // If deleting a folder, remove all items inside it
    const { data: folderFiles } = await supabase.storage.from(BUCKET).list(targetPath);
    const pathsToDelete = (folderFiles || []).map((file) => `${targetPath}/${file.name}`);
    pathsToDelete.push(`${targetPath}/.keep`);

    return supabase.storage.from(BUCKET).remove(pathsToDelete);
}

// Download a file
export async function downloadProjectFile(projectId, currentPath, fileName) {
    const path = getFullPath(projectId, currentPath, fileName);
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error) {
        console.error("Download failed:", error);
        return { error };
    }

    // Trigger browser download
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    return { error: null };
}

export async function openProjectFile(projectId, currentPath, fileName) {
    const path = getFullPath(projectId, currentPath, fileName);
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 10);

    if (error) {
        console.error("Could not open file:", error);
        return { error };
    }

    const previewWindow = window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    if (!previewWindow) {
        return { error: new Error("The browser blocked the preview tab. Please allow pop-ups for this site.") };
    }

    return { error: null };
}

export async function readProjectTextFile(projectId, currentPath, fileName) {
    const path = getFullPath(projectId, currentPath, fileName);
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 10);

    if (signedUrlError) {
        return { data: null, error: signedUrlError };
    }

    try {
        const response = await fetch(signedUrl.signedUrl);
        if (!response.ok) {
            return { data: null, error: new Error(`Could not read file (${response.status}).`) };
        }
        return { data: await response.text(), error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function readProjectDocxFile(projectId, currentPath, fileName) {
    const path = getFullPath(projectId, currentPath, fileName);
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 10);

    if (signedUrlError) {
        return { data: null, error: signedUrlError };
    }

    try {
        const response = await fetch(signedUrl.signedUrl);
        if (!response.ok) {
            return { data: null, error: new Error(`Could not read file (${response.status}).`) };
        }
        return { data: await response.arrayBuffer(), error: null };
    } catch (error) {
        return { data: null, error };
    }
}
