import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrameManifest, slotAspectRatio } from "./parseFrameManifest.ts";
import { FrameManifestError, WATERMARK_BAND_HEIGHT } from "./types.ts";

/** Manifest valid minimal, dipakai sebagai basis lalu dirusak per-test. */
function validRaw() {
  return {
    id: "t",
    name: "T",
    author: "aliby",
    canvas: { width: 600, height: 1800 },
    background: "#fff",
    overlay: "t.png",
    slots: [{ id: 1, x: 40, y: 150, w: 520, h: 360 }],
  };
}

describe("parseFrameManifest", () => {
  test("menerima manifest valid", () => {
    const m = parseFrameManifest(validRaw());
    assert.equal(m.id, "t");
    assert.equal(m.slots.length, 1);
  });

  test("menolak frame tanpa slot (ERD: minimal satu slot)", () => {
    assert.throws(
      () => parseFrameManifest({ ...validRaw(), slots: [] }),
      FrameManifestError,
    );
  });

  test("menolak id slot yang dobel", () => {
    const raw = validRaw();
    raw.slots = [
      { id: 1, x: 40, y: 150, w: 520, h: 360 },
      { id: 1, x: 40, y: 546, w: 520, h: 360 },
    ];
    assert.throws(() => parseFrameManifest(raw), /dobel/);
  });

  test("menolak slot yang keluar canvas", () => {
    const raw = validRaw();
    raw.slots = [{ id: 1, x: 200, y: 150, w: 520, h: 360 }]; // 200+520 > 600
    assert.throws(() => parseFrameManifest(raw), /keluar dari canvas/);
  });

  test("menolak slot yang menginjak pita watermark", () => {
    const raw = validRaw();
    // canvas 1800, pita mulai y=1760. Slot berakhir di 1761 → satu px melanggar.
    raw.slots = [{ id: 1, x: 40, y: 1401, w: 520, h: 360 }];
    assert.throws(() => parseFrameManifest(raw), /watermark/);
  });

  test("menerima slot yang berakhir tepat di batas pita watermark", () => {
    const raw = validRaw();
    raw.slots = [{ id: 1, x: 40, y: 1400, w: 520, h: 360 }]; // berakhir 1760
    const m = parseFrameManifest(raw);
    assert.equal(m.slots[0].y + m.slots[0].h, 1800 - WATERMARK_BAND_HEIGHT);
  });

  test("menolak field yang hilang atau salah tipe", () => {
    for (const key of ["id", "name", "author", "background", "overlay"]) {
      const raw = validRaw() as Record<string, unknown>;
      delete raw[key];
      assert.throws(() => parseFrameManifest(raw), FrameManifestError, key);
    }
    assert.throws(() => parseFrameManifest({ ...validRaw(), canvas: null }));
    assert.throws(() => parseFrameManifest({ ...validRaw(), slots: "x" }));
    assert.throws(() => parseFrameManifest(null));
  });

  test("menolak ukuran nol atau negatif", () => {
    const raw = validRaw();
    raw.slots = [{ id: 1, x: 40, y: 150, w: 0, h: 360 }];
    assert.throws(() => parseFrameManifest(raw), /integer > 0/);
  });
});

describe("frame Strip A yang dipakai Phase 1", () => {
  const frame = parseFrameManifest(
    JSON.parse(readFileSync("public/frames/scrapbook-pin-washi.json", "utf8")),
  );

  test("lolos validasi", () => {
    assert.equal(frame.id, "scrapbook-pin-washi");
    assert.equal(frame.canvas.width, 600);
    assert.equal(frame.canvas.height, 1800);
  });

  test("punya 4 slot — jumlah slot = jumlah shot", () => {
    assert.equal(frame.slots.length, 4);
    assert.deepEqual(
      frame.slots.map((s) => s.id),
      [1, 2, 3, 4],
    );
  });

  test("semua slot 520×360, rasio landscape", () => {
    for (const s of frame.slots) {
      assert.equal(s.w, 520);
      assert.equal(s.h, 360);
    }
    // Viewport kamera harus memakai rasio ini, bukan 3:4.
    assert.ok(slotAspectRatio(frame.slots[0]) > 1, "harus landscape");
    assert.equal(slotAspectRatio(frame.slots[0]), 520 / 360);
  });

  test("slot tidak saling tumpang tindih", () => {
    const sorted = [...frame.slots].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      assert.ok(
        sorted[i].y >= prev.y + prev.h,
        `slot ${sorted[i].id} menimpa slot ${prev.id}`,
      );
    }
  });

  test("tidak ada slot di zona watermark", () => {
    const top = frame.canvas.height - WATERMARK_BAND_HEIGHT;
    for (const s of frame.slots) {
      assert.ok(s.y + s.h <= top, `slot ${s.id} masuk zona watermark`);
    }
  });
});
