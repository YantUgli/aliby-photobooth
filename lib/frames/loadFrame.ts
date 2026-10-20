import { parseFrameManifest } from "./parseFrameManifest.ts";
import { FrameManifestError, type FrameManifest } from "./types.ts";

/** Direktori tempat katalog frame di-serve. Statis di v1 — belum ada database
 *  (PRD §5). Menambah frame = menaruh dua file di sini lalu menyebut id-nya di
 *  `index.json`. */
export const FRAMES_BASE_PATH = "/frames";

/** Frame yang dipilih duluan kalau tidak ada yang lain. Satu-satunya tempat id
 *  ini disebut; sisa aplikasi membaca dari katalog. */
export const DEFAULT_FRAME_ID = "scrapbook-pin-washi";

export function frameIndexUrl(basePath = FRAMES_BASE_PATH): string {
  return `${trimSlash(basePath)}/index.json`;
}

export function frameManifestUrl(
  frameId: string,
  basePath = FRAMES_BASE_PATH,
): string {
  return `${trimSlash(basePath)}/${frameId}.json`;
}

/** Manifest hanya menyimpan NAMA file overlay, bukan URL. Pemanggil yang
 *  menjadikannya URL, supaya manifest tetap portabel — file yang sama bisa
 *  di-serve dari mana saja tanpa diedit. */
export function resolveOverlayUrl(
  manifest: FrameManifest,
  basePath = FRAMES_BASE_PATH,
): string {
  if (/^(https?:)?\/\//.test(manifest.overlay)) {
    // Sudah absolut — pakai apa adanya.
    return manifest.overlay;
  }
  return `${trimSlash(basePath)}/${manifest.overlay}`;
}

/** Daftar id frame. Sengaja cuma id, bukan salinan nama dan jumlah slot:
 *  satu-satunya sumber kebenaran soal isi sebuah frame adalah manifest-nya
 *  sendiri, jadi tidak ada yang bisa melenceng. */
export function parseFrameIndex(input: unknown): readonly string[] {
  const list = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? (input as Record<string, unknown>).frames
      : undefined;

  if (!Array.isArray(list)) {
    throw new FrameManifestError(
      "Index frame harus array, atau objek dengan field `frames` berisi array.",
    );
  }
  if (list.length === 0) {
    throw new FrameManifestError("Index frame tidak boleh kosong.");
  }

  const seen = new Set<string>();
  return list.map((id, i) => {
    if (typeof id !== "string" || id.length === 0) {
      throw new FrameManifestError(`frames[${i}] harus string tidak kosong.`);
    }
    if (seen.has(id)) {
      throw new FrameManifestError(`Frame id "${id}" dobel di index.`);
    }
    seen.add(id);
    return id;
  });
}

export async function loadFrameManifest(
  frameId: string,
  basePath = FRAMES_BASE_PATH,
): Promise<FrameManifest> {
  const url = frameManifestUrl(frameId, basePath);
  const res = await fetch(url);
  if (!res.ok) {
    throw new FrameManifestError(
      `Gagal memuat manifest frame "${frameId}" (HTTP ${res.status}).`,
    );
  }
  return parseFrameManifest(await res.json());
}

/** Muat seluruh katalog: index dulu, lalu semua manifest sekaligus.
 *
 *  Satu manifest rusak tidak boleh menjatuhkan seluruh layar pilih frame —
 *  frame itu dilewati dan sisanya tetap bisa dipakai. Kalau TIDAK ADA yang
 *  berhasil dimuat, barulah ini melempar, karena saat itu memang tidak ada
 *  yang bisa ditampilkan. */
export async function loadFrameCatalog(
  basePath = FRAMES_BASE_PATH,
): Promise<readonly FrameManifest[]> {
  const res = await fetch(frameIndexUrl(basePath));
  if (!res.ok) {
    throw new FrameManifestError(
      `Gagal memuat index frame (HTTP ${res.status}).`,
    );
  }
  const ids = parseFrameIndex(await res.json());
  const settled = await Promise.allSettled(
    ids.map((id) => loadFrameManifest(id, basePath)),
  );

  const frames: FrameManifest[] = [];
  const problems: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") frames.push(r.value);
    else problems.push(`${ids[i]}: ${errorText(r.reason)}`);
  });

  if (frames.length === 0) {
    throw new FrameManifestError(
      `Tidak ada frame yang bisa dimuat. ${problems.join(" · ")}`,
    );
  }
  return frames;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function trimSlash(p: string): string {
  return p.endsWith("/") ? p.slice(0, -1) : p;
}
