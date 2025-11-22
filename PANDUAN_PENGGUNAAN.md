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
- ✅ Menghitung standard time
- ✅ Membandingkan sesi recording
- ✅ Simulasi improvement

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
| 📊 | Analysis | Dashboard analisis & charts |
| 🔄 | Rearrange | Simulasi penyusunan ulang elemen |
| ⚖️ | Comparison | Bandingkan multiple sesi |
| 📈 | Aggregation | Agregasi data cycle time |
| ⏱️ | Std Time | Kalkulasi standard time |
| 🗑️ | Waste | Simulasi eliminasi waste |
| 🏆 | Best/Worst | Analisis cycle terbaik/terburuk |
| 🎥 | Compare | Video side-by-side |

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

#### D. Rating Speed (Fitur Baru!)
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

**Tabel Elemen:**
| Kolom | Keterangan |
|-------|------------|
| No. | Nomor urut |
| Cycle | Nomor siklus |
| Nama Elemen | Nama aktivitas |
| Kategori | VA / NVA / Waste |
| Rating | Bintang 1-5 (klik untuk ubah) |
| Start/Finish | Waktu mulai & selesai |
| Waktu | Durasi (detik) |
| Aksi | Tombol kontrol |

**Tombol Aksi:**
- ▲/▼ : Pindah urutan atas/bawah
- ✎ : Edit nama & kategori
- ✂️ : **[BARU!]** Split elemen
- 🗑 : Hapus elemen

---

### 3. 📊 Analysis Dashboard

**🎯 Tujuan:** Mendapatkan insight ringkas dan visual dari hasil analisis video untuk evaluasi cepat performa dan identifikasi area improvement.

**Menampilkan:**
1. **Summary Cards**
   - Total Time
   - Number of Elements
   - Average per Element
   - Efficiency %

2. **Category Distribution (Pie Chart)**
   - Value-added %
   - Non value-added %
   - Waste %

3. **Timeline Bars**
   - Visual representasi setiap elemen
   - Warna sesuai kategori

4. **Element Duration Chart**
   - Bar chart durasi per elemen
   - Sorted by duration

---

### 4. 🔄 Element Rearrangement

**🎯 Tujuan:** Mencari susunan elemen optimal untuk mengurangi cycle time dengan simulasi tanpa perlu melakukan percobaan fisik.

**Fungsi:** Simulasi penyusunan ulang elemen untuk optimasi

**Cara Pakai:**
1. Klik icon **🔄**
2. Drag & drop elemen untuk ubah urutan
3. Lihat perbandingan:
   - **Original Order**
   - **New Order**
   - **Time Saved**

---

### 5. ⚖️ Comparison Dashboard

**🎯 Tujuan:** Membandingkan performa antar sesi untuk validasi konsistensi, identifikasi best practice, atau evaluasi improvement.

**Fungsi:** Bandingkan multiple sesi recording

**Langkah:**
1. Klik **⚖️ Comparison**
2. Pilih minimal 2 sesi dari dropdown
3. Review:
   - Comparison table (elemen per sesi)
   - Total time comparison
   - Element-by-element difference
4. **Export to Excel** untuk dokumentasi

---

### 6. 📈 Cycle Aggregation

**🎯 Tujuan:** Mendapatkan data statistik yang reliable dengan mengagregasi multiple sesi untuk decision making yang lebih akurat.

**Fungsi:** Agregasi data dari multiple sesi

**Fitur:**
1. Select multiple sessions
2. View statistics:
   - Min, Max, Average, Std Dev per elemen
   - Total cycle time stats
3. Export aggregation data

---

### 7. ⏱️ Standard Time Calculation

**🎯 Tujuan:** Menetapkan waktu standar yang fair dan realistic untuk perencanaan produksi, costing, dan performance measurement.

**Formula:** `Standard Time = Normal Time × (1 + Allowances)`

**Input:**
1. Select sessions
2. Pilih rating factor (60%-140%)
3. Set allowances:
   - Personal (5-10%)
   - Fatigue (5-15%)
   - Delay (5-10%)

