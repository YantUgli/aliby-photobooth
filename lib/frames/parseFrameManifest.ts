import {
  FrameManifestError,
  WATERMARK_BAND_HEIGHT,
  type FrameManifest,
  type FrameSlot,
} from "./types.ts";

/** Validasi manifest frame dari JSON mentah.
 *
 *  Kenapa divalidasi padahal Phase 1 cuma punya satu frame buatan sendiri:
 *  manifest adalah data eksternal, dan di UGC nanti datanya datang dari user.
 *  Aturan yang ditegakkan di sini ditulis sekali, lalu berlaku untuk semua
 *  frame — termasuk yang belum ada.
 *
 *  Yang dijaga:
 *  - bentuk & tipe field (PRD §6.1)
 *  - minimal satu slot (ERD: FRAME ||--|{ SLOT)
 *  - id slot unik
 *  - slot tidak keluar canvas
 *  - slot tidak menginjak pita watermark 40px di dasar canvas */
export function parseFrameManifest(input: unknown): FrameManifest {
  if (typeof input !== "object" || input === null) {
    throw new FrameManifestError("Manifest harus berupa objek JSON.");
  }
  const raw = input as Record<string, unknown>;

  const id = requireString(raw, "id");
  const name = requireString(raw, "name");
  const author = requireString(raw, "author");
  const background = requireString(raw, "background");
  const overlay = requireString(raw, "overlay");

  const canvasRaw = raw.canvas;
  if (typeof canvasRaw !== "object" || canvasRaw === null) {
    throw new FrameManifestError("Field `canvas` harus objek { width, height }.");
  }
  const canvas = canvasRaw as Record<string, unknown>;
  const width = requirePositiveInt(canvas, "width", "canvas.width");
  const height = requirePositiveInt(canvas, "height", "canvas.height");

  if (!Array.isArray(raw.slots)) {
    throw new FrameManifestError("Field `slots` harus array.");
  }
  if (raw.slots.length === 0) {
    // ERD: satu frame WAJIB punya minimal satu slot.
    throw new FrameManifestError("Frame harus punya minimal satu slot.");
  }

  const seen = new Set<number>();
  const slots: FrameSlot[] = raw.slots.map((slotRaw, i) => {
    if (typeof slotRaw !== "object" || slotRaw === null) {
      throw new FrameManifestError(`Slot indeks ${i} harus objek.`);
    }
    const s = slotRaw as Record<string, unknown>;
    const slotId = requirePositiveInt(s, "id", `slots[${i}].id`);
    if (seen.has(slotId)) {
      throw new FrameManifestError(`Slot id ${slotId} dobel — id slot harus unik.`);
    }
    seen.add(slotId);

    const x = requireNonNegativeInt(s, "x", `slots[${i}].x`);
    const y = requireNonNegativeInt(s, "y", `slots[${i}].y`);
    const w = requirePositiveInt(s, "w", `slots[${i}].w`);
    const h = requirePositiveInt(s, "h", `slots[${i}].h`);

    if (x + w > width || y + h > height) {
      throw new FrameManifestError(
        `Slot ${slotId} keluar dari canvas ${width}×${height} ` +
          `(x=${x} y=${y} w=${w} h=${h}).`,
      );
    }

    const watermarkTop = height - WATERMARK_BAND_HEIGHT;
    if (y + h > watermarkTop) {
      throw new FrameManifestError(
        `Slot ${slotId} menginjak pita watermark ${WATERMARK_BAND_HEIGHT}px ` +
          `(y ${watermarkTop}–${height}). Slot berakhir di y=${y + h}.`,
      );
    }

    return { id: slotId, x, y, w, h };
  });

  return {
    id,
    name,
    author,
    canvas: { width, height },
    background,
    overlay,
    slots,
  };
}

/** Rasio slot sebagai `w/h`. Viewport kamera wajib memakai ini supaya yang
 *  dilihat user saat capture sama dengan yang masuk ke slot
 *  (docs/aliby-konvensi.md §Aturan arsitektur). Strip A: 520/360 → landscape. */
export function slotAspectRatio(slot: FrameSlot): number {
  return slot.w / slot.h;
}

function requireString(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new FrameManifestError(`Field \`${key}\` harus string tidak kosong.`);
  }
  return v;
}

function requirePositiveInt(
  o: Record<string, unknown>,
  key: string,
  label = key,
): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
    throw new FrameManifestError(`Field \`${label}\` harus integer > 0.`);
  }
  return v;
}

function requireNonNegativeInt(
  o: Record<string, unknown>,
  key: string,
  label = key,
): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    throw new FrameManifestError(`Field \`${label}\` harus integer >= 0.`);
  }
  return v;
}
