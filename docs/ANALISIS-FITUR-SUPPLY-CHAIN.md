# Analisis Fitur Dashboard Healthcare Supply Chain SIGMA

## Informasi Dokumen

| Atribut | Nilai |
|---|---|
| Nama proyek | SIGMA Health Supply |
| Jenis dokumen | Analisis fitur dan rekomendasi tampilan |
| Referensi utama | OpenBoxes |
| Fokus | Healthcare supply chain dan warehouse operations |
| Tanggal analisis | 27 Agustus 2026 |
| Status | Draft |

## 1. Latar Belakang

SIGMA merupakan aplikasi healthcare supply chain yang digunakan untuk membantu pengelolaan persediaan medis, permintaan stok, penerimaan barang, distribusi, pembelian, dan pelaporan.

OpenBoxes digunakan sebagai referensi karena menyediakan workflow warehouse management yang lengkap untuk kebutuhan healthcare. Namun, SIGMA tidak perlu menyalin seluruh fitur OpenBoxes. Pengembangan perlu berfokus pada fungsi yang paling penting untuk menjaga ketersediaan produk medis, mengurangi kedaluwarsa, mempercepat pemenuhan permintaan, dan memastikan setiap pergerakan stok dapat ditelusuri.

Dashboard SIGMA harus membantu pengguna menjawab tiga pertanyaan utama:

1. Stok apa yang sedang berisiko?
2. Pekerjaan apa yang harus diselesaikan sekarang?
3. Apakah kebutuhan unit pelayanan terpenuhi tepat waktu?

## 2. Tujuan

Dokumen ini bertujuan untuk:

- Menentukan fitur supply chain yang penting untuk SIGMA.
- Menentukan informasi yang perlu ditampilkan pada setiap halaman.
- Mengelompokkan fitur berdasarkan prioritas implementasi.
- Menghindari pengembangan fitur OpenBoxes yang belum dibutuhkan.
- Menjadi dasar pembuatan product requirements document, wireframe, dan backlog.

## 3. Prinsip Produk

### 3.1 Action-oriented dashboard

Dashboard tidak hanya menampilkan grafik, tetapi harus menunjukkan masalah dan menyediakan jalan menuju tindakan berikutnya.

Contoh:

- Klik jumlah produk stockout untuk membuka daftar produk stockout.
- Klik lot yang mendekati kedaluwarsa untuk membuka laporan expiry.
- Klik permintaan yang melewati SLA untuk membuka detail permintaan.
- Klik barang di receiving bin untuk memulai putaway.

### 3.2 Location-aware

Semua data operasional harus mengikuti lokasi aktif pengguna, misalnya:

- Gudang farmasi pusat
- Depo rawat inap
- Depo IGD
- Apotek rawat jalan
- Ward atau unit pelayanan

Pengguna yang memiliki akses ke beberapa lokasi dapat mengganti lokasi aktif. Pengguna hanya boleh melihat data dari lokasi yang diberikan kepadanya.

### 3.3 Batch and expiry first

Produk medis harus dapat ditelusuri berdasarkan:

- Produk atau SKU
- Nomor lot/batch
- Tanggal kedaluwarsa
- Bin penyimpanan
- Lokasi
- Riwayat penerimaan dan pengeluaran

### 3.4 Auditability

Setiap transaksi penting perlu menyimpan:

- Pengguna yang melakukan tindakan
- Waktu tindakan
- Lokasi
- Dokumen referensi
- Kuantitas sebelum dan sesudah transaksi
- Alasan adjustment, penolakan, kerusakan, atau selisih

### 3.5 Role-based experience

Dashboard dan menu harus menyesuaikan kebutuhan pengguna. Pengguna gudang tidak membutuhkan tampilan yang sama dengan requestor atau buyer.

## 4. Alur Supply Chain Utama

```text
Kebutuhan unit
    |
    v
Requisition -> Approval -> Alokasi stok -> FEFO Picking -> Dispatch -> Diterima unit
                                   |
                                   v
                             Stok berkurang

Reorder Alert -> Purchase Order -> Inbound Receiving -> Putaway -> Stok bertambah
```

