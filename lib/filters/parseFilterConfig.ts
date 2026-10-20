import {
  FilterConfigError,
  NO_FILTER_CSS,
  type FilterConfig,
} from "./types.ts";

/** Validasi filter config dari JSON mentah.
 *
 *  Kenapa string `css` diperiksa ketat padahal katalognya kita sendiri yang
 *  tulis: string itu berakhir di dua tempat yang mengeksekusinya —
 *  `element.style.filter` dan `ctx.filter`. PRD §6.2 menyebut format ini
 *  sebagai target output "filter builder" UGC nanti, jadi begitu UGC dibuka
 *  isinya datang dari orang lain. Aturannya ditulis sekarang, sekali, selagi
 *  masih murah.
 *
 *  Yang ditolak dan alasannya:
 *  - `url(...)` — referensi filter SVG; bisa menarik resource eksternal dan
 *    (di canvas) membuat hasil komposit bergantung pada jaringan.
 *  - fungsi di luar daftar putih — termasuk `drop-shadow`, yang menerima
 *    warna dan panjang, bukan filter warna, dan bisa menggeser piksel keluar
 *    dari kotak slot.
 *  - blur besar — satu angka salah di UGC cukup untuk membekukan HP murah. */

/** Fungsi yang menerima angka atau persen non-negatif. */
const AMOUNT_FUNCTIONS = new Set([
  "brightness",
  "contrast",
  "grayscale",
  "invert",
  "opacity",
  "saturate",
  "sepia",
]);

const AMOUNT = /^\d+(\.\d+)?%?$/;
const LENGTH = /^(0|\d+(\.\d+)?(px|em|rem))$/;
const ANGLE = /^(0|-?\d+(\.\d+)?(deg|rad|turn|grad))$/;

/** Satu `nama(argumen)`. Sengaja tidak mengizinkan tanda kurung bersarang,
 *  jadi `url(...)` berisi kurung pun tidak bisa menyelinap lewat celah ini. */
const FUNCTION_CALL = /([a-zA-Z-]+)\(([^()]*)\)/g;

/** Batas atas blur, dalam px. Di atas ini canvas 600×1800 mulai terasa berat
 *  di perangkat kelas bawah — target utama PRD §3. */
export const MAX_BLUR_PX = 20;

/** Panjang maksimum string css. Angka bulat yang longgar; gunanya menahan
 *  input patologis, bukan membatasi filter yang wajar. */
export const MAX_CSS_LENGTH = 240;

/** Jumlah maksimum fungsi dalam satu filter. */
export const MAX_FUNCTIONS = 8;

/** Periksa string `filter` CSS. Melempar kalau ada yang di luar daftar putih.
 *  Mengembalikan string yang sudah dinormalkan (spasi dirapikan). */
export function validateFilterCss(css: string, label = "css"): string {
  if (typeof css !== "string" || css.trim().length === 0) {
    throw new FilterConfigError(`Field \`${label}\` harus string tidak kosong.`);
  }
  const trimmed = css.trim();
  if (trimmed.length > MAX_CSS_LENGTH) {
    throw new FilterConfigError(
      `Field \`${label}\` maksimum ${MAX_CSS_LENGTH} karakter.`,
    );
  }
  if (trimmed === NO_FILTER_CSS) return NO_FILTER_CSS;

  // Sisa string setelah semua panggilan fungsi yang dikenali dibuang harus
  // kosong. Ini yang menjamin tidak ada apa pun yang lolos tanpa diperiksa —
  // bukan daftar larangan, tapi daftar izin.
  let residue = trimmed;
  let count = 0;

  for (const match of trimmed.matchAll(FUNCTION_CALL)) {
    const [whole, rawName, rawArg] = match;
    const name = rawName.toLowerCase();
    const arg = rawArg.trim();
    count += 1;
    if (count > MAX_FUNCTIONS) {
      throw new FilterConfigError(
        `Field \`${label}\` maksimum ${MAX_FUNCTIONS} fungsi.`,
      );
    }

    if (AMOUNT_FUNCTIONS.has(name)) {
      if (!AMOUNT.test(arg)) {
        throw new FilterConfigError(
          `\`${name}()\` di \`${label}\` butuh angka atau persen non-negatif, dapat "${arg}".`,
        );
      }
    } else if (name === "blur") {
      if (!LENGTH.test(arg)) {
        throw new FilterConfigError(
          `\`blur()\` di \`${label}\` butuh panjang seperti "3px", dapat "${arg}".`,
        );
      }
      const px = arg.endsWith("px") ? Number.parseFloat(arg) : 0;
      if (px > MAX_BLUR_PX) {
        throw new FilterConfigError(
          `\`blur()\` di \`${label}\` maksimum ${MAX_BLUR_PX}px, dapat "${arg}".`,
        );
      }
    } else if (name === "hue-rotate") {
      if (!ANGLE.test(arg)) {
        throw new FilterConfigError(
          `\`hue-rotate()\` di \`${label}\` butuh sudut seperti "-10deg", dapat "${arg}".`,
        );
      }
    } else {
      throw new FilterConfigError(
        `Fungsi \`${name}()\` tidak diizinkan di \`${label}\`.`,
      );
    }

    residue = residue.replace(whole, " ");
  }

  if (residue.trim().length > 0) {
    throw new FilterConfigError(
      `Ada bagian yang tidak dikenali di \`${label}\`: "${residue.trim()}".`,
    );
  }
  if (count === 0) {
    throw new FilterConfigError(
      `Field \`${label}\` tidak berisi fungsi filter apa pun.`,
    );
  }

  return trimmed.replace(/\s+/g, " ");
}

export function parseFilterConfig(input: unknown, index = 0): FilterConfig {
  if (typeof input !== "object" || input === null) {
    throw new FilterConfigError(`Filter indeks ${index} harus objek JSON.`);
  }
  const raw = input as Record<string, unknown>;

  const id = requireString(raw, "id", `filters[${index}].id`);
  const name = requireString(raw, "name", `filters[${index}].name`);
  const css = validateFilterCss(
    typeof raw.css === "string" ? raw.css : "",
    `filters[${index}].css`,
  );

  // `webgl` boleh hilang sama sekali; yang tidak boleh adalah diisi, karena
  // v1 tidak punya pipeline shader dan filter yang diam-diam tidak jalan lebih
  // buruk daripada filter yang ditolak di muka (PRD §9, Phase 5).
  const webglRaw = raw.webgl;
  if (webglRaw !== undefined && webglRaw !== null) {
    throw new FilterConfigError(
      `Field \`filters[${index}].webgl\` harus null di v1 — pipeline shader baru ada di Phase 5.`,
    );
  }

  return { id, name, css, webgl: null };
}

/** Validasi seluruh katalog: array tidak kosong, id unik. */
export function parseFilterCatalog(input: unknown): readonly FilterConfig[] {
  const list = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? (input as Record<string, unknown>).filters
      : undefined;

  if (!Array.isArray(list)) {
    throw new FilterConfigError(
      "Katalog filter harus array, atau objek dengan field `filters` berisi array.",
    );
  }
  if (list.length === 0) {
    throw new FilterConfigError("Katalog filter tidak boleh kosong.");
  }

  const seen = new Set<string>();
  return list.map((item, i) => {
    const filter = parseFilterConfig(item, i);
    if (seen.has(filter.id)) {
      throw new FilterConfigError(
        `Filter id "${filter.id}" dobel — id filter harus unik.`,
      );
    }
    seen.add(filter.id);
    return filter;
  });
}

function requireString(
  o: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const v = o[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new FilterConfigError(`Field \`${label}\` harus string tidak kosong.`);
  }
  return v;
}
