# PRD — Aliby

**Web Photobooth · versi 0.1 (blueprint)**
Disusun: 24 September 2026 · Status: perencanaan

---

## 1. Ringkasan

Aliby adalah web photobooth consumer-facing: orang buka web di HP atau desktop, pilih frame, foto beberapa kali (per-slot, bisa re-take satu slot tanpa mengulang semua), tambah filter warna, lalu dapat photo strip yang bisa di-download atau disimpan sementara untuk dibagikan lewat link.

Ini **bukan** sistem manajemen booth event (bukan seperti Jepreto). Tidak ada manajemen sewa, jadwal, atau operator booth. Fokusnya murni pada pengalaman ambil-foto-dapat-strip yang menyenangkan dan desain yang eye-catching.

**Arti nama.** "Alibi" = bukti bahwa kamu ada di suatu tempat/momen. Itu persis definisi foto photobooth. Nama ini bukan cuma gabungan nama kamu dan pasangan — ia punya konsep yang bisa diangkat jadi brand: *strip foto = alibi-mu, bukti kamu ada di momen itu.*

**Positioning satu kalimat:** photobooth web gratis yang cakep dan terbuka — orang bisa bikin frame (dan nanti filter) mereka sendiri.

---

## 2. Tujuan & Non-Tujuan

### Tujuan
- Portfolio piece berkualitas yang **benar-benar bisa dipakai orang banyak**, bukan demo mati.
- Pengalaman capture yang mulus di HP **dan** desktop.
- Frame dan filter yang banyak dan gampang ditambah.
- Arsitektur yang **siap dibuka untuk UGC** (user bikin frame/filter sendiri) tanpa harus ditulis ulang.

### Non-Tujuan (v1)
- Manajemen booth / event / sewa — **tidak akan pernah** masuk; ini garis pembeda dari Jepreto.
- AR face filter (efek nempel di wajah) — ditunda, bukan dibatalkan.
- User-generated content (frame/filter dari user) — arsitekturnya disiapkan, tapi editornya bukan v1.
- Akun/login — tidak perlu sampai UGC datang.
- Aplikasi native mobile — web dulu.

---

## 3. Pengguna & Skenario

**Persona utama — "si pemakai".** Anak muda yang mau foto bareng teman/pasangan, sering dari HP. Ekspektasi: cepat, lucu, hasil langsung bisa di-share ke IG story. Tidak mau bikin akun.

**Persona kedua (nanti) — "si kreator".** Orang yang suka desain, mau bikin frame sendiri (misal frame ulang tahun, wisuda, tema tertentu) dan share ke publik. Ini yang bikin katalog frame tumbuh tanpa kamu harus gambar semuanya sendiri.

**Alur inti v1:**
1. Buka Aliby → izinkan kamera.
2. Pilih frame (misal strip 4-slot vertikal).
3. Foto slot 1 (countdown 3 detik) → preview → puas / re-take slot ini.
4. Ulang untuk slot 2–4.
5. Pilih filter warna (live di preview, di-*bake* saat final).
6. Lihat strip jadi → Download, atau Simpan (dapat link, aktif 7 hari).

---

## 4. Fitur

### v1 (MVP)
- Akses kamera (front/back, HTTPS).
- Katalog frame dari manifest (mulai ~6–10 frame buatan sendiri).
- Capture per-slot dengan countdown.
- **Re-take per-slot** (fitur pembeda — jatuh gratis dari model data, lihat §6).
- Filter warna (preset: B&W, warm film, cool, vintage, high-contrast, dst).
- Compositing strip → download PNG/JPG.
- Simpan sementara + share link (auto-hapus 7 hari).
- Desain eye-catching + responsive (HP & desktop).

### Nanti (pasca-MVP, sesuai urutan)
- Filter berat berbasis WebGL shader (look yang tidak bisa dicapai CSS).
- **UGC frame**: editor drag-slot + upload overlay PNG.
- **UGC filter**: builder parameter (masih dipertimbangkan — feasible, IG/TikTok saja mengizinkannya).
- Akun + galeri/profil kreator.
- Moderasi konten (wajib sebelum UGC dibuka publik — lihat §11).
- AR face filter.

