// IndexedDB wrapper for Motion Analysis data
// With Supabase cloud sync for cross-device access

import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const DB_NAME = 'MotionAnalysisDB';
const DB_VERSION = 4; // Updated version for cameras support
const STORE_NAME = 'measurements';
const PROJECTS_STORE = 'projects';
const FOLDERS_STORE = 'folders';
const CAMERAS_STORE = 'cameras';

// Supabase table names
const SUPABASE_PROJECTS_TABLE = 'projects';
const SUPABASE_MEASUREMENTS_TABLE = 'measurements';

// Initialize database
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;

            // Create measurements store if not exists
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('videoName', 'videoName', { unique: false });
            }

            // Create projects store if not exists
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('projectName', 'projectName', { unique: true });
                projectStore.createIndex('createdAt', 'createdAt', { unique: false });
                projectStore.createIndex('lastModified', 'lastModified', { unique: false });
            }

            // Version 3: Projects Folder Support
            if (transaction) {
                const projectStore = transaction.objectStore(PROJECTS_STORE);
                if (!projectStore.indexNames.contains('folderId')) {
                    projectStore.createIndex('folderId', 'folderId', { unique: false });
                }
            }

            // Version 4: Multi-Camera Support
            if (!db.objectStoreNames.contains(CAMERAS_STORE)) {
                const cameraStore = db.createObjectStore(CAMERAS_STORE, { keyPath: 'id', autoIncrement: true });
                cameraStore.createIndex('name', 'name', { unique: false });
                cameraStore.createIndex('projectId', 'projectId', { unique: false });
            }

            // Create folders store
            if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
                const folderStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id', autoIncrement: true });
                folderStore.createIndex('parentId', 'parentId', { unique: false });
                folderStore.createIndex('section', 'section', { unique: false }); // 'projects' or 'manuals'
            }
        };
    });
};

// Save measurement session
export const saveMeasurementSession = async (videoName, measurements, narration = null) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            videoName: videoName || 'Untitled',
            timestamp: new Date().toISOString(),
            measurements: measurements,
            narration: narration
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get all sessions
export const getAllSessions = async () => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get session by ID
export const getSessionById = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Delete session
export const deleteSession = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Update session
export const updateSession = async (id, videoName, measurements, narration = null) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            id: id,
            videoName: videoName || 'Untitled',
            timestamp: new Date().toISOString(),
            measurements: measurements,
            narration: narration
        };

        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// ===== PROJECT MANAGEMENT FUNCTIONS =====

// Helper function to sync project to Supabase cloud
const syncProjectToCloud = async (cloudId, projectData) => {
    if (!isSupabaseConfigured()) return null;

    try {
        const supabase = getSupabase();

        // Prepare cloud data (exclude large binary videoBlob)
        const cloudData = {
            id: cloudId,
            project_name: projectData.projectName,
            video_name: projectData.videoName,
            measurements: projectData.measurements || [],
            narration: projectData.narration,
            created_at: projectData.createdAt,
            last_modified: projectData.lastModified
        };

        const { data, error } = await supabase
            .from(SUPABASE_PROJECTS_TABLE)
            .upsert(cloudData, { onConflict: 'id' });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Project cloud sync error:', err);
        throw err;
    }
};

// Helper to update project sync status locally
const updateProjectSyncStatus = async (localId, status) => {
    try {
        const db = await initDB();
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);
        const getRequest = store.get(localId);

        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.syncStatus = status;
                store.put(item);
            }
        };
    } catch (err) {
        console.error('Failed to update project sync status:', err);
    }
};

// Save new project (with cloud sync)
export const saveProject = async (projectName, videoBlob, videoName, measurements = [], narration = null) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    // Generate cloud ID
    const cloudId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);

        const data = {
            projectName,
            videoBlob,
            videoName,
            measurements,
            narration,
            cloudId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            syncStatus: 'pending'
        };

        const request = store.add(data);

        request.onsuccess = () => {
            const localId = request.result;

            // Sync to Supabase (non-blocking)
            if (isSupabaseConfigured()) {
                syncProjectToCloud(cloudId, data).then(() => {
                    updateProjectSyncStatus(localId, 'synced');
                    console.log('Project synced to cloud:', projectName);
                }).catch(err => {
                    console.error('Project cloud sync failed:', err);
                    updateProjectSyncStatus(localId, 'error');
                });
            }

            resolve(localId);
        };
        request.onerror = () => reject(request.error);
    });
};

// Get all projects
export const getAllProjects = async () => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get project by name
export const getProjectByName = async (projectName) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const index = store.index('projectName');
        const request = index.get(projectName);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Update project (optimized for partial updates)
