# Aliby

Web photobooth: pilih frame, foto per-slot (bisa ulangi satu slot), pilih filter
warna, lalu unduh strip atau simpan dan dapat link 7 hari.

> *Biar nggak cuma di ingatan. Momennya lewat, stripnya nggak.*

## Status

**Phase 0 — Setup: selesai.** Next.js + TypeScript + Tailwind v4, design token
terpasang, landing bukti token di `/`.

**Phase 1 — Vertical slice: selesai.** Satu frame, alur capture per-slot dengan
countdown, re-take per-slot dengan konfirmasi, pratinjau strip, dan unduh.

**Phase 2 — Filter & multi-frame: selesai.** Katalog frame dari manifest JSON,
katalog filter dari config JSON, layar pilih frame, layar pilih filter dengan
pratinjau langsung, dan filter yang di-*bake* saat komposit. Alur penuh di
`/booth`: pilih frame → foto per-slot → tinjau (+ ulangi) → pilih filter →
unduh. Masih tanpa backend.

Terverifikasi end-to-end lewat Chrome headless dengan kamera palsu, untuk
ketiga frame:

| Frame | Slot | Canvas | Foto | Viewport kamera |
|---|---|---|---|---|
| Pin & Washi | 4 | 600×1800 | 520×360 | 1.453 (slot 1.444) |
| Trio | 3 | 600×1404 | 520×360 | 1.453 (slot 1.444) |
| Duo Potret | 2 | 600×1568 | 520×640 | 0.810 (slot 0.813) |

Bahwa filter benar-benar ter-*bake* diperiksa dengan mengunduh strip yang sama
dua kali — "Asli" lalu "Hitam Putih" — dan membandingkan piksel di titik yang
sama:

| Titik sampel | Asli | Hitam Putih |
|---|---|---|
| tengah foto 1 | `77,250,36` | `203,203,203` |
| tengah foto 2 | `84,239,59` | `199,199,199` |
| kertas antar slot | `251,250,245` | `251,250,245` |
| pita watermark | `251,250,245` | `251,250,245` |
| bingkai polaroid | `255,255,255` | `255,255,255` |

Foto berubah; kertas, bingkai, dan pita watermark tidak. Itu yang membuktikan
`ctx.filter` dipasang setelah background dan dilepas sebelum overlay.

Roadmap lengkap ada di [`docs/PRD-Aliby.md`](docs/PRD-Aliby.md) §9.

## Jalankan lokal

```bash
npm install
npm run dev     # http://localhost:3000
```