### 4.1 Alur permintaan dan distribusi

```text
Draft -> Submitted -> Approved/Rejected -> Picking -> Dispatched -> Received
```

### 4.2 Alur pembelian dan penerimaan

```text
Draft PO -> Approved -> Placed -> Partially Received -> Received
```

### 4.3 Alur cycle count

```text
Created -> In Progress -> Resolve Variance -> Completed
```

## 5. Prioritas Fitur

### 5.1 Prioritas P0 — Fitur inti

Fitur P0 dibutuhkan agar SIGMA dapat menjalankan proses supply chain dasar dengan aman.

| Modul | Kemampuan inti | Nilai bisnis |
|---|---|---|
| Dashboard operasional | Risiko stok dan daftar pekerjaan | Membantu pengguna menentukan prioritas kerja |
| Inventory | Stok per produk, lokasi, lot, bin, dan expiry | Memberikan visibilitas stok yang akurat |
| Requisition | Permintaan, approval, pemenuhan, dan penerimaan | Menghubungkan unit peminta dengan gudang |
| Inbound | Penerimaan PO/transfer dengan lot dan expiry | Menambah stok secara terkontrol |
| Outbound | Alokasi, FEFO, picking, dan dispatch | Mengurangi kesalahan dan pemborosan stok |
| Stock card | Saldo dan riwayat transaksi | Menyediakan traceability dan audit trail |
| Role dan location access | Pembatasan menu dan data | Menjaga keamanan dan relevansi data |

### 5.2 Prioritas P1 — Pengendalian dan analitik

| Modul | Kemampuan inti | Nilai bisnis |
|---|---|---|
| Reorder report | Produk di bawah reorder point dan saran kuantitas | Mengurangi risiko stockout |
| Procurement | Purchase order dan partial receipt | Menghubungkan kebutuhan stok dengan supplier |
| Cycle count | Count, variance, reason, dan adjustment | Meningkatkan inventory accuracy |
| Batch hold/recall | Menahan dan menelusuri lot bermasalah | Penting untuk keselamatan produk medis |
| Reports | Expiry, stockout, consumption, fill rate, transactions | Mendukung keputusan manajemen |
| SLA monitoring | Permintaan dan shipment overdue | Mengurangi keterlambatan pelayanan |

### 5.3 Prioritas P2 — Pengembangan lanjutan

| Modul | Kemampuan inti |
|---|---|
| Forecasting | Prediksi permintaan dan analisis musiman |
| Barcode dan label | Scanning produk, lot, bin, dan shipment |
| Integrasi | KFA, ERP, accounting, DHIS2, atau SATUSEHAT |
| Notification | Email, push notification, atau daily digest |
| Advanced supplier analytics | Lead time, price history, dan supplier performance |

## 6. Information Architecture

Navigasi utama yang direkomendasikan:

1. **Dashboard**
2. **Inventory**
3. **Requests**
4. **Stock Movements**
   - Inbound
   - Outbound
   - Transfers
   - Putaway
5. **Procurement**
6. **Reports**
7. **Master Data & Settings**
   - Products
   - Locations
   - Users and roles

Inbound, outbound, dan transfer sebaiknya dikelompokkan di bawah Stock Movements agar navigasi tidak terlalu panjang. Products dan konfigurasi pengguna/lokasi dapat ditempatkan di bawah Master Data & Settings.

## 7. Dashboard Utama

### 7.1 Filter dan konteks global

Bagian atas dashboard harus menampilkan:

- Lokasi aktif
- Rentang waktu
- Waktu pembaruan data terakhir
- Global search produk, SKU, lot, atau dokumen
- Tombol refresh
- Tombol ekspor jika dibutuhkan

Label **Real-Time** hanya boleh digunakan jika status sinkronisasi benar-benar diperoleh dari backend. Jika tidak, gunakan informasi seperti `Diperbarui 5 menit lalu`.

### 7.2 KPI utama

Maksimal enam KPI ditampilkan pada bagian pertama:

