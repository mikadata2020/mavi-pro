import React, { useState } from 'react';
import { saveMeasurementSession } from '../utils/database';
import { exportToExcel } from '../utils/excelExport';
import NarrationRecorder from './NarrationRecorder';
import { THERBLIGS } from '../constants/therbligs.jsx';

function ElementEditor({ measurements = [], videoName = 'Untitled', onUpdateMeasurements, narration = null, onNarrationChange }) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editTherblig, setEditTherblig] = useState('');
    const [editCycle, setEditCycle] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTherblig, setFilterTherblig] = useState('all');
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

    const renderTherbligIcon = (code) => {
        const therblig = THERBLIGS[code];
        if (!therblig) return null;
        return (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                {therblig.icon}
            </svg>
        );
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

        const sessionName = prompt('Masukkan nama untuk sesi ini:', videoName || `Session ${new Date().toLocaleString()}`);
        if (!sessionName) return;

        setIsSaving(true);
        setSaveMessage('');
        try {
            await saveMeasurementSession(sessionName, measurements, narration);
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

    const [editStartTime, setEditStartTime] = useState(0);
    const [editEndTime, setEditEndTime] = useState(0);

    const handleStartEdit = (element) => {
        setEditingId(element.id);
        setEditName(element.elementName);
        setEditCategory(element.category);
        setEditTherblig(element.therblig || '');
        setEditCycle(element.cycle || 1);
        setEditStartTime(element.startTime);
        setEditEndTime(element.endTime);
    };

    const handleSaveEdit = () => {
        const startTime = parseFloat(editStartTime);
        const endTime = parseFloat(editEndTime);

        if (isNaN(startTime) || isNaN(endTime) || startTime < 0 || endTime < 0) {
            alert('Waktu Start dan Finish harus berupa angka positif.');
            return;
        }

        if (startTime >= endTime) {
            alert('Waktu Start harus lebih kecil dari waktu Finish.');
            return;
        }

        onUpdateMeasurements(measurements.map(m => m.id === editingId ? {
            ...m,
            elementName: editName,
            category: editCategory,
            therblig: editTherblig,
            cycle: parseInt(editCycle) || 1,
            startTime: startTime,
            endTime: endTime,
            duration: endTime - startTime
        } : m));
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditCategory('');
        setEditTherblig('');
        setEditCycle(1);
        setEditStartTime(0);
        setEditEndTime(0);
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

    const handleSplit = (element) => {
        const splitTimeStr = prompt(`Masukkan waktu split (antara ${element.startTime.toFixed(2)}s - ${element.endTime.toFixed(2)}s):`, ((element.startTime + element.endTime) / 2).toFixed(2));
        if (splitTimeStr === null) return;

        const splitTime = parseFloat(splitTimeStr);
        if (isNaN(splitTime) || splitTime <= element.startTime || splitTime >= element.endTime) {
            alert('Waktu split tidak valid! Harus berada di antara waktu mulai dan selesai elemen.');
            return;
        }

        const firstPart = {
            ...element,
            id: Date.now().toString(),
            endTime: splitTime,
            duration: splitTime - element.startTime,
            elementName: `${element.elementName} (Part 1)`
        };

        const secondPart = {
            ...element,
            id: (Date.now() + 1).toString(),
            startTime: splitTime,
            duration: element.endTime - splitTime,
            elementName: `${element.elementName} (Part 2)`
        };

        const index = measurements.findIndex(m => m.id === element.id);
        const updated = [...measurements];
        updated.splice(index, 1, firstPart, secondPart);
        onUpdateMeasurements(updated);
    };

    const getFilteredAndSortedMeasurements = () => {
        let filtered = [...measurements];
        if (searchQuery) {
            filtered = filtered.filter(m => m.elementName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (filterCategory !== 'all') {
            filtered = filtered.filter(m => m.category === filterCategory);
        }
        if (filterTherblig !== 'all') {
            filtered = filtered.filter(m => m.therblig === filterTherblig);
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
            case 'cycle':
                filtered.sort((a, b) => (a.cycle || 1) - (b.cycle || 1));
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
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto 2fr 1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '6px', padding: '3px 6px', backgroundColor: '#2a2a2a', borderRadius: '4px', alignItems: 'center' }}>
                <button onClick={handleSave} disabled={isSaving || measurements.length === 0} style={{ padding: '3px 8px', fontSize: '0.9rem', backgroundColor: measurements.length > 0 ? 'var(--accent-blue)' : '#555', cursor: measurements.length > 0 ? 'pointer' : 'not-allowed', border: 'none', borderRadius: '3px', color: 'white' }} title="Simpan ke Database">
                    {isSaving ? '⌛' : '💾'}
                </button>
                <button onClick={handleExport} disabled={measurements.length === 0} style={{ padding: '3px 8px', fontSize: '0.9rem', backgroundColor: measurements.length > 0 ? '#217346' : '#555', cursor: measurements.length > 0 ? 'pointer' : 'not-allowed', border: 'none', borderRadius: '3px', color: 'white' }} title="Export ke Excel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}>
                        <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-8h8v2H8v-2zm0 4h8v2H8v-2zm0-8h5v2H8V8z" />
                        <text x="12" y="15" fontSize="10" fontWeight="bold" textAnchor="middle" fill="white">X</text>
                    </svg>
                </button>
                <NarrationRecorder
                    sessionId={null}
                    existingNarration={narration}
                    onNarrationSaved={onNarrationChange}
                />
                <input type="text" placeholder="🔍 Cari elemen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '3px 8px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', color: '#fff', fontSize: '0.8rem' }} />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '3px 6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', color: '#fff', fontSize: '0.75rem' }}>
                    <option value="all">Semua Kategori</option>
                    <option value="Value-added">Value-added</option>
                    <option value="Non value-added">Non value-added</option>
                    <option value="Waste">Waste</option>
                </select>
                <select value={filterTherblig} onChange={(e) => setFilterTherblig(e.target.value)} style={{ padding: '3px 6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', color: '#fff', fontSize: '0.75rem' }}>
                    <option value="all">Semua Therblig</option>
                    {Object.entries(THERBLIGS).map(([code, { name }]) => (
                        <option key={code} value={code}>{code} - {name}</option>
                    ))}
                </select>
                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: '3px 6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', color: '#fff', fontSize: '0.75rem' }}>
                    <option value="all">Semua Rating</option>
                    <option value="5">⭐⭐⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐+</option>
                    <option value="3">⭐⭐⭐+</option>
                    <option value="2">⭐⭐+</option>
                    <option value="1">⭐+</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '3px 6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', color: '#fff', fontSize: '0.75rem' }}>
                    <option value="order">Urutan Asli</option>
                    <option value="cycle">Cycle</option>
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

            {(searchQuery || filterCategory !== 'all' || filterTherblig !== 'all' || filterRating !== 'all') && (
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px', padding: '4px 8px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                    Menampilkan {filteredMeasurements.length} dari {measurements.length} elemen
                </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#333', zIndex: 1 }}>
                        <tr>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '40px', fontSize: '0.7rem' }}>No.</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '60px', fontSize: '0.7rem' }}>Cycle</th>
                            <th style={{ padding: '4px', border: '1px solid #444', fontSize: '0.7rem' }}>Proses</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '150px', fontSize: '0.7rem' }}>Kategori</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '120px', fontSize: '0.7rem' }}>Therblig</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '120px', fontSize: '0.7rem' }}>Rating</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '70px', fontSize: '0.7rem' }}>Start (s)</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '70px', fontSize: '0.7rem' }}>Finish (s)</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '80px', fontSize: '0.7rem' }}>Waktu (s)</th>
                            <th style={{ padding: '4px', border: '1px solid #444', width: '180px', fontSize: '0.7rem' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMeasurements.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    {measurements.length === 0 ? 'Belum ada elemen. Mulai pengukuran untuk menambahkan elemen.' : 'Tidak ada elemen yang sesuai dengan filter.'}
                                </td>
                            </tr>
                        ) : (
                            filteredMeasurements.map((el) => {
                                const originalIndex = measurements.findIndex(m => m.id === el.id);
                                return (
                                    <tr key={el.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'center' }}>{originalIndex + 1}</td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', textAlign: 'center', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <input
                                                    type="number"
                                                    value={editCycle}
                                                    onChange={(e) => setEditCycle(e.target.value)}
                                                    min="1"
                                                    style={{ width: '60px', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem', textAlign: 'center' }}
                                                />
                                            ) : (
                                                <span style={{ backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', border: '1px solid #555' }}>
                                                    {el.cycle || 1}
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem' }} />
                                            ) : el.elementName}
                                        </td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem' }}>
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{ display: 'inline-block', padding: '3px 8px', backgroundColor: getCategoryColor(el.category), borderRadius: '3px', fontSize: '0.8rem' }}>{el.category}</span>
                                            )}
                                        </td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <select value={editTherblig} onChange={(e) => setEditTherblig(e.target.value)} style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem' }}>
                                                    <option value="">-- Pilih --</option>
                                                    {Object.entries(THERBLIGS).map(([code, { name }]) => (
                                                        <option key={code} value={code}>{code} - {name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                el.therblig && THERBLIGS[el.therblig] ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: THERBLIGS[el.therblig].color + '40', border: `1px solid ${THERBLIGS[el.therblig].color}`, borderRadius: '3px', fontSize: '0.8rem', color: '#fff' }}>
                                                        {renderTherbligIcon(el.therblig)}
                                                        <span>{el.therblig}</span>
                                                    </span>
                                                ) : '-'
                                            )}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'center' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} onClick={() => handleRatingChange(el.id, star)} style={{ cursor: 'pointer', color: (el.rating || 0) >= star ? '#ffa500' : '#444', fontSize: '1.1rem', marginRight: '2px' }} title={`Rating ${star}`}>★</span>
                                            ))}
                                        </td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', textAlign: 'right', fontSize: '0.8rem', color: '#aaa', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editStartTime}
                                                    onChange={(e) => setEditStartTime(e.target.value)}
                                                    style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem', textAlign: 'right' }}
                                                />
                                            ) : el.startTime.toFixed(2)}
                                        </td>
                                        <td
                                            onClick={() => editingId !== el.id && handleStartEdit(el)}
                                            style={{ padding: '6px', border: '1px solid #444', textAlign: 'right', fontSize: '0.8rem', color: '#aaa', cursor: editingId !== el.id ? 'pointer' : 'default' }}
                                        >
                                            {editingId === el.id ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editEndTime}
                                                    onChange={(e) => setEditEndTime(e.target.value)}
                                                    style={{ width: '100%', padding: '4px', backgroundColor: '#222', border: '1px solid #555', color: 'white', fontSize: '0.85rem', textAlign: 'right' }}
                                                />
                                            ) : el.endTime.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #444', textAlign: 'right' }}>
                                            {editingId === el.id ? (
                                                (parseFloat(editEndTime) - parseFloat(editStartTime)).toFixed(2)
                                            ) : el.duration.toFixed(2)}
                                        </td>
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
                                                    <button onClick={() => handleSplit(el)} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#d97706', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Split Element">✂️</button>
                                                    <button onClick={() => handleStartEdit(el)} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#05a', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Edit">✎</button>
                                                    <button onClick={() => handleDelete(el.id)} style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#a00', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }} title="Hapus">🗑</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {
                            measurements.length > 0 && (
                                <>
                                    <tr style={{ backgroundColor: '#222', fontWeight: 'bold' }}>
                                        <td colSpan="7" style={{ padding: '8px', border: '1px solid #444' }}>Total</td>
                                        <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'right' }}>{totalTime.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #444' }}></td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#1a1a1a', fontSize: '0.8rem' }}>
                                        <td colSpan="9" style={{ padding: '10px', border: '1px solid #444' }}>
                                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                                                <div><span style={{ color: '#005a9e' }}>■</span> Value-added: {valueAddedTime.toFixed(2)}s {totalTime > 0 && `(${((valueAddedTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                                <div><span style={{ color: '#bfa900' }}>■</span> Non value-added: {nonValueAddedTime.toFixed(2)}s {totalTime > 0 && `(${((nonValueAddedTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                                <div><span style={{ color: '#c50f1f' }}>■</span> Waste: {wasteTime.toFixed(2)}s {totalTime > 0 && `(${((wasteTime / totalTime) * 100).toFixed(1)}%)`}</div>
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )
                        }
                    </tbody >
                </table >
            </div >
        </div >
    );
}

export default ElementEditor;
