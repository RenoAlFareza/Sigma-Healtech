<div align="center">

# 🏥 SIGMA Healtech
### Smart Hospital Pharmacy Supply Chain & Inventory Intelligence System
**Solusi Manajemen Logistik Farmasi Terpadu Berstandar OpenBoxes Core & KFA Kemenkes RI**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed_60/60-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Kemenkes KFA](https://img.shields.io/badge/Kemenkes_KFA-1.011_SKU-007EB4?style=for-the-badge)](https://kfa.kemkes.go.id/)

---

</div>

## 👥 Informasi Tim Pengembang

* **Nama Tim:** **Sigma**  
* **Asal Institusi:** **UPN "Veteran" Jawa Timur**

| Posisi | Nama Anggota | NPM |
| :--- | :--- | :--- |
| 👑 **Ketua Tim** | **Aswin Arung Ilmi** | `22081010099` |
| 💻 **Anggota 1** | **Reno Alfa Reza** | `23081010091` |
| 📊 **Anggota 2** | **Bevantyo Satria Pinandhita** | `22081010153` |

---

## 📖 Tentang Proyek

**SIGMA Healtech** adalah platform sistem informasi manajemen logistik dan farmasi rumah sakit modern yang dirancang untuk mengatasi tantangan kritis pengelolaan obat: *stockout* obat darurat, kerugian akibat kedaluwarsa (*expired drugs*), ketidaksesuaian fisik stok, dan transparansi alur distribusi antar depo.

Sistem ini mengadopsi standar alur kerja internasional **OpenBoxes Core** serta terintegrasi penuh dengan **Kamus Farmasi dan Alat Kesehatan (KFA) Kemenkes RI** dan izin edar resmi **BPOM**.

### 🎯 Tujuan Utama Aplikasi:
1. **Zero Stockout**: Mitigasi risiko kekosongan obat vital (*life-saving*) melalui prediksi *Average Daily Consumption (ADC)* dan rekomendasi *reorder point* otomatis.
2. **First-Expired, First-Out (FEFO)**: Pengambilan dan alokasi stok otomatis berdasarkan tanggal kedaluwarsa terdekat untuk menekan kerugian finansial rumah sakit.
3. **Standarisasi Regulasi KFA & BPOM**: Basis data terpadu 1.011 master obat nyata lengkap dengan NIE, zat aktif, bentuk sediaan, serta parameter keamanan (*High Alert*, *Cold Chain*, dan *LASA*).
4. **Audit Akuntabilitas 100%**: Pencatatan mutasi otomatis ke dalam Buku Besar Kartu Stok Elektronik (*Digital Stock Card*) pada setiap pergerakan barang.

---

## ✨ Fitur & Modul Utama Aplikasi

```text
SIGMA Healtech Core System
├── 1. 📊 Executive Analytics Dashboard (Curelo-Inspired Visuals)
├── 2. 🏢 Smart Inventory Management (Stok, Reorder, Fill Rate, Transfer, Stock Opname)
├── 3. 📥 Inbound Operations (PO Receiving & Guided Putaway ke Bin Rak)
├── 4. 📤 Outbound Operations (Permintaan Unit, Otorisasi Apoteker & FEFO Pick-Pack-Dispatch)
├── 5. 🛒 Procurement & Purchasing (Purchase Order Lifecycle & Multi-Vendor Tracking)
├── 6. 📑 Reports & Audit Intelligence (Pareto ABC, Risiko ED, Prediksi Stockout, Audit Opname)
└── 7. 💊 Master Katalog Produk KFA Kemenkes (1.011 SKU Obat Terverifikasi BPOM)
```

### 1. 📊 Dashboard Eksekutif & Visualisasi Cerdas
* **Bento KPI Metrics**: Indikator *Total Stock Value (Rp)*, *Fill Rate Layanan (%)*, *Permintaan Diproses*, dan *Lot Kritis Kedaluwarsa*.
* **Visualisasi Terpadu**:
  * Grafik Tren Kedaluwarsa Dinamis (30 / 60 / 90 / 180 / 365 Hari).
  * Distribusi Valuasi Stok per Kategori Farmasi (Pareto Horizontal Bar).
  * Pemantauan Status Dokumen Masuk (*Inbound Pipeline*) & Distribusi Umur Permintaan Keluar (*Outbound Lead Time*).

### 2. 🏢 Manajemen Persediaan (Inventory)
* **Katalog Saldo Stok Multi-Gudang**: Pencarian instan per lokasi (*Gudang Pusat, Depo IGD, Depo Rawat Inap, Apotek Rawat Jalan*).
* **Rekomendasi Reorder Cerdas**: Deteksi stok di bawah *safety level* dengan tombol instan `+ Buat PO`.
* **Analisis Fill Rate Layanan**: Rasio pemenuhan obat per unit pemohon untuk evaluasi performa logistik.
* **Transfer Antar-Depo**: Alur permohonan mutasi stok antar unit lengkap dengan halaman detail pelacakan.
* **Stock Opname (Cycle Count)**: Sesi audit fisik periodik dengan kalkulasi otomatis *variance* unit, dampak nilai finansial, dan *reason codes*.

### 3. 📥 Penerimaan Barang (Inbound)
* **Verifikasi Surat Pesanan (PO)**: Pemeriksaan kuantitas datang vs kuantitas pesanan.
* **Inspeksi Kualitas**: Validasi nomor lot pabrikan, tanggal kedaluwarsa, dan pencatatan barang rusak (*damaged qty*).
* **Guided Putaway**: Rekomendasi penempatan stok ke kode bin rak fisik (*Zone-Aisle-Shelf-Bin*).

### 4. 📤 Pengeluaran Gudang & Permintaan Unit (Outbound)
* **Permintaan Unit Medis (Requisitions)**: Pengajuan kebutuhan obat dari kepala ruangan/depo dengan prioritas klinis (*Rutin, Urgent, Emergency*).
* **Telaah Apoteker & Reason Codes**: Otorisasi resep/permintaan dengan alasan penolakan terstandar jika kuantitas dibatasi.
* **Alokasi FEFO Otomatis**: Sistem otomatis mengunci lot dengan masa kedaluwarsa paling dekat.
* **Workflow 4 Tahap**: *Item Selection $\rightarrow$ FEFO Picking (Pick Slip) $\rightarrow$ Packing Koli $\rightarrow$ Dispatch & Surat Jalan*.
* **Halaman Outbound Detail**: Visualisasi *stepper* progres pengiriman, ringkasan SKU parsial, serta lembar cetak surat jalan.

### 5. 🛒 Pengadaan (Purchasing / Procurement)
* **Purchase Order Lifecycle**: Alur status terstruktur (*Draft $\rightarrow$ Pending Approval $\rightarrow$ Placed $\rightarrow$ Partially Received $\rightarrow$ Received*).
* **Kalkulasi Anggaran**: Format nominal mata uang terstandar (`Rp XXX.XXX.XXX`) lengkap dengan PPN dan termin pembayaran.
* **Tracking Supplier**: Pengelompokan vendor distributor farmasi resmi (PBF).

### 6. 📑 Pusat Laporan & Audit (Reporting Hub)
* **Laporan 1: Saldo Persediaan & Valuasi (Pareto ABC)** — Klasifikasi Kelas A (75% aset), Kelas B (15%), dan Kelas C (10%).
* **Laporan 2: Risiko Kedaluwarsa FEFO** — *Early Warning System* ambang batas waktu (Kritis &lt; 30 hari, Tinggi 31–60 hari, Sedang 61–90 hari).
* **Laporan 3: Prediksi Risiko Stockout & Konsumsi Harian (ADC)** — Estimasi sisa hari ketahanan stok sebelum habis.
* **Laporan 4: Rekapitulasi Audit Stock Opname** — Laporan akurasi fisik, selisih buku besar, dan lembar pengesahan auditor.
* **Ekspor & Cetak**: Dukungan unduh **Spreadsheet CSV** dan cetak **Dokumen PDF Resmi (A4 Landscape)**.

### 7. 💊 Master Data Produk KFA Kemenkes RI
* Master data **1.011 obat nyata** terintegrasi KFA & BPOM.
* Penandaan khusus keselamatan pasien: **High Alert Medicine**, **Cold Chain (2–8°C)**, dan **Peringatan LASA**.
* Layout 2-Kolom OpenBoxes dengan filter multi-parameter dan form pendaftaran 3-section.

---

## 🛠️ Tech Stack & Arsitektur

* **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
* **Library UI**: [React 19](https://reactjs.org/) & [Tailwind CSS](https://tailwindcss.com/)
* **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Type-Safety)
* **Desain Sistem**: **Clean Emerald & Medical White Palette** terinspirasi OpenBoxes & Curelo
* **Arsitektur Kode**: **Feature-Sliced Design (FSD)**:
  * `src/app/` $\rightarrow$ Routing, Server Components, API Route Handlers.
  * `src/features/` $\rightarrow$ Modul fungsional independen (*inventory, inbound, outbound, procurement, reports, products, dashboard, auth, shell*).
  * `src/shared/` $\rightarrow$ Reusable UI Kit, Utility Formatter, Domain Types, Nav Config.
  * `src/api/` $\rightarrow$ Mock In-Memory Backend Store & Fixtures (1.011 KFA Products).
* **Unit Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/) (**60 Test Files, 258 Tests Passed**).

