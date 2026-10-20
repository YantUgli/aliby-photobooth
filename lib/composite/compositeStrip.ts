import type { FrameSlot } from "../frames/types.ts";
import { NO_FILTER_CSS } from "../filters/types.ts";
import type { CompositeInput, CompositeResult } from "./types.ts";

/** Sumber gambar yang siap digambar ke canvas, plus cara melepasnya.
 *  ImageBitmap harus di-close manual; <img> cukup dilepas object URL-nya. */
type Decoded = {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly dispose: () => void;
};

/** Decode Blob jadi sumber gambar.
 *
 *  `createImageBitmap` lebih hemat dan tidak perlu object URL, tapi tidak ada
 *  di semua browser lama, jadi ada jalur cadangan lewat <img>. Dua-duanya
 *  MENUNGGU sampai gambar benar-benar siap — menggambar gambar yang belum
 *  selesai di-decode menghasilkan canvas kosong tanpa error apa pun. */
async function decodeBlob(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(url);
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Overlay di-serve dari origin yang sama, jadi canvas tidak ter-taint dan
    // toBlob tetap boleh dipanggil.
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = src;
  });
}

/** Gambar sumber ke kotak slot dengan crop tengah (perilaku `object-fit: cover`).
 *  Foto dari grabFrame normalnya sudah seukuran slot, tapi jangan bergantung
 *  pada itu — kalau ukurannya beda, stretch akan membuat wajah gepeng. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: Decoded,
  slot: FrameSlot,
): void {
  const targetRatio = slot.w / slot.h;
  const sourceRatio = img.width / img.height;
  let sw = img.width;
  let sh = img.height;
  if (sourceRatio > targetRatio) {
    sw = Math.round(img.height * targetRatio);
  } else {
    sh = Math.round(img.width / targetRatio);
  }
  const sx = Math.round((img.width - sw) / 2);
  const sy = Math.round((img.height - sh) / 2);
  ctx.drawImage(img.source, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
}

/** Komposit strip final.
 *
 *  Urutan gambar — tidak boleh ditukar:
 *    1. background  → isi seluruh canvas, TANPA filter
 *    2. filter on   → ctx.filter = css dari filter config
 *    3. tiap foto   → ke kotak slot-nya masing-masing, posisi dari manifest
 *    4. filter off  → ctx.filter = "none"
 *    5. overlay PNG → di ATAS semua foto, seukuran penuh canvas
 *    6. toBlob
 *
 *  `filterCss` diharapkan sudah lewat `validateFilterCss` (dilakukan saat
 *  katalog dimuat). Nilai itu masuk langsung ke `ctx.filter`, jadi jangan
 *  pernah meneruskan string mentah dari sumber lain ke sini.
 *
 *  Overlay terakhir karena isinya bingkai polaroid, washi, pin, dan wordmark
 *  yang memang harus menumpuk di atas foto.
 *
 *  Posisi slot dibaca dari manifest, tidak dihitung ulang. Untuk Strip A slot
 *  kebetulan berjarak rata 396px, tapi frame lain tidak wajib begitu — itu
 *  sebabnya tidak ada aritmetika jarak di sini sama sekali.
 *
 *  Pita watermark 40px di dasar canvas tidak diperlakukan khusus: validator
 *  manifest sudah menjamin tidak ada slot yang menginjaknya, jadi zona itu
 *  otomatis hanya berisi background dan overlay. */
export async function compositeStrip(
  input: CompositeInput,
): Promise<CompositeResult> {
  const {
    frame,
    photos,
    overlayUrl,
    filterCss = NO_FILTER_CSS,
    mimeType = "image/jpeg",
    quality = 0.92,
  } = input;
  const { width, height } = frame.canvas;

  if (typeof document === "undefined") {
    throw new Error(
      "compositeStrip hanya bisa dijalankan di browser (butuh Canvas 2D).",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia di browser ini.");

  // 1. Background.
  ctx.fillStyle = frame.background;
  ctx.fillRect(0, 0, width, height);

  const decoded: Decoded[] = [];
  try {
    // 2. Foto per slot. Slot tanpa foto dilewati — bukan error; itu yang bikin
    //    strip setengah jadi tetap bisa dikomposit untuk pratinjau.
    // Filter dipasang SETELAH background dan dilepas SEBELUM overlay: yang
    // boleh terkena filter hanya foto user. Background kertas dan bingkai
    // polaroid harus tetap warna aslinya, kalau tidak "Hitam Putih" akan
    // mengubah seluruh strip, bukan fotonya saja.
    ctx.filter = filterCss;
    for (const slot of frame.slots) {
      const photo = photos[slot.id];
      if (!photo) continue;
      const img = await decodeBlob(photo.blob);
      decoded.push(img);
      drawCover(ctx, img, slot);
    }
    ctx.filter = NO_FILTER_CSS;

    // 3. Overlay paling atas.
    const overlay = await loadImageElement(overlayUrl);
    ctx.drawImage(overlay, 0, 0, width, height);
  } finally {
    // Dilepas apa pun yang terjadi, kalau tidak memori naik tiap kali Unduh.
    for (const img of decoded) img.dispose();
  }

  // 4. Export.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality),
  );
  if (!blob) throw new Error("Gagal mengekspor strip.");

  return { blob, width, height };
}

/** Apakah browser ini bisa membakar filter ke canvas.
 *
 *  `ctx.filter` baru ada di Safari 18. Di browser yang belum punya, assignment
 *  ke properti itu diam-diam tidak berefek — pratinjau tampak berfilter tapi
 *  file yang terunduh polos, dan tidak ada error apa pun yang memberi tahu.
 *  Pemanggil memakai ini untuk mengatakannya di muka, bukan membiarkan user
 *  menemukannya sendiri setelah mengunduh. */
let filterSupport: boolean | null = null;
export function canvasFilterSupported(): boolean {
  if (filterSupport !== null) return filterSupport;
  if (typeof document === "undefined") return false;
  const ctx = document.createElement("canvas").getContext("2d");
  filterSupport = ctx !== null && typeof ctx.filter === "string";
  return filterSupport;
}
