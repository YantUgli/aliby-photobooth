import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  captureReducer,
  initialCaptureState,
  filledCount,
  firstEmptySlotId,
  isComplete,
  photosInSlotOrder,
} from "./captureReducer.ts";
import type { CaptureAction } from "./captureReducer.ts";
import type { CaptureState, SlotPhoto } from "./types.ts";
import type { FrameSlot } from "../frames/types.ts";

const slots: readonly FrameSlot[] = [1, 2, 3, 4].map((id) => ({
  id,
  x: 40,
  y: 150 + (id - 1) * 396,
  w: 520,
  h: 360,
}));

/** Blob palsu — reducer tidak pernah membacanya, cuma memindahkannya. */
function photo(slotId: number, tag = "a"): SlotPhoto {
  return {
    slotId,
    blob: new Blob([tag]),
    objectUrl: `blob:${slotId}-${tag}`,
    takenAt: slotId * 1000,
  };
}

function run(state: CaptureState, actions: CaptureAction[]) {
  let s = state;
  for (const a of actions) s = captureReducer(s, a, slots);
  return { state: s };
}

describe("alur normal", () => {
  test("start mengarah ke slot pertama", () => {
    const { state } = run(initialCaptureState, [{ type: "start" }]);
    assert.equal(state.phase, "capturing");
    assert.equal(state.activeSlotId, 1);
  });

  test("tiap foto memajukan ke slot kosong berikutnya", () => {
    let s = run(initialCaptureState, [{ type: "start" }]).state;
    for (const id of [1, 2, 3]) {
      s = run(s, [{ type: "photoTaken", photo: photo(id) }]).state;
      assert.equal(s.phase, "capturing");
      assert.equal(s.activeSlotId, id + 1);
    }
  });

  test("slot terakhir terisi -> pindah ke review, activeSlotId null", () => {
    let s = run(initialCaptureState, [{ type: "start" }]).state;
    for (const id of [1, 2, 3, 4]) {
      s = run(s, [{ type: "photoTaken", photo: photo(id) }]).state;
    }
    assert.equal(s.phase, "review");
    assert.equal(s.activeSlotId, null);
    assert.equal(filledCount(s.photos, slots), 4);
    assert.ok(isComplete(s.photos, slots));
  });

  test("start saat sudah lengkap tidak menjepret ulang", () => {
    const photos = Object.fromEntries([1, 2, 3, 4].map((id) => [id, photo(id)]));
    const { state } = run({ ...initialCaptureState, photos }, [{ type: "start" }]);
    assert.equal(state.phase, "review");
    assert.equal(state.activeSlotId, null);
  });
});

describe("re-take per-slot", () => {
  const complete: CaptureState = {
    phase: "review",
    activeSlotId: null,
    pendingRetakeSlotId: null,
    filterId: null,
    photos: Object.fromEntries([1, 2, 3, 4].map((id) => [id, photo(id)])),
  };

  test("ketuk foto memunculkan konfirmasi untuk slot itu", () => {
    const { state } = run(complete, [{ type: "askRetake", slotId: 2 }]);
    assert.equal(state.pendingRetakeSlotId, 2);
    // Masih di review; belum pindah layar sebelum user menekan "Ulangi".
    assert.equal(state.phase, "review");
  });

  test("Batal menutup konfirmasi tanpa mengubah foto", () => {
    const { state } = run(complete, [
      { type: "askRetake", slotId: 2 },
      { type: "cancelRetake" },
    ]);
    assert.equal(state.pendingRetakeSlotId, null);
    assert.equal(state.phase, "review");
    assert.equal(filledCount(state.photos, slots), 4);
  });

  test("Ulangi kembali ke capture hanya untuk slot itu", () => {
    const { state } = run(complete, [
      { type: "askRetake", slotId: 2 },
      { type: "confirmRetake" },
    ]);
    assert.equal(state.phase, "capturing");
    assert.equal(state.activeSlotId, 2);
    assert.equal(state.pendingRetakeSlotId, null);
  });

  test("re-take menimpa SATU entri; tiga lain utuh — klaim PRD §6.1", () => {
    const { state } = run(complete, [
      { type: "askRetake", slotId: 2 },
      { type: "confirmRetake" },
      { type: "photoTaken", photo: photo(2, "baru") },
    ]);
    assert.equal(state.photos[2].objectUrl, "blob:2-baru");
    for (const id of [1, 3, 4]) {
      assert.equal(state.photos[id].objectUrl, `blob:${id}-a`, `slot ${id} berubah`);
    }
  });

  test("setelah re-take langsung kembali ke review, bukan lanjut slot 3", () => {
    const { state } = run(complete, [
      { type: "askRetake", slotId: 2 },
      { type: "confirmRetake" },
      { type: "photoTaken", photo: photo(2, "baru") },
    ]);
    // Activity diagram: re-take -> kembali ke tinjau, bukan lanjut otomatis.
    assert.equal(state.phase, "review");
    assert.equal(state.activeSlotId, null);
  });

  test("foto lama tetap ada selama slot belum dijepret ulang", () => {
    const { state } = run(complete, [
      { type: "askRetake", slotId: 2 },
      { type: "confirmRetake" },
    ]);
    // User batal di tengah countdown: strip masih lengkap.
    assert.equal(filledCount(state.photos, slots), 4);
    assert.equal(state.photos[2].objectUrl, "blob:2-a");
  });

  test("foto lama benar-benar lepas dari state setelah ditimpa", () => {
    // Reducer tidak me-revoke apa pun (ia murni); yang dijamin di sini adalah
    // entri lama tidak lagi terjangkau, sehingga effect di pemanggil bisa
    // mendeteksinya lewat diff dan me-revoke URL-nya.
    const { state } = run(complete, [
      { type: "photoTaken", photo: photo(2, "baru") },
    ]);
    const urls = Object.values(state.photos).map((p) => p.objectUrl);
    assert.ok(!urls.includes("blob:2-a"));
    assert.ok(urls.includes("blob:2-baru"));
  });

  test("askRetake pada slot kosong diabaikan", () => {
    const { state } = run(initialCaptureState, [{ type: "askRetake", slotId: 3 }]);
    assert.equal(state.pendingRetakeSlotId, null);
  });

  test("confirmRetake tanpa konfirmasi tertunda tidak melakukan apa-apa", () => {
    const { state } = run(complete, [{ type: "confirmRetake" }]);
    assert.equal(state.phase, "review");
    assert.equal(state.activeSlotId, null);
  });
});

