export type FacingMode = "user" | "environment";

export type CameraStatus =
  /** Belum diminta. */
  | "idle"
  /** Izin sedang diminta ke user. */
  | "requesting"
  /** Stream jalan, <video> siap dijepret. */
  | "ready"
  /** User menolak izin kamera. Jalan buntu yang harus dijelaskan, bukan dibiarkan. */
  | "denied"
  /** Browser tidak punya getUserMedia / tidak ada kamera / bukan secure origin. */
  | "unsupported"
  /** Gagal lain. Lihat `errorMessage`. */
  | "error";

export type UseCameraOptions = {
  /** Rasio `w/h` slot aktif dari manifest. Viewport WAJIB mengikuti ini supaya
   *  yang dilihat user sama dengan yang masuk ke slot
   *  (docs/aliby-konvensi.md §Aturan arsitektur). Strip A: 520/360 ≈ 1.444. */
  readonly aspectRatio: number;
  readonly initialFacingMode?: FacingMode;
};

export type UseCameraResult = {
  /** Dipasang ke <video>. Sengaja CALLBACK ref, bukan RefObject: elemen
   *  <video> bisa berganti saat layar di-remount, dan stream harus dipasang
   *  ulang ke elemen yang baru. RefObject tidak memberi tahu hook saat itu
   *  terjadi, sehingga elemen baru akan tetap kosong (videoWidth = 0). */
  readonly videoRef: (el: HTMLVideoElement | null) => void;
  readonly status: CameraStatus;
  /** Pesan siap-tampil untuk user saat status "denied" | "unsupported" | "error". */
  readonly errorMessage: string | null;
  readonly facingMode: FacingMode;
  /** Minta izin & mulai stream. Aman dipanggil berulang. */
  readonly start: () => void;
  /** Hentikan semua track. Wajib dipanggil saat komponen unmount —
   *  kalau tidak, lampu kamera tetap menyala setelah user pindah layar. */
  readonly stop: () => void;
  /** Ganti depan/belakang. */
  readonly flip: () => void;
  /** Ambil satu frame dari <video> ke Blob berukuran `size`.
   *  Hanya valid saat status === "ready". */
  readonly grabFrame: (size: {
    readonly width: number;
    readonly height: number;
  }) => Promise<Blob>;
};