| KPI | Definisi | Interaksi |
|---|---|---|
| Stockout | Jumlah SKU dengan available quantity nol | Membuka daftar produk stockout |
| Below reorder | Jumlah SKU pada atau di bawah reorder point | Membuka reorder report |
| Expired lots | Lot yang sudah kedaluwarsa dan masih memiliki stok | Membuka laporan expired |
| Expiring lots | Lot yang kedaluwarsa dalam 30/60/90 hari | Membuka laporan expiry |
| Pending urgent requests | Permintaan urgent yang belum selesai | Membuka daftar permintaan |
| Fill rate | Persentase kuantitas permintaan yang terpenuhi | Membuka detail fill rate |

Setiap KPI sebaiknya memiliki konteks perubahan, contohnya:

- `12 SKU stockout, naik 3 dari minggu lalu`
- `Rp42 juta stok berisiko kedaluwarsa`
- `8 permintaan telah melewati SLA`

`Total Produk` bukan KPI operasional utama. Informasi tersebut dapat ditempatkan pada bagian sekunder atau halaman master data.

### 7.3 Daftar perlu tindakan

Daftar ini harus lebih menonjol dibandingkan sebagian besar grafik.

| Kolom | Deskripsi |
|---|---|
| Prioritas | Critical, high, medium, atau low |
| Masalah | Stockout, expiry, overdue request, delayed inbound, dan sebagainya |
| Produk/dokumen | Produk, nomor permintaan, PO, atau shipment |
| Lokasi | Lokasi yang terdampak |
| Umur/SLA | Lama masalah atau batas waktu |
| Dampak | Kuantitas, nilai, atau jumlah unit pelayanan terdampak |
| Aksi | Tindakan relevan untuk menyelesaikan masalah |

Contoh:

| Prioritas | Masalah | Lokasi | Umur/SLA | Aksi |
|---|---|---|---|---|
| Critical | Ceftriaxone stockout | Depo IGD | 2 hari | Lihat stok lokasi lain |
| High | Tiga lot kedaluwarsa dalam 21 hari | Gudang pusat | Rp18 juta | Distribusikan atau hold |
| High | Requisition urgent belum disetujui | Rawat inap | 5 jam | Review |
| Medium | Barang belum di-putaway | Receiving bin | 2 hari | Mulai putaway |

### 7.4 Visualisasi

Visual utama dibatasi menjadi tiga bagian:

1. **Distribusi kesehatan stok**
   - In stock
   - Reorder
   - Low stock
   - Stockout
   - Overstock

2. **Tren pelayanan**
   - Fill rate
   - Stockout incidents

3. **Pipeline pekerjaan**
   - Pending approval
   - Picking
   - Ready to dispatch
   - In transit
   - Receiving
   - Putaway

Fast-moving products dan pengeluaran per kategori dapat ditampilkan pada bagian bawah karena sifatnya analitis, bukan tindakan segera.

### 7.5 Definisi KPI

Definisi harus konsisten agar dashboard tidak menampilkan angka yang menyesatkan.

#### Available quantity

```text
Available = On Hand - Allocated - Hold - Recalled - Expired
```

#### Quantity fill rate

```text
Quantity Fill Rate = Total Qty Issued / Total Qty Requested x 100%
```

Jika organisasi menggunakan kuantitas yang disetujui sebagai denominator, label harus diubah menjadi `Approved Quantity Fill Rate`.

#### Line fill rate

```text
Line Fill Rate = Jumlah Request Line Terpenuhi Penuh / Total Request Line x 100%
```

Quantity fill rate dan line fill rate tidak boleh digabungkan karena keduanya menghasilkan interpretasi berbeda.

#### Months of stock

```text
Months of Stock = Available Quantity / Average Monthly Consumption
```

#### Inventory accuracy

```text
Inventory Accuracy = Jumlah Count Tanpa Variance / Total Cycle Count x 100%
```

## 8. Inventory Browser

### 8.1 Filter

Inventory browser perlu mendukung filter berikut:

- Lokasi
- Nama produk
- Kode KFA/SKU
- Lot
- Kategori
- Status stok
- Bin
- Rentang expiry
- Hanya stok yang tersedia

