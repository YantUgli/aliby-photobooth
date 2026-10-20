import { parseFilterCatalog } from "./parseFilterConfig.ts";
import { FilterConfigError, type FilterConfig } from "./types.ts";

/** Katalog filter statis. Tidak ada database di v1 (PRD §5) — menambah filter
 *  berarti menambah satu entri di file ini, bukan menulis kode. */
export const FILTERS_URL = "/filters/filters.json";

/** Filter yang dipilih duluan saat layar filter dibuka. Harus ada di katalog;
 *  kalau tidak, pemanggil jatuh ke entri pertama. */
export const DEFAULT_FILTER_ID = "asli";

export async function loadFilterCatalog(
  url = FILTERS_URL,
): Promise<readonly FilterConfig[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new FilterConfigError(
      `Gagal memuat katalog filter (HTTP ${res.status}).`,
    );
  }
  return parseFilterCatalog(await res.json());
}

/** Cari filter menurut id, jatuh ke entri pertama kalau tidak ketemu.
 *  Katalog dijamin tidak kosong oleh parser, jadi hasilnya tidak pernah
 *  undefined — id yang tidak dikenal berarti strip keluar tanpa filter, bukan
 *  layar kosong. */
export function findFilter(
  catalog: readonly FilterConfig[],
  id: string | null,
): FilterConfig {
  return catalog.find((f) => f.id === id) ?? catalog[0];
}