**Output:**
- Observed Time
- Normal Time
- Standard Time
- Export to Excel

---

### 8. 🗑️ Waste Elimination Simulation

**🎯 Tujuan:** Menghitung dan memvisualisasikan potential savings dari eliminasi waste untuk justifikasi project improvement.

**Fungsi:** Simulasi penghapusan waste

**Tampilan:**
- **Before**: Total time dengan waste
- **After**: Total time tanpa waste  
- **Time Saved** & **% Improvement**
- Detail waste yang dieliminasi

---

### 9. 🏆 Best/Worst Cycle Analysis **[FITUR BARU!]**

**🎯 Tujuan:** Mengidentifikasi variabilitas performa untuk standardisasi best practice dan eliminasi faktor penyebab cycle lambat.

**Fungsi:** Identifikasi cycle terbaik & terburuk

**Cara Pakai:**
1. Klik icon **🏆**
2. Pilih minimal 2 sesi dari list
3. Review hasil:
   - 🏆 **Best Cycle** (tercepat)
   - 📉 **Worst Cycle** (terlambat)
   - ⚡ **Potential Savings**
   - 📊 **All Cycles Ranking**
   - 📋 **Element Comparison** table dengan % difference

---

### 10. 🎥 Video Side-by-Side Comparison **[FITUR BARU!]**

**🎯 Tujuan:** Melakukan visual comparison untuk training, validasi improvement, atau benchmarking method kerja secara real-time.

**Fungsi:** Bandingkan 2 video secara visual

**Cara Pakai:**
1. Klik icon **🎥**
2. Pilih **Left Video** dari dropdown
3. Pilih **Right Video** dari dropdown
4. Toggle **🔗 Synchronized Playback** (on/off)
5. Control:
   - ▶/⏸ Play/Pause (both videos)
   - Speed: 0.5x, 1x, 1.5x, 2x
6. Lihat stats total per video

---

### 11. 🍝 Spaghetti Chart **[FITUR BARU!]**

**🎯 Tujuan:** Menganalisis dan mengoptimasi layout workstation dengan visualisasi flow pattern untuk mengurangi waste transport dan walking distance.

**Fungsi:** Visualisasi diagram pergerakan (movement diagram)

**Cara Pakai:**
1. Klik icon **🍝**
2. Pilih session dari dropdown
3. Chart otomatis generate:
   - 🔵 Nodes (stations) dari nama elemen
   - ➡️ Paths (arrows) menunjukkan flow
   - 🎨 Colors sesuai kategori
4. **Drag nodes** untuk arrange layout optimal
5. Adjust **Grid Size** dengan slider (25-100px)
6. Review statistics:
   - Total moves
   - Number of stations  
   - Path distribution by category

**Interpretasi Visual:**
- 🔵 **Blue Circle** = Station/Location point
- ➡️ **Curved Arrow** = Movement path dengan direction
- **(Nx)** = Visit frequency (berapa kali dikunjungi)
- **Path Colors**:
  - 🟦 Blue = Value-added movement
  - 🟨 Yellow = Non value-added movement
  - 🟥 Red = Waste (backtracking, excess transport)

**Analisis:**
- ✅ Identifikasi **backtracking** (bolak-balik tidak perlu)
- ✅ Cari **waste transport** (jarak berlebihan)
- ✅ Optimasi **workstation layout**
- ✅ Reduce **walking distance**
- ✅ Improve **flow efficiency**

**Red Flags:**
- ⚠️ Banyak garis merah = waste movement tinggi
- ⚠️ Crossing paths = layout kurang optimal
- ⚠️ High visit count (>3x) = bottleneck station
- ⚠️ Long distance red paths = prioritas improvement

**Tips Optimasi:**
1. **Minimize crossings** - arrange nodes agar path tidak bersilangan
2. **Group related stations** - dekatkan station yang sering connected
3. **Eliminate backtracking** - rearrange untuk one-way flow
4. **Balance load** - cek station dengan visit count tinggi

---

### 12. 🎙️ Narration Recording **[FITUR BARU!]**