### 8.2 Kolom tabel

| Kolom | Keterangan |
|---|---|
| Kode KFA/SKU | Identitas produk |
| Nama produk | Nama lengkap produk |
| Kategori | Kategori farmasi atau alat kesehatan |
| Qty on hand | Seluruh kuantitas fisik yang tercatat |
| Qty reserved | Stok yang sudah dialokasikan |
| Qty available | Stok yang dapat digunakan |
| Monthly consumption | Rata-rata pemakaian bulanan |
| Months of stock | Estimasi durasi persediaan |
| Reorder point | Batas pemesanan kembali |
| Nearest expiry | Tanggal expiry terdekat |
| Lots | Jumlah lot aktif |
| Bin | Lokasi penyimpanan |
| Status | Kondisi stok saat ini |

Klik satu baris untuk membuka electronic stock card produk.

## 9. Electronic Stock Card

### 9.1 Ringkasan produk

Bagian atas menampilkan:

- Nama produk
- Kode KFA/SKU
- Zat aktif dan kekuatan
- Bentuk sediaan
- Unit of measure
- Manufacturer
- Kategori

### 9.2 Ringkasan stok

- On hand quantity
- Reserved quantity
- Available quantity
- Average monthly demand
- Months of stock
- Minimum level
- Reorder point
- Maximum level
- Average unit price
- Total stock value
- Last stock count

### 9.3 Tab penting

| Tab | Informasi |
|---|---|
| Current lots | Lot, expiry, bin, on hand, available, dan hold status |
| Transaction history | Semua debit, kredit, receipt, issue, transfer, dan adjustment |
| Pending inbound | PO atau shipment yang belum diterima |
| Pending outbound | Alokasi atau shipment yang belum dikirim |
| All locations | Ketersediaan produk di lokasi lain |
| Cycle count | Count terakhir, variance, dan adjustment |

Substitutions dan supplier sources dapat menjadi fitur P1 atau P2 sesuai kebutuhan organisasi.

## 10. Requisition

### 10.1 Daftar permintaan

Kolom yang ditampilkan:

- Nomor permintaan
- Unit asal
- Gudang pemenuh
- Pemohon
- Prioritas
- Desired delivery date
- Jumlah item
- Fill progress
- Status
- Umur permintaan/SLA

Filter penting:

- Status
- Prioritas
- Unit asal
- Gudang pemenuh
- Tanggal
- Overdue only

### 10.2 Detail permintaan

Header dokumen:

- Nomor permintaan
- Requesting location
- Fulfilling location
- Requestor
- Approver
- Requested date
- Desired delivery date
- Priority
- Status
- Alasan permintaan

Setiap line item menampilkan:

- Requested quantity
- Approved quantity
- Allocated quantity
- Issued quantity
- Received quantity
- Backorder atau shortage
- Alasan perubahan, substitusi, atau penolakan

### 10.3 Aturan penting

- Permintaan `URGENT` harus memiliki SLA.
- Approval harus menyimpan pengguna, waktu, dan catatan.
- Pemenuhan sebagian harus tetap dapat diproses.
- Pemohon harus dapat melihat status sampai barang diterima.
- Perubahan kuantitas harus dapat ditelusuri.

## 11. Inbound dan Putaway

### 11.1 Daftar inbound

Tampilkan:

- Nomor receipt/shipment
- Referensi PO atau transfer
- Supplier atau lokasi asal
- Lokasi tujuan
- Expected arrival date
- Jumlah item
- Receipt progress
- Status
- Overdue indicator

### 11.2 Receiving

Setiap line penerimaan menampilkan:

- Product/SKU
- Expected quantity
- Received quantity
- Damaged quantity
- Short/excess quantity
- Lot number
- Expiry date
- Receiving bin
- Discrepancy reason

Validasi yang diperlukan:

- Lot wajib untuk produk yang menggunakan batch tracking.
- Expiry wajib untuk produk yang memiliki masa kedaluwarsa.
- Received quantity tidak boleh negatif.
- Selisih dan barang rusak wajib memiliki reason code.
- Partial receipt tidak boleh otomatis menutup seluruh PO.

