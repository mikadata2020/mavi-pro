// IndexedDB wrapper for Motion Analysis data
// With Supabase cloud sync for cross-device access

import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const DB_NAME = 'MotionAnalysisDB';
const DB_VERSION = 3; // Updated version for folders
const STORE_NAME = 'measurements';
const PROJECTS_STORE = 'projects';
const FOLDERS_STORE = 'folders';

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

// Update project (with cloud sync)
export const updateProject = async (projectName, updates) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise(async (resolve, reject) => {
        try {
            // First get the existing project
            const project = await getProjectByName(projectName);
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
                syncStatus: 'pending'
            };

            const request = store.put(updatedData);

            request.onsuccess = () => {
                // Sync to Supabase (non-blocking)
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

// Get project from cloud by cloudId
export const getProjectFromCloud = async (cloudId) => {
    if (!isSupabaseConfigured()) return null;

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_PROJECTS_TABLE)
            .select('*')
            .eq('id', cloudId)
            .single();

        if (error) {
            console.error('Cloud project fetch error:', error);
            return null;
        }

        return {
            cloudId: data.id,
            projectName: data.project_name,
            videoName: data.video_name,
            measurements: data.measurements || [],
            narration: data.narration,
            createdAt: data.created_at,
            lastModified: data.last_modified
        };
    } catch (err) {
        console.error('Failed to fetch project from cloud:', err);
        return null;
    }
};

// Delete project
export const deleteProject = async (projectName) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise(async (resolve, reject) => {
        try {
            // First get the project to get its ID
            const project = await getProjectByName(projectName);
            if (!project) {
                reject(new Error('Project not found'));
                return;
            }

            const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
            const store = transaction.objectStore(PROJECTS_STORE);
            const request = store.delete(project.id);

            request.onsuccess = () => resolve();
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
