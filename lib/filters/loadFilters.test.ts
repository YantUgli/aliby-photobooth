import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_FILTER_ID, findFilter } from "./loadFilters.ts";
import { parseFilterCatalog } from "./parseFilterConfig.ts";
import type { FilterConfig } from "./types.ts";

const catalog: readonly FilterConfig[] = [
  { id: "asli", name: "Asli", css: "none", webgl: null },
  { id: "bw", name: "BW", css: "grayscale(1)", webgl: null },
];

describe("findFilter", () => {
  test("id yang dikenal ketemu", () => {
    assert.equal(findFilter(catalog, "bw").name, "BW");
  });

  test("id tidak dikenal atau null jatuh ke entri pertama", () => {
    // Lebih baik strip tanpa filter daripada layar kosong.
    assert.equal(findFilter(catalog, "tidak-ada").id, "asli");
    assert.equal(findFilter(catalog, null).id, "asli");
  });
});

describe("katalog filter yang benar-benar dikirim", () => {
  /* Bukan uji unit — ini menjaga file JSON yang di-serve ke browser. Kalau
     seseorang menambah filter dengan typo, gagalnya di sini, bukan di HP
     orang. */
  const raw: unknown = JSON.parse(
    readFileSync(new URL("../../public/filters/filters.json", import.meta.url), "utf8"),
  );
  const filters = parseFilterCatalog(raw);

  test("lolos validasi dan tidak kosong", () => {
    assert.ok(filters.length > 1);
  });

  test(`punya "${DEFAULT_FILTER_ID}" sebagai pilihan tanpa filter`, () => {
    const fallback = filters.find((f) => f.id === DEFAULT_FILTER_ID);
    assert.ok(fallback, `filter default "${DEFAULT_FILTER_ID}" tidak ada di katalog`);
    assert.equal(fallback.css, "none");
  });

  test("entri pertama adalah yang tanpa filter", () => {
    // findFilter jatuh ke entri pertama, jadi urutan ini yang bikin fallback
    // berarti "apa adanya", bukan "vintage" karena kebetulan ditaruh di atas.
    assert.equal(filters[0].id, DEFAULT_FILTER_ID);
  });
});
