# Aliby — Indeks Kebutuhan

**Turunan dari `PRD-Aliby.md` v0.1, `aliby-konvensi.md`, dan `aliby-diagram-sistem.md`.**

Dokumen ini **tidak menambah kebutuhan**. Ia memberi kode pada kebutuhan yang sudah tertulis supaya tiap paket
kerja di [`aliby-wbs.md`](aliby-wbs.md), tiap test, dan tiap baris progres bisa menunjuk ke hal yang sama.
Kolom "Sumber" wajib dibaca utuh sebelum mengerjakan kode itu — ringkasan di sini bukan pengganti.

Bila dokumen ini bertentangan dengan PRD, **PRD menang**: perbaiki baris di sini, jangan kodenya.

Konvensi rujukan di kode dan test: nama test diawali kode, misal
`test("KAM-05 cermin hanya untuk kamera depan", …)`. Komentar asumsi: `// ASUMSI(OQ-03)`.

---

## KAM — Kamera

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| KAM-01 | Minta izin kamera; izin ditolak → alur berhenti dengan pesan cara mengizinkan, bukan layar kosong. | 1 | PRD §3 langkah 1, §8.1 · diagram §3 (`Blokir + pesan izin`) |
| KAM-02 | Kamera depan dan belakang bisa dipilih (`facingMode`). | 1 | PRD §4 v1, §8.1 |
| KAM-03 | Kamera hanya dijalankan di secure origin (HTTPS); di luar itu tampil pesan "tidak didukung". | 0–1 | PRD §4 v1, §7 Hosting · `lib/camera/types.ts` (status `unsupported`) |
| KAM-04 | Viewport kamera mengikuti rasio `w/h` slot aktif; yang dilihat saat capture = yang masuk ke slot (crop tengah, bukan stretch). | 1 | konvensi §Aturan arsitektur |
| KAM-05 | Kamera depan dicerminkan (mirror). | 3 | PRD §9 Phase 3 · README §Belum dikerjakan |
| KAM-06 | Kamera benar di iOS Safari dan Android: orientasi, aspect ratio, stream tidak macet setelah pindah tab/layar. | 3 | PRD §9 Phase 3, §11 risiko 2 |
| KAM-07 | Stream dihentikan saat tidak dipakai (unmount, keluar dari fase capture). | 1 | `CLAUDE.md` mode pembimbing (stop stream) · `app/booth/page.tsx` (kamera hidup hanya saat menjepret) |
| KAM-08 | Live preview tetap mulus di HP mid-range Android (perf). | 3 | PRD §9 Phase 3, §10, §11 risiko 2 |

## CAP — Alur capture

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| CAP-01 | Hitung mundur 3 detik sebelum setiap jepretan, termasuk saat ulangi. | 1 | PRD §3 langkah 3 · diagram §1 «include», §3 |
| CAP-02 | Jumlah jepretan = jumlah slot di manifest; slot diisi berurutan. | 1 | PRD §6.1 · diagram §2 (`FRAME ||--|{ SLOT`) |
| CAP-03 | Setelah jepret, foto slot itu bisa dipratinjau lalu diterima atau diulangi tanpa mengulang slot lain. | 1 | PRD §3 langkah 3–4, §4 v1 · diagram §3 (`Puas?`) |
| CAP-04 | Dari tinjau strip lengkap, ketuk satu foto → ulangi slot itu saja, lalu kembali ke tinjau. Ada affordance visual bahwa foto bisa diketuk. | 1 | diagram §1 «extend», §3 (`Tinjau strip`) |
| CAP-05 | Foto mentah per slot disimpan di state; ulangi = timpa satu entri lalu komposit ulang. | 1 | PRD §6.1 · konvensi §Aturan arsitektur |

## FRM — Frame

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| FRM-01 | Frame = manifest JSON format PRD §6.1 + overlay PNG; tidak ada logika khusus per frame di kode. | 1–2 | PRD §6.1 · konvensi §Aturan arsitektur |
| FRM-02 | Manifest divalidasi saat dimuat (slot ada, id unik, di dalam canvas); manifest rusak dilewati, sisanya tetap jalan. | 2 | README §Frame |
| FRM-03 | Pita watermark 40px di dasar canvas tidak boleh ditempati slot. | 1 | konvensi §Aturan arsitektur |
| FRM-04 | Katalog frame = file statis (`public/frames/index.json` berisi id saja), tanpa database. | 2 | PRD §5 · README §Frame |
| FRM-05 | Katalog berisi ~6–10 frame. | 3 | PRD §4 v1 |
| FRM-06 | Layar pilih frame, merender pratinjau dari manifest. | 2 | PRD §3 langkah 2, §9 Phase 2 |

