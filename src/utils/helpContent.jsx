import React from 'react';

// Help content for each view
export const helpContent = {
    'ml-data': {
        title: '🧠 Machine Learning Data - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Analisis konsistensi gerakan operator menggunakan konsep Machine Learning dengan Golden Cycle sebagai referensi standar.</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🚀 Cara Pakai</h3>
                <ol>
                    <li><strong>Set Golden Cycle</strong> (Gerakan Referensi):
                        <ul>
                            <li>📹 <strong>Capture Current</strong>: Ambil dari video saat ini</li>
                            <li>📤 <strong>Upload Video</strong>: Upload video gerakan standar</li>
                        </ul>
                    </li>
                    <li>Klik <strong>Start Analysis</strong> untuk mulai deteksi</li>
                    <li>Monitor real-time:
                        <ul>
                            <li><strong>Consistency Score</strong>: % kecocokan dengan Golden Cycle</li>
                            <li><strong>Anomaly Graph</strong>: Tren deviasi dari waktu ke waktu</li>
                            <li><strong>Live Skeleton Feed</strong>: Visualisasi pose detection</li>
                        </ul>
                    </li>
                </ol>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>💡 Tips</h3>
                <ul>
                    <li>Upload video gerakan terbaik sebagai Golden Cycle</li>
                    <li>Threshold 80% = batas minimum konsistensi</li>
                    <li>Anomaly tinggi = perlu retraining operator</li>
                </ul>
            </>
        )
    },
    'analysis': {
        title: '📊 Analysis Dashboard - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Dashboard visualisasi hasil analisis dengan charts dan summary statistics.</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📊 Metrics</h3>
                <ul>
                    <li><strong>OEE</strong>: Availability × Performance × Quality</li>
                    <li><strong>Efficiency</strong>: Output Actual vs Standard</li>
                    <li><strong>Takt vs Cycle</strong>: Kesesuaian dengan demand</li>
                    <li><strong>Productivity Index</strong>: Indeks performa total</li>
                </ul>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>💡 Tips</h3>
                <ul>
                    <li>Pilih project dari dropdown untuk melihat analisis</li>
                    <li>Export chart sebagai image atau data ke Excel</li>
                    <li>Screenshot dashboard untuk dokumentasi</li>
                </ul>
            </>
        )
    },
    'statistical-analysis': {
        title: '📉 Statistical Analysis - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Analisis statistik mendalam untuk variabilitas proses dan kapabilitas sistem.</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📊 Fitur</h3>
                <ul>
                    <li><strong>Summary Stats</strong>: Mean, Median, Std Dev, Min/Max</li>
                    <li><strong>Confidence Interval</strong>: 90%, 95%, 99%</li>
                    <li><strong>Process Capability</strong>: Cp, Cpk, Capable/Not Capable</li>
                    <li><strong>Control Chart</strong>: I-Chart dengan UCL/LCL</li>
                    <li><strong>Histogram</strong>: Distribusi data & Outlier detection</li>
                </ul>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>💡 Tips</h3>
                <ul>
                    <li>Minimal 10 cycles untuk statistik valid</li>
                    <li>Cp/Cpk > 1.33 = Process Capable</li>
                    <li>Export PDF Report untuk dokumentasi</li>
                </ul>
            </>
        )
    },
    'mtm-calculator': {
        title: '⏱️ MTM Calculator - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Kalkulasi waktu baku menggunakan metode Methods-Time Measurement (MTM-1).</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🚀 Cara Pakai</h3>
                <ol>
                    <li>Pilih <strong>Motion Type</strong> (Reach, Move, Grasp, etc)</li>
                    <li>Input parameter (Jarak, Case, Type)</li>
                    <li>Klik <strong>Add Motion</strong></li>
                    <li>TMU terhitung otomatis</li>
                </ol>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>💡 Konversi</h3>
                <p><strong>1 TMU = 0.036 detik</strong></p>
            </>
        )
    },
    'allowance-calculator': {
        title: '🔧 Allowance Calculator - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Menghitung kelonggaran (allowance) untuk penetapan waktu standar.</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📊 Fitur</h3>
                <ul>
                    <li>Input Normal Time</li>
                    <li>Basic Allowances (Personal, Fatigue, Delay)</li>
                    <li>Variable Fatigue (Standing, Lifting, Lighting, etc)</li>
                    <li>Output: Standard Time final</li>
                </ul>
            </>
        )
    },
    'manual-creation': {
        title: '📘 Manual Creation - Help',
        content: (
            <>
                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                <p>Membuat dokumen Instruksi Kerja (Work Instruction/SOP) visual dengan mengambil gambar langsung dari video.</p>

                <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🚀 Cara Pakai</h3>
                <ol>
                    <li>Pilih proyek dengan video</li>
                    <li>Untuk setiap langkah kerja:
                        <ul>
                            <li>Play/Seek video ke posisi yang tepat</li>
                            <li>Klik tombol <strong>📸 Capture</strong></li>
                            <li>Isi Deskripsi, Key Points, dan Safety Notes</li>
                        </ul>
                    </li>
                    <li>Klik <strong>Export PDF</strong> untuk mengunduh dokumen</li>
                </ol>
            </>
        )
    }
};
