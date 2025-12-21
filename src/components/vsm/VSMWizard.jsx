import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Layout, User, Package, Truck, Info, CheckCircle2, Factory, Monitor, Settings2, ArrowRight, Wand2, Building2 } from 'lucide-react';
import { VSMSymbols } from './vsm-constants';

const VSMWizard = ({ isOpen, onClose, onGenerate, currentLanguage }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        customer: {
            name: 'Customer',
            demand: 1000,
            shifts: 2,
            hoursPerShift: 8,
            packSize: 24,
            transportMode: VSMSymbols.TRUCK,
            source: 'production' // 'production', 'warehouse', 'supplier'
        },
        processes: [
            { id: 1, name: 'Process 1', ct: 30, va: 30, co: 45, coUnit: 'min', workers: 1, performance: 90, yield: 99, uptime: 95, buffer: 'inventory', bufferQty: 500, isParallel: false, flowType: 'push', hasKaizen: false, needsGoSee: false, supplierIds: ['s1'], bom: {}, inputSource: 'previous', transportFromReceiving: null }
        ],
        suppliers: [
            { id: 's1', name: 'Main Supplier', frequency: 1, transportMode: VSMSymbols.TRUCK, hasWarehouse: false }
        ],
        logistics: { milkRunFrequency: 4, truckCapacity: 500 },
        receiving: { enabled: false, transportMode: VSMSymbols.TROLLEY, amount: 1000 },
        infoFlow: 'electronic', // 'manual' or 'electronic'
        useHeijunka: false
    });

    if (!isOpen) return null;

    const steps = [
        { id: 1, title: currentLanguage === 'id' ? 'Pelanggan' : 'Customer', icon: <User size={18} />, desc: currentLanguage === 'id' ? 'Permintaan & Sumber' : 'Demand & Source' },
        { id: 2, title: currentLanguage === 'id' ? 'Produksi' : 'Production', icon: <Factory size={18} />, desc: currentLanguage === 'id' ? 'Aliran Proses & Buffer' : 'Process Flow & Buffers' },
        { id: 3, title: currentLanguage === 'id' ? 'Penerimaan' : 'Receiving', icon: <Package size={18} />, desc: currentLanguage === 'id' ? 'Gudang Masuk (Inbound)' : 'Inbound Warehouse' },
        { id: 4, title: currentLanguage === 'id' ? 'Pemasok' : 'Suppliers', icon: <Truck size={18} />, desc: currentLanguage === 'id' ? 'Material & Logistik' : 'Material & Logistics' },
        { id: 5, title: currentLanguage === 'id' ? 'Kontrol' : 'Control', icon: <Settings2 size={18} />, desc: currentLanguage === 'id' ? 'Aliran Informasi' : 'Information Flow' },
    ];

    const updateCustomer = (field, value) => {
        setData(prev => ({ ...prev, customer: { ...prev.customer, [field]: value } }));
    };

    const addProcess = () => {
        const newId = data.processes.length + 1;
        setData(prev => ({
            ...prev,
            processes: [...prev.processes, { id: newId, name: `Process ${newId}`, ct: 30, va: 30, co: 45, coUnit: 'min', workers: 1, performance: 90, yield: 99, uptime: 95, buffer: 'inventory', bufferQty: 100, isParallel: false, flowType: 'push', hasKaizen: false, needsGoSee: false, supplierIds: [prev.suppliers[0]?.id], bom: {}, inputSource: 'previous', transportFromReceiving: null }]
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

    const addSupplier = () => {
        const newId = `s${data.suppliers.length + 1}`;
        setData(prev => ({
            ...prev,
            suppliers: [...prev.suppliers, { id: newId, name: `Supplier ${prev.suppliers.length + 1}`, frequency: 1, transportMode: VSMSymbols.TRUCK, hasWarehouse: false }]
        }));
    };

    const updateSupplier = (id, field, value) => {
        setData(prev => ({
            ...prev,
            suppliers: prev.suppliers.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeSupplier = (id) => {
        if (data.suppliers.length <= 1) return;
        setData(prev => ({
            ...prev,
            suppliers: prev.suppliers.filter(s => s.id !== id)
        }));
    };

    const handleGenerate = () => {
        onGenerate(data);
        onClose();
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}>{currentLanguage === 'id' ? 'Konfigurasi Pelanggan' : 'Customer Configuration'}</h3>
                        <p style={stepDescStyle}>{currentLanguage === 'id' ? 'Tentukan siapa pelanggan Anda dan seberapa besar permintaan mereka.' : 'Define your customer and their demand requirements.'}</p>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Nama Pelanggan' : 'Customer Name'}</label>
                            <input style={inputStyle} value={data.customer.name} onChange={e => updateCustomer('name', e.target.value)} placeholder="e.g. Toyota Motor Corp" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Permintaan / Hari (pcs)' : 'Demand / Day (pcs)'}</label>
                                <input type="number" style={inputStyle} value={data.customer.demand} onChange={e => updateCustomer('demand', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Jumlah Shift' : 'Shifts'}</label>
                                <input type="number" style={inputStyle} value={data.customer.shifts} onChange={e => updateCustomer('shifts', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Jam per Shift' : 'Hours/Shift'}</label>
                                <input type="number" style={inputStyle} value={data.customer.hoursPerShift} onChange={e => updateCustomer('hoursPerShift', parseInt(e.target.value))} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>{currentLanguage === 'id' ? 'Ukuran Pack (Pitch)' : 'Pack Size (Pitch)'}</label>
                                <input type="number" style={inputStyle} value={data.customer.packSize} onChange={e => updateCustomer('packSize', parseInt(e.target.value))} />
                            </div>
                        </div>

                        <div style={sectionCardStyle}>
                            <h4 style={sectionTitleStyle}>🛒 {currentLanguage === 'id' ? 'Sumber Material Pelanggan' : 'Customer Material Source'}</h4>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {[
                                    { id: 'production', label: currentLanguage === 'id' ? 'Produksi' : 'Production', icon: <Factory size={20} />, desc: 'Direct flow' },
                                    { id: 'warehouse', label: currentLanguage === 'id' ? 'Gudang FG' : 'FG Warehouse', icon: <Building2 size={20} />, desc: 'Stock points' },
                                    { id: 'supplier', label: currentLanguage === 'id' ? 'Pemasok' : 'Supplier', icon: <Truck size={20} />, desc: 'Trading/Drop-ship' }
                                ].map(option => (
                                    <div
                                        key={option.id}
                                        onClick={() => updateCustomer('source', option.id)}
                                        style={{
                                            ...choiceStyle,
                                            borderColor: data.customer.source === option.id ? '#0078d4' : '#444',
                                            backgroundColor: data.customer.source === option.id ? 'rgba(0, 120, 212, 0.1)' : '#1e1e1e'
                                        }}
                                    >
                                        <div style={{ color: data.customer.source === option.id ? '#0078d4' : '#888', marginBottom: '8px' }}>{option.icon}</div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{option.label}</span>
                                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{option.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...sectionCardStyle, marginTop: '15px' }}>
                            <h4 style={sectionTitleStyle}>🚚 {currentLanguage === 'id' ? 'Metode Pengiriman' : 'Shipping Method'}</h4>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {[
                                    { id: VSMSymbols.TRUCK, label: 'Truck', icon: '🚚' },
                                    { id: VSMSymbols.SEA, label: 'Sea', icon: '🚢' },
                                    { id: VSMSymbols.AIR, label: 'Air', icon: '✈️' }
                                ].map(mode => (
                                    <div
                                        key={mode.id}
                                        onClick={() => updateCustomer('transportMode', mode.id)}
                                        style={{
                                            ...choiceStyle,
                                            borderColor: data.customer.transportMode === mode.id ? '#0078d4' : '#444',
                                            backgroundColor: data.customer.transportMode === mode.id ? 'rgba(0, 120, 212, 0.1)' : '#1e1e1e'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{mode.icon}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{mode.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}>{currentLanguage === 'id' ? 'Proses Produksi' : 'Production Processes'}</h3>
                        <div style={alertInfoStyle}>
                            <Info size={16} />
                            <span>{currentLanguage === 'id' ? 'Masukkan proses berurutan dari Hulu (Supplier) ke Hilir (Customer).' : 'Enter processes in order from Upstream (Supplier) to Downstream (Customer).'}</span>
                        </div>

                        <div style={{ padding: '5px' }}>
                            {data.processes.map((proc, idx) => (
                                <React.Fragment key={proc.id}>
                                    <div style={{
                                        ...processCardStyle,
                                        marginLeft: proc.isParallel ? '40px' : '0',
                                        borderLeftColor: proc.isParallel ? '#ff9900' : '#0078d4',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                <div style={processBadgeStyle}>{idx + 1}</div>
                                                <input
                                                    style={ghostInputStyle}
                                                    value={proc.name}
                                                    onChange={e => updateProcess(proc.id, 'name', e.target.value)}
                                                    placeholder="Process Name"
                                                />
                                            </div>
                                            <button onClick={() => removeProcess(proc.id)} style={removeBtnStyle}><Trash2 size={16} /></button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                            <div style={miniInputGroup}>
                                                <label style={miniLabel}>CT (sec)</label>
                                                <input type="number" style={miniInput} value={proc.ct} onChange={e => updateProcess(proc.id, 'ct', parseInt(e.target.value))} />
                                            </div>
                                            <div style={miniInputGroup}>
                                                <label style={miniLabel}>CO ({proc.coUnit})</label>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input type="number" style={{ ...miniInput, flex: 1 }} value={proc.co} onChange={e => updateProcess(proc.id, 'co', parseInt(e.target.value))} />
                                                    <select style={unitSelect} value={proc.coUnit} onChange={e => updateProcess(proc.id, 'coUnit', e.target.value)}>
                                                        <option value="min">m</option>
                                                        <option value="sec">s</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={miniInputGroup}>
                                                <label style={miniLabel}>Uptime (%)</label>
                                                <input type="number" style={miniInput} value={proc.uptime} onChange={e => updateProcess(proc.id, 'uptime', parseInt(e.target.value))} />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #444', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={miniLabel}>📦 Buffer:</span>
                                                <select style={unitSelect} value={proc.buffer} onChange={e => updateProcess(proc.id, 'buffer', e.target.value)}>
                                                    <option value="inventory">Inventory</option>
                                                    <option value="supermarket">Supermarket</option>
                                                    <option value="fifo">FIFO</option>
                                                    <option value="none">None</option>
                                                </select>
                                                {proc.buffer !== 'none' && (
                                                    <input type="number" style={{ ...miniInput, width: '50px' }} value={proc.bufferQty} onChange={e => updateProcess(proc.id, 'bufferQty', parseInt(e.target.value))} />
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={miniLabel}>🔄 Flow:</span>
                                                <select style={unitSelect} value={proc.flowType} onChange={e => updateProcess(proc.id, 'flowType', e.target.value)}>
                                                    <option value="push">Push</option>
                                                    <option value="pull">Pull</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {idx < data.processes.length - 1 && !data.processes[idx + 1].isParallel && (
                                        <div style={flowArrowContainer}>
                                            <ArrowRight size={20} color="#555" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                            <button onClick={addProcess} style={addBtnStyle}><Plus size={16} /> {currentLanguage === 'id' ? 'Tambah Proses Baru' : 'Add New Process'}</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}>{currentLanguage === 'id' ? 'Gudang Penerimaan (Receiving)' : 'Receiving Warehouse'}</h3>
                        <p style={stepDescStyle}>{currentLanguage === 'id' ? 'Konfigurasi area penerimaan material dari pemasok sebelum masuk ke produksi.' : 'Configure the material receiving area before it enters production.'}</p>

                        <div
                            style={{
                                ...sectionCardStyle,
                                cursor: 'pointer',
                                borderLeft: '4px solid ' + (data.receiving.enabled ? '#0078d4' : '#444'),
                                marginBottom: '25px'
                            }}
                            onClick={() => setData(prev => ({ ...prev, receiving: { ...prev.receiving, enabled: !prev.receiving.enabled } }))}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="checkbox" checked={data.receiving.enabled} readOnly />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{currentLanguage === 'id' ? 'Gunakan Gudang Penerimaan?' : 'Use Receiving Warehouse?'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{currentLanguage === 'id' ? 'Menambahkan buffer stock awal setelah material datang dari supplier.' : 'Adds an initial buffer stock after material arrives from supplier.'}</div>
                                </div>
                            </div>
                        </div>

                        {data.receiving.enabled && (
                            <>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>{currentLanguage === 'id' ? 'Jumlah Stok Awal (pcs)' : 'Initial Stock Amount (pcs)'}</label>
                                    <input type="number" style={inputStyle} value={data.receiving.amount} onChange={e => setData(prev => ({ ...prev, receiving: { ...prev.receiving, amount: parseInt(e.target.value) } }))} />
                                </div>

                                <div style={sectionCardStyle}>
                                    <h4 style={sectionTitleStyle}>🚜 {currentLanguage === 'id' ? 'Metode Pemindahan ke Produksi' : 'Internal Transport to Production'}</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {[
                                            { id: VSMSymbols.TROLLEY, label: currentLanguage === 'id' ? 'Trolley' : 'Trolley', icon: '🛒' },
                                            { id: VSMSymbols.FORKLIFT, label: currentLanguage === 'id' ? 'Forklift' : 'Forklift', icon: '🚜' }
                                        ].map(mode => (
                                            <div
                                                key={mode.id}
                                                onClick={() => setData(prev => ({ ...prev, receiving: { ...prev.receiving, transportMode: mode.id } }))}
                                                style={{
                                                    ...choiceStyle,
                                                    borderColor: data.receiving.transportMode === mode.id ? '#0078d4' : '#444',
                                                    backgroundColor: data.receiving.transportMode === mode.id ? 'rgba(0, 120, 212, 0.1)' : '#1e1e1e'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{mode.icon}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{mode.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {!data.receiving.enabled && (
                            <div style={alertInfoStyle}>
                                <Info size={16} />
                                <span>{currentLanguage === 'id' ? 'Material akan dikirim langsung dari supplier ke proses produksi pertama.' : 'Material will be delivered directly from supplier to the first production process.'}</span>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}>{currentLanguage === 'id' ? 'Pemasok & Material' : 'Suppliers & Raw Material'}</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                            {data.suppliers.map((supp, sIdx) => (
                                <div key={supp.id} style={{ ...processCardStyle, borderLeftColor: '#4caf50' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <input style={ghostInputStyle} value={supp.name} onChange={e => updateSupplier(supp.id, 'name', e.target.value)} />
                                        <button onClick={() => removeSupplier(supp.id)} style={removeBtnStyle}><Trash2 size={16} /></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>Freq (x/day)</label>
                                            <input type="number" style={inputStyle} value={supp.frequency} onChange={e => updateSupplier(supp.id, 'frequency', parseInt(e.target.value))} />
                                        </div>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>Transport</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[VSMSymbols.TRUCK, VSMSymbols.SEA, VSMSymbols.AIR].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => updateSupplier(supp.id, 'transportMode', m)}
                                                        style={{
                                                            ...choiceStyle,
                                                            padding: '8px',
                                                            borderColor: supp.transportMode === m ? '#4caf50' : '#444',
                                                            backgroundColor: supp.transportMode === m ? 'rgba(76, 175, 80, 0.1)' : '#1e1e1e'
                                                        }}
                                                    >
                                                        {m === VSMSymbols.TRUCK ? '🚚' : m === VSMSymbols.SEA ? '🚢' : '✈️'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <label style={checkboxLabelStyle}>
                                        <input type="checkbox" checked={supp.hasWarehouse} onChange={e => updateSupplier(supp.id, 'hasWarehouse', e.target.checked)} />
                                        🏢 {currentLanguage === 'id' ? 'Gunakan Gudang Material (WH RM)' : 'Use Material Warehouse (WH RM)'}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <button onClick={addSupplier} style={addBtnStyle}><Plus size={16} /> {currentLanguage === 'id' ? 'Tambah Pemasok' : 'Add Supplier'}</button>
                    </div>
                );
            case 5:
                return (
                    <div className="wizard-step">
                        <h3 style={stepTitleStyle}>{currentLanguage === 'id' ? 'Kontrol & Aliran Informasi' : 'Control & Info Flow'}</h3>

                        <div style={sectionCardStyle}>
                            <label style={labelStyle}>{currentLanguage === 'id' ? 'Metode Komunikasi' : 'Communication Method'}</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <div
                                    onClick={() => setData(prev => ({ ...prev, infoFlow: 'manual' }))}
                                    style={{
                                        ...choiceStyle,
                                        padding: '15px',
                                        borderColor: data.infoFlow === 'manual' ? '#0078d4' : '#444',
                                        backgroundColor: data.infoFlow === 'manual' ? 'rgba(0, 120, 212, 0.1)' : '#1e1e1e'
                                    }}
                                >
                                    <strong>Physical</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Kanban/Manual</span>
                                </div>
                                <div
                                    onClick={() => setData(prev => ({ ...prev, infoFlow: 'electronic' }))}
                                    style={{
                                        ...choiceStyle,
                                        padding: '15px',
                                        borderColor: data.infoFlow === 'electronic' ? '#0078d4' : '#444',
                                        backgroundColor: data.infoFlow === 'electronic' ? 'rgba(0, 120, 212, 0.1)' : '#1e1e1e'
                                    }}
                                >
                                    <strong>Electronic</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>ERP/Digital</span>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                ...sectionCardStyle,
                                cursor: 'pointer',
                                borderLeft: '4px solid ' + (data.useHeijunka ? '#0078d4' : '#444')
                            }}
                            onClick={() => setData(prev => ({ ...prev, useHeijunka: !prev.useHeijunka }))}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="checkbox" checked={data.useHeijunka} readOnly />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>📊 Use Heijunka Box?</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Distribute production volume evenly for Lean Future State.</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'center', padding: '30px', backgroundColor: 'rgba(76, 175, 80, 0.05)', borderRadius: '12px', border: '1px dashed #4caf50' }}>
                            <CheckCircle2 size={48} color="#4caf50" style={{ marginBottom: '15px' }} />
                            <h4 style={{ margin: 0 }}>{currentLanguage === 'id' ? 'Siap Generate!' : 'Ready to Generate!'}</h4>
                            <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '8px' }}>
                                {currentLanguage === 'id'
                                    ? 'VSM akan disusun dari Hulu (Supplier) ke Hilir (Customer).'
                                    : 'VSM will be arranged from Upstream (Supplier) to Downstream (Customer).'}
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
                {/* Dashboard Sidebar Stepper */}
                <div style={sidebarStyle}>
                    <div style={brandStyle}>
                        <div style={logoStyle}><Package size={20} /></div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '0.9rem', color: '#fff' }}>MAVi VSM</div>
                            <div style={{ fontSize: '0.65rem', color: '#0078d4', fontWeight: 'bold' }}>MAGIC WIZARD</div>
                        </div>
                    </div>

                    <div style={stepperContainerStyle}>
                        {steps.map((s, idx) => (
                            <div key={s.id} style={stepItemWrapper}>
                                <div
                                    style={{
                                        ...stepItemStyle,
                                        color: step === s.id ? '#fff' : '#888',
                                        backgroundColor: step === s.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        paddingLeft: '10px',
                                        borderRadius: '8px',
                                        marginRight: '-10px'
                                    }}
                                    onClick={() => setStep(s.id)}
                                >
                                    <div style={{
                                        ...stepIconStyle,
                                        backgroundColor: step === s.id ? '#0078d4' : '#2a2a2a',
                                        borderColor: step === s.id ? '#0078d4' : '#444',
                                    }}>
                                        {s.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{s.title}</div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{s.desc}</div>
                                    </div>
                                    {step > s.id && <CheckCircle2 size={14} color="#4caf50" style={{ marginRight: '10px' }} />}
                                </div>
                                {idx < steps.length - 1 && <div style={{ ...connectorLine, backgroundColor: step > s.id ? '#4caf50' : '#444' }} />}
                            </div>
                        ))}
                    </div>

                    <div style={sidebarFooterStyle}>
                        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={mainContentStyle}>
                    <div style={headerActionStyle}>
                        <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                    </div>

                    <div style={scrollContentStyle}>
                        {renderStep()}
                    </div>

                    <div style={footerStyle}>
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            style={{ ...navBtnStyle, visibility: step === 1 ? 'hidden' : 'visible' }}
                        >
                            <ChevronLeft size={18} /> {currentLanguage === 'id' ? 'Kembali' : 'Back'}
                        </button>

                        {step < steps.length ? (
                            <button onClick={() => setStep(s => s + 1)} style={primaryBtnStyle}>
                                {currentLanguage === 'id' ? 'Lanjut' : 'Next Step'} <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleGenerate} style={generateBtnStyle}>
                                <Wand2 size={18} /> {currentLanguage === 'id' ? 'Hasilkan VSM' : 'Generate VSM'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Styles
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' };
const modalStyle = { width: '850px', height: '600px', backgroundColor: '#181818', borderRadius: '16px', overflow: 'hidden', display: 'flex', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)', border: '1px solid #333' };

const sidebarStyle = { width: '240px', backgroundColor: '#111', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', padding: '25px' };
const brandStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' };
const logoStyle = { width: '36px', height: '36px', backgroundColor: '#0078d4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' };

const stepperContainerStyle = { flex: 1 };
const stepItemWrapper = { display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: '8px' };
const stepItemStyle = { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', cursor: 'pointer', transition: 'all 0.2s' };
const stepIconStyle = { width: '32px', height: '32px', borderRadius: '10px', border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' };
const connectorLine = { width: '2px', height: '12px', marginLeft: '15px', transition: 'all 0.3s' };

const mainContentStyle = { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#181818' };
const scrollContentStyle = { flex: 1, padding: '40px', overflowY: 'auto' };
const footerStyle = { padding: '20px 40px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1c' };

const stepTitleStyle = { margin: '0 0 10px 0', fontSize: '1.4rem', color: '#fff' };
const stepDescStyle = { margin: '0 0 30px 0', fontSize: '0.9rem', color: '#888' };

const inputGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' };

const sectionCardStyle = { backgroundColor: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #333' };
const sectionTitleStyle = { margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ccc' };

const choiceStyle = { flex: 1, padding: '15px 10px', border: '2px solid #333', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', textAlign: 'center' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', fontSize: '0.85rem', color: '#ccc', cursor: 'pointer' };

const processCardStyle = { backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '12px', border: '1px solid #333', marginBottom: '10px', position: 'relative' };
const processBadgeStyle = { width: '24px', height: '24px', backgroundColor: '#0078d4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' };
const ghostInputStyle = { background: 'none', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', outline: 'none', flex: 1 };
const removeBtnStyle = { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '5px' };

const miniInputGroup = { display: 'flex', flexDirection: 'column', gap: '4px' };
const miniLabel = { fontSize: '0.65rem', color: '#888' };
const miniInput = { padding: '8px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' };
const unitSelect = { ...miniInput, padding: '8px 4px' };

const flowArrowContainer = { display: 'flex', justifyContent: 'center', padding: '8px 0' };
const alertInfoStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'rgba(0, 120, 212, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: '#4fc3f7', marginBottom: '20px' };

const addBtnStyle = { width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px dashed #444', borderRadius: '10px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' };
const navBtnStyle = { padding: '10px 20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const primaryBtnStyle = { padding: '12px 24px', backgroundColor: '#0078d4', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' };
const generateBtnStyle = { ...primaryBtnStyle, backgroundColor: '#4caf50' };
const cancelBtnStyle = { width: '100%', padding: '10px', background: 'none', border: '1px solid #333', borderRadius: '8px', color: '#888', cursor: 'pointer' };
const sidebarFooterStyle = { marginTop: 'auto' };
const headerActionStyle = { position: 'absolute', top: '20px', right: '25px', zIndex: 10 };
const closeBtnStyle = { background: 'none', border: 'none', color: '#555', cursor: 'pointer' };

export default VSMWizard;