### 11.3 Putaway

Alur putaway yang disarankan:

```text
Pilih receiving lines -> Tentukan destination bin -> Konfirmasi perpindahan
```

Informasi yang ditampilkan:

- Receiving bin
- Suggested/preferred bin
- Destination bin
- Quantity to put away
- Lot dan expiry
- Remaining quantity in receiving

## 12. Outbound

### 12.1 Status

Status yang disarankan:

```text
Draft -> Items Added -> Picking -> Picked -> Dispatched -> Received
```

`Packing` dapat menjadi tahap opsional jika organisasi belum membutuhkan pallet atau box hierarchy.

### 12.2 Daftar outbound

Kolom yang ditampilkan:

- Nomor outbound
- Referensi requisition
- Origin
- Destination
- Requested/created date
- Desired dispatch date
- Jumlah item
- Pick progress
- Status
- SLA/overdue

### 12.3 Picking

Informasi penting:

- Product/SKU
- Requested quantity
- Available quantity
- Allocated quantity
- Suggested lot
- Expiry
- Bin
- Picked quantity
- Shortage

Gunakan FEFO sebagai aturan default:

```text
First Expired, First Out
```

Pengguna dapat mengganti lot yang disarankan jika memiliki izin dan memasukkan alasan override.

### 12.4 Dispatch

Tampilkan:

- Shipment date
- Driver/carrier
- Tracking number
- Delivery note
- Total items dan quantity
- Dispatched by
- Received confirmation

## 13. Reorder dan Procurement

### 13.1 Reorder report

Kolom yang ditampilkan:

- Produk
- Location
- Available quantity
- Average monthly consumption
- Months of stock
- Reorder point
- Maximum level
- Pending inbound
- Suggested order quantity
- Stockout risk date

Contoh perhitungan sederhana:

```text
Suggested Qty = Maximum Level - Available Qty - Pending Inbound Qty
```

Nilai tidak boleh kurang dari nol.

### 13.2 Purchase order

Kemampuan minimum:

- Membuat draft PO
- Approval PO
- Menempatkan order
- Melacak supplier dan expected delivery date
- Menerima barang sebagian
- Menghubungkan receipt dengan PO
- Menampilkan outstanding quantity

Invoice, payment, dan budget accounting dapat ditunda.

## 14. Cycle Count dan Adjustment

### 14.1 Cycle count

Fitur minimum:

- Memilih produk/bin yang akan dihitung
- Menugaskan counter
- Mencatat physical quantity
- Menghitung variance
- Melakukan recount
- Menyelesaikan variance dengan reason code
- Membuat adjustment setelah approval

### 14.2 Reason code

Contoh reason code:

- Data entry error
- Receiving discrepancy
- Unrecorded issue
- Damaged
- Expired
- Lost
- Wrong bin
- Found stock
- Recall

### 14.3 Laporan accuracy

Tampilkan:

- Produk yang dihitung
- Jumlah count
- Count tanpa variance
- Count dengan variance
- Total adjustment quantity
- Adjustment value
- Inventory accuracy percentage
- Inventory shrinkage

## 15. Batch Hold dan Recall

Untuk healthcare supply chain, minimal recall workflow perlu mendukung:

1. Mencari nomor lot.
2. Menampilkan seluruh lokasi yang memiliki lot tersebut.
3. Menampilkan riwayat penerimaan dan distribusi.
4. Mengubah lot menjadi `HOLD` atau `RECALLED`.
5. Mengeluarkan stok tersebut dari available quantity.
6. Mencatat alasan, pengguna, dan waktu tindakan.

## 16. Reports

### 16.1 Laporan P0/P1

| Laporan | Informasi utama |
|---|---|
| Expiry report | Lot expired dan expiring 30/60/90/180 hari |
| Stockout report | Produk stockout dan durasi stockout |
| Inventory summary | Qty dan value per lokasi/kategori/status |
| Transaction report | Semua pergerakan dan adjustment |
| Consumption report | Pemakaian per produk, lokasi, dan periode |
| Fill rate report | Requested, issued, shortage, dan fill rate |
| Inventory accuracy | Hasil cycle count dan variance |
| Reorder report | Produk di bawah reorder point |

