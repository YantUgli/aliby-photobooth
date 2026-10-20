import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  FRAMES_BASE_PATH,
  frameIndexUrl,
  frameManifestUrl,
  parseFrameIndex,
  resolveOverlayUrl,
} from "./loadFrame.ts";
import { parseFrameManifest } from "./parseFrameManifest.ts";
import {
  FrameManifestError,
  WATERMARK_BAND_HEIGHT,
  type FrameManifest,
} from "./types.ts";

const base: FrameManifest = {
  id: "t",
  name: "T",
  author: "aliby",
  canvas: { width: 600, height: 1800 },
  background: "#fff",
  overlay: "t.png",
  slots: [{ id: 1, x: 40, y: 150, w: 520, h: 360 }],
};

describe("resolusi URL frame", () => {
  test("manifest di-serve dari direktori katalog", () => {
    assert.equal(frameManifestUrl("abc"), "/frames/abc.json");
  });

  test("overlay relatif digabung dengan basePath", () => {
    assert.equal(resolveOverlayUrl(base), "/frames/t.png");
  });

  test("basePath dengan slash di belakang tidak jadi dobel slash", () => {
    assert.equal(resolveOverlayUrl(base, "/frames/"), "/frames/t.png");
  });

  test("overlay yang sudah absolut dibiarkan", () => {
    for (const url of ["https://cdn.x/y.png", "//cdn.x/y.png"]) {
      assert.equal(resolveOverlayUrl({ ...base, overlay: url }), url);
    }
  });

  test("basePath bisa diganti tanpa mengubah manifest", () => {
    // Inti "frame adalah data": file yang sama bisa di-serve dari mana saja.
    assert.equal(resolveOverlayUrl(base, "/cdn/f"), "/cdn/f/t.png");
    assert.equal(FRAMES_BASE_PATH, "/frames");
  });
});

describe("index katalog frame", () => {
  test("array telanjang maupun { frames: [...] } sama-sama diterima", () => {
    assert.deepEqual(parseFrameIndex(["a", "b"]), ["a", "b"]);
    assert.deepEqual(parseFrameIndex({ frames: ["a"] }), ["a"]);
  });

  test("index kosong, bukan array, atau berisi id dobel ditolak", () => {
    for (const bad of [[], { frames: [] }, {}, null, ["a", "a"], [""], [3]]) {
      assert.throws(() => parseFrameIndex(bad), FrameManifestError);
    }
  });

  test("url index ikut basePath", () => {
    assert.equal(frameIndexUrl(), `${FRAMES_BASE_PATH}/index.json`);
    assert.equal(frameIndexUrl("/f/"), "/f/index.json");
  });
});

describe("katalog frame yang benar-benar dikirim", () => {
  /* Menjaga file di public/frames: tiap id di index.json harus punya manifest
     yang lolos validasi, dan overlay-nya harus ada. */
  const dir = new URL("../../public/frames/", import.meta.url);
  const ids = parseFrameIndex(
    JSON.parse(readFileSync(new URL("index.json", dir), "utf8")),
  );

  test("index tidak kosong", () => {
    assert.ok(ids.length > 0);
  });

  for (const id of ids) {
    test(`frame "${id}": manifest valid, overlay ada, watermark aman`, () => {
      const manifest = parseFrameManifest(
        JSON.parse(readFileSync(new URL(`${id}.json`, dir), "utf8")),
      );
      assert.equal(manifest.id, id, "id di manifest harus sama dengan nama file");
      assert.ok(existsSync(new URL(manifest.overlay, dir)), "overlay hilang");

      // parseFrameManifest sudah menolak slot yang menginjak pita watermark;
      // yang ditegaskan di sini adalah bahwa aturan itu memang diuji terhadap
      // frame nyata yang dikirim, bukan cuma terhadap contoh di test lain.
      const bandTop = manifest.canvas.height - WATERMARK_BAND_HEIGHT;
      for (const slot of manifest.slots) {
        assert.ok(slot.y + slot.h <= bandTop, `slot ${slot.id} masuk pita watermark`);
      }
    });
  }
});
