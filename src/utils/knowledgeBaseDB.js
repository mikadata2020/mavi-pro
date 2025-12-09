// Knowledge Base Database Utilities
// Uses IndexedDB for local storage + Supabase for cloud sync

import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const SUPABASE_TABLE = 'manuals';

const DB_NAME = 'MAViKnowledgeBase';
const DB_VERSION = 1;

// Initialize IndexedDB
export const initKnowledgeBaseDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Knowledge Base Items Store
            if (!db.objectStoreNames.contains('knowledgeBase')) {
                const kbStore = db.createObjectStore('knowledgeBase', { keyPath: 'id', autoIncrement: true });
                kbStore.createIndex('type', 'type', { unique: false });
                kbStore.createIndex('category', 'category', { unique: false });
                kbStore.createIndex('createdAt', 'createdAt', { unique: false });
                kbStore.createIndex('rating', 'averageRating', { unique: false });
                kbStore.createIndex('usageCount', 'usageCount', { unique: false });
            }

            // Tags Store
            if (!db.objectStoreNames.contains('kbTags')) {
                const tagsStore = db.createObjectStore('kbTags', { keyPath: 'id', autoIncrement: true });
                tagsStore.createIndex('kbId', 'kbId', { unique: false });
                tagsStore.createIndex('tag', 'tag', { unique: false });
            }

            // Ratings Store
            if (!db.objectStoreNames.contains('kbRatings')) {
                const ratingsStore = db.createObjectStore('kbRatings', { keyPath: 'id', autoIncrement: true });
                ratingsStore.createIndex('kbId', 'kbId', { unique: false });
                ratingsStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
};

// CRUD Operations for Knowledge Base Items

export const addKnowledgeBaseItem = async (item) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['knowledgeBase'], 'readwrite');
    const store = transaction.objectStore('knowledgeBase');

    // Generate a unique UUID for cloud sync
    const cloudId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const kbItem = {
        ...item,
        cloudId, // Store cloud ID for reference
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        usageCount: 0,
        averageRating: 0,
        ratingCount: 0,
        syncStatus: 'pending' // pending, synced, error
    };

    const request = store.add(kbItem);

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const localId = request.result;

            // Sync to Supabase (non-blocking)
            if (isSupabaseConfigured()) {
                syncItemToCloud(cloudId, kbItem).then(() => {
                    // Update sync status to 'synced'
                    updateSyncStatus(localId, 'synced');
                }).catch(err => {
                    console.error('Supabase sync error:', err);
                    updateSyncStatus(localId, 'error');
                });
            }

            resolve(localId);
        };
        request.onerror = () => reject(request.error);
    });
};

// Helper function to sync item to Supabase
const syncItemToCloud = async (cloudId, item) => {
    const supabase = getSupabase();

    // Prepare data for Supabase (exclude local-only fields)
    const cloudData = {
        id: cloudId,
        title: item.title || '',
        document_number: item.documentNumber || '',
        version: item.version || '1.0',
        status: item.status || 'Draft',
        author: item.author || '',
        summary: item.description || item.summary || '',
        difficulty: item.difficulty || 'Moderate',
        time_required: item.timeRequired || '',
        category: item.category || '',
        industry: item.industry || '',
        type: item.type || 'manual',
        steps: item.steps || item.content || null,
        created_at: item.createdAt,
        updated_at: item.updatedAt
    };

    const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert(cloudData, { onConflict: 'id' });

    if (error) throw error;
    return data;
};

// Helper to update local sync status
const updateSyncStatus = async (localId, status) => {
    try {
        const db = await initKnowledgeBaseDB();
        const transaction = db.transaction(['knowledgeBase'], 'readwrite');
        const store = transaction.objectStore('knowledgeBase');
        const getRequest = store.get(localId);

        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.syncStatus = status;
                store.put(item);
            }
        };
    } catch (err) {
        console.error('Failed to update sync status:', err);
    }
};

export const getAllKnowledgeBaseItems = async () => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['knowledgeBase'], 'readonly');
    const store = transaction.objectStore('knowledgeBase');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get item from Supabase cloud by cloudId (for QR code access)
export const getItemFromCloud = async (cloudId) => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return null;
    }

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_TABLE)
            .select('*')
            .eq('id', cloudId)
            .single();

        if (error) {
            console.error('Cloud fetch error:', error);
            return null;
        }

        // Convert cloud format to local format
        return {
            cloudId: data.id,
            title: data.title,
            documentNumber: data.document_number,
            version: data.version,
            status: data.status,
            author: data.author,
            summary: data.summary,
            description: data.summary,
            difficulty: data.difficulty,
            timeRequired: data.time_required,
            category: data.category,
            industry: data.industry,
            type: data.type,
            steps: data.steps,
            content: data.steps,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (err) {
        console.error('Failed to fetch from cloud:', err);
        return null;
    }
};

// Get local item by cloudId
export const getItemByCloudId = async (cloudId) => {
    const items = await getAllKnowledgeBaseItems();
    return items.find(item => item.cloudId === cloudId) || null;
};