**🎯 Tujuan:** Mendokumentasikan analisis dengan narasi audio untuk keperluan training, presentasi, atau dokumentasi improvement.

**Fungsi:** Merekam narasi audio (voice commentary)

**Cara Pakai:**
1. Buka **🎬 Video** workspace
2. Scroll ke panel kanan (di bawah Element Editor)
3. Klik **🎙️ Start Recording**
4. **Allow microphone permission** (browser akan prompt)
5. Mulai berbicara untuk record narasi Anda
6. Gunakan controls:
   - ⏸ **Pause** - pause recording sementara
   - ▶ **Resume** - lanjutkan recording
   - ⏹ **Stop** - selesai recording
7. Narasi tersimpan otomatis dengan session

**Playback & Management:**
- ▶ **Play Narration** - dengar hasil recording
- 🔄 **Re-record** - rekam ulang jika tidak puas  
- 🗑 **Delete** - hapus narration

**Recording Indicator:**
- 🔴 Blinking red dot = sedang recording
- ⏸ PAUSED = recording di-pause
- Timer menunjukkan durasi recording

**Technical Details:**
- Menggunakan **MediaRecorder API**
- Audio format: WebM
- Storage: Base64 string di IndexedDB
- Terintegrasi dengan session data

**Best Practices:**
- ✅ Rekam di **lingkungan tenang** untuk audio jernih
- ✅ Gunakan **external microphone** untuk kualitas lebih baik
- ✅ Test microphone sebelum recording penting
- ✅ Pause recording jika ada interupsi
- ✅ Re-record jika ada kesalahan

**Use Cases:**
1. **Training Material**
   - Record penjelasan step-by-step
   - Voice-over untuk video analysis
   - Instruksi untuk operator baru

2. **Improvement Documentation**
   - Narasi before/after improvement
   - Penjelasan waste yang ditemukan
   - Justifikasi perubahan layout/method

3. **Presentation**
   - Narasi untuk presentation ke management
   - Walkthrough analysis results
   - Project review dengan audio commentary

4. **Review Session**
   - Catatan lisan saat analisis
   - Observasi langsung yang perlu didokumentasi
   - Diskusi team yang direkam

**Tips:**
- 💡 Record narasi setelah selesai analisis
- 💡 Buat outline sebelum recording untuk flow yang baik
- 💡 Pause recording jika perlu mikir atau cek data
- 💡 Simpan session setelah recording selesai

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
4. Beri Rating (opsional)
   ↓
5. Simpan ke Database (💾)
   ↓
6. Lihat Analysis (📊)
   ↓
7. Export to Excel (📊)
```

### Workflow 2: Perbandingan Multiple Sesi

```
1. Rekam 3-5 sesi video yang sama
   ↓
2. Simpan semua ke database
   ↓
3. Buka Comparison (⚖️)
   ↓
4. Select all sessions
   ↓
5. Review comparison table
   ↓
6. Export comparison data
```

### Workflow 3: Kalkulasi Standard Time

```
1. Rekam minimal 10 cycle
   ↓
2. Beri rating setiap elemen (1-5 bintang)
   ↓
3. Buka Standard Time (⏱️)
   ↓
4. Select sessions dengan rating
   ↓
5. Set allowances (Personal, Fatigue, Delay)
   ↓
6. Review standard time
   ↓
7. Export to Excel
```

### Workflow 4: Improvement Analysis

```
1. Identifikasi waste (Analysis 📊)
   ↓
2. Simulasi eliminasi (Waste 🗑️)
   ↓
3. Simulasi rearrangement (Rearrange 🔄)
   ↓
4. Bandingkan before/after
   ↓
5. Hitung potential savings
   ↓