// Note: Originally expected (projectName, updates) but (id, updates) is safer for moves
// To maintain compatibility, we check if first arg is string (name) or number (id)
export const updateProject = async (identifier, updates) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise(async (resolve, reject) => {
        try {
            let project;
            if (typeof identifier === 'number') {
                project = await getProjectById(identifier);
            } else {
                project = await getProjectByName(identifier);
            }

            if (!project) {
                reject(new Error('Project not found'));
                return;
            }

            const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
            const store = transaction.objectStore(PROJECTS_STORE);

            const updatedData = {
                ...project,
                ...updates,
                lastModified: new Date().toISOString(),
                syncStatus: 'pending' // Reset sync on update
            };

            const request = store.put(updatedData);

            request.onsuccess = () => {
                // Sync to Supabase if configured
                if (isSupabaseConfigured() && project.cloudId) {
                    syncProjectToCloud(project.cloudId, updatedData).then(() => {
                        updateProjectSyncStatus(project.id, 'synced');
                    }).catch(err => {
                        console.error('Project update sync failed:', err);
                        updateProjectSyncStatus(project.id, 'error');
                    });
                }
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

// Get project by ID
export const getProjectById = async (id) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Delete project by ID
export const deleteProjectById = async (id) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Generic delete project (handles ID or Name)
export const deleteProject = async (identifier) => {
    try {
        if (typeof identifier === 'number') {
            return await deleteProjectById(identifier);
        } else if (typeof identifier === 'string') {
            const project = await getProjectByName(identifier);
            if (!project) throw new Error('Project not found with name: ' + identifier);
            return await deleteProjectById(project.id);
        } else {
            throw new Error('Invalid identifier type for deleteProject');
        }
    } catch (error) {
        throw error;
    }
};

// ===== FOLDER MANAGEMENT FUNCTIONS (New) =====

export const createFolder = async (name, section = 'projects', parentId = null) => {
    const db = await initDB();
    const FOLDERS_STORE = 'folders';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
        const store = transaction.objectStore(FOLDERS_STORE);

        const folder = {
            name,
            section,
            parentId,
            createdAt: new Date().toISOString()
        };

        const request = store.add(folder);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getFolders = async (section = 'projects', parentId = null) => {
    const db = await initDB();
    const FOLDERS_STORE = 'folders';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FOLDERS_STORE], 'readonly');
        const store = transaction.objectStore(FOLDERS_STORE);
        const index = store.index('parentId'); // We assume we added this index in initDB

        // If getting root folders (parentId is null), we can't easily query index for null in all browsers consistently
        // But let's try standard approach or filter

        const request = store.getAll();

        request.onsuccess = () => {
            const allFolders = request.result;
            // Filter in memory for now to be safe with compound logic (section + parentId)
            const filtered = allFolders.filter(f =>
                f.section === section && f.parentId === parentId
            );
            resolve(filtered);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteFolder = async (id) => {
    // Note: This should ideally be recursive or block if not empty.
    // For now, valid implementation is just delete the folder entry.
    // Items inside might become orphaned (parentId points to non-existent).
    // Better: Move items to root or delete them? 
    // Let's just delete the folder.
    const db = await initDB();
    const FOLDERS_STORE = 'folders';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
        const store = transaction.objectStore(FOLDERS_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Helper for breadcrumbs
export const getFolderById = async (id) => {
    const db = await initDB();
    const FOLDERS_STORE = 'folders';
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FOLDERS_STORE], 'readonly');
        const store = transaction.objectStore(FOLDERS_STORE);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getFolderBreadcrumbs = async (folderId) => {
    if (!folderId) return [];

    const crumbs = [];
    let currentId = folderId;

    while (currentId) {
        try {
            const folder = await getFolderById(currentId);
            if (!folder) break;
            crumbs.unshift({ id: folder.id, name: folder.name, parentId: folder.parentId });
            currentId = folder.parentId;
        } catch (e) {
            break;
        }
    }
    return crumbs;
};

// --- Multi-Camera Management ---

export const getAllCameras = async () => {
    const db = await initDB();
    const CAMERAS_STORE = 'cameras';
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CAMERAS_STORE], 'readonly');
        const store = transaction.objectStore(CAMERAS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const saveCamera = async (cameraData) => {
    const db = await initDB();
    const CAMERAS_STORE = 'cameras';
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CAMERAS_STORE], 'readwrite');
        const store = transaction.objectStore(CAMERAS_STORE);
        const request = store.put(cameraData);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteCamera = async (id) => {
    const db = await initDB();
    const CAMERAS_STORE = 'cameras';
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CAMERAS_STORE], 'readwrite');
        const store = transaction.objectStore(CAMERAS_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