---

## 5. Arsitektur

Prinsip: **client-heavy, backend tipis.** Semua kerja berat ada di browser; server cuma untuk simpan/share.

```
┌─────────────────────────── BROWSER (inti) ───────────────────────────┐
│  getUserMedia → <video>  →  Canvas capture per-slot  →  Canvas        │
│      (live preview + CSS filter)          (bake filter)   compositor  │
│                                                              │        │
│  Frame manifest (JSON) ──────────────────────────────────────┘        │
│  Filter config (JSON)                                        strip.jpg │
└───────────────────────────────────────────────────────────────┬──────┘
                                                                 │ upload (opsional)
                              ┌──────────────────────────────────▼──────┐
                              │  Next.js route handler /api/save         │
                              │   → presigned PUT ke R2                   │
                              └──────────────────────────────────┬──────┘
                                                                 ▼
                              ┌──────────────────────────────────────────┐
                              │  Cloudflare R2  (strips/{shortid}.jpg)    │
                              │  lifecycle rule: auto-delete after 7 days │
                              └──────────────────────────────────────────┘
                              /s/{shortid}  → SSR share page + OG preview
```

Frame = aset statis + JSON. Filter = JSON. Untuk v1, katalog frame/filter bisa cukup di-*serve* sebagai file JSON statis — belum butuh database. Database baru masuk saat UGC (menyimpan frame buatan user + kepemilikan).

---

## 6. Data Model (jantung project ini)

Keputusan paling penting: **frame dan filter adalah data, bukan kode.** Ini yang bikin fitur "re-take per-slot" gratis, dan bikin UGC nanti tinggal nambah editor — bukan nulis ulang engine.

### 6.1 Frame manifest

```json
{
  "id": "birthday-pink",
  "name": "Birthday Pink",
  "author": "aliby",
  "canvas": { "width": 600, "height": 1800 },
  "background": "#ffd6e7",
  "overlay": "birthday-pink.png",
  "slots": [
    { "id": 1, "x": 40, "y": 40,   "w": 520, "h": 390 },
    { "id": 2, "x": 40, "y": 460,  "w": 520, "h": 390 },
    { "id": 3, "x": 40, "y": 880,  "w": 520, "h": 390 },
    { "id": 4, "x": 40, "y": 1300, "w": 520, "h": 390 }
  ]
}
```

- `overlay` = PNG transparan yang digambar **di atas** foto (bingkai, teks, ornamen).
- `slots` = daftar kotak tempat tiap foto ditaruh. **Jumlah slot = jumlah shot.**
- Re-take per-slot = tiap slot menyimpan foto sendiri di state; ulang satu slot tinggal timpa satu entri, lalu re-composite. Tidak ada logika khusus — konsekuensi langsung dari model ini.

Compositing = gambar background → gambar tiap foto ke kotak slot-nya → gambar overlay di atas → `canvas.toBlob()`.

### 6.2 Filter config

```json
{
  "id": "warm-film",
  "name": "Warm Film",
  "css": "sepia(0.2) contrast(1.05) saturate(1.15) brightness(1.02)",
  "webgl": null
}
```

- `css` = string yang dipakai untuk **live preview** (ringan, mulus di HP murah).
- `webgl` = opsional; pipeline shader untuk look berat yang di-*bake* saat capture (Phase 5).
- Format ini juga jadi target output "filter builder" UGC nanti — user menghasilkan config JSON, bukan kode.

### 6.3 Share record

- Key R2: `strips/{shortid}.jpg` (`shortid` = nanoid ~8 char).
- Expiry ditangani **object lifecycle rule R2** (auto-delete 7 hari) — bukan kode kamu, bukan cron.
- v1 tidak perlu DB: `shortid` cukup untuk resolve. Simpan metadata (frame, tanggal) sebagai custom metadata objek kalau perlu.

---