6. Dokumentasi improvement
```

---

## 🔧 Fitur Lanjutan

### Element Split ✂️ **[FITUR BARU!]**

**Kapan digunakan:**
- Elemen terlalu panjang
- Perlu detail breakdown

**Cara:**
1. Klik tombol **✂️** pada elemen
2. Input waktu split (dalam detik)
   - Contoh: Element 2.5s-5.0s → split di 3.5s
3. Hasil: 2 elemen baru
   - `Nama (1)` : 2.5s - 3.5s
   - `Nama (2)` : 3.5s - 5.0s

### Keyboard Shortcuts

| Key | Fungsi |
|-----|--------|
| **Space** | Play/Pause |
| **S** | Start measurement |
| **E** | End measurement |
| **→** | Next frame |
| **←** | Previous frame |

### Session Management

**Menyimpan Sesi:**
1. Setelah selesai analisis, klik 💾
2. Data tersimpan di IndexedDB browser
3. Nama session = nama video + timestamp

**Load Sesi:**
1. Klik icon Sessions di header
2. Pilih sesi dari list
3. Data akan dimuat ke workspace

---

## 💡 Tips & Trik

### 1. Pengukuran Akurat
- ✅ Gunakan **frame-by-frame** (← →) untuk presisi
- ✅ Zoom in jika gerakan detail
- ✅ Gunakan slow motion (0.25x-0.5x)

### 2. Kategorisasi yang Benar
- **Value-added**: Mengubah bentuk/fungsi produk
- **Non value-added**: Perlu tapi tidak VA (setup, inspeksi)
- **Waste**: Bisa dieliminasi (tunggu, cari, transport berlebih)

### 3. Rating yang Konsisten
- ⭐⭐⭐⭐⭐ (100%): Operator sangat cepat & terampil
- ⭐⭐⭐ (60%): Operator normal
- ⭐ (20%): Operator sangat lambat

### 4. Optimasi Workflow
1. **Grouping**: Ukur beberapa cycle sekaligus
2. **Template**: Simpan kategori umum untuk reuse
3. **Batch Export**: Export multiple sessions sekaligus

### 5. Best Practices
- 📹 Rekam minimal **10 cycles** untuk data statistik
- 🎯 Fokus pada **1 operasi** per sesi
- 📊 Selalu **export data** untuk backup
- 🔄 Lakukan **cycle time aggregation** untuk validasi
- 🏆 Gunakan **Best/Worst analysis** untuk identifikasi variasi

---

## 📞 Troubleshooting

### Video tidak muncul
- ✅ Cek format: MP4, WebM, Ogg supported
- ✅ Cek ukuran file (max ~500MB)
- ✅ Refresh browser (Ctrl+F5)

### Data hilang setelah refresh
- ⚠️ Data belum disimpan ke database
- ✅ Selalu klik 💾 sebelum close

### Performance lambat
- ✅ Kurangi zoom level
- ✅ Close tab lain
- ✅ Gunakan browser modern (Chrome/Edge recommended)

---

## 📚 Glossary

- **Cycle**: Satu putaran lengkap operasi
- **Element**: Bagian kecil dari cycle
- **VA**: Value-Added (aktivitas menambah nilai)
- **NVA**: Non Value-Added
- **Standard Time**: Waktu standar untuk 1 cycle
- **Rating**: Performance rating (kecepatan operator)
- **Allowance**: Kelonggaran waktu (personal, fatigue, delay)

---

## 🎓 Contoh Kasus Penggunaan

### Kasus 1: Assembly Line
**Tujuan:** Analisis waktu assembly 1 produk

1. Rekam video assembly complete
2. Breakdown menjadi elemen:
   - Ambil komponen A (VA)
   - Pasang komponen A (VA)
   - Kencangkan baut (VA)
   - Cek visual (NVA)
   - Tunggu operator lain (Waste)
3. Analisis waste → 15% waiting time
4. Simulasi eliminasi → saving 8 detik per cycle
5. Dokumentasi improvement proposal

### Kasus 2: Packing Station
**Tujuan:** Standardisasi waktu packing

1. Rekam 10 cycles dari 3 operator berbeda
2. Beri rating setiap operator
3. Kalkulasi standard time
4. Identifikasi best practice (best cycle analysis)
5. Training berdasarkan best practice

---

## 📈 Update Log

### Version 2.0 (Latest)
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
- Waste elimination simulation

---

**© 2024 MAVi - Motion Analysis & Visualization**

*Untuk support & feedback, hubungi development team.*
