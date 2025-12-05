import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Plus, Star, Eye, TrendingUp, Calendar, Tag } from 'lucide-react';
import {
    getAllKnowledgeBaseItems,
    searchKnowledgeBase,
    sortKnowledgeBase,
    getAllTags,
    incrementViewCount
} from '../utils/knowledgeBaseDB';
import KnowledgeBaseDetail from './features/KnowledgeBaseDetail';
import TemplateUpload from './features/TemplateUpload';

function KnowledgeBase() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [allTags, setAllTags] = useState([]);

    // Load items on mount
    useEffect(() => {
        loadItems();
        loadTags();
    }, []);

    const loadItems = async () => {
        const allItems = await getAllKnowledgeBaseItems();
        setItems(allItems);
        setFilteredItems(sortKnowledgeBase(allItems, sortBy));
    };

    const loadTags = async () => {
        const tags = await getAllTags();
        setAllTags(tags);
    };

    // Search and filter
    useEffect(() => {
        const performSearch = async () => {
            const results = await searchKnowledgeBase(searchQuery, {
                type: selectedType,
                category: selectedCategory,
                industry: selectedIndustry
            });
            setFilteredItems(sortKnowledgeBase(results, sortBy));
        };
        performSearch();
    }, [searchQuery, selectedType, selectedCategory, selectedIndustry, sortBy, items]);

    const handleItemClick = async (item) => {
        await incrementViewCount(item.id);
        setSelectedItem(item);
        loadItems(); // Refresh to update view count
    };

    const handleUploadComplete = () => {
        setShowUploadForm(false);
        loadItems();
        loadTags();
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'template': return '📋';
            case 'video': return '🎥';
            case 'document': return '📄';
            case 'best_practice': return '⭐';
            default: return '📚';
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={14}
                    fill={i <= rating ? '#ffd700' : 'none'}
                    stroke={i <= rating ? '#ffd700' : '#666'}
                />
            );
        }
        return stars;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>
                        📚 Knowledge Base & Best Practices
                    </h1>
                    <button
                        onClick={() => setShowUploadForm(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#00d2ff',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#000',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Plus size={18} /> Add New Item
                    </button>
                </div>

                {/* Search and Controls */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search Bar */}
                    <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Search templates, videos, best practices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: showFilters ? '#00d2ff' : '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: showFilters ? '#000' : '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Filter size={18} /> Filters
                    </button>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '10px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="mostUsed">Most Used</option>
                        <option value="highestRated">Highest Rated</option>
                        <option value="title">Title (A-Z)</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '10px',
                                backgroundColor: viewMode === 'grid' ? '#00d2ff' : '#2a2a2a',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: viewMode === 'grid' ? '#000' : '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '10px',
                                backgroundColor: viewMode === 'list' ? '#00d2ff' : '#2a2a2a',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: viewMode === 'list' ? '#000' : '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '6px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Type</label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: '#fff'
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="template">Templates</option>
                                <option value="video">Videos</option>
                                <option value="document">Documents</option>
                                <option value="best_practice">Best Practices</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: '#fff'
                                }}
                            >
                                <option value="">All Categories</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Assembly">Assembly</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Quality Control">Quality Control</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Industry</label>
                            <select
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: '#fff'
                                }}
                            >
                                <option value="">All Industries</option>
                                <option value="Automotive">Automotive</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Pharmaceutical">Pharmaceutical</option>
                                <option value="Textile">Textile</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No items found</p>
                        <p>Try adjusting your search or filters, or add a new item to get started.</p>
                    </div>
                ) : (
                    <div style={{
                        display: viewMode === 'grid' ? 'grid' : 'flex',
                        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
                        flexDirection: viewMode === 'list' ? 'column' : undefined,
                        gap: '20px'
                    }}>
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: viewMode === 'list' ? 'row' : 'column',
                                    gap: '15px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#00d2ff';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#444';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Icon/Thumbnail */}
                                <div style={{
                                    fontSize: '3rem',
                                    textAlign: 'center',
                                    width: viewMode === 'list' ? '80px' : '100%',
                                    flexShrink: 0
                                }}>
                                    {getTypeIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.1rem' }}>{item.title}</h3>
                                    <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        {item.description?.substring(0, 100)}{item.description?.length > 100 ? '...' : ''}
                                    </p>

                                    {/* Tags */}
                                    {item.tags && item.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                            {item.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        padding: '3px 8px',
                                                        backgroundColor: '#1a1a1a',
                                                        border: '1px solid #555',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        color: '#00d2ff'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#888' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {renderStars(Math.round(item.averageRating || 0))}
                                            <span>({item.ratingCount || 0})</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <TrendingUp size={14} />
                                            <span>{item.usageCount || 0} uses</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Eye size={14} />
                                            <span>{item.viewCount || 0} views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <KnowledgeBaseDetail
                    item={selectedItem}
                    onClose={() => {
                        setSelectedItem(null);
                        loadItems();
                    }}
                />
            )}

            {/* Upload Form Modal */}
            {showUploadForm && (
                <TemplateUpload
                    onClose={() => setShowUploadForm(false)}
                    onComplete={handleUploadComplete}
                />
            )}
        </div>
    );
}

export default KnowledgeBase;
