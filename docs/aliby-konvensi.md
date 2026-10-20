# Aliby — Konvensi

Aturan yang dipegang kode Aliby. Scope dan data model ada di
[`PRD-Aliby.md`](PRD-Aliby.md); dokumen ini mencatat aturan turunannya yang
dirujuk dari komentar kode.

## Aturan arsitektur

- **Frame dan filter adalah data, bukan kode.** Frame = manifest JSON (PRD §6.1) + overlay PNG; filter = config JSON (PRD §6.2). Tidak ada logika khusus per frame atau per filter.
- **Client-heavy, backend tipis.** Capture, filter, dan komposit terjadi di browser. Server hanya untuk upload/share (Phase 4).
- **Tidak ada database di v1.** Katalog frame/filter = file JSON statis.
- **Viewport kamera mengikuti rasio slot aktif** (`w/h` dari manifest). Yang dilihat user saat capture harus sama dengan yang masuk ke slot.
- **Foto mentah per-slot disimpan di state.** Re-take = timpa satu entri lalu komposit ulang. Filter diterapkan saat komposit, jadi bisa diganti tanpa foto ulang.
- **Zona watermark:** pita bawah 40px tiap frame (canvas 600×1800 → y 1760–1800) tidak boleh ditempati slot.
- Tidak ada fitur di luar PRD v1 (login, galeri, editor frame, AR filter).

## Desain

- Arah visual: scrapbook / "papan bukti". Pakai token di `app/globals.css`, jangan hardcode warna atau font.
- Handoff desain ditulis dengan gaya Tailwind v3 (`theme.extend`); proyek ini memakai Tailwind v4, jadi token dipetakan lewat `@theme` di CSS. Font dari `next/font` tidak memakai nama variabel yang sama dengan token berisi fallback stack (misal pakai `--font-titan`, lalu `--font-display: var(--font-titan), 'Arial Black', ...`).
- Kepadatan per layar: landing, pilih frame, dan hasil maksimal; tinjau strip dan filter sedang; capture minimal. Maksimal 1 sticky note, 2 washi tape, dan 1 benang per layar. Layar capture harus minimal: kamera, countdown, dan indikator slot tidak boleh tertutup dekorasi.
- Area yang bisa diketuk tetap jelas terlihat sebagai tombol. Teks kecil lolos kontras WCAG AA.
- Utamakan CSS untuk efek (rotasi, bayangan, border). Aset gambar hanya yang ada di daftar aset.
