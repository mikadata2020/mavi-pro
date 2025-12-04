# 📖 Panduan Penggunaan MAVi
## Motion Analysis & Visualization Application

---

## 📋 Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Memulai Aplikasi](#memulai-aplikasi)
3. [Fitur Utama](#fitur-utama)
4. [Panduan Step-by-Step](#panduan-step-by-step)
5. [Fitur Analisis Lanjutan](#fitur-analisis-lanjutan)
6. [Tips & Trik](#tips--trik)

---

## 🎯 Pengenalan

**MAVi** adalah aplikasi analisis gerakan berbasis web yang dirancang untuk:
- ✅ Menganalisis video kerja/operasi
- ✅ Mengukur waktu setiap elemen gerakan
- ✅ Mengklasifikasikan aktivitas (Value-added, Non value-added, Waste)
- ✅ Menghitung standard time & productivity metrics
- ✅ Membandingkan sesi recording
- ✅ Simulasi improvement & eliminasi waste

---

## 🚀 Memulai Aplikasi

### Instalasi & Menjalankan
```bash
# 1. Install dependencies
npm install

# 2. Jalankan aplikasi
npm run dev

# 3. Buka browser di:
http://localhost:5173/
```

### Interface Utama
Aplikasi terdiri dari **Header Navigation** dengan icon-icon fitur:

| Icon | Fitur | Fungsi |
|------|-------|--------|
| 🎬 | Video | Workspace analisis video |
| 📊 | Analysis | Dashboard analisis, OEE, & charts |
| 🔄 | Rearrange | Simulasi penyusunan ulang elemen |
| 📈 | Cycle Analysis | Analisis detail cycle time |
| Σ | Aggregation | Agregasi data cycle time |
| ⏱️ | Std Time | Kalkulasi standard time |
| 🗑️ | Waste | Simulasi eliminasi waste |
| 📍 | Therblig | Analisis Therblig & Spaghetti Chart |
| 📉 | Statistical | Analisis statistik (Cp, Cpk, Control Chart) |
| ⏱️ | MTM Calc | Kalkulasi waktu baku metode MTM-1 |
| 🔧 | Allowance | Kalkulasi kelonggaran & fatigue |
| 🏆 | Best/Worst | Analisis cycle terbaik/terburuk |
| 🎥 | Compare | Video side-by-side comparison |
| 📑 | Multi-Axial | Analisis multi-project (Man-Machine/Two-Hand) |
| 📘 | Manual | Pembuatan manual kerja (Work Instruction) |
| 🧠 | ML Data | Machine Learning Consistency Check |
| ❓ | Help | Panduan penggunaan |

---

## 🎬 Fitur Utama

### 1. Video Analysis Workspace

**Langkah-langkah:**

#### A. Upload Video
1. Klik icon **🎬 Video** di header
2. Klik tombol **"Upload Video"** atau drag & drop file video
3. Video akan muncul di player

#### B. Melakukan Pengukuran
1. **Play video** dengan tombol ▶
2. Untuk mengukur:
   - Tekan **S** saat elemen dimulai (Start)
   - Tekan **E** saat elemen selesai (End)
3. Dialog akan muncul untuk input:
   - ✏️ **Nama Elemen** (contoh: "Ambil baut")
   - 🏷️ **Kategori**:
     - **Value-added**: Aktivitas yang menambah nilai
     - **Non value-added**: Aktivitas perlu tapi tidak menambah nilai
     - **Waste**: Pemborosan yang harus dieliminasi
4. Klik **"Save"**

#### C. Playback Controls
- ▶/⏸ : Play/Pause
- ⏮ / ⏭ : Previous/Next Frame
- **Speed**: 0.25x - 8x
- **Zoom**: 0.5x - 3x
- ◀/▶ : Normal/Reverse mode

#### D. Rating Speed
- Jika elemen punya **Rating** (bintang 1-5)
- Toggle **⭐ Rating Speed** akan muncul
- Speed otomatis = Average Rating / 100

---

### 2. Element Editor (Panel Kanan)

**Toolbar:**
- 💾 : Simpan ke database
- 📊 : Export ke Excel
- 🔍 : Cari elemen
- Filter kategori & rating
- Sort by: Order, Cycle, Duration, Rating, Name

**Tombol Aksi:**
- ▲/▼ : Pindah urutan atas/bawah
- ✎ : Edit nama & kategori
- ✂️ : Split elemen
- 🗑 : Hapus elemen

---

### 3. 📊 Analysis Dashboard

**🎯 Tujuan:** Mendapatkan insight ringkas, visual, dan metrik produktivitas dari hasil analisis.

**Menampilkan:**
1. **Summary Cards**
   - Total Time & Elements
   - Average Rating
   - Value-added %

2. **Productivity Metrics (BARU!)**
   - **OEE (Overall Equipment Effectiveness)**: Availability x Performance x Quality
   - **Efficiency**: Rasio output aktual vs standar
   - **Takt vs Cycle**: Analisis kesesuaian dengan demand pelanggan
   - **Productivity Index**: Indeks komprehensif performa

3. **Charts**
   - **Category Distribution**: Pie chart VA/NVA/Waste
   - **Top Elements**: Bar chart durasi elemen terlama
   - **Gantt Chart**: Visualisasi urutan kerja

---

### 4. 📉 Statistical Analysis (BARU!)

**🎯 Tujuan:** Analisis mendalam variabilitas proses dan kapabilitas sistem.

**Fitur:**
1. **Summary Statistics**: Mean, Median, Std Dev, Min/Max, CV.
2. **Confidence Interval**: Estimasi rentang rata-rata populasi (90%, 95%, 99%).
3. **Process Capability**:
   - **Cp/Cpk**: Mengukur kemampuan proses memenuhi spesifikasi (LSL/USL).
   - Indikator kapabilitas (Capable/Not Capable).
4. **Control Chart (I-Chart)**:
   - Visualisasi stabilitas proses.
   - Garis UCL (Upper Control Limit) dan LCL (Lower Control Limit).
5. **Histogram**: Distribusi frekuensi data.
6. **Outlier Detection**: Deteksi data pencilan yang tidak wajar.
7. **Export PDF**: Download laporan statistik lengkap.

---

### 5. ⏱️ MTM Calculator (BARU!)

**🎯 Tujuan:** Menghitung waktu baku menggunakan metode *Methods-Time Measurement* (MTM-1) tanpa stopwatch.

**Cara Pakai:**
1. Pilih **Motion Type** (Reach, Move, Grasp, Position, dll).
2. Tentukan parameter (Jarak, Case, Type).
3. Klik **Add Motion**.
4. Sistem menghitung **TMU** (Time Measurement Unit) dan konversi ke detik/menit.
5. Total waktu akan terakumulasi otomatis.

**Referensi:** 1 TMU = 0.036 detik.

---

### 6. 🔧 Allowance Calculator (BARU!)

**🎯 Tujuan:** Menghitung kelonggaran (allowance) secara ilmiah untuk penetapan waktu standar.

**Fitur:**
1. **Input Normal Time**.
2. **Basic Allowances**: Personal needs, Basic fatigue, Delay.
3. **Variable Fatigue**:
   - Standing/Posture
   - Lifting weight
   - Light/Atmosphere
   - Mental strain/Monotony
4. **Output**:
   - Total Fatigue %
   - Standard Time final.

---

### 7. 🔄 Element Rearrangement

**🎯 Tujuan:** Mencari susunan elemen optimal untuk mengurangi cycle time dengan simulasi.

**Cara Pakai:**
1. Klik icon **🔄**
2. Drag & drop elemen untuk ubah urutan
3. Lihat perbandingan **Time Saved**

---

### 8. ⚖️ Comparison Dashboard

**🎯 Tujuan:** Membandingkan performa antar sesi untuk validasi konsistensi.

**Langkah:**
1. Klik **⚖️ Comparison** (atau icon Compare di menu)
2. Pilih minimal 2 sesi dari dropdown
3. Review comparison table & element differences
4. Export to Excel

---

### 9. 📈 Cycle Aggregation

**🎯 Tujuan:** Agregasi data statistik dari multiple sesi.

**Fitur:**
1. Select multiple sessions
2. View statistics (Min, Max, Avg) per elemen
3. Export aggregation data

---

### 10. ⏱️ Standard Time Calculation

**🎯 Tujuan:** Menetapkan waktu standar produksi.

**Formula:** `Standard Time = Normal Time × (1 + Allowances)`

**Input:**
1. Select sessions & Rating factor
2. Set allowances (Personal, Fatigue, Delay)
3. Output: Observed, Normal, & Standard Time

---

### 11. 🗑️ Waste Elimination Simulation

**🎯 Tujuan:** Menghitung potential savings dari eliminasi waste.

**Tampilan:**
- **Before vs After** comparison
- **Time Saved** & **% Improvement**
- Detail waste yang dieliminasi

---

### 12. 🏆 Best/Worst Cycle Analysis

**🎯 Tujuan:** Identifikasi variabilitas performa ekstrem.

**Fitur:**
- Identifikasi **Best Cycle** (tercepat) & **Worst Cycle** (terlambat)
- Hitung **Potential Savings** jika semua cycle seperti best cycle
- Ranking semua cycle

---

### 13. 🎥 Video Side-by-Side Comparison

**🎯 Tujuan:** Visual comparison method kerja secara real-time.

**Fitur:**
- Play 2 video secara sinkron
- Speed control independent atau linked
- Visualisasi perbedaan gerakan operator

---

### 14. 📍 Therblig & Spaghetti Chart

**🎯 Tujuan:** Analisis gerakan mikro (Therblig) dan aliran perpindahan (Spaghetti Chart).

**Fitur:**
- **Spaghetti Chart**: Visualisasi path pergerakan operator di layout.
- Identifikasi backtracking dan long travel distance.
- Analisis elemen Therblig (Search, Select, Grasp, dll).

---

### 15. 🎙️ Narration Recording

**🎯 Tujuan:** Dokumentasi audio untuk analisis.

**Cara Pakai:**
1. Di Video Workspace, buka panel kanan bawah.
2. Klik **🎙️ Start Recording**.
3. Rekam komentar/penjelasan.
4. Playback atau re-record sesuai kebutuhan.

---

---

### 16. 📑 Multi-Axial Analysis (BARU!)

**🎯 Tujuan:** Menganalisis dan membandingkan beberapa proyek secara bersamaan dalam satu timeline (Gantt Chart). Cocok untuk analisis Man-Machine atau Two-Hand Process Chart.

**Fitur:**
- **Multi-Project Selection**: Pilih beberapa proyek (misal: "Operator" dan "Mesin").
- **Timeline Visualization**: Visualisasi aktivitas dalam lane terpisah.
- **Zoom Control**: Atur skala waktu untuk detail lebih baik.

**Cara Pakai:**
1. Klik icon 📑 di header.
2. Pilih proyek-proyek yang ingin dibandingkan.
3. Analisis interaksi antar lane (misal: operator menunggu mesin).

---

### 17. 📋 Standard Work Combination Sheet (SWCS) Export (BARU!)

**🎯 Tujuan:** Menghasilkan dokumen Standard Work Combination Sheet dalam format PDF standar industri.

**Fitur:**
- **Header Input**: Nama Part, No Part, Takt Time, Tanggal, dll.
- **Auto-Chart**: Visualisasi Manual (Hijau), Auto (Biru putus-putus), dan Walk (Merah gelombang).
- **PDF Export**: Download dokumen siap cetak.

**Cara Pakai:**
1. Buka menu SWCS (bisa via menu utama atau shortcut jika ada).
2. Pilih proyek.
3. Isi data header.
4. Klik **Export PDF**.

---

### 18. 📘 Manual Creation (Work Instruction) (BARU!)

**🎯 Tujuan:** Membuat dokumen instruksi kerja (Work Instruction/SOP) visual dengan cepat dari video.

**Fitur:**
- **Video Capture**: Ambil screenshot langsung dari video untuk setiap langkah.
- **Text Editor**: Tambahkan deskripsi, poin kunci, dan safety/quality notes.
- **PDF Export**: Generate dokumen manual lengkap dengan gambar dan teks.

**Cara Pakai:**
1. Klik icon 📘 di header.
2. Pilih proyek dengan video.
3. Untuk setiap elemen:
   - Seek video ke posisi yang tepat.
   - Klik **Capture** untuk ambil gambar.
   - Isi deskripsi dan poin penting.
4. Klik **Export PDF** untuk unduh manual.

---

### 19. 🧠 Machine Learning Data (BARU!)

**🎯 Tujuan:** Menganalisis konsistensi gerakan operator menggunakan konsep Machine Learning dengan "Golden Cycle" sebagai referensi standar.

**Fitur:**
- **Golden Cycle Management**: Set gerakan referensi dari video saat ini atau upload video terpisah.
- **Real-time Consistency Score**: Gauge yang menampilkan % kecocokan dengan Golden Cycle.
- **Anomaly Detection**: Deteksi otomatis penyimpangan dari standar.
- **Trend Visualization**: Grafik real-time yang menunjukkan konsistensi dari waktu ke waktu.
- **Live Skeleton Feed**: Canvas overlay untuk visualisasi pose detection.

**Cara Pakai:**
1. Klik icon 🧠 di header.
2. **Set Golden Cycle** (pilih salah satu):
   - **📹 Capture Current**: Ambil dari video yang sedang diputar
   - **📤 Upload Video**: Upload video gerakan standar terpisah
3. Klik **Start Analysis** untuk mulai deteksi konsistensi.
4. Monitor metrics:
   - **Consistency Score**: % kecocokan (target >80%)
   - **Anomalies**: Jumlah penyimpangan terdeteksi
   - **Trend Graph**: Grafik konsistensi real-time

**Use Case:**
- Validasi konsistensi gerakan operator dengan SOP
- Training operator baru menggunakan Golden Cycle
- Quality control untuk standardized work
- Identifikasi operator yang perlu retraining

---

## 📝 Panduan Step-by-Step

### Workflow 1: Analisis Video Baru
```
1. Upload Video (🎬)
   ↓
2. Lakukan Pengukuran (S/E keys)
   ↓
3. Input Nama & Kategori
   ↓
4. Simpan ke Database (💾)
   ↓
5. Lihat Analysis & Metrics (📊)
```

### Workflow 2: Penetapan Waktu Standar Lengkap
```
1. Analisis Video & Rating (🎬)
   ↓
2. Cek Statistik & Outlier (📉)
   ↓
3. Hitung Allowance (🔧)
   ↓
4. Kalkulasi Standard Time (⏱️)
```

---

## 📈 Update Log

### Version 2.2 (Current)
- ✅ **New**: Machine Learning Data (Consistency Check with Golden Cycle)
- ✅ **New**: Multi-Axial Analysis (Man-Machine / Two-Hand Chart)
- ✅ **New**: Standard Work Combination Sheet (SWCS) PDF Export
- ✅ **New**: Manual Creation (Work Instruction Generator) with Video Capture
- ✅ **Update**: Enhanced Documentation

### Version 2.1
- ✅ **New**: Statistical Analysis Module (Cp, Cpk, Control Charts)
- ✅ **New**: MTM-1 Calculator
- ✅ **New**: Allowance Calculator with variable fatigue factors
- ✅ **New**: Productivity Metrics (OEE, Takt Time, Efficiency)
- ✅ **Update**: Enhanced Analysis Dashboard

### Version 2.0
- ✅ Best/Worst Cycle Analysis
- ✅ Rating Speed Playback
- ✅ Video Side-by-Side Comparison
- ✅ Element Split functionality
- ✅ Icon-only navigation UI

### Version 1.0
- Basic video analysis
- Element categorization
- Analysis dashboard
- Comparison & aggregation
- Standard time calculation

---

**© 2024 MAVi - Motion Analysis & Visualization**
