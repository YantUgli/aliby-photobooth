/** Tipe frame manifest — format sesuai PRD §6.1.
 *
 *  Frame adalah DATA, bukan kode (docs/aliby-konvensi.md §Aturan arsitektur). Semua yang
 *  spesifik per frame hidup di JSON; tidak ada cabang `if (frame.id === ...)`
 *  di mana pun. Menambah frame = menambah satu JSON + satu PNG overlay. */

/** Satu kotak tempat foto ditaruh di atas canvas strip.
 *  Jumlah slot = jumlah shot (PRD §6.1). */
export type FrameSlot = {
  /** Nomor slot, 1-based. Ini yang dipakai user ("Ulangi foto 2?"). */
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

export type FrameCanvas = {
  readonly width: number;
  readonly height: number;
};

export type FrameManifest = {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly canvas: FrameCanvas;
  /** Warna dasar, digambar sebelum foto. */
  readonly background: string;
  /** Nama file PNG transparan yang digambar DI ATAS foto.
   *  Relatif terhadap direktori frame, bukan URL absolut. */
  readonly overlay: string;
  readonly slots: readonly FrameSlot[];
};

/** Tinggi pita watermark di dasar canvas, dalam px.
 *  Zona ini tidak boleh ditempati slot (docs/aliby-konvensi.md §Aturan arsitektur).
 *  Untuk canvas 600×1800 berarti y 1760–1800. */
export const WATERMARK_BAND_HEIGHT = 40;

export class FrameManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrameManifestError";
  }
}
