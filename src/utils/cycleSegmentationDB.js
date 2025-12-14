// Cycle Segmentation Database Utilities
// Uses IndexedDB for local storage of cycle segmentation projects and detected cycles

const DB_NAME = 'MAViCycleSegmentation';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB for Cycle Segmentation
 * Creates object stores: projects, cycles, comparisons
 */
export const initCycleSegmentationDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Projects Store - stores video, model cycle, and settings
            if (!db.objectStoreNames.contains('projects')) {
                const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('name', 'name', { unique: true });
                projectStore.createIndex('createdAt', 'createdAt', { unique: false });
                projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            // Cycles Store - stores individual detected cycles
            if (!db.objectStoreNames.contains('cycles')) {
                const cycleStore = db.createObjectStore('cycles', { keyPath: 'id', autoIncrement: true });
                cycleStore.createIndex('projectId', 'projectId', { unique: false });
                cycleStore.createIndex('cycleNumber', 'cycleNumber', { unique: false });
                cycleStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Comparisons Store - stores cycle comparison results
            if (!db.objectStoreNames.contains('comparisons')) {
                const comparisonStore = db.createObjectStore('comparisons', { keyPath: 'id', autoIncrement: true });
                comparisonStore.createIndex('projectId', 'projectId', { unique: false });
                comparisonStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
};

// ============================================
// PROJECT OPERATIONS
// ============================================

/**
 * Save a cycle segmentation project
 * @param {Object} projectData - Project data including video, model cycle, settings
 * @returns {Promise<number>} - Project ID
 */
export const saveCycleProject = async (projectData) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');

    const project = {
        ...projectData,
        createdAt: projectData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const request = store.add(project);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get a cycle project by ID
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Project data
 */
export const getCycleProject = async (projectId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.get(projectId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get a cycle project by name
 * @param {string} projectName - Project name
 * @returns {Promise<Object|null>} - Project data or null
 */
export const getCycleProjectByName = async (projectName) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const index = store.index('name');
    const request = index.get(projectName);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get all cycle projects
 * @returns {Promise<Array>} - Array of projects
 */
export const getAllCycleProjects = async () => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Update a cycle project
 * @param {number} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<number>} - Project ID
 */
export const updateCycleProject = async (projectId, updates) => {
    const db = await initCycleSegmentationDB();

    // Get existing project
    const getTransaction = db.transaction(['projects'], 'readonly');
    const getStore = getTransaction.objectStore('projects');
    const getRequest = getStore.get(projectId);

    const project = await new Promise((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
    });

    if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
    }

    // Update project
    const updateTransaction = db.transaction(['projects'], 'readwrite');
    const updateStore = updateTransaction.objectStore('projects');

    const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    const updateRequest = updateStore.put(updatedProject);

    return new Promise((resolve, reject) => {
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
    });
};

/**
 * Delete a cycle project and all related data
 * @param {number} projectId - Project ID
 * @returns {Promise<void>}
 */
export const deleteCycleProject = async (projectId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['projects', 'cycles', 'comparisons'], 'readwrite');

    // Delete project
    const projectStore = transaction.objectStore('projects');
    projectStore.delete(projectId);

    // Delete all cycles for this project
    const cycleStore = transaction.objectStore('cycles');
    const cycleIndex = cycleStore.index('projectId');
    const cycleRequest = cycleIndex.openCursor(IDBKeyRange.only(projectId));

    cycleRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };

    // Delete all comparisons for this project
    const comparisonStore = transaction.objectStore('comparisons');
    const comparisonIndex = comparisonStore.index('projectId');
    const comparisonRequest = comparisonIndex.openCursor(IDBKeyRange.only(projectId));

    comparisonRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

// ============================================
// CYCLE OPERATIONS
// ============================================

/**
 * Save a detected cycle
 * @param {Object} cycleData - Cycle data including pose, actions, timing
 * @returns {Promise<number>} - Cycle ID
 */
export const saveCycle = async (cycleData) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['cycles'], 'readwrite');
    const store = transaction.objectStore('cycles');

    const cycle = {
        ...cycleData,
        createdAt: new Date().toISOString()
    };

    const request = store.add(cycle);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get all cycles for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} - Array of cycles
 */
export const getCyclesForProject = async (projectId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['cycles'], 'readonly');
    const store = transaction.objectStore('cycles');
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // Sort by cycle number
            const cycles = request.result.sort((a, b) => a.cycleNumber - b.cycleNumber);
            resolve(cycles);
        };
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get a specific cycle
 * @param {number} cycleId - Cycle ID
 * @returns {Promise<Object>} - Cycle data
 */
export const getCycle = async (cycleId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['cycles'], 'readonly');
    const store = transaction.objectStore('cycles');
    const request = store.get(cycleId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete a cycle
 * @param {number} cycleId - Cycle ID
 * @returns {Promise<void>}
 */
export const deleteCycle = async (cycleId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['cycles'], 'readwrite');
    const store = transaction.objectStore('cycles');
    const request = store.delete(cycleId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete all cycles for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<void>}
 */
export const deleteAllCyclesForProject = async (projectId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['cycles'], 'readwrite');
    const store = transaction.objectStore('cycles');
    const index = store.index('projectId');
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

// ============================================
// COMPARISON OPERATIONS
// ============================================

/**
 * Save a cycle comparison result
 * @param {Object} comparisonData - Comparison data and statistics
 * @returns {Promise<number>} - Comparison ID
 */
export const saveComparison = async (comparisonData) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['comparisons'], 'readwrite');
    const store = transaction.objectStore('comparisons');

    const comparison = {
        ...comparisonData,
        createdAt: new Date().toISOString()
    };

    const request = store.add(comparison);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get all comparisons for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} - Array of comparisons
 */
export const getComparisonsForProject = async (projectId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['comparisons'], 'readonly');
    const store = transaction.objectStore('comparisons');
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete a comparison
 * @param {number} comparisonId - Comparison ID
 * @returns {Promise<void>}
 */
export const deleteComparison = async (comparisonId) => {
    const db = await initCycleSegmentationDB();
    const transaction = db.transaction(['comparisons'], 'readwrite');
    const store = transaction.objectStore('comparisons');
    const request = store.delete(comparisonId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