## 7. Tech Stack (dengan alasan)

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Satu repo, deploy Vercel gampang, route handler cukup buat endpoint save, SSR bikin share link punya OG preview cakep. Kamu sudah kuat di sini. |
| Capture & composite | **`getUserMedia` + Canvas 2D** | Inti photobooth. API standar, jalan di semua browser modern. Skill baru buat kamu, tapi kecil. |
| Filter (v1) | **CSS `filter`** live preview, **bake ke canvas** saat capture | Ringan, mulus lintas-device. WebGL (`glfx.js`) baru pas butuh look berat. |
| Styling | **Tailwind CSS** | Desain eye-catching cepat tanpa lawan CSS. |
| Storage | **Cloudflare R2** | Egress **gratis** (kritikal buat platform gambar publik gratis), free tier 10 GB, punya **lifecycle rule** untuk auto-delete 7 hari. S3-compatible → pakai AWS SDK. |
| Hosting | **Vercel** | Nyatu dengan Next.js, HTTPS otomatis (wajib buat `getUserMedia`), preview deploy per branch. |
| DB (nanti, UGC) | **Supabase (Postgres + Auth)** | Baru relevan pas UGC + login. Auth + RLS + DB dalam satu paket. Bukan buat nyimpen gambar (free tier storage sempit + project di-pause kalau nganggur). |
| Image processing (nanti) | **FastAPI + Python** | Baru masuk pas moderasi/pemrosesan frame UGC — di situ kekuatan Python kamu kepakai. Tidak untuk v1. |

**Yang baru buat kamu cuma dua:** Canvas capture/composite (kecil) dan R2 + lifecycle (kecil). Sisanya kandang sendiri.

---

## 8. Learning Path (diurut dari yang paling nge-blok)

Semua bisa dikerjakan minggu ini. Estimasi "sampai *bisa dipakai*", bukan mahir.

1. **`getUserMedia` → MediaStream → `<video>`** *(nge-blok segalanya)* — ~2–3 jam.
   Cukup paham: minta izin kamera, pasang stream ke `<video>`, pilih front/back (`facingMode`), handle penolakan izin. → MDN "MediaDevices.getUserMedia".
2. **Canvas 2D `drawImage`** — ~setengah hari.
   Capture frame dari `<video>` ke canvas, gambar beberapa foto ke posisi slot, `toBlob()` untuk export. Ini inti compositing. → MDN "Canvas API tutorial".
3. **CSS `filter` + bake ke canvas** — ~1–2 jam.
   Terapkan `ctx.filter = "..."` sebelum `drawImage` supaya filter ikut ter-*bake* ke hasil. → MDN "CanvasRenderingContext2D.filter".
4. **Next.js route handler + presigned upload** — kamu sudah tahu, refresh ~1 jam.
5. **Cloudflare R2: bucket, S3 SDK, presigned PUT, lifecycle rule** *(baru)* — ~setengah hari.
   Buat bucket, generate presigned URL dari server, set lifecycle rule 7-hari via dashboard/Wrangler. → Cloudflare R2 docs "Object lifecycles".

**Belajar sambil jalan (jangan ditunggu di depan):**
- iOS Safari camera quirks (Phase 3) — dipelajari saat ketemu bug-nya, bukan sebelumnya.
- `glfx.js` / WebGL shader (Phase 5) — hanya kalau CSS sudah tidak cukup.

---

## 9. Roadmap Bertahap

Aturan: **Phase 1 harus menghasilkan sesuatu yang jalan end-to-end**, sesempit apa pun. Slice tipis yang jalan mengalahkan tiga komponen rapi yang belum nyambung.

**Phase 0 — Setup** *(~1 malam)*
Repo, Next.js + TS + Tailwind, deploy skeleton ke Vercel (dapat HTTPS dari awal — penting buat kamera).

**Phase 1 — Vertical slice** *(~2 weekend)*
Satu frame hardcoded. Akses kamera → capture per-slot dengan countdown → **re-take per-slot** → composite → download. **Tanpa filter, tanpa backend.** Di akhir phase ini kamu punya photobooth yang benar-benar bisa dipakai.

**Phase 2 — Filter & multi-frame** *(~2 weekend)*
Filter CSS (live preview + bake) + katalog frame dari manifest JSON + UI pemilih frame/filter.

