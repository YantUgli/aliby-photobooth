import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { canvasFilterSupported, compositeStrip } from "./compositeStrip.ts";
import { parseFrameManifest } from "../frames/parseFrameManifest.ts";
import { readFileSync } from "node:fs";

const frame = parseFrameManifest(
  JSON.parse(readFileSync("public/frames/scrapbook-pin-washi.json", "utf8")),
);

/** compositeStrip butuh Canvas 2D dan decoding gambar — dua-duanya tidak ada di
 *  Node. Jadi kontraknya ditulis di sini sebagai checklist yang dieksekusi
 *  HANYA di lingkungan browser. Di Node ia dilaporkan skipped, bukan lulus
 *  diam-diam.
 *
 *  Yang bisa diuji tanpa browser sudah ditutup di tempat lain:
 *  - geometri slot & zona watermark  -> lib/frames/parseFrameManifest.test.ts
 *  - urutan foto saat komposit        -> photosInSlotOrder di captureReducer.test.ts
 *  - resolusi URL overlay             -> lib/frames/loadFrame.test.ts
 *  - string filter yang boleh masuk   -> lib/filters/parseFilterConfig.test.ts
 *
 *  Bahwa filter benar-benar TER-BAKE ke file — dan hanya mengenai foto, bukan
 *  kertas dan bingkai — diperiksa di luar test ini, dengan mengunduh strip yang
 *  sama dua kali (tanpa filter dan dengan "Hitam Putih") lalu membandingkan
 *  piksel di titik yang sama. Itu butuh browser sungguhan; lihat README. */
const hasCanvas =
  typeof globalThis.document !== "undefined" &&
  typeof globalThis.HTMLCanvasElement !== "undefined";

const needsBrowser = {
  skip: hasCanvas ? false : "butuh Canvas 2D — jalankan di browser",
};

describe("compositeStrip — kontrak", () => {
  test("gagal rapi kalau Canvas 2D tidak ada", { skip: hasCanvas && "punya canvas" }, async () => {
    // Di Node tidak ada `document`, jadi fungsinya harus melempar Error yang
    // jelas — bukan ReferenceError mentah yang bocor ke user.
    await assert.rejects(
      () =>
        compositeStrip({
          frame,
          photos: {},
          overlayUrl: "/frames/scrapbook-pin-washi.png",
        }),
      /hanya bisa dijalankan di browser/,
    );
  });

  test("hasil berukuran canvas manifest, bukan ukuran layar", needsBrowser, async () => {
    const r = await compositeStrip({
      frame,
      photos: {},
      overlayUrl: "/frames/scrapbook-pin-washi.png",
    });
    assert.equal(r.width, 600);
    assert.equal(r.height, 1800);
  });

  test("slot kosong bukan error — strip sebagian tetap terkomposit", needsBrowser, async () => {
    const r = await compositeStrip({
      frame,
      photos: {},
      overlayUrl: "/frames/scrapbook-pin-washi.png",
    });
    assert.ok(r.blob.size > 0);
  });

  test("menghormati mimeType yang diminta", needsBrowser, async () => {
    const r = await compositeStrip({
      frame,
      photos: {},
      overlayUrl: "/frames/scrapbook-pin-washi.png",
      mimeType: "image/png",
    });
    assert.equal(r.blob.type, "image/png");
  });

  test("filter tidak mengubah ukuran keluaran", needsBrowser, async () => {
    const r = await compositeStrip({
      frame,
      photos: {},
      overlayUrl: "/frames/scrapbook-pin-washi.png",
      filterCss: "grayscale(1)",
    });
    assert.equal(r.width, 600);
    assert.equal(r.height, 1800);
  });
});

describe("canvasFilterSupported", () => {
  test("false di lingkungan tanpa canvas", { skip: hasCanvas && "punya canvas" }, () => {
    // Bukan formalitas: kalau ini salah melapor `true`, layar filter berhenti
    // memperingatkan dan user mengunduh strip polos tanpa tahu.
    assert.equal(canvasFilterSupported(), false);
  });

  test("true di browser modern", needsBrowser, () => {
    assert.equal(canvasFilterSupported(), true);
  });
});