---

## 🚀 Panduan Instalasi & Menjalankan Secara Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer lokal:

### 1. Prasyarat Sistem
Pastikan telah menginstal perangkat lunak berikut:
* **Node.js**: Versi `18.18.0` atau yang lebih baru (Disarankan versi LTS terbaru).
* **npm** (bawaan Node.js) atau **pnpm** / **yarn**.
* **Git**.

### 2. Clone Repository
Buka terminal dan unduh repositori proyek:
```bash
git clone https://github.com/RenoAlFareza/Sigma-Healtech.git
cd Sigma-Healtech
```

### 3. Masuk ke Folder Proyek Frontend
```bash
cd sigma-healtech-frontend
```

### 4. Install Dependencies
Jalankan perintah instalasi seluruh pustaka:
```bash
npm install
```

### 5. Menjalankan Server Development
Mulai server lokal Next.js:
```bash
npm run dev
```

Aplikasi akan berjalan di:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Akun Uji Coba (Demo Credentials)

Aplikasi telah dilengkapi sistem otentikasi berbasis peran (*Role-Based Access Control*). Gunakan kredensial demo di bawah ini untuk masuk ke dalam sistem:

| Peran (Role) | Username / User ID | Password | Akses & Wewenang |
| :--- | :--- | :--- | :--- |
| 🛡️ **Administrator** | `usr-admin` | *(bebas / apa saja)* | Akses penuh seluruh master data, konfigurasi user & lokasi |
| 💊 **Kepala Farmasi (Manager)** | `usr-manager` | *(bebas / apa saja)* | Otorisasi PO, approval permintaan unit, rekonsiliasi audit |
| 👨‍⚕️ **Apoteker (Pharmacist)** | `usr-pharmacist` | *(bebas / apa saja)* | Telaah resep/permintaan depo, review FEFO, laporan farmasi |
| 📦 **Asisten Gudang (Assistant)**| `usr-assistant` | *(bebas / apa saja)* | Eksekusi penerimaan barang, putaway rak, pick & packing |
| 🏥 **Kepala Ruangan (Requestor)**| `usr-requestor` | *(bebas / apa saja)* | Pengajuan permintaan obat baru dari depo rawat inap/IGD |
| 🛒 **Staf Pengadaan (Buyer)** | `usr-buyer` | *(bebas / apa saja)* | Pembuatan draf PO dan monitoring pengiriman distributor |
| 👁️ **Auditor (Viewer)** | `usr-viewer` | *(bebas / apa saja)* | Akses analitik dashboard dan laporan (*read-only*) |

