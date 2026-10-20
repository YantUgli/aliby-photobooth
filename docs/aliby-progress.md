# Aliby — Progres

Diperbarui setiap akhir WP oleh skill `/kerjakan-wp`. Status: `Belum` · `Berjalan` · `Selesai` · `Tertahan`.
Kolom "Asumsi" berisi kode OQ yang dipakai sebagai default sementara; kolom "Catatan" berisi hal yang perlu
diperiksa pemilik proyek. Rincian tiap WP: [`aliby-wbs.md`](aliby-wbs.md).

**Fase aktif menurut `CLAUDE.md`:** Phase 1. **Menurut README:** Phase 0–2 selesai. → OQ-14.

| WP | Nama | Mode | Status | Kebutuhan tercakup & teruji | Asumsi | Catatan |
|---|---|---|---|---|---|---|
| 0.1 | Repo, Next.js, lint, test runner | Agen | Selesai | — | — | Dicatat ulang 20/10/2026 dari README. |
| 0.2 | Design token & font | Agen | Selesai | UX-01 | — | Halaman bukti token di `/` (lihat OQ-08). |
| 0.3 | Deploy skeleton Vercel | Manusia | Tertahan | DEP-01, KAM-03 | — | Belum ada URL yang terbukti (OQ-16). |
| 1.1 | Manifest frame + zona watermark | Agen | Selesai | FRM-01, FRM-03 | — | |
| 1.2 | Hook kamera | Pembimbing | Selesai | KAM-01..04, KAM-07 | — | Mirror belum (3.1). |
| 1.3 | Reducer alur capture | Agen | Selesai | CAP-01..05 | — | |
| 1.4 | Komposit & unduh | Pembimbing | Selesai | KOM-01, KOM-02 | — | Test canvas di-skip di Node; bukti piksel di README. |
| 1.5 | Layar capture, tinjau, ulangi | Agen | Selesai | CAP-01, CAP-03, CAP-04, UX-04 | — | |
| 2.1 | Katalog frame (3 frame) | Agen | Selesai | FRM-02, FRM-04 | — | |
| 2.2 | Katalog & validasi filter | Agen | Selesai | FLT-01, FLT-02, FLT-05 | — | |
| 2.3 | Layar pilih frame | Agen | Selesai | FRM-06 | — | |
| 2.4 | Layar filter + bake | Agen + Pembimbing | Selesai | FLT-03, FLT-04, FLT-06 | — | |
| 3.1 | Cermin kamera depan | Campuran | Belum | — | — | Menunggu OQ-03. |
| 3.2 | Hardening kamera iOS & Android | Pembimbing + Manusia | Belum | — | — | Butuh HTTPS di HP (0.3 / tunnel). |
| 3.3 | Landing | Agen | Belum | — | — | Menunggu OQ-08. |
| 3.4 | Dekorasi scrapbook per layar | Agen | Belum | — | — | Butuh daftar aset handoff. |
| 3.5 | Animasi & transisi | Agen | Belum | — | — | |
| 3.6 | Suara countdown & shutter | Agen | Belum | — | — | |
| 3.7 | Katalog frame 6–10 | Campuran | Belum | — | — | Menunggu OQ-07. |
| 4.1 | Infrastruktur R2 | Manusia | Belum | — | — | Menunggu OQ-11. |
| 4.2 | `/api/save` presigned PUT | Pembimbing | Belum | — | — | Menunggu OQ-09, OQ-10. |
| 4.3 | Layar Hasil + Simpan | Agen | Belum | — | — | |
| 4.4 | Halaman share `/s/{id}` | Agen | Belum | — | — | Menunggu OQ-11. |
| 4.5 | Verifikasi share di Vercel | Manusia + Agen | Belum | — | — | |
| Q.1 | Driver verifikasi browser | Agen | Belum | — | — | Menunggu OQ-15. |
| Q.2 | Audit aksesibilitas & kontras | Agen | Belum | — | — | |
| Q.3 | Uji perangkat nyata | Manusia | Belum | — | — | |
| Q.4 | Rilis MVP | Manusia + Agen | Belum | — | — | |

## Log sesi

<!-- Format: YYYY-MM-DD · WP · ringkasan 1–2 kalimat · test: X lulus / Y skip / Z total -->
- 2026-10-20 · — · WBS, indeks kebutuhan, keputusan/OQ, dan skill `/kerjakan-wp` dibuat. Baseline diambil sebelum WP pertama. · test: 78 lulus / 5 skip / 83 total; lint & tsc bersih
