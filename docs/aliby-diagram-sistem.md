# Aliby — Diagram Sistem

**Turunan dari `PRD-Aliby.md` (v0.1) · dibekukan 24 September 2026**

Dokumen ini merekam tiga diagram untuk memahami sistem Aliby. Semua diagram ditulis sebagai blok [Mermaid](https://mermaid.js.org/) — bisa diedit langsung dan dirender otomatis di GitHub, GitLab, dan VS Code (ekstensi *Markdown Preview Mermaid*).

> **Konteks penting:** di **v1 (MVP)** belum ada database. `Frame`, `Slot`, dan `Filter` hidup sebagai file JSON statis; `Strip` cuma objek `.jpg` di Cloudflare R2. Skema relasional pada ERD di bawah adalah *model data logis* yang baru jadi tabel Postgres beneran saat fitur **UGC** (user bikin frame/filter sendiri) dibuka. Bagian pasca-MVP ditandai jelas di tiap diagram.

---

## 1. Use Case Diagram

Aktor digambar sebagai lingkaran, use case sebagai kapsul. Aktor **Pemakai** memikul seluruh alur v1. Aktor **Kreator** dan **Moderator** baru relevan saat UGC.

```mermaid
flowchart LR
    pemakai(("Pemakai"))
    kreator(("Kreator"))
    moderator(("Moderator"))

    subgraph Aliby
        direction TB
        uc1(["Izinkan kamera"])
        uc2(["Pilih frame"])
        uc3(["Foto per-slot"])
        uc3a(["Hitung mundur"])
        uc3b(["Re-take slot"])
        uc4(["Tinjau strip"])
        uc5(["Pilih filter warna"])
        uc6(["Komposit strip"])
        uc7(["Unduh strip"])
        uc8(["Simpan & bagikan"])
        uc9(["Login / akun"])
        uc10(["Buat frame"])
        uc11(["Buat filter"])
        uc12(["Moderasi konten"])
    end

    pemakai --- uc1
    pemakai --- uc2
    pemakai --- uc3
    pemakai --- uc4
    pemakai --- uc5
    pemakai --- uc6
    pemakai --- uc7
    pemakai --- uc8

    uc3 -. include .-> uc3a
    uc3 -. extend .-> uc3b
    uc4 -. extend .-> uc3b

    kreator --- uc9
    kreator --- uc10
    kreator --- uc11
    moderator --- uc12

    classDef mvp fill:#E1F5EE,stroke:#0F6E56,color:#04342C;
    classDef ugc fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A,stroke-dasharray:4 3;
    class uc1,uc2,uc3,uc3a,uc3b,uc4,uc5,uc6,uc7,uc8 mvp;
    class uc9,uc10,uc11,uc12 ugc;
```

**Keterangan**

- Hijau = use case **v1 (MVP)**; abu-abu garis putus-putus = **pasca-MVP (UGC)**.
- `Hitung mundur` adalah **«include»** dari `Foto per-slot` — selalu terjadi tiap kali menjepret.
- `Re-take slot` adalah **«extend»** dari **dua** use case: `Foto per-slot` (saat capture) dan `Tinjau strip` (klik foto di preview akhir). Keduanya operasi yang sama — timpa satu entri foto lalu re-composite.
- Manajemen booth/sewa **tidak ada** dan tidak akan pernah masuk (garis pembeda dari Jepreto).

---

## 2. ERD — Model Data

Model data logis. Di v1 `Frame`/`Slot`/`Filter` = JSON dan `Strip` = objek R2; entitas `User` beserta kolom `author_id` & `status` baru aktif saat UGC.

```mermaid
erDiagram
    USER ||--o{ FRAME : membuat
    USER ||--o{ FILTER : membuat
    FRAME ||--|{ SLOT : punya
    FRAME ||--o{ STRIP : dipakai
    FILTER ||--o{ STRIP : diterapkan

    USER {
        uuid id PK
        string handle
        timestamp created_at
    }
    FRAME {
        string id PK
        string name
        string author_id FK
        int canvas_w
        int canvas_h
        string background
        string overlay
        string status
    }
    SLOT {
        int id PK
        string frame_id FK
        int x
        int y
        int w
        int h
    }
    FILTER {
        string id PK
        string name
        string css
        string webgl
        string author_id FK
        string status
    }
    STRIP {
        string shortid PK
        string object_key
        string frame_id FK
        string filter_id FK
        timestamp created_at
        timestamp expires_at
    }
```

**Keterangan kardinalitas**

- `FRAME ||--|{ SLOT` — satu frame **wajib** punya minimal satu slot. Inilah aturan **jumlah slot = jumlah shot**.
- `USER ||--o{ FRAME` (lingkaran = *optional*) — seorang user bisa saja belum bikin frame apa pun.
- `STRIP` menyimpan `frame_id` & `filter_id` sebagai jejak yang dipakai. Di v1 ini cukup jadi *custom metadata* objek R2; `expires_at` ditangani **lifecycle rule R2** (auto-hapus 7 hari), bukan kode.

---

## 3. Activity Diagram — Alur Capture

Alur inti dari izin kamera sampai simpan/unduh. Ada **dua titik re-take**: langsung per-slot saat capture, dan klik foto di tinjau strip lengkap.

```mermaid
flowchart TD
    start([Mulai]) --> izin[Izinkan kamera]
    izin --> qizin{Kamera diizinkan?}
    qizin -- tidak --> blokir[/Blokir + pesan izin/]
    qizin -- ya --> frame[Pilih frame]

    frame --> countdown[Hitung mundur 3 detik]
    countdown --> ambil[Ambil foto + preview slot]
    ambil --> qpuas{Puas dengan slot ini?}
    qpuas -- tidak --> countdown
    qpuas -- ya --> qlengkap{Semua slot terisi?}
    qlengkap -- belum --> countdown
    qlengkap -- ya --> tinjau[Tinjau strip lengkap]

    tinjau --> qretake{Klik foto untuk re-take?}
    qretake -- ya --> retake[Re-take slot terpilih<br/>countdown + 1 foto]
    retake --> tinjau
    qretake -- tidak --> filter[Pilih filter warna]

    filter --> komposit[Komposit strip<br/>bake filter + overlay]
    komposit --> qsimpan{Unduh atau simpan?}
    qsimpan -- unduh --> unduh([Unduh PNG / JPG])
    qsimpan -- simpan --> upload([Upload ke R2<br/>link aktif 7 hari])
```

**Keterangan**

- **Loop capture** — `Puas?` yang gagal mengulang slot yang sama; `Semua slot terisi?` yang belum lanjut ke slot berikutnya. Keduanya kembali ke `Hitung mundur`.
- **Tinjau strip** adalah state interaktif: tiap slot bisa diklik untuk re-take, lalu kembali ke tinjau (bukan lanjut otomatis). Beri affordance visual (border menyala + ikon ulangi) supaya jelas foto bisa diklik.
- Filter dipilih **sekali** setelah semua slot beres, lalu di-*bake* saat komposit.
- Satu-satunya langkah yang menyentuh backend adalah **Upload ke R2**.

---

*Dokumen ini turunan dari blueprint dan ikut berubah saat asumsi berubah. Perbarui berbarengan dengan `PRD-Aliby.md`.*
