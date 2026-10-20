"use client";

import { useEffect, useRef, useState } from "react";
import type { FrameSlot } from "@/lib/frames/types";
import type { UseCameraResult } from "@/lib/camera/types";
import { SlotIndicator } from "./SlotIndicator";
import { CountdownBadge } from "./CountdownBadge";
import { StickerButton } from "@/components/ui/StickerButton";

const COUNTDOWN_SECONDS = 3;
/** Jeda sebelum hitungan mulai, supaya user sempat bersiap saat masuk slot. */
const READY_DELAY_MS = 700;
const FLASH_MS = 160;

type Stage = "waiting" | "countdown" | "flash" | "failed";

/** State satu siklus jepret, diikat ke slot-nya.
 *  Diikat supaya ganti slot tidak perlu effect yang me-reset state —
 *  nilai untuk slot lain sekadar diabaikan saat render. */
type Shot = {
  readonly slotId: number;
  readonly stage: Stage;
  readonly count: number;
  readonly error: string | null;
};

/** Layar Capture (04a).
 *
 *  Kepadatan: MINIMAL (docs/aliby-konvensi.md §Desain). Kamera, countdown, dan indikator
 *  slot tidak boleh tertutup apa pun. Dekorasi scrapbook sengaja belum ada —
 *  itu Phase 3.
 *
 *  Viewport kamera memakai rasio slot aktif dari manifest, bukan rasio tetap,
 *  supaya yang dilihat user sama dengan yang masuk ke slot.
 *
 *  Komponen ini TIDAK di-mount ulang tiap ganti slot. Elemen <video> harus
 *  hidup terus supaya preview kamera tidak putus di antara slot. State siklus
 *  jepret diikat ke slot-nya (lihat `Shot`), jadi ganti slot tetap mulai bersih
 *  tanpa perlu effect yang me-reset state saat render. */
export function CaptureScreen({
  slot,
  slotNumber,
  slots,
  filledSlotIds,
  isRetake,
  camera,
  onPhoto,
  onBack,
}: {
  slot: FrameSlot;
  slotNumber: number;
  slots: readonly FrameSlot[];
  filledSlotIds: ReadonlySet<number>;
  isRetake: boolean;
  camera: UseCameraResult;
  onPhoto: (blob: Blob) => void;
  onBack: () => void;
}) {
  const idle = (slotId: number): Shot => ({
    slotId,
    stage: "waiting",
    count: COUNTDOWN_SECONDS,
    error: null,
  });

  const [shot, setShot] = useState<Shot>(() => idle(slot.id));
  /** Dinaikkan untuk menjalankan ulang siklus setelah jepret gagal. */
  const [retry, setRetry] = useState(0);

  // Nilai dari slot lain diabaikan — inilah pengganti effect reset.
  const active = shot.slotId === slot.id ? shot : idle(slot.id);

  const { status, errorMessage, videoRef, start } = camera;
  const ready = status === "ready";
  const blocked =
    status === "denied" || status === "unsupported" || status === "error";

  /* `camera` adalah objek baru tiap render (hook mengembalikan literal), dan
     `onPhoto` ikut berubah identitas. Kalau effect countdown bergantung pada
     keduanya, ia akan dibatalkan dan dijadwalkan ulang tiap render — hitungan
     tak pernah sampai nol. Jadi keduanya disimpan di ref yang diperbarui di
     effect (bukan saat render), dan effect countdown hanya bergantung pada
     nilai primitif yang benar-benar menandai "siklus jepret baru". */
  const latest = useRef({ camera, onPhoto });
  useEffect(() => {
    latest.current = { camera, onPhoto };
  });

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    const slotId = slot.id;
    at(READY_DELAY_MS, () =>
      setShot({ slotId, stage: "countdown", count: COUNTDOWN_SECONDS, error: null }),
    );

    for (let i = 1; i <= COUNTDOWN_SECONDS; i++) {
      at(READY_DELAY_MS + i * 1000, () => {
        const remaining = COUNTDOWN_SECONDS - i;
        if (remaining > 0) {
          setShot({ slotId, stage: "countdown", count: remaining, error: null });
          return;
        }
        setShot({ slotId, stage: "flash", count: 0, error: null });
        void (async () => {
          try {
            const blob = await latest.current.camera.grabFrame({
              width: slot.w,
              height: slot.h,
            });
            if (cancelled) return;
            // Flash ditahan sebentar supaya terasa seperti jepretan.
            at(FLASH_MS, () => latest.current.onPhoto(blob));
          } catch (err) {
            if (cancelled) return;
            // Jangan buntu: tawarkan jepret ulang, jangan diam di layar mati.
            setShot({
              slotId,
              stage: "failed",
              count: 0,
              error:
                err instanceof Error ? err.message : "Gagal mengambil foto.",
            });
          }
        })();
      });
    }

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [ready, slot.id, slot.w, slot.h, retry]);

  return (
    <main className="booth flex min-h-dvh flex-col items-center px-[var(--pad-screen)] py-5">
      <div className="flex w-full max-w-md items-center justify-between">
        <StickerButton
          variant="ghost"
          tilt={0}
          onClick={onBack}
          aria-label="Kembali"
          className="text-cream border-cream/60 h-[38px]! px-3!"
        >
          ‹
        </StickerButton>
        <span className="font-marker text-marker-m text-cream">
          {isRetake
            ? `Ulangi foto ${slotNumber}`
            : `Foto ${slotNumber} dari ${slots.length}`}
        </span>
        <span className="w-[38px]" aria-hidden />
      </div>

      <div className="mt-3">
        <SlotIndicator
          slots={slots}
          filledSlotIds={filledSlotIds}
          activeSlotId={slot.id}
        />
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3">
        <div
          className="border-cream/12 relative w-full overflow-hidden rounded-[18px] border-[3px] bg-black"
          // Rasio DARI MANIFEST. Strip A: 520/360 (landscape), bukan 3:4.
          style={{ aspectRatio: `${slot.w} / ${slot.h}` }}
        >
          <video
            ref={videoRef}
            // playsInline + muted wajib, kalau tidak iOS memaksa fullscreen.
            playsInline
            muted
            autoPlay
            className="size-full object-cover"
          />

          {active.stage === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CountdownBadge value={active.count} />
            </div>
          )}

          {active.stage === "flash" && (
            <div className="absolute inset-0 bg-white" aria-hidden />
          )}

          {blocked && (
            <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
              <p className="font-sans text-body text-cream">
                {errorMessage ?? "Kamera tidak bisa dipakai."}
              </p>
            </div>
          )}
        </div>

        <span className="font-marker text-marker-s text-cream/55">
          rasio ikut slot aktif · {slot.w}×{slot.h}
        </span>

        {active.error && (
          <p className="font-sans text-caption text-accent-yellow text-center">
            {active.error}
          </p>
        )}
      </div>

      <div className="flex h-12 items-center">
        {blocked ? (
          <StickerButton onClick={start} tilt={-1}>
            Coba lagi
          </StickerButton>
        ) : active.stage === "failed" ? (
          <StickerButton onClick={() => setRetry((n) => n + 1)} tilt={-1}>
            Jepret lagi ✦
          </StickerButton>
        ) : (
          <span className="font-marker text-marker-m text-accent-blue -rotate-2">
            gaya dulu ✦
          </span>
        )}
      </div>
    </main>
  );
}
