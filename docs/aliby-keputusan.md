# Aliby — Keputusan & Pertanyaan Terbuka

Bagian A berisi keputusan yang **sudah mengikat**: kode wajib mengikutinya. Bagian B berisi pertanyaan
terbuka (OQ) beserta default sementara.

Cara pakai OQ:

- **Default sementara** boleh dipakai agen untuk melanjutkan kerja. Tandai di kode dengan
  `// ASUMSI(OQ-xx)` dan sebut di laporan akhir WP.
- **Wajib jawab** berarti default-nya tidak boleh dipakai diam-diam. Agen berhenti dan bertanya sebelum
  menulis kode yang bergantung padanya.
- Setelah pemilik proyek menjawab, pindahkan barisnya ke bagian A sebagai keputusan (kode `K-xx` baru)
  dan coret OQ-nya. Jangan menghapus baris OQ, supaya `ASUMSI(OQ-xx)` lama tetap bisa dilacak.

---

## A. Keputusan yang mengikat

| Kode | Keputusan | Sumber |
|---|---|---|
| K-01 | Frame dan filter adalah data (manifest/config JSON + PNG). Tidak ada `if (frame.id === …)` atau `if (filter.id === …)` di kode. | konvensi |
| K-02 | Tanpa database di v1. Katalog = JSON statis di `public/`. Share = objek R2. | PRD §5, §6.3 |
| K-03 | Pita bawah 40px (`WATERMARK_BAND_HEIGHT`) dipesan, tidak boleh ditempati slot. Apa yang digambar di situ: lihat OQ-01. | konvensi |
| K-04 | `public/frames/index.json` hanya berisi id; isi frame hanya dari manifest-nya sendiri. | README §Frame |
| K-05 | String `css` filter divalidasi dengan **daftar izin**: `brightness contrast grayscale invert opacity saturate sepia blur hue-rotate` + `none`. `url()` dan `drop-shadow` ditolak. | README §Filter |
| K-06 | Kamera hidup hanya selama fase menjepret; di layar tinjau/filter stream dihentikan. | `app/booth/page.tsx` |
| K-07 | Browser tanpa `ctx.filter` (Safari < 18): pratinjau tetap berfilter, file unduhan polos, dan layar filter **mengatakannya di muka**. Tidak ada polyfill. | README §Filter |
| K-08 | Arah desain "Blitz" (Baloo 2 + magenta) di proyek desain **tidak dipakai**. Token hanya dari `app/globals.css`. | README §Dokumen rujukan |
| K-09 | Tailwind v4: token dipetakan lewat `@theme static`; token yang bertabrakan dengan namespace Tailwind tinggal di `:root`. Variabel `next/font` (`--font-titan` dkk.) tidak memakai nama token peran. | README §Design token · konvensi |
| K-10 | Test runner = `node --test` bawaan Node, tanpa dependency. Test yang butuh Canvas 2D/kamera di-*skip* di Node dan dibuktikan di browser. | README §Jalankan lokal |
| K-11 | **Mode pembimbing:** `lib/camera/useCamera.ts` (hook kamera), `lib/composite/compositeStrip.ts` (komposit), dan upload R2 dengan presigned URL ditulis pemilik proyek. Agen hanya boleh menulis tipe, test, stub `TODO(pembimbing)`, dan kode pemanggil, lalu mereview dengan bertanya dulu. | `CLAUDE.md` §Cara bekerja |
| K-12 | Dependency baru selalu ditanyakan dulu, termasuk devDependency. | `CLAUDE.md` §Cara bekerja |
| K-13 | Galeri publik tidak ada di v1; strip hanya bisa diakses lewat link privat `/s/{shortid}`. | PRD §13.2 · `CLAUDE.md` (tanpa galeri) |
| K-14 | Countdown tetap 3 detik, tidak bisa diatur user. | PRD §3 |

## B. Pertanyaan terbuka (OQ)