### 16.2 Filter laporan

- Lokasi
- Periode
- Produk
- Kategori
- Supplier
- Unit tujuan
- Status
- Lot

Semua laporan tabel sebaiknya dapat diekspor ke CSV atau Excel.

## 17. Dashboard Berbasis Role

### 17.1 Warehouse operator

Fokus:

- Receiving hari ini
- Putaway tertunda
- Picking queue
- Ready to dispatch
- Cycle count yang ditugaskan

### 17.2 Manager atau pharmacist

Fokus:

- Stockout dan low stock
- Expiry risk
- Fill rate
- Inventory value
- Inventory accuracy
- Overdue workflow

### 17.3 Requestor

Fokus:

- Membuat permintaan
- Permintaan menunggu approval
- Permintaan dalam proses
- Pengiriman dalam perjalanan
- Konfirmasi penerimaan

### 17.4 Buyer

Fokus:

- Reorder recommendations
- PO pending approval
- PO overdue
- Partial receipt
- Supplier lead time

### 17.5 Administrator

Fokus:

- User dan role
- Location access
- Products dan inventory level
- Master data quality
- Audit log

Dashboard tidak perlu mendukung drag-and-drop customization pada tahap awal. Preset berdasarkan role lebih sederhana dan konsisten.

## 18. Evaluasi Kondisi SIGMA Saat Ini

### 18.1 Fitur yang sudah tersedia

Struktur proyek SIGMA telah memiliki fondasi berikut:

- Dashboard KPI dan tren
- Inventory browser
- Electronic stock card
- Reorder report
- Requisition dan approval
- Inbound receiving
- Putaway
- Outbound dan FEFO
- Transfers
- Purchase order
- Cycle count
- Reports
- Role-based navigation
- Active location switcher

### 18.2 Gap prioritas

#### A. Dashboard belum menjadi work queue

Dashboard saat ini lebih banyak menampilkan KPI dan chart. Perlu ditambahkan daftar pekerjaan yang dapat ditindak langsung dan indikator overdue.

#### B. Data dashboard belum berasal dari transaksi aktual

Summary dashboard masih menggunakan beberapa nilai tetap dan data tren masih dibangkitkan secara simulasi. KPI perlu dihitung dari inventory, requisition, inbound, outbound, dan procurement aktual.

#### C. Available quantity belum dimodelkan

Perhitungan available masih sama dengan on hand. Sistem perlu memperhitungkan:

- Reserved atau allocated
- Hold
- Recalled
- Expired

#### D. Kategori kesehatan stok harus mutually exclusive

Kategori in stock, reorder, low stock, stockout, expired, dan expiring harus memiliki aturan yang jelas. Jangan mengurangi jumlah batch expiry dari total produk karena unit hitungnya berbeda dan dapat tumpang tindih.

#### E. Stock card belum memberikan konteks keputusan

Perlu ditambahkan demand, months of stock, min/reorder/max, pending inbound, pending outbound, available quantity, dan all-location availability.

#### F. Filter dashboard belum lengkap

Dashboard memerlukan filter lokasi dan periode yang konsisten serta waktu pembaruan data.

#### G. Navigasi terlalu lebar

Inbound, outbound, dan transfers dapat dikelompokkan sebagai Stock Movements. Products dan Config dapat dikelompokkan sebagai Master Data & Settings.

## 19. Fitur yang Belum Perlu Diimplementasikan

Fitur berikut dapat ditunda sampai kebutuhan bisnisnya tervalidasi:

- Invoice dan payment tracking
- Budget/grant accounting kompleks
- Pallet dan box hierarchy
- Customs documentation
- Bill of materials atau kit assembly
- Dashboard drag-and-drop customization
- Forecasting berbasis AI
- RFID
- Multi-language
- Marketplace integration
- Advanced webhook automation
- Supplier document management kompleks

## 20. Roadmap yang Direkomendasikan

