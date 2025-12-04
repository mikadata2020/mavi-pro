import React, { useState } from 'react';

function Help() {
    const [activeSection, setActiveSection] = useState('intro');

    const sections = {
        intro: {
            title: '🎯 Pengenalan MAVi',
            content: `
**MAVi (Motion Analysis & Visualization)** adalah aplikasi analisis gerakan berbasis web untuk:

✅ Menganalisis video kerja/operasi
✅ Mengukur waktu setiap elemen gerakan  
✅ Mengklasifikasikan aktivitas (Value-added, Non value-added, Waste)
✅ Menghitung standard time & productivity metrics
✅ Membandingkan sesi recording
✅ Simulasi improvement
            `
        },
        quick: {
            title: '⚡ Quick Start',
            content: `
**Workflow Dasar:**

1️⃣ **Upload Video** - Klik 🎬 Video, upload file video
2️⃣ **Mulai Pengukuran** - Tekan S (Start) dan E (End) saat video play
3️⃣ **Input Data** - Masukkan nama elemen & kategori (VA/NVA/Waste)
4️⃣ **Simpan** - Klik icon 💾 untuk save ke database
5️⃣ **Analisis** - Klik 📊 Analysis untuk lihat hasil

**Keyboard Shortcuts:**
• Space - Play/Pause
• S - Start measurement
• E - End measurement  
• ← / → - Previous/Next frame
            `
        },
        features: {
            title: '🎬 Fitur Utama',
            content: `
**Navigation Icons:**

🎬 **Video** - Workspace analisis video utama
📊 **Analysis** - Dashboard charts, OEE, & summary
🔄 **Rearrange** - Simulasi penyusunan ulang elemen
📈 **Cycle Analysis** - Analisis waktu cycle individual
Σ **Aggregation** - Agregasi cycle time dari multiple projects
⏱️ **Std Time** - Kalkulasi standard time dengan rating & allowance
🗑️ **Waste** - Simulasi eliminasi waste
📍 **Therblig** - Therblig flow diagram & layout analysis
📉 **Statistical** - Analisis statistik (Cp, Cpk, Control Chart)
⏱️ **MTM Calc** - Kalkulasi waktu baku metode MTM-1
🔧 **Allowance** - Kalkulasi kelonggaran & fatigue
🏆 **Best/Worst** - Analisis cycle terbaik vs terburuk
🎥 **Compare** - Video side-by-side comparison
📑 **Multi-Axial** - Analisis multi-project (Man-Machine/Two-Hand)
📘 **Manual** - Pembuatan manual kerja (Work Instruction)
🧠 **ML Data** - Machine Learning Consistency Check
❓ **Help** - Panduan penggunaan aplikasi

**Element Editor Tools:**

💾 - Simpan ke database
📊 - Export ke Excel
🔍 - Cari elemen
▲/▼ - Pindah urutan
✎ - Edit nama & kategori
✂️ - Split elemen
🗑 - Hapus elemen
            `
        },
        categories: {
            title: '🏷️ Kategorisasi',
            content: `
**Value-Added (VA):**
Aktivitas yang mengubah bentuk/fungsi produk dan customer mau bayar.
Contoh: Memasang komponen, mengelas, merakit

**Non Value-Added (NVA):**  
Aktivitas perlu tapi tidak menambah nilai langsung.
Contoh: Setup mesin, inspeksi, handling material

**Waste:**
Pemborosan yang bisa & harus dieliminasi.
Contoh: Menunggu, mencari alat, transport berlebihan, rework
            `
        },
        rating: {
            title: '⭐ Rating & Speed',
            content: `
**Rating Performance:**

⭐⭐⭐⭐⭐ (100%) - Operator sangat cepat & terampil
⭐⭐⭐⭐ (80%) - Operator di atas rata-rata
⭐⭐⭐ (60%) - Operator normal/standard
⭐⭐ (40%) - Operator di bawah rata-rata  
⭐ (20%) - Operator sangat lambat

**Rating Speed Playback:**
Jika elemen memiliki rating, toggle "⭐ Rating Speed" akan tersedia di playback controls. Video akan play dengan kecepatan sesuai average rating.

Contoh: Rating 80% → Speed 0.8x
            `
        },
        split: {
            title: '✂️ Element Split',
            content: `
**Kapan Digunakan:**
• Elemen terlalu panjang perlu detail breakdown
• Ingin analisis lebih granular

**Cara Menggunakan:**

1. Klik tombol ✂️ pada elemen di tabel
2. Masukkan waktu split (dalam detik)
   Contoh: Element 2.5s - 5.0s, split di 3.5s
3. Hasil: 2 elemen baru
   • "Nama Elemen (1)" : 2.5s - 3.5s (1.0s)
   • "Nama Elemen (2)" : 3.5s - 5.0s (1.5s)

Durasi otomatis dihitung ulang!
            `
        },
        video: {
            title: '🎬 Video Workspace',
            content: `
**Fungsi:**
Workspace utama untuk analisis video dan pengukuran waktu elemen kerja.

**Cara Pakai:**

1. Upload video dengan klik tombol "Upload Video"
2. Play video dan gunakan keyboard shortcuts:
   • Space - Play/Pause
   • S - Start measurement
   • E - End measurement
   • ← / → - Frame by frame
3. Input nama elemen dan kategori (VA/NVA/Waste)
4. Ulangi untuk semua elemen
5. Save ke database dengan tombol 💾

**Fitur:**
• Timeline measurement dengan visual markers
• Playback speed control (0.25x - 2x)
• Frame-by-frame navigation
• Element editor dengan drag & drop
• Narration recording (opsional)

**Tips:**
• Gunakan slow motion untuk gerakan cepat
• Frame-by-frame untuk presisi tinggi
• Zoom in untuk detail gerakan
            `
        },
        analysis: {
            title: '📊 Analysis Dashboard',
            content: `
**Fungsi:**
Dashboard visualisasi hasil analisis dengan charts dan summary statistics.

**Cara Pakai:**

1. Klik icon 📊 di header
2. Pilih project dari dropdown
3. Review charts dan metrics:
   • Pie chart - Distribusi VA/NVA/Waste
   • Bar chart - Durasi per elemen
   • Timeline - Sequence visualization
   • Summary stats - Total time, cycle time, dll

**Metrics Baru:**
• **OEE**: Availability x Performance x Quality
• **Efficiency**: Output Actual vs Standard
• **Takt vs Cycle**: Kesesuaian dengan demand
• **Productivity Index**: Indeks performa total

**Export:**
• Screenshot dashboard
• Export data ke Excel
• Export chart sebagai image
            `
        },
        statistical: {
            title: '📉 Statistical Analysis',
            content: `
**Fungsi:**
Analisis statistik mendalam untuk variabilitas proses dan kapabilitas sistem.

**Fitur:**
1. **Summary Stats**: Mean, Median, Std Dev, Min/Max
2. **Confidence Interval**: 90%, 95%, 99%
3. **Process Capability**: Cp, Cpk, Capable/Not Capable
4. **Control Chart**: I-Chart dengan UCL/LCL
5. **Histogram**: Distribusi data & Outlier detection

**Cara Pakai:**
1. Klik icon 📉 di header
2. Review statistik otomatis dari data pengukuran
3. Export PDF Report untuk dokumentasi
            `
        },
        mtm: {
            title: '⏱️ MTM Calculator',
            content: `
**Fungsi:**
Kalkulasi waktu baku menggunakan metode Methods-Time Measurement (MTM-1).

**Cara Pakai:**
1. Klik icon ⏱️ (MTM) di header
2. Pilih Motion Type (Reach, Move, Grasp, etc)
3. Input parameter (Jarak, Case)
4. Add Motion -> TMU terhitung otomatis

**Konversi:**
1 TMU = 0.036 detik
            `
        },
        allowance: {
            title: '🔧 Allowance Calculator',
            content: `
**Fungsi:**
Menghitung kelonggaran (allowance) untuk penetapan waktu standar.

**Fitur:**
• Input Normal Time
• Basic Allowances (Personal, Fatigue, Delay)
• Variable Fatigue (Standing, Lifting, Lighting, etc)
• Output: Standard Time final
            `
        },
        rearrange: {
            title: '🔄 Rearrange & Simulate',
            content: `
**Fungsi:**
Simulasi penyusunan ulang urutan elemen untuk optimasi cycle time.

**Cara Pakai:**

1. Klik icon 🔄 di header
2. Pilih project dari dropdown
3. Drag & drop elemen untuk ubah urutan
4. Lihat perubahan cycle time secara real-time
5. Compare before vs after
6. Save arrangement baru jika lebih baik

**Use Case:**
• Optimasi sequence kerja
• Eliminasi backtracking
• Grouping aktivitas sejenis
• Reduce setup/changeover time
• Improve flow efficiency

**Tips:**
• Group elemen VA bersamaan
• Minimize perpindahan antar workstation
• Eliminate unnecessary NVA
            `
        },
        cycleanalysis: {
            title: '📈 Cycle Time Analysis',
            content: `
**Fungsi:**
Analisis detail waktu cycle individual dengan breakdown per elemen.

**Cara Pakai:**

1. Klik icon 📈 di header
2. Pilih project dari dropdown
3. Review breakdown:
   • Cycle time total
   • Time per elemen
   • Percentage contribution
   • Kategori distribution

**Analisis:**
• Identifikasi elemen terlama
• Cari opportunity improvement
• Validasi balance antar elemen
• Track performance metrics

**Output:**
• Detailed time breakdown table
• Visual charts
• Export ke Excel
            `
        },
        aggregation: {
            title: 'Σ Cycle Time Aggregation',
            content: `
**Fungsi:**
Agregasi data cycle time dari multiple projects untuk analisis statistik.

**Cara Pakai:**

1. Klik icon Σ di header
2. Pilih multiple projects (min 2)
3. Review agregasi:
   • Average time per elemen
   • Min/Max/Std deviation
   • Frequency distribution
   • Outlier detection

**Metrics:**
• Mean cycle time
• Standard deviation
• Coefficient of variation
• Process capability

**Use Case:**
• Validasi consistency
• Identify variation
• Set standard time
• Process improvement tracking

**Tips:**
• Minimal 10 cycles untuk statistik valid
• Remove outliers jika ada special cause
• Track trend over time
            `
        },
        bestworst: {
            title: '🏆 Best/Worst Analysis',
            content: `
**Fungsi:**
Identifikasi cycle tercepat (best) dan terlambat (worst) dari multiple sesi.

**Cara Pakai:**

1. Klik icon 🏆 di header
2. Pilih minimal 2 sesi dari list
3. Review hasil:
   • 🏆 Best Cycle (tercepat)
   • 📉 Worst Cycle (terlambat)
   • ⚡ Potential Savings
   • 📊 Ranking semua cycle
   • 📋 Element comparison table

**Insight:**
Lihat element mana yang punya variasi waktu terbesar untuk fokus improvement.
            `
        },
        comparison: {
            title: '🎥 Video Comparison',
            content: `
**Fungsi:**
Bandingkan 2 video secara side-by-side dengan playback synchron.

**Cara Pakai:**

1. Klik icon 🎥 di header
2. Pilih Left Video & Right Video dari dropdown
3. Toggle 🔗 Synchronized Playback (on/off)
4. Control:
   • ▶/⏸ Play/Pause both videos
   • Speed: 0.5x, 1x, 1.5x, 2x
5. Lihat stats comparison di bawah

**Use Case:**
• Before vs After improvement
• Operator A vs Operator B
• Method 1 vs Method 2
            `
        },
        therblig: {
            title: '📍 Therblig Analysis',
            content: `
**Fungsi:**
Visualisasi Therblig flow diagram untuk analisis gerakan dan layout workstation.

**Cara Pakai:**

1. Klik icon 📍 di header
2. Pilih project dari dropdown
3. Chart otomatis generate dengan:
   • Therblig icons untuk setiap elemen
   • Flow lines menunjukkan urutan gerakan
   • Colors sesuai kategori (VA/NVA/Waste)

**Interaksi:**
• 🖱️ Drag icons untuk arrange layout
• 📏 Lihat sequence dan flow pattern
• 🎨 Warna garis sesuai kategori elemen

**Interpretasi:**
🔵 Blue Line = Value-added movement
🟡 Yellow Line = Non value-added movement
🔴 Red Line = Waste movement

**Analisis:**
✅ Identifikasi waste movement
✅ Optimasi sequence gerakan
✅ Improve workstation layout
✅ Reduce unnecessary motion
✅ Standardize work method

**Tips:**
• Banyak garis merah = banyak waste
• Crossing lines = layout kurang optimal
• Sequence panjang = perlu simplifikasi
            `
        },

        stdtime: {
            title: '⏱️ Standard Time',
            content: `
**Formula:**
Standard Time = Normal Time × (1 + Allowances)

**Langkah:**

1. Rekam minimal 10 cycles
2. Beri rating setiap elemen (1-5 bintang)
3. Klik ⏱️ Std Time
4. Select sessions dengan rating
5. Set allowances:
   • Personal (5-10%)
   • Fatigue (5-15%)
   • Delay (5-10%)
6. Review & export hasil

**Output:**
• Observed Time (rata-rata actual)
• Normal Time (adjusted by rating)
• Standard Time (final)
            `
        },
        tips: {
            title: '💡 Tips & Best Practices',
            content: `
**Pengukuran Akurat:**
✅ Gunakan frame-by-frame (← →) untuk presisi
✅ Zoom in untuk gerakan detail
✅ Gunakan slow motion (0.25x - 0.5x)

**Data Quality:**
✅ Rekam minimal 10 cycles untuk statistik
✅ Fokus 1 operasi per sesi  
✅ Pastikan lighting & angle video bagus
✅ Selalu export data untuk backup

**Workflow Optimization:**
✅ Gunakan Aggregation untuk validasi data
✅ Best/Worst analysis untuk cek variasi
✅ Comparison untuk track improvement
✅ Standard time untuk work standardization
            `
        },
        troubleshooting: {
            title: '🔧 Troubleshooting',
            content: `
**Video tidak muncul:**
✅ Cek format: MP4, WebM, Ogg supported
✅ Cek ukuran file (max ~500MB)
✅ Refresh browser (Ctrl+F5)

**Data hilang setelah refresh:**
⚠️ Data belum disimpan ke database
✅ Selalu klik 💾 sebelum close tab

**Performance lambat:**
✅ Kurangi zoom level
✅ Close tab browser lain
✅ Gunakan Chrome/Edge (recommended)

**Split tidak bekerja:**
✅ Pastikan waktu split berada di range element
✅ Format: angka desimal (contoh: 3.5)
            `
        },
        multiaxial: {
            title: '📑 Multi-Axial Analysis',
            content: `
**Fungsi:**
Analisis dan perbandingan multi-proyek dalam satu timeline (Gantt Chart). Ideal untuk Man-Machine Chart atau Two-Hand Process Chart.

**Cara Pakai:**
1. Klik icon 📑 di header
2. Pilih beberapa proyek sekaligus dari dropdown
3. Analisis visualisasi lane yang terpisah untuk setiap proyek
4. Gunakan zoom slider untuk detail waktu

**Use Case:**
• Membandingkan aktivitas Operator vs Mesin
• Analisis gerakan Tangan Kiri vs Tangan Kanan
• Membandingkan dua operator yang bekerja paralel
            `
        },
        manualcreation: {
            title: '📘 Manual Creation',
            content: `
**Fungsi:**
Membuat dokumen Instruksi Kerja (Work Instruction/SOP) visual dengan mengambil gambar langsung dari video.

**Cara Pakai:**
1. Klik icon 📘 di header
2. Pilih proyek dengan video
3. Untuk setiap langkah kerja:
   • Play/Seek video ke posisi yang tepat
   • Klik tombol **📸 Capture**
   • Isi Deskripsi, Key Points, dan Safety Notes
4. Klik **Export PDF** untuk mengunduh dokumen

**Fitur:**
• Auto-capture frame video resolusi tinggi
• Format tabel standar industri
• Export PDF siap cetak
            `
        },
        mldata: {
            title: '🧠 Machine Learning Data',
            content: `
**Fungsi:**
Analisis konsistensi gerakan operator menggunakan konsep Machine Learning dengan Golden Cycle sebagai referensi standar.

**Cara Pakai:**

1. Klik icon 🧠 di header
2. **Set Golden Cycle** (Gerakan Referensi):
   • **Capture Current**: Ambil dari video saat ini
   • **Upload Video**: Upload video gerakan standar
3. Klik **Start Analysis** untuk mulai deteksi
4. Monitor real-time:
   • Consistency Score (% kecocokan)
   • Anomaly Graph (tren deviasi)
   • Live Skeleton Feed (visualisasi)

**Fitur:**
• **Golden Cycle**: Gerakan referensi "sempurna" sebagai standar
• **Consistency Gauge**: Indikator % kecocokan real-time
• **Anomaly Detection**: Deteksi penyimpangan otomatis
• **Trend Graph**: Grafik konsistensi dari waktu ke waktu
• **Live Visualization**: Canvas overlay untuk pose detection

**Use Case:**
• Validasi konsistensi gerakan operator
• Training operator baru dengan standar
• Quality control gerakan kerja
• Identifikasi variasi yang tidak sesuai SOP

**Tips:**
• Upload video gerakan terbaik sebagai Golden Cycle
• Threshold 80% = batas minimum konsistensi
• Anomaly tinggi = perlu retraining operator
            `
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Sidebar Navigation */}
            <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto', borderRight: '1px solid #444', paddingRight: '15px' }}>
                <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '1.3rem' }}>📚 Panduan</h2>
                {Object.entries(sections).map(([key, section]) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: activeSection === key ? 'var(--accent-blue)' : '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (activeSection !== key) e.target.style.backgroundColor = '#333';
                        }}
                        onMouseLeave={(e) => {
                            if (activeSection !== key) e.target.style.backgroundColor = '#2a2a2a';
                        }}
                    >
                        {section.title}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
                    <h1 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '2rem' }}>
                        {sections[activeSection].title}
                    </h1>
                    <div style={{
                        color: '#ddd',
                        fontSize: '1rem',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-line'
                    }}>
                        {sections[activeSection].content.split('\n').map((line, idx) => {
                            // Handle bold text
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return <div key={idx} style={{ fontWeight: 'bold', color: '#4da6ff', marginTop: '15px', fontSize: '1.1rem' }}>{line.replace(/\*\*/g, '')}</div>;
                            }
                            // Handle bullet points
                            if (line.trim().startsWith('•') || line.trim().startsWith('✅') || line.trim().startsWith('⚠️')) {
                                return <div key={idx} style={{ marginLeft: '20px', marginTop: '8px' }}>{line}</div>;
                            }
                            // Handle numbered lists
                            if (/^\d+[️⃣]/.test(line.trim())) {
                                return <div key={idx} style={{ marginLeft: '20px', marginTop: '10px', fontWeight: 'bold', color: '#0a5' }}>{line}</div>;
                            }
                            // Regular text
                            return line.trim() ? <div key={idx} style={{ marginTop: '8px' }}>{line}</div> : <div key={idx} style={{ height: '10px' }}></div>;
                        })}
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>🔗 Quick Links</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                        <div style={{ padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveSection('quick')}>
                            ⚡ Quick Start
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveSection('features')}>
                            🎬 Fitur Utama
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveSection('tips')}>
                            💡 Tips
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem', padding: '10px' }}>
                    <p>MAVi v2.1 - Motion Analysis & Visualization</p>
                    <p>Untuk panduan lengkap, lihat file: <code style={{ backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '3px' }}>PANDUAN_PENGGUNAAN.md</code></p>
                </div>
            </div>
        </div>
    );
}

export default Help;
