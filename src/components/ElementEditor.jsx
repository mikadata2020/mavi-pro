import React, { useState } from 'react';
import { saveMeasurementSession } from '../utils/database';
import { exportToExcel } from '../utils/excelExport';

function ElementEditor({ measurements = [], videoName = 'Untitled', onUpdateMeasurements }) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [sortBy, setSortBy] = useState('order');

    const categories = ['Value-added', 'Non value-added', 'Waste'];

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Value-added': return '#005a9e';
            case 'Non value-added': return '#bfa900';
            case 'Waste': return '#c50f1f';
            default: return 'transparent';
        }
    };

    const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0);
    const valueAddedTime = measurements.filter(m => m.category === 'Value-added').reduce((sum, m) => sum + m.duration, 0);
    const nonValueAddedTime = measurements.filter(m => m.category === 'Non value-added').reduce((sum, m) => sum + m.duration, 0);
    const wasteTime = measurements.filter(m => m.category === 'Waste').reduce((sum, m) => sum + m.duration, 0);

    const handleSave = async () => {
        if (measurements.length === 0) {
            alert('Tidak ada data untuk disimpan!');
            return;
        }
        setIsSaving(true);
        setSaveMessage('');
        try {
            await saveMeasurementSession(videoName, measurements);
            setSaveMessage('✓ Data berhasil disimpan!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Error saving to database:', error);
            setSaveMessage('✗ Gagal menyimpan data');
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = () => {
        exportToExcel(measurements, videoName);
    };

    const handleDelete = (id) => {
        if (confirm('Hapus element ini?')) {
            onUpdateMeasurements(measurements.filter(m => m.id !== id));
        }
    };

    const handleStartEdit = (element) => {
        setEditingId(element.id);
        setEditName(element.elementName);
        setEditCategory(element.category);
    };

    const handleSaveEdit = () => {
        onUpdateMeasurements(measurements.map(m => m.id === editingId ? { ...m, elementName: editName, category: editCategory } : m));
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditCategory('');
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const updated = [...measurements];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        onUpdateMeasurements(updated);
    };

    const handleMoveDown = (index) => {
        if (index === measurements.length - 1) return;
        const updated = [...measurements];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        onUpdateMeasurements(updated);
    };

    const handleRatingChange = (id, rating) => {
        onUpdateMeasurements(measurements.map(m => m.id === id ? { ...m, rating } : m));
    };

    const getFilteredAndSortedMeasurements = () => {
        let filtered = [...measurements];
        if (searchQuery) {
            filtered = filtered.filter(m => m.elementName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (filterCategory !== 'all') {
            filtered = filtered.filter(m => m.category === filterCategory);
        }
        if (filterRating !== 'all') {
            const rating = parseInt(filterRating);
            filtered = filtered.filter(m => (m.rating || 0) >= rating);
        }
        switch (sortBy) {
            case 'duration':
                filtered.sort((a, b) => b.duration - a.duration);
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
                filtered.sort((a, b) => a.elementName.localeCompare(b.elementName));
                break;
            default:
                break;
        }
        return filtered;
    };

    const filteredMeasurements = getFilteredAndSortedMeasurements();

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '10px' }}>
            {/* Filter Row with Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '6px', alignItems: 'center' }}>
                <button onClick={handleSave} disabled={isSaving || measurements.length === 0} style={{ padding: '8px 12px', fontSize: '1.2rem', backgroundColor: measurements.length > 0 ? 'var(--accent-blue)' : '#555', cursor: measurements.length > 0 ? 'pointer' : 'not-allowed', border: 'none', borderRadius: '4px', color: 'white' }} title="Simpan ke Database">
                    {isSaving ? '⏳' : '💾'}
                </button>
                <button onClick={handleExport} disabled={measurements.length === 0} style={{ padding: '8px 12px', fontSize: '1.2rem', backgroundColor: measurements.length > 0 ? '#0a0' : '#555', cursor: measurements.length > 0 ? 'pointer' : 'not-allowed', border: 'none', borderRadius: '4px', color: 'white' }} title="Export ke Excel">
                    📊
                </button>
                <input type="text" placeholder="🔍 Cari elemen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }} />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="all">Semua Kategori</option>
                    <option value="Value-added">Value-added</option>
                    <option value="Non value-added">Non value-added</option>
                    <option value="Waste">Waste</option>
                </select>
                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="all">Semua Rating</option>
                    <option value="5">⭐⭐⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐+</option>
                    <option value="3">⭐⭐⭐+</option>
                    <option value="2">⭐⭐+</option>
                    <option value="1">⭐+</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="order">Urutan Asli</option>
                    <option value="duration">Durasi (Terbesar)</option>
                    <option value="rating">Rating (Tertinggi)</option>
                    <option value="name">Nama (A-Z)</option>
                </select>
            </div>

            {saveMessage && (
                <div style={{ fontSize: '0.85rem', color: saveMessage.includes('✓') ? '#0f0' : '#f00', marginBottom: '8px', padding: '4px 8px', backgroundColor: '#2a2a2a', borderRadius: '4px', textAlign: 'center' }}>
                    {saveMessage}
                </div>
            )}

            {(searchQuery || filterCategory !== 'all' || filterRating !== 'all') && (
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px', padding: '4px 8px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                    Menampilkan {filteredMeasurements.length} dari {measurements.length} elemen
                </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#333', zIndex: 1 }}>
                        <tr>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '40px' }}>No.</th>
                            <th style={{ padding: '8px', border: '1px solid #444' }}>Nama Elemen</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '150px' }}>Kategori</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '120px' }}>Rating</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '70px' }}>Start (s)</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '70px' }}>Finish (s)</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '80px' }}>Waktu (s)</th>
                            <th style={{ padding: '8px', border: '1px solid #444', width: '180px' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMeasurements.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    {measurements.length === 0 ? 'Belum ada elemen. Mulai pengukuran untuk menambahkan elemen.' : 'Tidak ada elemen yang sesuai dengan filter.'}
                                </td>
                            </tr>
                        ) : (
                            filteredMeasurements.map((el) => {
                                const originalIndex = measurements.findIndex(m => m.id === el.id);
                                return (
                                    <tr key={el.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'center' }}>{originalIndex + 1}</td>
                                        <td style={{ padding: '6px', border: '1px solid #444' }}>
                                            {editingId === el.id ? (
                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem' }} />
                                            ) : el.elementName}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #444' }}>
                                            {editingId === el.id ? (
                                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem' }}>
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{ display: 'inline-block', padding: '3px 8px', backgroundColor: getCategoryColor(el.category), borderRadius: '3px', fontSize: '0.8rem' }}>{el.category}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'center' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} onClick={() => handleRatingChange(el.id, star)} style={{ cursor: 'pointer', color: (el.rating || 0) >= star ? '#ffa500' : '#444', fontSize: '1.1rem', marginRight: '2px' }} title={`Rating ${star}`}>★</span>
                                            ))}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'right', fontSize: '0.8rem', color: '#aaa' }}>{el.startTime.toFixed(2)}</td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'right', fontSize: '0.8rem', color: '#aaa' }}>{el.endTime.toFixed(2)}</td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'right' }}>{el.duration.toFixed(2)}</td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'center' }}>
                                            {editingId === el.id ? (
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                    <button onClick={handleSaveEdit} style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#0a0', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Simpan">✓</button>
                                                    <button onClick={handleCancelEdit} style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#a00', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Batal">✗</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <button onClick={() => handleMoveUp(originalIndex)} disabled={originalIndex === 0} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: originalIndex === 0 ? '#333' : '#555', border: 'none', color: 'white', cursor: originalIndex === 0 ? 'not-allowed' : 'pointer', borderRadius: '3px' }} title="Pindah ke atas">▲</button>
                                                    <button onClick={() => handleMoveDown(originalIndex)} disabled={originalIndex === measurements.length - 1} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: originalIndex === measurements.length - 1 ? '#333' : '#555', border: 'none', color: 'white', cursor: originalIndex === measurements.length - 1 ? 'not-allowed' : 'pointer', borderRadius: '3px' }} title="Pindah ke bawah">▼</button>
                                                    <button onClick={() => handleStartEdit(el)} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#05a', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Edit">✎</button>
                                                    <button onClick={() => handleDelete(el.id)} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#a00', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Hapus">🗑</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {measurements.length > 0 && (
                            <>
                                <tr style={{ backgroundColor: '#222', fontWeight: 'bold' }}>
                                    <td colSpan="6" style={{ padding: '8px', border: '1px solid #444' }}>Total</td>
                                    <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'right' }}>{totalTime.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #444' }}></td>
                                </tr>
                                <tr style={{ backgroundColor: '#1a1a1a', fontSize: '0.8rem' }}>
                                    <td colSpan="8" style={{ padding: '10px', border: '1px solid #444' }}>
                                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                                            <div><span style={{ color: '#005a9e' }}>■</span> Value-added: {valueAddedTime.toFixed(2)}s {totalTime > 0 && `(${((valueAddedTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                            <div><span style={{ color: '#bfa900' }}>■</span> Non value-added: {nonValueAddedTime.toFixed(2)}s {totalTime > 0 && `(${((nonValueAddedTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                            <div><span style={{ color: '#c50f1f' }}>■</span> Waste: {wasteTime.toFixed(2)}s {totalTime > 0 && `(${((wasteTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                        </div>
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ElementEditor;