**Phase 3 — Polish & mobile hardening** *(~1–2 weekend)*
Desain eye-catching, animasi, sound (shutter/countdown), dan yang terpenting: **beresin kamera di iOS Safari & Android** (orientasi, aspect ratio, mirror front-cam, perf).

**Phase 4 — Save & share** *(~1 weekend)*
Upload strip ke R2, short link, lifecycle 7-hari, halaman share `/s/{id}` dengan OG preview.

→ **MVP selesai di akhir Phase 4.**

**Phase 5+ — Lanjutan (opsional, sesuai minat)**
WebGL filter berat → editor frame UGC → filter builder → auth + galeri kreator → moderasi.

**Total estimasi MVP (Phase 0–4):** ~**6–9 minggu** dengan ritme santai (≈1 jam/malam + weekend). Kalau fokus penuh di weekend, bisa lebih cepat. Angka ini asumsi kamu belajar item §8 sambil jalan, bukan sekaligus di depan.

---

## 10. Metrik Sukses (buat portfolio yang "kepakai")

- Orang bisa dari buka web → strip ter-download **tanpa baca instruksi**.
- Jalan mulus di HP mid-range Android dan iPhone.
- Minimal beberapa orang di luar kamu benar-benar memakainya dan share hasilnya.
- (Nanti) ada frame buatan orang lain yang masuk katalog.

---

## 11. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | **Ruang sangat ramai** — ratusan web photobooth & clone life4cut gratis | "Portofolio yang kepakai" gagal karena tak ada pembeda | Hook = **desain + sudut open/custom-frame**. Jangan tunda terlalu lama bagian yang bikin beda. |
| 2 | **Kamera lintas-device fiddly** (iOS Safari rewel, perf Android murah) | Bagian yang paling makan waktu, bukan filternya | Live preview pakai CSS ringan; look berat baru di-bake saat capture. Alokasikan Phase 3 penuh untuk ini. |
| 3 | **Moderasi UGC** — frame/filter dari user bisa disalahgunakan (NSFW, konten bermasalah) | Blocker sebelum UGC dibuka publik | Jujur: ini scope besar. Tunda UGC sampai ada mekanisme moderasi (manual approval dulu, otomatis nanti). Jangan buka UGC publik tanpa ini. |
| 4 | **Scope creep di "desain eye-catching"** | Time sink tanpa ujung | Tetapkan satu arah desain di awal Phase 3 dan patuhi; polish itu berlapis, bukan tak terbatas. |
| 5 | **UGC filter** masih tanda tanya | Bisa jadi kompleksitas besar dgn payoff kecil | Perlakukan sebagai eksperimen terpisah setelah UGC frame terbukti dipakai. Frame dulu, filter menyusul. |

**Risiko terbesar yang jujur:** bukan teknis — ini soal pembeda. Engine-nya bisa kamu selesaikan. Yang menentukan "kepakai orang banyak" adalah desain dan sudut terbuka, jadi itu jangan diperlakukan sebagai polish belakangan.

---

## 12. Catatan Branding

- **Nama inti:** Aliby. "Booth" jadi deskriptor opsional (judul halaman: *Aliby — photo booth*).
- **Konsep:** alibi = bukti kamu ada di momen itu. Angkat ini di landing.
- **Tagline kandidat:** *"Bukti kamu di sana."* / *"Every moment needs an Aliby."*
- **Cek sebelum fix:** ketersediaan domain & handle. `aliby.com` kemungkinan sudah diambil; cek `aliby.pics`, `aliby.app`, `getaliby.com`. (Bisa dibantu cek terpisah.)

---

## 13. Keputusan Terbuka

1. UGC filter — jadi dibuka atau cukup UGC frame saja? (Diputuskan setelah lihat traksi frame.)
2. Perlu galeri publik hasil strip, atau cukup link privat? (Galeri = butuh moderasi lebih berat.)
3. Watermark "Aliby" kecil di strip gratis — ya/tidak? (Membantu penyebaran organik.)
4. Domain final (§12).

---

*Dokumen ini blueprint, bukan kontrak. Perbarui saat asumsi berubah — terutama setelah Phase 1 memperlihatkan mana yang keliru selagi masih murah untuk berubah arah.*
