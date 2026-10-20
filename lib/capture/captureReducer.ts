import type { FrameSlot } from "../frames/types.ts";
import type { CaptureState, SlotPhoto } from "./types.ts";

/** Reducer alur capture.
 *
 *  Inti desainnya: foto disimpan per-slot di `photos`, jadi "ulangi foto N"
 *  hanya menimpa satu entri lalu komposit ulang. Tidak ada logika khusus untuk
 *  re-take — ia konsekuensi langsung dari model data (PRD §6.1).
 *
 *  Reducer ini MURNI: tidak menyentuh canvas, kamera, DOM, atau object URL.
 *  Itu yang bikin ia bisa dites tanpa browser. Umur object URL diurus di
 *  pemanggil lewat effect yang membandingkan URL lama vs baru — bukan di sini,
 *  karena reducer bisa dipanggil ulang oleh React dan tidak boleh punya efek
 *  samping. */

export type CaptureAction =
  /** Mulai sesi: arahkan ke slot pertama yang masih kosong. */
  | { type: "start" }
  /** Satu slot selesai dijepret. */
  | { type: "photoTaken"; photo: SlotPhoto }
  /** User mengetuk foto di layar tinjau → munculkan konfirmasi. */
  | { type: "askRetake"; slotId: number }
  /** User menekan "Batal" di konfirmasi. */
  | { type: "cancelRetake" }
  /** User menekan "Ulangi" → kembali ke capture untuk slot itu saja. */
  | { type: "confirmRetake" }
  /** Dari tinjau → layar filter. */
  | { type: "goToFilter" }
  /** Dari layar filter → kembali ke tinjau. */
  | { type: "backToReview" }
  /** Pilih filter warna. Tidak mengubah foto — filter dibakar saat komposit. */
  | { type: "selectFilter"; filterId: string }
  /** Buang semua dan mulai dari nol. */
  | { type: "reset" };

export const initialCaptureState: CaptureState = {
  phase: "idle",
  activeSlotId: null,
  photos: {},
  pendingRetakeSlotId: null,
  filterId: null,
};

export function captureReducer(
  state: CaptureState,
  action: CaptureAction,
  slots: readonly FrameSlot[],
): CaptureState {
  switch (action.type) {
    case "start": {
      const next = firstEmptySlotId(state.photos, slots);
      if (next === null) {
        // Sudah lengkap — langsung ke tinjau, bukan menjepret ulang.
        return { ...state, phase: "review", activeSlotId: null };
      }
      return { ...state, phase: "capturing", activeSlotId: next };
    }

    case "photoTaken": {
      const { photo } = action;
      if (!slots.some((s) => s.id === photo.slotId)) {
        // Slot asing: abaikan daripada menaruh foto di slot yang tak ada.
        return state;
      }

      const photos = { ...state.photos, [photo.slotId]: photo };
      const next = firstEmptySlotId(photos, slots);

      return {
        ...state,
        photos,
        phase: next === null ? "review" : "capturing",
        activeSlotId: next,
        pendingRetakeSlotId: null,
      };
    }

    case "askRetake": {
      // Hanya slot yang sudah ada fotonya bisa diulang.
      if (!state.photos[action.slotId]) return state;
      return { ...state, pendingRetakeSlotId: action.slotId };
    }

    case "cancelRetake":
      return { ...state, pendingRetakeSlotId: null };

    case "confirmRetake": {
      const slotId = state.pendingRetakeSlotId;
      if (slotId === null) return state;
      // Foto lama DIBIARKAN sampai foto baru masuk. Kalau user keluar di
      // tengah jalan, strip tetap lengkap — tiga foto lain memang aman, dan
      // yang ini pun belum hilang.
      return {
        ...state,
        phase: "capturing",
        activeSlotId: slotId,
        pendingRetakeSlotId: null,
      };
    }

    case "goToFilter": {
      // Hanya dari tinjau, dan hanya kalau strip benar-benar lengkap — layar
      // filter tidak boleh jadi jalan pintas keluar dari capture.
      if (state.phase !== "review" || !isComplete(state.photos, slots)) {
        return state;
      }
      return { ...state, phase: "filter", pendingRetakeSlotId: null };
    }

    case "backToReview": {
      if (state.phase !== "filter") return state;
      return { ...state, phase: "review" };
    }

    case "selectFilter":
      // Foto mentah tidak disentuh sama sekali; filter cuma catatan tentang
      // bagaimana strip akan dikomposit nanti (docs/aliby-konvensi.md §Aturan arsitektur).
      return { ...state, filterId: action.filterId };

    case "reset":
      return initialCaptureState;
  }
}

/** Slot kosong pertama menurut urutan di manifest, atau null kalau penuh. */
export function firstEmptySlotId(
  photos: Readonly<Record<number, SlotPhoto>>,
  slots: readonly FrameSlot[],
): number | null {
  for (const slot of slots) {
    if (!photos[slot.id]) return slot.id;
  }
  return null;
}

export function filledCount(
  photos: Readonly<Record<number, SlotPhoto>>,
  slots: readonly FrameSlot[],
): number {
  return slots.reduce((n, s) => (photos[s.id] ? n + 1 : n), 0);
}

export function isComplete(
  photos: Readonly<Record<number, SlotPhoto>>,
  slots: readonly FrameSlot[],
): boolean {
  return firstEmptySlotId(photos, slots) === null;
}

/** Urutan foto sesuai urutan slot di manifest — dipakai saat komposit. */
export function photosInSlotOrder(
  photos: Readonly<Record<number, SlotPhoto>>,
  slots: readonly FrameSlot[],
): readonly SlotPhoto[] {
  return slots
    .map((s) => photos[s.id])
    .filter((p): p is SlotPhoto => p !== undefined);
}