### Tahap 1 — Data dan inventory visibility

- Definisikan status stok dan formula KPI.
- Pisahkan on hand, reserved, dan available.
- Lengkapi inventory browser.
- Lengkapi electronic stock card.
- Hubungkan dashboard dengan data transaksi aktual.

### Tahap 2 — Operational work queue

- Tambahkan daftar perlu tindakan.
- Tambahkan SLA dan overdue indicator.
- Buat drill-down dari KPI ke halaman terfilter.
- Tambahkan role-based dashboard preset.

### Tahap 3 — End-to-end fulfillment

- Rapikan alur requisition sampai received.
- Hubungkan requisition dengan outbound.
- Pastikan FEFO dan allocation bekerja konsisten.
- Lengkapi partial fulfillment dan shortage reason.

### Tahap 4 — Procurement dan inventory control

- Hubungkan reorder dengan PO.
- Hubungkan PO dengan inbound receipt.
- Lengkapi partial receipt.
- Lengkapi cycle count dan adjustment approval.

### Tahap 5 — Healthcare safety dan analytics

- Batch hold dan recall.
- Expiry value-at-risk.
- Consumption dan months of stock.
- Fill rate dan inventory accuracy report.

### Tahap 6 — Integrasi dan automation

- Barcode scanning.
- Notifications.
- Integrasi master data dan sistem eksternal.
- Forecasting lanjutan jika data historis sudah memadai.

## 21. Acceptance Criteria Tingkat Produk

SIGMA dapat dianggap memenuhi kebutuhan supply chain inti apabila:

- Pengguna dapat mengetahui stok aktual dan tersedia untuk setiap produk, lot, dan lokasi.
- Produk stockout, low stock, expired, dan expiring dapat ditemukan dari dashboard.
- Setiap KPI dapat dibuka menjadi daftar detail yang relevan.
- Permintaan dapat dilacak dari draft sampai diterima.
- Gudang dapat melakukan alokasi dan picking berdasarkan FEFO.
- Penerimaan mencatat expected, received, damaged, lot, expiry, dan bin.
- Partial fulfillment dan partial receipt didukung.
- Semua transaksi menghasilkan stock card dan audit trail.
- Pengguna hanya dapat mengakses lokasi dan tindakan sesuai role.
- Dashboard menunjukkan pekerjaan overdue dan tindakan yang harus dilakukan.

## 22. Keputusan Produk Utama

Fokus SIGMA adalah:

> Inventory visibility, expiry control, requisition fulfillment, dan transaction traceability untuk healthcare supply chain.

SIGMA tidak diarahkan menjadi ERP lengkap pada tahap awal. Setiap fitur baru harus dinilai berdasarkan pengaruhnya terhadap:

1. Ketersediaan produk medis.
2. Keselamatan dan traceability produk.
3. Kecepatan pemenuhan kebutuhan unit.
4. Akurasi persediaan.
5. Kemudahan kerja pengguna operasional.

## 23. Referensi

- [OpenBoxes Features](https://openboxes.com/features/)
- [OpenBoxes Dashboard](https://help.openboxes.com/article/7-dashboard)
- [OpenBoxes Electronic Stock Card](https://help.openboxes.com/article/39-electronic-stock-card)
- [OpenBoxes Inventory Reports](https://help.openboxes.com/article/310-inventory-reports)
- [OpenBoxes Manage Inventory Levels](https://help.openboxes.com/article/299-manage-inventory-levels)
- [OpenBoxes Receiving and Putaway](https://help.openboxes.com/article/297-receiving-putaway)
- [OpenBoxes Outbound Picking](https://help.openboxes.com/article/74-outbound-shipment-page-by-page-pick)
- [OpenBoxes Stock Movement Status](https://help.openboxes.com/article/476-stock-movements-status-summary)
- [OpenBoxes Electronic Requests](https://help.openboxes.com/article/413-electronic-requests)
- [OpenBoxes Cycle Count](https://help.openboxes.com/article/485-perform-cycle-count)
- [OpenBoxes Purchase Orders](https://help.openboxes.com/article/42-create-a-purchase-order)

