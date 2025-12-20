import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Layout, User, Package, Truck, Info, CheckCircle2 } from 'lucide-react';
import { VSMSymbols } from './vsm-constants';

const VSMWizard = ({ isOpen, onClose, onGenerate, currentLanguage }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        customer: { name: 'Customer', demand: 1000, shifts: 2, hoursPerShift: 8, packSize: 24 },
        processes: [
            { id: 1, name: 'Process 1', ct: 30, co: 45, workers: 1, performance: 90, buffer: 'inventory', bufferQty: 500, isParallel: false, flowType: 'push' }
        ],
        supplier: { name: 'Supplier', frequency: 1, transportMode: VSMSymbols.TRUCK },
        logistics: { milkRunFrequency: 4, truckCapacity: 500 },
        infoFlow: 'electronic' // 'manual' or 'electronic'
    });

    if (!isOpen) return null;

    const updateCustomer = (field, value) => {
        setData(prev => ({ ...prev, customer: { ...prev.customer, [field]: value } }));
    };

    const addProcess = () => {
        const newId = data.processes.length + 1;
        setData(prev => ({
            ...prev,
            processes: [...prev.processes, { id: newId, name: `Process ${newId}`, ct: 30, co: 45, workers: 1, performance: 90, buffer: 'inventory', bufferQty: 100, isParallel: false, flowType: 'push' }]
        }));
    };

    const updateProcess = (id, field, value) => {
        setData(prev => ({
            ...prev,
            processes: prev.processes.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const removeProcess = (id) => {
        setData(prev => ({
            ...prev,
            processes: prev.processes.filter(p => p.id !== id)
        }));
    };

    const totalSteps = 4;

    const handleGenerate = () => {
        onGenerate(data);
        onClose();
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}><User size={20} /> {currentLanguage === 'id' ? 'Pelanggan & Permintaan' : 'Customer & Demand'}</h3>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Nama Pelanggan' : 'Customer Name'}</label>
                            <input style={inputStyle} value={data.customer.name} onChange={e => updateCustomer('name', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Permintaan / Hari' : 'Demand / Day'}</label>
                                <input type="number" style={inputStyle} value={data.customer.demand} onChange={e => updateCustomer('demand', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Jumlah Shift' : 'Shifts'}</label>
                                <input type="number" style={inputStyle} value={data.customer.shifts} onChange={e => updateCustomer('shifts', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Jam / Shift' : 'Hours / Shift'}</label>
                                <input type="number" style={inputStyle} value={data.customer.hoursPerShift} onChange={e => updateCustomer('hoursPerShift', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Ukuran Pack (Pitch)' : 'Pack Size (Pitch)'}</label>
                                <input type="number" style={inputStyle} value={data.customer.packSize} onChange={e => updateCustomer('packSize', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}><Layout size={20} /> {currentLanguage === 'id' ? 'Proses Produksi' : 'Manufacturing Processes'}</h3>
                        <div style={{ padding: '5px' }}>
                            {data.processes.map((proc, idx) => (
                                <div key={proc.id} style={processCardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <input style={{ ...inputStyle, fontWeight: 'bold', width: '70%', background: 'none', borderBottom: '1px solid #555' }} value={proc.name} onChange={e => updateProcess(proc.id, 'name', e.target.value)} />
                                        <button onClick={() => removeProcess(proc.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>CT (s)</label>
                                            <input type="number" style={inputStyle} value={proc.ct} onChange={e => updateProcess(proc.id, 'ct', parseInt(e.target.value))} />
                                        </div>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>CO (m)</label>
                                            <input type="number" style={inputStyle} value={proc.co} onChange={e => updateProcess(proc.id, 'co', parseInt(e.target.value))} />
                                        </div>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>Op</label>
                                            <input type="number" style={inputStyle} value={proc.workers} onChange={e => updateProcess(proc.id, 'workers', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ ...labelStyle, marginBottom: 0 }}>Buffer:</label>
                                            <select style={{ ...inputStyle, padding: '5px' }} value={proc.buffer} onChange={e => updateProcess(proc.id, 'buffer', e.target.value)}>
                                                <option value="inventory">Inventory</option>
                                                <option value="supermarket">Supermarket</option>
                                                <option value="fifo">FIFO</option>
                                                <option value="none">None</option>
                                            </select>
                                            {proc.buffer !== 'none' && (
                                                <input type="number" style={{ ...inputStyle, width: '60px', padding: '5px' }} value={proc.bufferQty} onChange={e => updateProcess(proc.id, 'bufferQty', parseInt(e.target.value))} placeholder="Qty" />
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <label style={{ ...labelStyle, marginBottom: 0 }}>Flow:</label>
                                            <select style={{ ...inputStyle, padding: '5px' }} value={proc.flowType} onChange={e => updateProcess(proc.id, 'flowType', e.target.value)}>
                                                <option value="push">Push (Arrow)</option>
                                                <option value="pull">Pull (Kanban)</option>
                                            </select>
                                        </div>

                                        {idx > 0 && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                <input type="checkbox" checked={proc.isParallel} onChange={e => updateProcess(proc.id, 'isParallel', e.target.checked)} />
                                                Parallel to Prev
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button onClick={addProcess} style={addBtnStyle}><Plus size={16} /> {currentLanguage === 'id' ? 'Tambah Proses' : 'Add Process'}</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}><Truck size={20} /> {currentLanguage === 'id' ? 'Pemasok & Logistik' : 'Supplier & Logistics'}</h3>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Nama Pemasok' : 'Supplier Name'}</label>
                            <input style={inputStyle} value={data.supplier.name} onChange={e => setData(prev => ({ ...prev, supplier: { ...prev.supplier, name: e.target.value } }))} />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Mode Transportasi' : 'Transport Mode'}</label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                {[
                                    { id: VSMSymbols.TRUCK, label: 'Truck', icon: '🚚' },
                                    { id: VSMSymbols.SEA, label: 'Sea', icon: '🚢' },
                                    { id: VSMSymbols.AIR, label: 'Air', icon: '✈️' }
                                ].map(mode => (
                                    <div
                                        key={mode.id}
                                        onClick={() => setData(prev => ({ ...prev, supplier: { ...prev.supplier, transportMode: mode.id } }))}
                                        style={{
                                            ...choiceStyle,
                                            padding: '10px',
                                            borderColor: data.supplier.transportMode === mode.id ? '#0078d4' : '#444',
                                            backgroundColor: data.supplier.transportMode === mode.id ? '#1a365d' : '#2a2a2a'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{mode.icon}</span>
                                        <span style={{ fontSize: '0.7rem' }}>{mode.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#333', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ff9900' }}>📦 {currentLanguage === 'id' ? 'Detail Logistik' : 'Logistics Details'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>{currentLanguage === 'id' ? 'Frekuensi' : 'Frequency'}</label>
                                    <input type="number" style={inputStyle} value={data.supplier.frequency} onChange={e => setData(prev => ({ ...prev, supplier: { ...prev.supplier, frequency: parseInt(e.target.value) } }))} />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>{currentLanguage === 'id' ? 'Kapasitas' : 'Capacity'}</label>
                                    <input type="number" style={inputStyle} value={data.logistics.truckCapacity} onChange={e => setData(prev => ({ ...prev, logistics: { ...prev.logistics, truckCapacity: parseInt(e.target.value) } }))} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}><Info size={20} /> {currentLanguage === 'id' ? 'Aliran Informasi & Kontrol' : 'Information Flow & Control'}</h3>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Tipe Aliran Informasi' : 'Information Flow Type'}</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <div
                                    onClick={() => setData(prev => ({ ...prev, infoFlow: 'manual' }))}
                                    style={{ ...choiceStyle, borderColor: data.infoFlow === 'manual' ? '#0078d4' : '#444' }}
                                >
                                    <strong>Physical</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Kanban/Fax/Manual</span>
                                </div>
                                <div
                                    onClick={() => setData(prev => ({ ...prev, infoFlow: 'electronic' }))}
                                    style={{ ...choiceStyle, borderColor: data.infoFlow === 'electronic' ? '#0078d4' : '#444' }}
                                >
                                    <strong>Electronic</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>ERP/MRP/Digital</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '3rem', color: '#4CAF50', marginBottom: '10px' }}><CheckCircle2 size={60} /></div>
                            <h4>{currentLanguage === 'id' ? 'Siap Generate VSM!' : 'Ready to Generate VSM!'}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#888' }}>
                                {currentLanguage === 'id'
                                    ? 'Kami akan menyusun diagram secara otomatis dari hulu ke hilir.'
                                    : 'We will automatically arrange the diagram from upstream to downstream.'}
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SparklesIcon color="#ff9900" />
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{currentLanguage === 'id' ? 'VSM Magic Wizard' : 'VSM Magic Wizard'}</h2>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                {/* Progress Bar */}
                <div style={progressContainerStyle}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{
                            ...progressItemStyle,
                            backgroundColor: s <= step ? '#0078d4' : '#444'
                        }} />
                    ))}
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {renderStep()}
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                        style={{ ...navBtnStyle, opacity: step === 1 ? 0.3 : 1 }}
                    >
                        <ChevronLeft size={18} /> {currentLanguage === 'id' ? 'Kembali' : 'Back'}
                    </button>
                    {step < totalSteps ? (
                        <button onClick={() => setStep(s => Math.min(totalSteps, s + 1))} style={navBtnStyle}>
                            {currentLanguage === 'id' ? 'Lanjut' : 'Next'} <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button onClick={handleGenerate} style={generateBtnStyle}>
                            {currentLanguage === 'id' ? 'Generate VSM' : 'Generate VSM'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const SparklesIcon = ({ color }) => (
    <div style={{ color }}><Package size={24} /></div>
);

// Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalStyle = { width: '600px', maxHeight: '90vh', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #444', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' };
const headerStyle = { padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#252526', flexShrink: 0 };
const closeBtnStyle = { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' };
const progressContainerStyle = { display: 'flex', height: '4px', flexShrink: 0 };
const progressItemStyle = { flex: 1, transition: 'background-color 0.3s ease' };
const contentStyle = { padding: '30px', flex: 1, overflowY: 'auto', color: '#eee' };
const footerStyle = { padding: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', backgroundColor: '#252526', flexShrink: 0 };
const stepTitleStyle = { margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#0078d4' };
const inputGroupStyle = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
const labelStyle = { fontSize: '0.8rem', color: '#888', marginBottom: '5px' };
const inputStyle = { padding: '10px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none' };
const processCardStyle = { backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #0078d4' };
const addBtnStyle = { width: '100%', padding: '10px', backgroundColor: '#333', border: '1px dashed #555', borderRadius: '8px', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' };
const navBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 20px', backgroundColor: '#444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' };
const generateBtnStyle = { ...navBtnStyle, backgroundColor: '#0078d4' };
const choiceStyle = { flex: 1, padding: '15px', backgroundColor: '#2a2a2a', border: '2px solid #444', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s' };

export default VSMWizard;