| Kode | Pertanyaan | Default sementara | Status | Menahan WP |
|---|---|---|---|---|
| OQ-01 | Watermark "Aliby" digambar di pita 40px strip? (PRD §13.3) | Pita dibiarkan polos (warna background). Tidak ada teks watermark. | Default sementara | 3.7, Q.4 |
| OQ-02 | Domain final? (PRD §12, §13.4) | URL absolut (OG, link share) dibaca dari env `NEXT_PUBLIC_SITE_URL`; dev = `http://localhost:3000`, produksi = URL Vercel sampai domain dipilih. | Default sementara | 4.4, Q.4 |
| OQ-03 | Kamera depan: hanya **pratinjau** yang dicerminkan, atau **foto hasilnya** juga? | Pratinjau **dan** foto dicerminkan, mengikuti aturan "yang dilihat = yang masuk ke slot" (KAM-04). Konsekuensi: tulisan di latar terbaca terbalik di strip. | **Wajib jawab** | 3.1 |
| OQ-04 | Sumber suara shutter/countdown? Aset audio tidak ada di daftar aset. | Disintesis dengan Web Audio API (tanpa file, tanpa dependency). | Default sementara | 3.6 |
| OQ-05 | Suara aktif secara bawaan? Perlu tombol bisu? | Aktif setelah interaksi pertama user (aturan autoplay), dengan satu tombol bisu yang pilihannya disimpan di `localStorage`. | Default sementara | 3.6 |
| OQ-06 | Animasi saat `prefers-reduced-motion: reduce`? | Animasi dekoratif dimatikan; countdown tetap tampil sebagai angka tanpa animasi skala. | Default sementara | 3.5 |
| OQ-07 | Aset frame ke-4 sampai ke-10 datang dari mana dan berapa banyak? (FRM-05) | Tidak ada default. Agen tidak menggambar overlay baru. | **Wajib jawab** | 3.7 |
| OQ-08 | Halaman bukti token di `/` dibuang, dipindah (misal `/dev/token`), atau dibiarkan saat landing dibangun? | Tidak ada default. | **Wajib jawab** | 3.3 |
| OQ-09 | Batasan upload `/api/save`: tipe, ukuran maksimum, dan pembatasan laju? PRD tidak menyebutnya, padahal endpoint ini publik dan gratis. | Presigned URL dikunci `Content-Type: image/jpeg` dan `Content-Length` ≤ 5 MB, berlaku 5 menit. Pembatasan laju **tidak** dibangun di v1. | **Wajib jawab** | 4.2 |
| OQ-10 | Dependency Phase 4: SDK S3 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) atau `aws4fetch` yang lebih kecil? `nanoid` atau `crypto.getRandomValues` sendiri? | Tidak ada default — K-12. | **Wajib jawab** | 4.2 |
| OQ-11 | Gambar di `/s/{shortid}` dibaca lewat URL publik R2 (custom domain / `r2.dev`) atau di-proxy lewat Next.js? | URL publik R2 dengan custom domain; halaman share hanya merujuk URL-nya. | **Wajib jawab** | 4.1, 4.4 |
| OQ-12 | Link yang sudah kedaluwarsa atau `shortid` tidak dikenal: tampilan apa? | Halaman 404 bergaya Aliby: "Strip ini sudah lewat 7 hari" + tombol "Bikin stripmu". | Default sementara | 4.4 |
| OQ-13 | Layar Hasil: fase baru di reducer `/booth` atau route terpisah? | Fase `result` di `captureReducer` (foto mentah tetap di memori, jadi "ganti filter" masih bisa). | Default sementara | 4.3 |
| OQ-14 | `CLAUDE.md` §Fase saat ini masih menulis **Phase 1**, sedangkan README menyatakan Phase 0–2 selesai. Fase aktif sekarang yang mana? | Tidak ada default. `kerjakan-wp` meminta konfirmasi bila WP di luar fase aktif `CLAUDE.md`. | **Wajib jawab** | semua WP Phase 3–4 |
| OQ-15 | Driver verifikasi browser (CDP + Chrome headless) yang sekarang di luar repo: dimasukkan ke repo? Di mana file aslinya? | Tidak ada default. | **Wajib jawab** | Q.1 |
| OQ-16 | Skeleton sudah ter-deploy di Vercel dengan HTTPS? (DEP-01) | Dianggap belum terbukti sampai ada URL. | **Wajib jawab** | 0.3, 3.2, Q.3 |
