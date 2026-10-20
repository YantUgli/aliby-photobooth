import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BLUR_PX,
  MAX_FUNCTIONS,
  parseFilterCatalog,
  parseFilterConfig,
  validateFilterCss,
} from "./parseFilterConfig.ts";
import { FilterConfigError } from "./types.ts";

const ok = { id: "warm", name: "Warm", css: "sepia(0.2)", webgl: null };

describe("validateFilterCss — yang diizinkan", () => {
  test('"none" lolos apa adanya', () => {
    assert.equal(validateFilterCss("none"), "none");
  });

  test("fungsi warna dengan angka maupun persen", () => {
    for (const css of [
      "grayscale(1)",
      "grayscale(100%)",
      "sepia(0.2) contrast(1.05) saturate(1.15) brightness(1.02)",
      "hue-rotate(-10deg)",
      "hue-rotate(0)",
      "blur(3px)",
      "opacity(0.5) invert(0)",
    ]) {
      assert.equal(validateFilterCss(css), css, css);
    }
  });

  test("spasi berlebih dirapikan", () => {
    assert.equal(
      validateFilterCss("  sepia(0.2)   contrast(1.05) "),
      "sepia(0.2) contrast(1.05)",
    );
  });

  test("nama fungsi tidak peka huruf besar", () => {
    assert.equal(validateFilterCss("GrayScale(1)"), "GrayScale(1)");
  });
});

describe("validateFilterCss — yang ditolak", () => {
  /** Ini yang sebenarnya dijaga: string ini berakhir di `ctx.filter`, dan
   *  PRD §6.2 menjadikan format ini target output filter builder UGC. */
  test("url() ditolak — referensi filter SVG eksternal", () => {
    assert.throws(
      () => validateFilterCss("url(https://x.test/f.svg#a)"),
      FilterConfigError,
    );
    assert.throws(() => validateFilterCss("sepia(0.2) url(#evil)"), FilterConfigError);
  });

  test("drop-shadow ditolak — bukan filter warna dan menggeser piksel", () => {
    assert.throws(
      () => validateFilterCss("drop-shadow(2px 2px 4px black)"),
      FilterConfigError,
    );
  });

  test("fungsi bersarang tidak bisa menyelinap", () => {
    assert.throws(() => validateFilterCss("blur(calc(2px * 3))"), FilterConfigError);
  });

  test("teks di luar panggilan fungsi ditolak", () => {
    for (const css of [
      "sepia(0.2); background: red",
      "sepia(0.2) }",
      "expression(alert(1))",
      "sepia(0.2) /* x */",
    ]) {
      assert.throws(() => validateFilterCss(css), FilterConfigError, css);
    }
  });

  test("argumen dengan satuan salah ditolak", () => {
    assert.throws(() => validateFilterCss("blur(3)"), FilterConfigError);
    assert.throws(() => validateFilterCss("hue-rotate(10)"), FilterConfigError);
    assert.throws(() => validateFilterCss("sepia(-0.2)"), FilterConfigError);
    assert.throws(() => validateFilterCss("sepia(2px)"), FilterConfigError);
  });

  test(`blur di atas ${MAX_BLUR_PX}px ditolak`, () => {
    assert.doesNotThrow(() => validateFilterCss(`blur(${MAX_BLUR_PX}px)`));
    assert.throws(
      () => validateFilterCss(`blur(${MAX_BLUR_PX + 1}px)`),
      FilterConfigError,
    );
  });

  test("terlalu banyak fungsi ditolak", () => {
    const many = Array.from({ length: MAX_FUNCTIONS + 1 }, () => "sepia(0.1)").join(" ");
    assert.throws(() => validateFilterCss(many), FilterConfigError);
  });

  test("string kosong ditolak", () => {
    assert.throws(() => validateFilterCss("   "), FilterConfigError);
  });
});

describe("parseFilterConfig", () => {
  test("config yang benar diterima", () => {
    assert.deepEqual(parseFilterConfig(ok), ok);
  });

  test("webgl boleh hilang, tapi tidak boleh diisi di v1", () => {
    assert.equal(parseFilterConfig({ id: "a", name: "A", css: "sepia(0.2)" }).webgl, null);
    assert.throws(
      () => parseFilterConfig({ ...ok, webgl: "shader.glsl" }),
      FilterConfigError,
    );
  });

  test("id dan name wajib string tidak kosong", () => {
    assert.throws(() => parseFilterConfig({ ...ok, id: "" }), FilterConfigError);
    assert.throws(() => parseFilterConfig({ ...ok, name: 3 }), FilterConfigError);
  });

  test("bukan objek ditolak", () => {
    for (const bad of [null, "x", 3, []]) {
      assert.throws(() => parseFilterConfig(bad), FilterConfigError);
    }
  });
});

describe("parseFilterCatalog", () => {
  test("array telanjang maupun { filters: [...] } sama-sama diterima", () => {
    assert.equal(parseFilterCatalog([ok]).length, 1);
    assert.equal(parseFilterCatalog({ filters: [ok] }).length, 1);
  });

  test("katalog kosong ditolak", () => {
    assert.throws(() => parseFilterCatalog([]), FilterConfigError);
    assert.throws(() => parseFilterCatalog({ filters: [] }), FilterConfigError);
  });

  test("id dobel ditolak", () => {
    assert.throws(() => parseFilterCatalog([ok, { ...ok }]), FilterConfigError);
  });

  test("satu entri rusak menjatuhkan seluruh katalog", () => {
    // Beda dari katalog frame: filter dimuat sebagai satu file, jadi file itu
    // benar atau tidak sama sekali — tidak ada yang bisa diselamatkan sebagian.
    assert.throws(
      () => parseFilterCatalog([ok, { ...ok, id: "b", css: "url(#x)" }]),
      FilterConfigError,
    );
  });
});
