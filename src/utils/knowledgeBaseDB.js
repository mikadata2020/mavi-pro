// Knowledge Base Database Utilities
// Uses IndexedDB for storing knowledge base items, templates, and ratings

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

    const kbItem = {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        usageCount: 0,
        averageRating: 0,
        ratingCount: 0
    };

    const request = store.add(kbItem);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
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
    const transaction = db.transaction(['knowledgeBase'], 'readwrite');
    const store = transaction.objectStore('knowledgeBase');

    const item = await getKnowledgeBaseItem(id);
    const updatedItem = {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    const request = store.put(updatedItem);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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
    return updateKnowledgeBaseItem(id, { viewCount: (item.viewCount || 0) + 1 });
};

export const incrementUsageCount = async (id) => {
    const item = await getKnowledgeBaseItem(id);
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
