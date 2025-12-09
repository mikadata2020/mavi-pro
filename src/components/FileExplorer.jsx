import React, { useState, useEffect } from 'react';
import { getAllProjects, deleteProjectById, getProjectById } from '../utils/database';
import { getAllKnowledgeBaseItems, deleteKnowledgeBaseItem } from '../utils/knowledgeBaseDB';

const FileExplorer = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [manuals, setManuals] = useState([]);
    const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0 });
    const [selectedItems, setSelectedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    useEffect(() => {
        loadData();
        getStorageEstimate();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [projectsData, manualsData] = await Promise.all([
                getAllProjects(),
                getAllKnowledgeBaseItems()
            ]);
            setProjects(projectsData || []);
            setManuals(manualsData || []);
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

    const handleDelete = async (type, id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            if (type === 'project') {
                await deleteProjectById(id);
            } else if (type === 'manual') {
                await deleteKnowledgeBaseItem(id);
            }
            loadData();
            getStorageEstimate();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete item');
        }
    };

    const handleExport = async (type, item) => {
        const data = JSON.stringify(item, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.projectName || item.title || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedItems.length} selected items?`)) return;

        for (const item of selectedItems) {
            try {
                if (item.type === 'project') {
                    await deleteProjectById(item.id);
                } else {
                    await deleteKnowledgeBaseItem(item.id);
                }
            } catch (err) {
                console.error('Bulk delete error:', err);
            }
        }
        setSelectedItems([]);
        loadData();
        getStorageEstimate();
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

    const filteredProjects = projects
        .filter(p => p.projectName?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.projectName || '').localeCompare(b.projectName || '');
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    const filteredManuals = manuals
        .filter(m => m.title?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
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
            color: '#fff'
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #333',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)'
        },
        title: {
            margin: 0,
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        storageBar: {
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#141414',
            borderRadius: '8px',
            border: '1px solid #333'
        },
        progressBar: {
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '8px'
        },
        progressFill: {
            height: '100%',
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
        },
        toolbar: {
            display: 'flex',
            gap: '10px',
            padding: '15px 20px',
            borderBottom: '1px solid #333',
            flexWrap: 'wrap',
            alignItems: 'center'
        },
        searchInput: {
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.9rem'
        },
        tabs: {
            display: 'flex',
            gap: '5px'
        },
        tab: {
            padding: '8px 16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#aaa',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        activeTab: {
            backgroundColor: '#667eea',
            color: '#fff',
            borderColor: '#667eea'
        },
        content: {
            flex: 1,
            overflow: 'auto',
            padding: '20px'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px'
        },
        card: {
            backgroundColor: '#141414',
            border: '1px solid #333',
            borderRadius: '10px',
            padding: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
        },
        cardSelected: {
            borderColor: '#667eea',
            backgroundColor: '#1a1a2e'
        },
        cardIcon: {
            fontSize: '2.5rem',
            marginBottom: '10px'
        },
        cardTitle: {
            fontSize: '0.9rem',
            fontWeight: 'bold',
            marginBottom: '5px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        cardMeta: {
            fontSize: '0.75rem',
            color: '#888'
        },
        cardActions: {
            display: 'flex',
            gap: '5px',
            marginTop: '10px'
        },
        actionBtn: {
            padding: '4px 8px',
            fontSize: '0.75rem',
            backgroundColor: '#333',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer'
        },
        checkbox: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '18px',
            height: '18px',
            cursor: 'pointer'
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
        },
        bulkActions: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#1a1a2e',
            borderBottom: '1px solid #333'
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>
                    📂 File Explorer
                    <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>
                        Local Storage Manager
                    </span>
                </h2>

                {/* Storage Info */}
                <div style={styles.storageBar}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>💾 Storage Used</span>
                        <span>{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}</span>
                    </div>
                    <div style={styles.progressBar}>
                        <div
                            style={{
                                ...styles.progressFill,
                                width: `${(storageInfo.used / storageInfo.quota) * 100}%`
                            }}
                        />
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#888' }}>
                        <span>📁 {projects.length} Projects</span>
                        <span>📄 {manuals.length} Manuals</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <input
                    type="text"
                    placeholder="🔍 Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />

                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'projects' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('projects')}
                    >
                        📁 Projects ({projects.length})
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'manuals' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('manuals')}
                    >
                        📄 Manuals ({manuals.length})
                    </button>
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ ...styles.searchInput, flex: 'none', width: '120px' }}
                >
                    <option value="date">📅 Date</option>
                    <option value="name">🔤 Name</option>
                </select>

                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    style={{ ...styles.tab, padding: '8px 12px' }}
                >
                    {viewMode === 'grid' ? '📋' : '📊'}
                </button>

                <button
                    onClick={loadData}
                    style={{ ...styles.tab, padding: '8px 12px' }}
                    title="Refresh"
                >
                    🔄
                </button>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div style={styles.bulkActions}>
                    <span>{selectedItems.length} selected</span>
                    <button
                        onClick={handleBulkDelete}
                        style={{ ...styles.actionBtn, backgroundColor: '#d13438' }}
                    >
                        🗑️ Delete Selected
                    </button>
                    <button
                        onClick={() => setSelectedItems([])}
                        style={styles.actionBtn}
                    >
                        ✖ Clear Selection
                    </button>
                </div>
            )}

            {/* Content */}
            <div style={styles.content}>
                {isLoading ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
                        Loading...
                    </div>
                ) : activeTab === 'projects' ? (
                    filteredProjects.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📁</div>
                            <p>No projects found</p>
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {filteredProjects.map(project => {
                                const isSelected = selectedItems.find(i => i.type === 'project' && i.id === project.id);
                                return (
                                    <div
                                        key={project.id}
                                        style={{ ...styles.card, ...(isSelected ? styles.cardSelected : {}) }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!isSelected}
                                            onChange={() => toggleSelect('project', project.id)}
                                            style={styles.checkbox}
                                        />
                                        <div style={styles.cardIcon}>
                                            {getSyncStatusIcon(project.syncStatus)} 🎬
                                        </div>
                                        <div style={styles.cardTitle}>{project.projectName}</div>
                                        <div style={styles.cardMeta}>
                                            {project.videoName || 'No video'}
                                        </div>
                                        <div style={styles.cardMeta}>
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={styles.cardActions}>
                                            <button
                                                style={styles.actionBtn}
                                                onClick={() => handleExport('project', project)}
                                            >
                                                📤 Export
                                            </button>
                                            <button
                                                style={{ ...styles.actionBtn, backgroundColor: '#d13438' }}
                                                onClick={() => handleDelete('project', project.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    filteredManuals.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📄</div>
                            <p>No manuals found</p>
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {filteredManuals.map(manual => {
                                const isSelected = selectedItems.find(i => i.type === 'manual' && i.id === manual.id);
                                return (
                                    <div
                                        key={manual.id}
                                        style={{ ...styles.card, ...(isSelected ? styles.cardSelected : {}) }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!isSelected}
                                            onChange={() => toggleSelect('manual', manual.id)}
                                            style={styles.checkbox}
                                        />
                                        <div style={styles.cardIcon}>
                                            {getSyncStatusIcon(manual.syncStatus)} 📋
                                        </div>
                                        <div style={styles.cardTitle}>{manual.title}</div>
                                        <div style={styles.cardMeta}>
                                            {manual.category || 'Uncategorized'}
                                        </div>
                                        <div style={styles.cardMeta}>
                                            {new Date(manual.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={styles.cardActions}>
                                            <button
                                                style={styles.actionBtn}
                                                onClick={() => handleExport('manual', manual)}
                                            >
                                                📤 Export
                                            </button>
                                            <button
                                                style={{ ...styles.actionBtn, backgroundColor: '#d13438' }}
                                                onClick={() => handleDelete('manual', manual.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