describe("ketahanan", () => {
  test("foto untuk slot yang tidak ada di manifest diabaikan", () => {
    const { state } = run(initialCaptureState, [
      { type: "photoTaken", photo: photo(99) },
    ]);
    assert.equal(filledCount(state.photos, slots), 0);
  });

  test("reset mengosongkan state", () => {
    const photos = Object.fromEntries([1, 2].map((id) => [id, photo(id)]));
    const { state } = run({ ...initialCaptureState, photos }, [
      { type: "reset" },
    ]);
    assert.deepEqual(state, initialCaptureState);
  });

  test("reducer tidak memutasi state sebelumnya", () => {
    const before = initialCaptureState;
    const snapshot = JSON.stringify(before);
    captureReducer(before, { type: "start" }, slots);
    assert.equal(JSON.stringify(before), snapshot);
  });

  test("mengisi slot di luar urutan tetap lanjut ke slot kosong terkecil", () => {
    let s = run(initialCaptureState, [
      { type: "photoTaken", photo: photo(3) },
    ]).state;
    assert.equal(firstEmptySlotId(s.photos, slots), 1);
    assert.equal(s.activeSlotId, 1);
    s = run(s, [{ type: "photoTaken", photo: photo(1) }]).state;
    assert.equal(s.activeSlotId, 2);
  });

  test("photosInSlotOrder mengikuti urutan manifest, bukan urutan jepret", () => {
    let s = initialCaptureState;
    for (const id of [4, 1, 3, 2]) {
      s = run(s, [{ type: "photoTaken", photo: photo(id) }]).state;
    }
    assert.deepEqual(
      photosInSlotOrder(s.photos, slots).map((p) => p.slotId),
      [1, 2, 3, 4],
    );
  });
});

describe("pilih filter", () => {
  const complete: CaptureState = {
    phase: "review",
    activeSlotId: null,
    pendingRetakeSlotId: null,
    filterId: null,
    photos: Object.fromEntries([1, 2, 3, 4].map((id) => [id, photo(id)])),
  };

  test("dari tinjau bisa lanjut ke layar filter", () => {
    const { state } = run(complete, [{ type: "goToFilter" }]);
    assert.equal(state.phase, "filter");
  });

  test("tidak bisa lompat ke filter kalau strip belum lengkap", () => {
    // Layar filter bukan jalan pintas keluar dari capture.
    const half: CaptureState = {
      ...complete,
      phase: "capturing",
      activeSlotId: 3,
      photos: Object.fromEntries([1, 2].map((id) => [id, photo(id)])),
    };
    assert.equal(run(half, [{ type: "goToFilter" }]).state.phase, "capturing");
  });

  test("kembali dari filter mendarat di tinjau, bukan di capture", () => {
    const { state } = run(complete, [
      { type: "goToFilter" },
      { type: "backToReview" },
    ]);
    assert.equal(state.phase, "review");
    assert.equal(state.activeSlotId, null);
  });

  test("memilih filter tidak menyentuh satu pun foto", () => {
    const { state } = run(complete, [
      { type: "goToFilter" },
      { type: "selectFilter", filterId: "vintage" },
    ]);
    assert.equal(state.filterId, "vintage");
    // Inti "filter diterapkan saat komposit": foto mentah tetap apa adanya,
    // jadi ganti filter tidak pernah butuh foto ulang.
    assert.deepEqual(state.photos, complete.photos);
    assert.equal(state.phase, "filter");
  });

  test("pilihan filter bertahan saat bolak-balik tinjau ↔ filter", () => {
    const { state } = run(complete, [
      { type: "goToFilter" },
      { type: "selectFilter", filterId: "vintage" },
      { type: "backToReview" },
      { type: "goToFilter" },
    ]);
    assert.equal(state.filterId, "vintage");
  });

  test("ulangi satu foto dari tinjau tidak menghapus pilihan filter", () => {
    const { state } = run(complete, [
      { type: "goToFilter" },
      { type: "selectFilter", filterId: "vintage" },
      { type: "backToReview" },
      { type: "askRetake", slotId: 2 },
      { type: "confirmRetake" },
      { type: "photoTaken", photo: photo(2, "baru") },
    ]);
    assert.equal(state.filterId, "vintage");
    assert.equal(state.phase, "review");
  });

  test("reset membuang pilihan filter juga", () => {
    const { state } = run(complete, [
      { type: "selectFilter", filterId: "vintage" },
      { type: "reset" },
    ]);
    assert.equal(state.filterId, null);
  });

  test("backToReview dari luar layar filter tidak mengubah apa pun", () => {
    const { state } = run(complete, [{ type: "backToReview" }]);
    assert.equal(state.phase, "review");
  });
});