export const getKnowledgeBaseItem = async (id) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['knowledgeBase'], 'readonly');
    const store = transaction.objectStore('knowledgeBase');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const updateKnowledgeBaseItem = async (id, updates) => {
    const db = await initKnowledgeBaseDB();

    // First, get the existing item
    const getTransaction = db.transaction(['knowledgeBase'], 'readonly');
    const getStore = getTransaction.objectStore('knowledgeBase');
    const getRequest = getStore.get(id);

    const item = await new Promise((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
    });

    if (!item) {
        throw new Error(`Item with id ${id} not found`);
    }

    // Then, update in a new transaction
    const updateTransaction = db.transaction(['knowledgeBase'], 'readwrite');
    const updateStore = updateTransaction.objectStore('knowledgeBase');

    const updatedItem = {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    const updateRequest = updateStore.put(updatedItem);

    return new Promise((resolve, reject) => {
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
    });
};

export const deleteKnowledgeBaseItem = async (id) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['knowledgeBase', 'kbTags', 'kbRatings'], 'readwrite');

    // Delete main item
    const kbStore = transaction.objectStore('knowledgeBase');
    kbStore.delete(id);

    // Delete associated tags
    const tagsStore = transaction.objectStore('kbTags');
    const tagsIndex = tagsStore.index('kbId');
    const tagsRequest = tagsIndex.openCursor(IDBKeyRange.only(id));

    tagsRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };

    // Delete associated ratings
    const ratingsStore = transaction.objectStore('kbRatings');
    const ratingsIndex = ratingsStore.index('kbId');
    const ratingsRequest = ratingsIndex.openCursor(IDBKeyRange.only(id));

    ratingsRequest.onsuccess = (event) => {
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

// Tags Operations

export const addTagsToItem = async (kbId, tags) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['kbTags'], 'readwrite');
    const store = transaction.objectStore('kbTags');

    const promises = tags.map(tag => {
        const tagItem = { kbId, tag: tag.toLowerCase() };
        const request = store.add(tagItem);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });

    return Promise.all(promises);
};

export const getTagsForItem = async (kbId) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['kbTags'], 'readonly');
    const store = transaction.objectStore('kbTags');
    const index = store.index('kbId');
    const request = index.getAll(kbId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result.map(item => item.tag));
        request.onerror = () => reject(request.error);
    });
};

export const getAllTags = async () => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['kbTags'], 'readonly');
    const store = transaction.objectStore('kbTags');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const tags = [...new Set(request.result.map(item => item.tag))];
            resolve(tags.sort());
        };
        request.onerror = () => reject(request.error);
    });
};

// Ratings Operations

export const addRating = async (kbId, rating, feedback = '') => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['kbRatings', 'knowledgeBase'], 'readwrite');

    // Add rating
    const ratingsStore = transaction.objectStore('kbRatings');
    const ratingItem = {
        kbId,
        rating,
        feedback,
        createdAt: new Date().toISOString()
    };
    ratingsStore.add(ratingItem);

    // Update average rating
    const kbStore = transaction.objectStore('knowledgeBase');
    const kbRequest = kbStore.get(kbId);

    kbRequest.onsuccess = async () => {
        const item = kbRequest.result;
        const ratings = await getRatingsForItem(kbId);
        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0) + rating;
        const count = ratings.length + 1;

        item.averageRating = totalRating / count;
        item.ratingCount = count;
        kbStore.put(item);
    };

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getRatingsForItem = async (kbId) => {
    const db = await initKnowledgeBaseDB();
    const transaction = db.transaction(['kbRatings'], 'readonly');
    const store = transaction.objectStore('kbRatings');
    const index = store.index('kbId');
    const request = index.getAll(kbId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Increment view/usage count

export const incrementViewCount = async (id) => {
    const item = await getKnowledgeBaseItem(id);
    if (!item) return;
    return updateKnowledgeBaseItem(id, { viewCount: (item.viewCount || 0) + 1 });
};

export const incrementUsageCount = async (id) => {
    const item = await getKnowledgeBaseItem(id);
    if (!item) return;
    return updateKnowledgeBaseItem(id, { usageCount: (item.usageCount || 0) + 1 });
};

// Search and Filter

export const searchKnowledgeBase = async (query, filters = {}) => {
    const allItems = await getAllKnowledgeBaseItems();

    return allItems.filter(item => {
        // Text search
        const matchesQuery = !query ||
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(query.toLowerCase()));

        // Type filter
        const matchesType = !filters.type || item.type === filters.type;

        // Category filter
        const matchesCategory = !filters.category || item.category === filters.category;

        // Industry filter
        const matchesIndustry = !filters.industry || item.industry === filters.industry;

        return matchesQuery && matchesType && matchesCategory && matchesIndustry;
    });
};

// Sort functions

export const sortKnowledgeBase = (items, sortBy) => {
    const sorted = [...items];

    switch (sortBy) {
        case 'mostUsed':
            return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        case 'highestRated':
            return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return sorted;
    }
};