> 💡 *Catatan: Pada mode simulasi lokal, password dapat diisi karakter apa saja (misal: `password123`).*

---

## 🧪 Menjalankan Pengujian (Testing Suite)

Untuk memverifikasi keandalan logika bisnis, routing, store, dan rendering komponen:

```bash
# Menjalankan seluruh pengujian unit test (Vitest)
npm test

# Atau menjalankan spesifik test suite
npx vitest run

# Menjalankan type-checking TypeScript tanpa error
npx tsc --noEmit
```

**Hasil Pengujian:**
```text
Test Files  60 passed (60)
     Tests  258 passed (258)
  Duration  ~12s (All assertions verified)
```

---

## 📦 Build untuk Production

Untuk membuat bundle produksi yang teroptimasi:
```bash
# Kompilasi aplikasi untuk production
npm run build

# Menjalankan build production secara lokal
npm run start
```

---

## 📂 Struktur Direktori Proyek

```text
sigma-healtech-frontend/
├── docs/                               # Dokumen Perencanaan & Cetak Biru Fitur
│   ├── plan-dashboard.md
│   ├── plan-inventory.md
│   ├── plan-inbound.md
│   ├── plan-outbound.md
│   ├── plan-purchasing.md
│   ├── plan-reporting.md
│   └── plan-products.md
├── public/                             # Asset Publik, Logo, & Ikon SIGMA
│   ├── images/
│   └── logo.svg
├── src/
│   ├── api/                            # Backend Mock In-Memory Store & Fixtures
│   │   ├── _fixtures/                  # Dataset 1.011 Obat KFA, Gudang, Transaksi
│   │   └── client.ts                   # Fetch Client Helper
│   ├── app/                            # Next.js 15 App Router
│   │   ├── (app)/                      # Rute Halaman Dashboard & Modul Bisnis
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── inbound/
│   │   │   ├── outbound/
│   │   │   ├── procurement/
│   │   │   ├── requisitions/
│   │   │   ├── reports/
│   │   │   ├── products/
│   │   │   └── transfers/
│   │   ├── (auth)/                     # Halaman Login & Otentikasi
│   │   └── api/                        # Route Handlers REST API
│   ├── features/                       # Modul Fungsional Bisnis (FSD Pattern)
│   │   ├── auth/
│   │   ├── cycle-count/
│   │   ├── dashboard/
│   │   ├── inbound/
│   │   ├── inventory/
│   │   ├── outbound/
│   │   ├── procurement/
│   │   ├── products/
│   │   ├── reports/
│   │   ├── requisitions/
│   │   ├── shell/                      # Topbar, Navigation Mega Menu, Search
│   │   ├── transactions/
│   │   └── transfers/
│   └── shared/                         # Reusable UI Components, Types & Utils
│       ├── config/                     # Menu Navigation & Role Matrix
│       ├── lib/                        # Formatting, Pareto ABC, Report Aggregates
│       ├── types/                      # TypeScript Domain Interfaces
│       └── ui/                         # Atomic Design UI Kit (Button, Card, Modal, dll)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

<div align="center">

**Dikembangkan dengan ❤️ oleh Tim Sigma — UPN "Veteran" Jawa Timur**  
*SIGMA Healtech • Smart Healthcare Logistics Intelligence*

</div>
