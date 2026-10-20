/** Foto mentah satu slot.
 *
 *  Disimpan MENTAH, tanpa filter (docs/aliby-konvensi.md §Aturan arsitektur). Filter
 *  diterapkan saat komposit, jadi bisa diganti tanpa foto ulang. Di Phase 1
 *  belum ada filter, tapi modelnya sudah benar supaya Phase 2 tinggal nambah. */
export type SlotPhoto = {
  readonly slotId: number;
  /** JPEG/PNG hasil jepret, ukuran = ukuran slot di manifest. */
  readonly blob: Blob;
  /** Object URL untuk <img> preview. Wajib di-revoke saat ditimpa. */
  readonly objectUrl: string;
  readonly takenAt: number;
};

/** Fase alur capture — turunan dari activity diagram di
 *  docs/aliby-diagram-sistem.md §3. */
export type CapturePhase =
  /** Kamera belum jalan / izin belum diminta. */
  | "idle"
  /** Slot aktif sedang dijepret (countdown berjalan). */
  | "capturing"
  /** Semua slot terisi; user meninjau strip dan bisa ketuk foto untuk ulangi. */
  | "review"
  /** User memilih filter warna sebelum mengunduh. */
  | "filter";

export type CaptureState = {
  readonly phase: CapturePhase;
  /** Slot yang sedang/akan dijepret. null saat phase "review". */
  readonly activeSlotId: number | null;
  /** Foto per slot, key = slotId. Ulangi = timpa satu entri di sini. */
  readonly photos: Readonly<Record<number, SlotPhoto>>;
  /** Slot yang sedang dikonfirmasi ulang ("Ulangi foto N?"). */
  readonly pendingRetakeSlotId: number | null;
  /** Filter warna terpilih, id dari katalog. null = belum memilih, yang
   *  diperlakukan sama dengan "Asli" oleh pemanggil. Disimpan di sini, bukan
   *  di layar filter, supaya pilihannya bertahan saat user bolak-balik ke
   *  tinjau — dan supaya `reset` ikut membersihkannya. */
  readonly filterId: string | null;
};
