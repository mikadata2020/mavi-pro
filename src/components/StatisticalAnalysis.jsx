import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
    calculateSummaryStats,
    calculateConfidenceInterval,
    calculateProcessCapability,
    calculateControlLimits,
    createHistogramBins,
    detectOutliers
} from '../utils/statistics';
import { generatePDFReport, savePDFReport } from '../utils/pdfExport';
import HelpButton from './HelpButton';
import { helpContent } from '../utils/helpContent.jsx';

function StatisticalAnalysis({ measurements = [] }) {
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [specLimits, setSpecLimits] = useState({ lsl: 0, usl: 10 });
    const [showOutliers, setShowOutliers] = useState(true);

    // Extract durations for analysis
    const durations = useMemo(() => {
        return measurements.map(m => m.duration).filter(d => d > 0);
    }, [measurements]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (durations.length === 0) return null;
        return calculateSummaryStats(durations);
    }, [durations]);

    const ci = useMemo(() => {
        if (durations.length === 0) return null;
        return calculateConfidenceInterval(durations, confidenceLevel);
    }, [durations, confidenceLevel]);

    const processCapability = useMemo(() => {
        if (durations.length === 0) return null;
        return calculateProcessCapability(durations, specLimits.lsl, specLimits.usl);
    }, [durations, specLimits]);

    const controlLimits = useMemo(() => {
        if (durations.length === 0) return null;
        return calculateControlLimits(durations);
    }, [durations]);

    const histogramData = useMemo(() => {
        if (durations.length === 0) return [];
        const bins = createHistogramBins(durations, 10);
        return bins.map(bin => ({
            range: `${bin.start.toFixed(2)}-${bin.end.toFixed(2)}`,
            count: bin.count,
            frequency: (bin.frequency * 100).toFixed(1)
        }));
    }, [durations]);

    const outlierInfo = useMemo(() => {
        if (durations.length === 0) return null;
        return detectOutliers(durations);
    }, [durations]);

    const controlChartData = useMemo(() => {
        return measurements.map((m, index) => ({
            index: index + 1,
            duration: m.duration,
            elementName: m.elementName
        }));
    }, [measurements]);

    const handleExportPDF = async () => {
        const doc = await generatePDFReport(
            { projectName: 'Statistical Analysis' },
            {
                projectName: 'Motion Study - Statistical Analysis',
                measurements,
                statistics: {
                    ...stats,
                    ci95: ci,
                    processCapability,
                    controlLimits
                },
                includeCharts: false,
                includeTables: true,
                includeStatistics: true
            }
        );
        savePDFReport(doc, 'statistical-analysis-report.pdf');
    };

    if (durations.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                <h3>No data available for statistical analysis</h3>
                <p>Please add measurements to view statistical analysis.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#1e1e1e', minHeight: '100vh', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#00a6ff' }}>Statistical Analysis</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <HelpButton
                        title={helpContent['statistical-analysis'].title}
                        content={helpContent['statistical-analysis'].content}
                    />
                    <button
                        onClick={handleExportPDF}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#005a9e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        📄 Export PDF Report
                    </button>
                </div>
            </div>

            {/* Summary Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <StatCard title="Count" value={stats.count} />
                <StatCard title="Mean" value={`${stats.mean.toFixed(3)} s`} />
                <StatCard title="Median" value={`${stats.median.toFixed(3)} s`} />
                <StatCard title="Std Dev" value={`${stats.stdDev.toFixed(3)} s`} />
                <StatCard title="Min" value={`${stats.min.toFixed(3)} s`} />
                <StatCard title="Max" value={`${stats.max.toFixed(3)} s`} />
                <StatCard title="Range" value={`${stats.range.toFixed(3)} s`} />
                <StatCard title="CV" value={`${stats.cv.toFixed(2)}%`} />
            </div>

            {/* Confidence Interval */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Confidence Interval</h3>
                    <select
                        value={confidenceLevel}
                        onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#1a1a1a',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '4px'
                        }}
                    >
                        <option value={0.90}>90% Confidence</option>
                        <option value={0.95}>95% Confidence</option>
                        <option value={0.99}>99% Confidence</option>
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <StatCard title="Lower Bound" value={`${ci.lower.toFixed(3)} s`} color="#ff6b6b" />
                    <StatCard title="Mean" value={`${stats.mean.toFixed(3)} s`} color="#4ecdc4" />
                    <StatCard title="Upper Bound" value={`${ci.upper.toFixed(3)} s`} color="#ff6b6b" />
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#aaa' }}>
                    Margin of Error: ±{ci.margin.toFixed(3)} s
                </p>
            </div>

            {/* Process Capability */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Process Capability</h3>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Lower Spec Limit (LSL)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={specLimits.lsl}
                            onChange={(e) => setSpecLimits({ ...specLimits, lsl: parseFloat(e.target.value) })}
                            style={{
                                width: '100px',
                                padding: '5px',
                                backgroundColor: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Upper Spec Limit (USL)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={specLimits.usl}
                            onChange={(e) => setSpecLimits({ ...specLimits, usl: parseFloat(e.target.value) })}
                            style={{
                                width: '100px',
                                padding: '5px',
                                backgroundColor: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    <StatCard title="Cp" value={processCapability.cp.toFixed(3)} color={processCapability.cp >= 1.33 ? '#4ecdc4' : '#ff6b6b'} />
                    <StatCard title="Cpk" value={processCapability.cpk.toFixed(3)} color={processCapability.cpk >= 1.33 ? '#4ecdc4' : '#ff6b6b'} />
                    <StatCard title="Cpl" value={processCapability.cpl.toFixed(3)} />
                    <StatCard title="Cpu" value={processCapability.cpu.toFixed(3)} />
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#aaa' }}>
                    {processCapability.cpk >= 1.33 ? '✓ Process is capable' : '⚠ Process may not be capable'}
                </p>
            </div>

            {/* Histogram */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Distribution Histogram</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={histogramData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="range" stroke="#aaa" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#aaa" />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }} />
                        <Bar dataKey="count" fill="#005a9e" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Control Chart */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Control Chart (I-Chart)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={controlChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="index" stroke="#aaa" />
                        <YAxis stroke="#aaa" domain={[0, 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }} />
                        <Legend />
                        <ReferenceLine y={controlLimits.centerLine} stroke="#4ecdc4" strokeDasharray="3 3" label="CL" />
                        <ReferenceLine y={controlLimits.ucl} stroke="#ff6b6b" strokeDasharray="3 3" label="UCL" />
                        <ReferenceLine y={controlLimits.lcl} stroke="#ff6b6b" strokeDasharray="3 3" label="LCL" />
                        <Line type="monotone" dataKey="duration" stroke="#005a9e" dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' }}>
                    <StatCard title="Center Line" value={`${controlLimits.centerLine.toFixed(3)} s`} color="#4ecdc4" />
                    <StatCard title="UCL" value={`${controlLimits.ucl.toFixed(3)} s`} color="#ff6b6b" />
                    <StatCard title="LCL" value={`${controlLimits.lcl.toFixed(3)} s`} color="#ff6b6b" />
                </div>
            </div>

            {/* Outliers */}
            {showOutliers && outlierInfo.outliers.length > 0 && (
                <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0, color: '#ff6b6b' }}>⚠ Outliers Detected</h3>
                    <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                        {outlierInfo.outliers.length} outlier(s) detected using IQR method
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {outlierInfo.outliers.map((val, idx) => (
                            <span key={idx} style={{
                                padding: '5px 10px',
                                backgroundColor: '#3a1a1a',
                                border: '1px solid #ff6b6b',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}>
                                {val.toFixed(3)} s
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, color = '#005a9e' }) {
    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '6px',
            border: `2px solid ${color}`,
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '5px' }}>{title}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color }}>{value}</div>
        </div>
    );
}

export default StatisticalAnalysis;
