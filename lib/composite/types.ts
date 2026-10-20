import type { FrameManifest } from "../frames/types.ts";
import type { SlotPhoto } from "../capture/types.ts";

export type CompositeInput = {
  readonly frame: FrameManifest;
  /** Foto per slot, key = slotId. Slot tanpa foto dibiarkan kosong
   *  (cuma background) — bukan error. */
  readonly photos: Readonly<Record<number, SlotPhoto>>;
  /** URL overlay PNG yang sudah di-resolve.
   *  Manifest hanya menyimpan nama file; pemanggil yang menjadikannya URL. */
  readonly overlayUrl: string;
  /** String `filter` CSS yang dibakar ke foto (PRD §6.2). Dipakai apa adanya
   *  sebagai `ctx.filter`, jadi harus string yang sama dengan yang dipakai
   *  pratinjau — kalau berbeda, hasil unduhan tidak sama dengan yang dilihat.
   *  Default "none". */
  readonly filterCss?: string;
  /** Tipe output. Default "image/jpeg". */
  readonly mimeType?: "image/jpeg" | "image/png";
  /** Kualitas JPEG 0–1. Default 0.92. */
  readonly quality?: number;
};

export type CompositeResult = {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
};
