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
✅ Menghitung standard time
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
📊 **Analysis** - Dashboard charts & summary
🔄 **Rearrange** - Simulasi penyusunan ulang elemen
⚖️ **Comparison** - Bandingkan multiple sesi
📈 **Aggregation** - Agregasi cycle time data
⏱️ **Std Time** - Kalkulasi standard time
🗑️ **Waste** - Simulasi eliminasi waste
🍝 **Spaghetti** - Movement diagram ⭐ BARU!
🏆 **Best/Worst** - Analisis cycle terbaik/terburuk ⭐ BARU!
🎥 **Compare** - Video side-by-side ⭐ BARU!
🎙️ **Narration** - Audio recording ⭐ BARU!

**Element Editor Tools:**

💾 - Simpan ke database
📊 - Export ke Excel
🔍 - Cari elemen
▲/▼ - Pindah urutan
✎ - Edit nama & kategori
✂️ - Split elemen ⭐ BARU!
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
        spaghetti: {
            title: '🍝 Spaghetti Chart',
            content: `
**Fungsi:**
Visualisasi diagram pergerakan (movement diagram) untuk analisis flow & layout.

**Cara Pakai:**

1. Klik icon 🍝 di header
2. Pilih session dari dropdown
3. Chart otomatis generate dengan:
   • Nodes (stations) dari nama elemen
   • Paths (arrows) menunjukkan flow
   • Colors sesuai kategori

**Interaksi:**
• 🖱️ Drag nodes untuk arrange layout
• 📏 Adjust grid size dengan slider
• 👀 Lihat visit frequency (Nx) per station

**Interpretasi:**
🔵 Blue Circle = Station/Location
➡️ Curved Arrow = Movement path
🎨 Path Color:
  • Blue = Value-added movement
  • Yellow = Non value-added
  • Red = Waste (backtracking, extra transport)
(Nx) = Berapa kali station dikunjungi

**Analisis:**
✅ Identifikasi backtracking
✅ Cari waste transport
✅ Optimasi workstation layout
✅ Reduce walking distance
✅ Improve flow efficiency

**Tips:**
• Banyak garis merah = banyak waste movement
• Crossing paths = layout kurang optimal
• High visit count (>3x) = bottleneck station
            `
        },
        narration: {
            title: '🎙️ Narration Recording',
            content: `
**Fungsi:**
Merekam narasi audio untuk dokumentasi analisis, training material, atau catatan lisan.

**Cara Pakai:**

1. Buka Video Analysis workspace
2. Scroll ke panel kanan (di bawah Element Editor)
3. Klik 🎙️ Start Recording
4. Allow microphone permission (browser akan minta izin)
5. Mulai berbicara untuk record narasi
6. Controls:
   • ⏸ Pause - pause recording sementara
   • ▶ Resume - lanjutkan recording
   • ⏹ Stop - selesai recording
7. Setelah stop, narasi tersimpan otomatis

**Playback & Management:**
• ▶ Play Narration - dengar hasil recording
• 🔄 Re-record - rekam ulang jika tidak puas
• 🗑 Delete - hapus narration

**Tips:**
• Rekam di lingkungan tenang untuk kualitas audio terbaik
• Gunakan external microphone untuk hasil lebih baik
• Narasi disimpan sebagai base64 di database session
• Cocok untuk training material atau presentasi

**Use Cases:**
✅ Training operator dengan voice-over
✅ Dokumentasi improvement dengan penjelasan
✅ Review session dengan catatan lisan
✅ Presentation project dengan narasi
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
                    <p>MAVi v2.0 - Motion Analysis & Visualization</p>
                    <p>Untuk panduan lengkap, lihat file: <code style={{ backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '3px' }}>PANDUAN_PENGGUNAAN.md</code></p>
                </div>
            </div>
        </div>
    );
}

export default Help;
