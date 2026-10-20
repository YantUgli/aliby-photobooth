/** Tipe filter config — format sesuai PRD §6.2.
 *
 *  Filter adalah DATA, bukan kode (docs/aliby-konvensi.md §Aturan arsitektur). Tidak ada
 *  cabang `if (filter.id === "vintage")` di mana pun; yang ada cuma string CSS
 *  yang dipakai dua kali — untuk pratinjau (`style.filter`) dan untuk dibakar
 *  ke hasil (`ctx.filter`). Menambah filter = menambah satu entri JSON. */

export type FilterConfig = {
  readonly id: string;
  readonly name: string;
  /** String `filter` CSS. Dipakai apa adanya di pratinjau DAN saat komposit,
   *  jadi apa yang dilihat user persis yang terunduh. `"none"` = tanpa filter. */
  readonly css: string;
  /** Pipeline shader untuk look berat. Selalu null di v1 — slot ini ada
   *  supaya format JSON-nya tidak perlu berubah saat Phase 5 datang. */
  readonly webgl: string | null;
};

/** Nilai `css` untuk "tanpa filter". Sama-sama sah di CSS dan di Canvas 2D,
 *  jadi jalur "Asli" tidak butuh percabangan khusus. */
export const NO_FILTER_CSS = "none";

export class FilterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterConfigError";
  }
}
