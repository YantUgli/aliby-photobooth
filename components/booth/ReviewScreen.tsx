"use client";

import type { FrameManifest } from "@/lib/frames/types";
import type { SlotPhoto } from "@/lib/capture/types";
import { StripPreview } from "./StripPreview";
import { StickerButton } from "@/components/ui/StickerButton";

/** Layar Tinjau strip (05).
 *
 *  Kepadatan: SEDANG. Strip adalah fokus; badge ↻ ada di semua foto.
 *  Tombol "Ulang semua" TIDAK ADA — dihapus di handoff Revisi 3 karena bukan
 *  bagian dari PRD.
 *
 *  Layar ini tidak mengunduh apa pun. Sesuai diagram sistem §3 urutannya
 *  tinjau → filter → komposit → unduh, jadi tombol Unduh tinggal di layar
 *  filter — satu tempat, satu jalur komposit.
 *
 *  "Simpan & dapat link" adalah Phase 4 dan sengaja belum dipasang supaya
 *  tidak ada tombol yang menjanjikan hal yang belum ada. */
export function ReviewScreen({
  frame,
  overlayUrl,
  photos,
  complete,
  onRetake,
  onNext,
  onBack,
}: {
  frame: FrameManifest;
  overlayUrl: string;
  photos: Readonly<Record<number, SlotPhoto>>;
  /** Semua slot terisi. Selama belum, tombol lanjut tidak aktif. */
  complete: boolean;
  onRetake: (slotId: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <main className="board flex min-h-dvh flex-col items-center px-[var(--pad-screen)] py-6">
      <div className="flex w-full max-w-md items-center gap-2.5">
        <StickerButton
          variant="ghost"
          tilt={0}
          onClick={onBack}
          aria-label="Ganti frame"
          className="text-cream border-cream/60 h-[38px]! px-3!"
        >
          ‹
        </StickerButton>
        <h1
          className="disp text-cream text-display-s"
          style={{ ["--disp-stroke" as string]: "1.3px" }}
        >
          Tinjau strip
        </h1>
      </div>

      <div className="flex w-full flex-1 items-center justify-center py-5">
        <StripPreview
          frame={frame}
          overlayUrl={overlayUrl}
          photos={photos}
          onRetake={onRetake}
          className="w-[170px] rotate-[-3deg]"
        />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-2.5">
        <p className="font-marker text-marker-s text-cream/75 text-center">
          ketuk foto mana pun buat ulangi
        </p>
        <StickerButton
          variant="secondary"
          tilt={0.5}
          onClick={onNext}
          disabled={!complete}
          className="w-full"
        >
          Pilih filter ✦
        </StickerButton>
      </div>
    </main>
  );
}
