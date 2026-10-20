"use client";

import { useState } from "react";
import Link from "next/link";
import type { FrameManifest } from "@/lib/frames/types";
import { resolveOverlayUrl } from "@/lib/frames/loadFrame";
import { StripPreview } from "./StripPreview";
import { StickerButton, stickerClasses } from "@/components/ui/StickerButton";

/** Layar Pilih frame.
 *
 *  Kepadatan: MAKSIMAL (handoff §4) — grid polaroid dipin, rotasi beda tiap
 *  kartu, tanpa sticky note. Dekorasi tidak boleh menutupi pratinjau frame,
 *  jadi doodle hanya di tepi.
 *
 *  Kartu tidak tahu apa pun tentang frame tertentu: pratinjaunya dirender dari
 *  manifest oleh komponen yang sama dengan yang dipakai layar tinjau, jadi
 *  frame baru cukup ditambahkan ke `index.json` — tidak ada kode di sini yang
 *  perlu ikut berubah. */

/** Rotasi per kartu. Rentang handoff untuk polaroid: -5°…+3°. Diambil
 *  berdasarkan indeks, bukan acak, supaya tata letaknya tidak berubah tiap
 *  render. */
const TILTS = [-5, 3, -2.5, 2, -4, 1.5] as const;

export function FramePicker({
  frames,
  initialId,
  onConfirm,
}: {
  frames: readonly FrameManifest[];
  initialId: string | null;
  onConfirm: (frameId: string) => void;
}) {
  const [draftId, setDraftId] = useState<string>(
    () => initialId ?? frames[0].id,
  );
  const selected = frames.find((f) => f.id === draftId) ?? frames[0];

  return (
    <main className="board flex min-h-dvh flex-col items-center px-[var(--pad-screen)] py-6">
      <div className="flex w-full max-w-lg items-center gap-2.5">
        <Link
          href="/"
          aria-label="Kembali ke beranda"
          className={stickerClasses(
            "ghost",
            "text-cream border-cream/60 h-[38px]! px-3!",
          )}
        >
          ‹
        </Link>
        <h1
          className="disp text-cream text-display-s"
          style={{ ["--disp-stroke" as string]: "1.3px" }}
        >
          Pilih frame
        </h1>
        <span
          aria-hidden
          className="font-marker text-marker-m text-accent-yellow ml-auto rotate-[-16deg]"
        >
          ✦
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Frame"
        className="grid w-full max-w-lg flex-1 grid-cols-3 content-center justify-items-center gap-x-4 gap-y-8 py-8 sm:grid-cols-4"
      >
        {frames.map((frame, i) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            tilt={TILTS[i % TILTS.length]}
            selected={frame.id === draftId}
            onSelect={() => setDraftId(frame.id)}
          />
        ))}
      </div>

      <div className="flex w-full max-w-lg flex-col items-center gap-2.5">
        <p className="font-marker text-marker-s text-cream/75 text-center">
          {selected.slots.length} foto, satu per slot
        </p>
        <StickerButton
          variant="secondary"
          tilt={0.5}
          onClick={() => onConfirm(selected.id)}
          className="w-full max-w-xs"
        >
          Mulai foto ✦
        </StickerButton>
      </div>
    </main>
  );
}

function FrameCard({
  frame,
  tilt,
  selected,
  onSelect,
}: {
  frame: FrameManifest;
  tilt: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{ transform: `rotate(${tilt}deg)` }}
      className={
        "bg-paper shadow-pola rounded-card relative w-fit cursor-pointer px-2 pt-2 pb-[22px] " +
        "transition-transform active:scale-[0.97] " +
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-yellow " +
        (selected ? "outline-brand-pink outline-[2.5px]" : "")
      }
    >
      {/* Pin: merah kalau terpilih, silver kalau tidak (handoff §2). */}
      <span
        aria-hidden
        className="shadow-pin absolute -top-2 left-1/2 size-[19px] -translate-x-1/2 rounded-full"
        style={{
          background: selected
            ? "radial-gradient(circle at 34% 30%, #ff8f7f, var(--color-accent-red))"
            : "radial-gradient(circle at 34% 30%, #d6dade, var(--color-pin-silver))",
        }}
      />

      {/* Tinggi pratinjau dipatok, lebarnya menyesuaikan rasio canvas. Kalau
          lebar yang dipatok, frame 600×1800 jadi kartu setinggi tiga layar dan
          tombol "Mulai foto" terdorong ke bawah lipatan — sementara di sini
          bedanya rasio antar frame justru jadi informasi yang berguna. */}
      <span className="flex h-[220px] items-center justify-center">
        <StripPreview
          frame={frame}
          overlayUrl={resolveOverlayUrl(frame)}
          photos={{}}
          className="h-full w-auto shadow-none!"
        />
      </span>

      <span className="font-marker text-marker-s text-ink mt-1.5 block max-w-[92px] text-center">
        {frame.name}
      </span>
      <span
        className={
          "font-sans text-caption block text-center " +
          (selected ? "text-teal-ink" : "text-ink/60")
        }
      >
        {selected ? "dipilih ✓" : `${frame.slots.length} slot`}
      </span>
    </button>
  );
}
