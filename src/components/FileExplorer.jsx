import React, { useState, useEffect } from 'react';
import { getAllProjects, deleteProjectById, getProjectById, saveProject, getProjectByName, createFolder, getFolders, getFolderBreadcrumbs, updateProject, deleteFolder } from '../utils/database';
import { getAllKnowledgeBaseItems, deleteKnowledgeBaseItem } from '../utils/knowledgeBaseDB';
import { useNavigate } from 'react-router-dom';
import { importProject, generateProjectZip } from '../utils/projectExport';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Folder, ArrowLeft, FolderPlus, FileVideo } from 'lucide-react'; // Basic icons

const FileExplorer = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [manuals, setManuals] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0 });
    const [selectedItems, setSelectedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [viewMode, setViewMode] = useState('grid');
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        loadData();
        getStorageEstimate();
    }, [currentFolderId, activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load items based on activeTab
            // Note: knowledgeBase currently doesn't support folders in database yet (we only updated database.js for projects context mostly)
            // But we can support it if we updated knowledgeBase schema. Use 'projects' folder section for now.

            const section = activeTab === 'projects' ? 'projects' : 'manuals';

            const [allProjects, allManuals, currentFolders, crumbs] = await Promise.all([
                getAllProjects(),
                getAllKnowledgeBaseItems(),
                getFolders(section, currentFolderId),
                getFolderBreadcrumbs(currentFolderId)
            ]);

            // Filter items by current folder
            // Ensure compatibility: items without folderId are in root (null)
            const folderProjects = allProjects.filter(p => {
                if (currentFolderId === null) return !p.folderId;
                return p.folderId === currentFolderId;
            });

            // For manuals, we haven't implemented folderId yet in schema
            // So for now, Manuals tab might just show flat list or we fake it?
            // User requested "System Folder / Kategori".
            // Let's assume ONLY Projects support actual folders for now unless I update KB schema.
            // I'll filter Manuals flatly or just show all in root for now to avoid breaking.
            // Or better: Only show folder UI in 'projects' tab.

            setProjects(folderProjects || []);
            setManuals(allManuals || []); // Manuals always flat for now
            setFolders(currentFolders || []);
            setBreadcrumbs(crumbs || []);

        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStorageEstimate = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            setStorageInfo({
                used: estimate.usage || 0,
                quota: estimate.quota || 0
            });
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleCreateFolder = async () => {
        const name = prompt("Folder Name:");
        if (!name) return;
        try {
            await createFolder(name, activeTab === 'projects' ? 'projects' : 'manuals', currentFolderId);
            loadData();
        } catch (e) {
            alert('Failed to create folder: ' + e.message);
        }
    };

    const handleNavigateFolder = (folderId) => {
        setCurrentFolderId(folderId);
        setSelectedItems([]); // Clear selection on nav
    };

    const handleNavigateUp = () => {
        // Go to parent of current folder
        // Breadcrumbs last item is current folder. Second to last is parent.
        if (breadcrumbs.length > 0) {
            const parent = breadcrumbs[breadcrumbs.length - 1].parentId;
            setCurrentFolderId(parent || null); // undefined -> null
        } else {
            setCurrentFolderId(null);
        }
        setSelectedItems([]);
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            if (type === 'project') {
                await deleteProjectById(id);
            } else if (type === 'manual') {
                await deleteKnowledgeBaseItem(id);
            } else if (type === 'folder') {
                await deleteFolder(id);
            }
            loadData();
            getStorageEstimate();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete item');
        }
    };

    const handleExport = async (type, item) => {
        if (type === 'folder') return; // Cannot export folder yet
        if (type === 'project') {
            try {
                const blob = await generateProjectZip(item);
                saveAs(blob, `${item.projectName}.zip`);
            } catch (e) {
                console.error(e);
                alert('Export Failed: ' + e.message);
            }
        } else {
            const data = JSON.stringify(item, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            saveAs(blob, `${item.title || 'manual'}.json`);
        }
    };

    // Move logic (simple version via Dropping on Folder in view)
    const handleMoveItemToFolder = async (itemId, type, targetFolderId) => {
        if (type !== 'project') return; // Only projects support folders for now

        try {
            await updateProject(itemId, { folderId: targetFolderId }); // We need updateProject to support this partial update (it does)
            // But wait, updateProject expects project name to find it? 
            // My implementation of updateProject uses project NAME. 
            // But I have itemId. 
            // I need `updateProjectById` or get project first.
            const p = projects.find(x => x.id === itemId);
            if (p) {
                // But wait database.js `updateProject` takes NAME. 
                // Let's use `saveProject`? modify record directly?
                // I should check database.js again.
                // It has `updateProject(projectName, updates)`.
                // I can use that.
                await updateProject(p.projectName, { folderId: targetFolderId });
                loadData();
            }
        } catch (e) {
            console.error("Move failed:", e);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedItems.length} selected items?`)) return;

        for (const item of selectedItems) {
            try {
                await handleDelete(item.type, item.id);
            } catch (err) {
                console.error('Bulk delete error:', err);
            }
        }
        setSelectedItems([]);
        loadData();
        getStorageEstimate();
    };

    const handleBulkExport = async () => {
        // ... (Same as before)
        if (selectedItems.length === 0) return;

        setIsLoading(true);
        try {
            const zip = new JSZip();
            const dateStr = new Date().toISOString().split('T')[0];
            const folder = zip.folder(`Motion_Export_${dateStr}`);

            let count = 0;
            for (const item of selectedItems) {
                if (item.type === 'project') {
                    const project = projects.find(p => p.id === item.id);
                    if (project) {
                        try {
                            const projectBlob = await generateProjectZip(project);
                            folder.file(`${project.projectName}.zip`, projectBlob);
                            count++;
                        } catch (e) { console.error(e) }
                    }
                }
                // no manual export yet for bulk
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `Motion_Bulk_Export_${dateStr}.zip`);
            }
        } catch (error) {
            alert('Export failed: ' + error.message);
        } finally {
            setIsLoading(false);
            setSelectedItems([]);
        }
    };

    const toggleSelect = (type, id) => {
        const key = `${type}-${id}`;
        const exists = selectedItems.find(i => `${i.type}-${i.id}` === key);
        if (exists) {
            setSelectedItems(selectedItems.filter(i => `${i.type}-${i.id}` !== key));
        } else {
            setSelectedItems([...selectedItems, { type, id }]);
        }
    };

    // Drag & Drop Handlers for Import
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        // ... (Import logic same as before)
        // Note: Imported items go to Root (currentFolderId?)
        // Let's assume they go to root for now, or use currentFolderId if we pass it to saveProject?
        // saveProject doesn't take folderId. 
        // We will default to root.

        const files = Array.from(e.dataTransfer.files);
        const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
        if (zipFiles.length === 0) return;

        setIsLoading(true);
        for (const file of zipFiles) {
            // ... import logic
            try {
                const projectData = await importProject(file);
                // Saving...
                await saveProject(projectData.projectName, projectData.videoBlob, projectData.videoName, projectData.measurements, projectData.narration);
                // If we want to move to current folder immediately:
                if (currentFolderId) {
                    await updateProject(projectData.projectName, { folderId: currentFolderId });
                }
            } catch (e) { console.error(e); }
        }
        loadData();
        alert('Import complete');
        setIsLoading(false);
    };

    // Internal Drag to Move functionality could be added to cards, 
    // but for now let's stick to "Click to Enter" and maybe a context menu moving?
    // User asked for "System Folder".

    const filteredProjects = projects
        .filter(p => p.projectName?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.projectName || '').localeCompare(b.projectName || '');
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    const getSyncStatusIcon = (status) => {
        switch (status) {
            case 'synced': return '☁️';
            case 'pending': return '🔄';
            case 'error': return '⚠️';
            default: return '📁';
        }
    };

    const styles = {
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            position: 'relative'
        },
        dragOverlay: {
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,120,212,0.2)',
            display: isDragging ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', zIndex: 999,
            border: '4px dashed #0078d4'
        },
        header: { padding: '20px', borderBottom: '1px solid #333', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)' },
        title: { margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' },
        storageBar: { marginTop: '15px', padding: '15px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid #333' },
        progressBar: { height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' },
        progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '4px' },
        toolbar: { display: 'flex', gap: '10px', padding: '15px 20px', borderBottom: '1px solid #333', flexWrap: 'wrap', alignItems: 'center' },
        searchInput: { flex: 1, minWidth: '200px', padding: '8px 12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff' },
        tabs: { display: 'flex', gap: '5px' },
        tab: { padding: '8px 16px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#aaa', cursor: 'pointer' },
        activeTab: { backgroundColor: '#667eea', color: '#fff', borderColor: '#667eea' },
        content: { flex: 1, overflow: 'auto', padding: '20px' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
        card: { backgroundColor: '#141414', border: '1px solid #333', borderRadius: '10px', padding: '15px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
        cardSelected: { borderColor: '#667eea', backgroundColor: '#1a1a2e' },
        cardIcon: { fontSize: '2.5rem', marginBottom: '10px' },
        cardTitle: { fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        cardMeta: { fontSize: '0.75rem', color: '#888' },
        cardActions: { display: 'flex', gap: '5px', marginTop: '10px' },
        actionBtn: { padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#333', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' },
        checkbox: { position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', cursor: 'pointer' },
        emptyState: { textAlign: 'center', padding: '60px 20px', color: '#666' },
        bulkActions: { display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 20px', backgroundColor: '#1a1a2e', borderBottom: '1px solid #333' }
    };

    return (
        <div style={styles.container} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div style={styles.dragOverlay}><h3>Drop to Import</h3></div>

            <div style={styles.header}>
                <h2 style={styles.title}>📂 File Explorer</h2>
                <div style={styles.storageBar}>
                    {/* Storage Viz */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>💾 Storage Used</span>
                        <span>{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}</span>
                    </div>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${(storageInfo.used / storageInfo.quota) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div style={styles.toolbar}>
                {currentFolderId ? (
                    <button onClick={handleNavigateUp} style={styles.tab} title="Go Back">
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : null}

                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', color: '#888', padding: '0 10px', gap: '5px' }}>
                    <span style={{ cursor: 'pointer', color: currentFolderId ? '#aaa' : '#fff' }} onClick={() => setCurrentFolderId(null)}>Root</span>
                    {breadcrumbs.map(b => (
                        <span key={b.id}> &gt; <span style={{ cursor: 'pointer', color: b.id === currentFolderId ? '#fff' : '#aaa' }} onClick={() => setCurrentFolderId(b.id)}>{b.name}</span></span>
                    ))}
                </div>

                <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput} />

                <div style={styles.tabs}>
                    <button style={activeTab === 'projects' ? { ...styles.tab, ...styles.activeTab } : styles.tab} onClick={() => setActiveTab('projects')}>Projects</button>
                    <button style={activeTab === 'manuals' ? { ...styles.tab, ...styles.activeTab } : styles.tab} onClick={() => setActiveTab('manuals')}>Manuals</button>
                </div>

                <button onClick={handleCreateFolder} style={styles.tab} title="New Folder">
                    <FolderPlus size={16} /> New Folder
                </button>

                <button onClick={loadData} style={styles.tab}>🔄</button>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div style={styles.bulkActions}>
                    <span>{selectedItems.length} selected</span>
                    <button onClick={handleBulkExport} style={{ ...styles.actionBtn, backgroundColor: '#0078d4' }}>📤 Export</button>
                    <button onClick={handleBulkDelete} style={{ ...styles.actionBtn, backgroundColor: '#d13438' }}>🗑️ Delete</button>
                    <button onClick={() => setSelectedItems([])} style={styles.actionBtn}>✖ Clear</button>
                </div>
            )}

            <div style={styles.content}>
                {isLoading ? (<div style={styles.emptyState}>Loading...</div>) : (
                    activeTab === 'projects' ? (
                        <div style={styles.grid}>
                            {/* Render Folders First */}
                            {folders.map(folder => (
                                <div key={`folder-${folder.id}`} style={styles.card} onDoubleClick={() => handleNavigateFolder(folder.id)}>
                                    {/* Allow selection of folders too? */}
                                    <input type="checkbox" checked={selectedItems.some(i => i.type === 'folder' && i.id === folder.id)} onChange={(e) => { e.stopPropagation(); toggleSelect('folder', folder.id) }} style={styles.checkbox} />
                                    <div style={{ ...styles.cardIcon, color: '#FFD700' }}><Folder size={40} /></div>
                                    <div style={styles.cardTitle}>{folder.name}</div>
                                    <div style={styles.cardMeta}>Folder</div>
                                    <div style={styles.cardActions}>
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#d13438' }} onClick={(e) => { e.stopPropagation(); handleDelete('folder', folder.id) }}>🗑️</button>
                                    </div>
                                </div>
                            ))}

                            {/* Render Projects */}
                            {filteredProjects.map(project => (
                                <div key={project.id} style={{ ...styles.card, ...(selectedItems.some(i => i.type === 'project' && i.id === project.id) ? styles.cardSelected : {}) }} onClick={() => toggleSelect('project', project.id)}>
                                    <input type="checkbox" checked={selectedItems.some(i => i.type === 'project' && i.id === project.id)} onChange={(e) => { e.stopPropagation(); toggleSelect('project', project.id) }} style={styles.checkbox} />
                                    <div style={styles.cardIcon}>{getSyncStatusIcon(project.syncStatus)} 🎬</div>
                                    <div style={styles.cardTitle}>{project.projectName}</div>
                                    <div style={styles.cardMeta}>{new Date(project.createdAt).toLocaleDateString()}</div>
                                    <div style={styles.cardActions}>
                                        <button style={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleExport('project', project); }}>📤</button>
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#d13438' }} onClick={(e) => { e.stopPropagation(); handleDelete('project', project.id); }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {/* Manuals - Just flat for now as discussed */}
                            {manuals.map(manual => (
                                <div key={manual.id} style={styles.card}>
                                    <div style={styles.cardIcon}>📄</div>
                                    <div style={styles.cardTitle}>{manual.title}</div>
                                    <div style={styles.cardActions}>
                                        <button style={styles.actionBtn} onClick={() => handleExport('manual', manual)}>📤</button>
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#d13438' }} onClick={() => handleDelete('manual', manual.id)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