| Script | Fungsi |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run start` | jalankan hasil build |
| `npm run lint` | ESLint (`next lint` sudah dihapus di Next 16) |
| `npm test` | test runner bawaan Node — tanpa dependency tambahan |
| `npx tsc --noEmit` | type-check |

Test mencakup logika murni: validasi manifest frame, geometri slot, zona
watermark, validasi string filter CSS, katalog yang benar-benar dikirim di
`public/`, dan reducer alur capture. Apa pun yang butuh Canvas 2D atau kamera
tidak bisa dites di Node dan ditandai skipped — itu dicek di browser.

Verifikasi browser dilakukan dengan driver CDP kecil (Chrome headless +
`--use-fake-device-for-media-stream`) yang hidup di luar repo. Ia belum jadi
script `npm`; angkanya di bagian Status adalah hasil terakhirnya.

Jalankan `npm run lint` dan type-check sebelum menganggap satu langkah selesai.

## Dokumen rujukan

| File | Isi |
|---|---|
| [`docs/aliby-konvensi.md`](docs/aliby-konvensi.md) | aturan arsitektur & desain |
| [`docs/PRD-Aliby.md`](docs/PRD-Aliby.md) | scope, data model, roadmap |
| [`docs/aliby-diagram-sistem.md`](docs/aliby-diagram-sistem.md) | use case, ERD, activity diagram |

**Desain:** proyek desain "Aliby Scrapbook" (arah visual *scrapbook /
papan bukti*), lewat `handoff-scrapbook.md` Revisi 3.

> Proyek desain itu juga memuat arah kedua bernama **"Blitz"** (Baloo 2 +
> magenta) di `tokens/`, `styles.css`, dan `readme.md`. Arah itu **tidak
> dipakai**. Jangan ambil token dari sana.

## Design token

[`app/globals.css`](app/globals.css) adalah **sumber kebenaran** untuk warna,
font, skala tipografi, spacing, radius, bayangan, dan rotasi. Jangan hardcode
nilai di komponen.

Token hidup di dua tempat, dan alasannya ada di komentar file itu:

- `@theme static { … }` — token yang jadi utility Tailwind (`bg-board`,
  `text-brand-pink`, `rounded-card`, `shadow-pola`, `font-display`,
  `text-display-xl`). `static` dipakai supaya token yang belum terpakai pun
  tetap diemit ke `:root`.
- `:root { … }` — token yang **tidak boleh** jadi utility karena namanya
  bertabrakan dengan namespace Tailwind v4 (`--inset-*`, `--space-*`), atau
  tidak punya namespace sama sekali (`--rot-*`, `--weight-*`, `--pad-screen`).

Tiga utility tersedia: `.disp` (judul bubble bergaris), `.board` (tekstur papan
gabus CSS-only), dan `.booth` (bilik gelap layar capture). Semuanya nol aset
gambar.

### Font

Titan One, Permanent Marker, dan Archivo dimuat lewat `next/font/google` dan
di-self-host. Nama variabelnya (`--font-titan`, `--font-permanent-marker`,
`--font-archivo`) **sengaja** berbeda dari token peran (`--font-display`,
`--font-marker`, `--font-sans`) yang memuat fallback stack — kalau disamakan,
next/font akan menimpanya dan fallback-nya hilang.

## Frame

Katalog frame adalah file statis di `public/frames/`, bukan database (PRD §5).
Satu frame = satu `<id>.json` (format PRD §6.1) + satu `<id>.png` overlay
transparan, dan id-nya disebut di `public/frames/index.json`. Menambah frame
tidak menyentuh kode.

`index.json` sengaja hanya berisi **id**, bukan salinan nama dan jumlah slot:
satu-satunya sumber kebenaran soal isi sebuah frame adalah manifest-nya
sendiri. Layar pilih frame merender pratinjau dari manifest itu, dengan
komponen yang sama yang dipakai layar tinjau.

Manifest divalidasi saat dimuat: slot wajib ada, id-nya unik, tidak keluar
canvas, dan tidak menginjak pita watermark 40px di dasar canvas. Satu manifest
rusak dilewati; sisanya tetap bisa dipakai.

Tiga frame terpasang. Overlay **Pin & Washi** datang dari handoff desain.
**Trio** dan **Duo Potret** disusun dari potongan overlay itu — bingkai
polaroid digambar ulang dengan rumus yang sama, sementara pin, wordmark, washi
tape, dan tanggal dipotong dari file aslinya. Jadi keduanya memakai aset
handoff, bukan seni baru; keduanya ada supaya klaim "frame adalah data"
benar-benar teruji dengan jumlah slot, tinggi canvas, dan rasio slot yang
berbeda. Skripnya tidak ikut di repo — ia sekali pakai, dan hasilnya yang dirawat.

## Filter

Katalog filter adalah satu file statis `public/filters/filters.json` (format
PRD §6.2). Filter = string `filter` CSS, dipakai **dua kali**: di pratinjau
(`style.filter`) dan saat komposit (`ctx.filter`). String yang sama di kedua
jalur — itu yang membuat yang dilihat sama dengan yang terunduh.

String `css` divalidasi dengan daftar **izin**, bukan daftar larangan:
`brightness contrast grayscale invert opacity saturate sepia blur hue-rotate`,
plus `none`. Semua yang lain ditolak, termasuk `url()` (referensi filter SVG
eksternal) dan `drop-shadow` (menggeser piksel keluar dari kotak slot). PRD
§6.2 menyebut format ini sebagai target output *filter builder* UGC nanti, jadi
aturannya ditulis sekarang, selagi katalognya masih ditulis sendiri.

Foto mentah tidak pernah difilter — filter dibakar saat komposit, jadi
menggantinya tidak pernah butuh foto ulang.

> `ctx.filter` baru ada di Safari 18. Di browser yang belum punya, pratinjau
> tetap berfilter tapi file yang terunduh polos, tanpa error apa pun. Layar
> filter mendeteksi ini dan mengatakannya di muka.

## Deploy (Vercel)

Import repo ini di Vercel; Next.js terdeteksi otomatis, tidak perlu
`vercel.json`. HTTPS dari Vercel wajib ada karena `getUserMedia` tidak jalan di
origin non-secure.

## Belum dikerjakan

- **Mirror kamera depan** — pratinjau selfie masih terbaca terbalik. Masuk
  Phase 3 (PRD §9), bersama orientasi dan perf HP.
- **Layar "Hasil" terpisah** dan tombol **"Simpan & dapat link"** — Phase 4,
  bersama upload R2. Tombol Unduh untuk sekarang tinggal di layar filter.