## FLT — Filter

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| FLT-01 | Filter = config JSON format PRD §6.2; tidak ada logika khusus per filter di kode. | 2 | PRD §6.2 · konvensi §Aturan arsitektur |
| FLT-02 | Preset minimal: B&W, warm film, cool, vintage, high-contrast. | 2 | PRD §4 v1 |
| FLT-03 | Filter tampil langsung di pratinjau (CSS `filter`). | 2 | PRD §3 langkah 5, §6.2 |
| FLT-04 | Filter di-*bake* saat komposit dengan string CSS yang sama dengan pratinjau; foto mentah tidak pernah difilter. | 2 | PRD §6.2, §8.3 · README §Filter |
| FLT-05 | String `css` divalidasi dengan daftar izin (allowlist). | 2 | README §Filter |
| FLT-06 | Filter dipilih sekali setelah semua slot terisi. | 2 | diagram §3 |

## KOM — Komposit & unduh

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| KOM-01 | Urutan komposit: background → foto per slot (dengan filter) → overlay → `toBlob`. | 1–2 | PRD §6.1 |
| KOM-02 | Strip bisa diunduh sebagai PNG/JPG. | 1 | PRD §3 langkah 6, §4 v1 |

## SHR — Simpan & bagikan

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| SHR-01 | Strip diunggah ke R2 lewat presigned PUT yang dibuat route handler `/api/save`; server tidak menerima byte gambar. | 4 | PRD §5 diagram, §6.3, §7 Storage |
| SHR-02 | Key objek `strips/{shortid}.jpg`, `shortid` ±8 karakter (nanoid). | 4 | PRD §6.3 |
| SHR-03 | Objek terhapus otomatis setelah 7 hari lewat **lifecycle rule R2**, bukan kode atau cron. | 4 | PRD §6.3, §8.5 |
| SHR-04 | Halaman `/s/{shortid}` di-render server dengan OG preview. | 4 | PRD §5 diagram, §9 Phase 4 |
| SHR-05 | Tanpa database: `shortid` cukup untuk me-resolve; metadata (frame, tanggal) sebagai custom metadata objek bila perlu. | 4 | PRD §6.3 |
| SHR-06 | Layar hasil memberi dua pilihan: Unduh, atau Simpan → dapat link aktif 7 hari. | 4 | PRD §3 langkah 6 · diagram §3 (`Unduh atau simpan?`) · README §Belum dikerjakan |

## UX — Desain & pengalaman

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| UX-01 | Arah visual scrapbook / "papan bukti"; warna, font, spacing, radius, bayangan, rotasi hanya dari token `app/globals.css`. | 0, 3 | konvensi §Desain · `CLAUDE.md` §Desain |
| UX-02 | Kepadatan per layar: landing, pilih frame, hasil = maksimal; tinjau & filter = sedang; capture = minimal. | 3 | konvensi §Desain |
| UX-03 | Per layar maksimal 1 sticky note, 2 washi tape, 1 benang. | 3 | konvensi §Desain |
| UX-04 | Layar capture: kamera, countdown, dan indikator slot tidak tertutup dekorasi. | 1, 3 | konvensi §Desain |
| UX-05 | Area yang bisa diketuk jelas terlihat sebagai tombol; teks kecil lolos kontras WCAG AA. | 1–4 | konvensi §Desain |
| UX-06 | Efek diutamakan lewat CSS; aset gambar hanya yang ada di daftar aset handoff. | 3 | konvensi §Desain |
| UX-07 | Responsive: nyaman di HP dan desktop. | 1–4 | PRD §4 v1 |
| UX-08 | Animasi. | 3 | PRD §9 Phase 3 |
| UX-09 | Suara shutter dan countdown. | 3 | PRD §9 Phase 3 |
| UX-10 | Landing mengangkat konsep "alibi = bukti kamu ada di momen itu". | 3 | PRD §1, §12 |
| UX-11 | Orang bisa dari buka web sampai strip terunduh tanpa membaca instruksi. | Q | PRD §10 |

## DEP — Deploy

| Kode | Kebutuhan | Fase | Sumber |
|---|---|---|---|
| DEP-01 | Deploy ke Vercel dengan HTTPS sejak awal. | 0 | PRD §7 Hosting, §9 Phase 0 |
| DEP-02 | Domain final dipasang sebelum rilis MVP. | Q | PRD §12, §13.4 |

---

## Di luar lingkup v1 (jangan dibangun)

Daftar ini dipakai skill `kerjakan-wp` untuk memeriksa bahwa tidak ada yang ikut terbangun.

- Manajemen booth / event / sewa / operator — **tidak akan pernah** (PRD §1, §2).
- Login / akun, galeri publik, profil kreator (PRD §2, §4 Nanti · `CLAUDE.md`).
- Editor frame UGC, filter builder UGC, moderasi konten (PRD §4 Nanti, §11 risiko 3).
- AR face filter (PRD §2).
- Filter WebGL / `glfx.js` — Phase 5, field `webgl` tetap `null` (PRD §6.2, §9).
- Database apa pun, termasuk Supabase (PRD §5, §7).
- Backend selain route handler upload/share; tidak ada pemrosesan gambar di server (PRD §5, §7).
- Aplikasi native mobile (PRD §2).
