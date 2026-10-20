"use client";

import type { FrameManifest } from "@/lib/frames/types";
import type { SlotPhoto } from "@/lib/capture/types";
import { NO_FILTER_CSS } from "@/lib/filters/types";

/** Pratinjau strip, dirender sebagai HTML (bukan canvas).
 *
 *  Posisi tiap slot dihitung dari manifest sebagai persentase, jadi komponen
 *  ini tidak tahu apa pun soal "Strip A" — ganti manifest, tata letaknya ikut.
 *  Overlay PNG yang sama dengan yang dipakai saat komposit dipasang di atas
 *  foto, sehingga pratinjau ini sekalian jadi cara mengecek apakah slot di
 *  manifest benar-benar sejajar dengan bingkai di overlay.
 *
 *  `filterCss` dipasang HANYA ke foto, bukan ke seluruh strip — persis seperti
 *  compositeStrip memasang `ctx.filter` hanya sebelum menggambar foto. Dua
 *  jalur ini memakai string yang sama, jadi pratinjau dan hasil unduhan tidak
 *  bisa berbeda. */
export function StripPreview({
  frame,
  overlayUrl,
  photos,
  onRetake,
  filterCss = NO_FILTER_CSS,
  className = "",
}: {
  frame: FrameManifest;
  overlayUrl: string;
  photos: Readonly<Record<number, SlotPhoto>>;
  /** Kalau ada, tiap foto jadi bisa diketuk untuk diulang. */
  onRetake?: (slotId: number) => void;
  /** String `filter` CSS dari katalog filter. Default "none". */
  filterCss?: string;
  className?: string;
}) {
  const { width, height } = frame.canvas;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div
      className={`shadow-pola relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${width} / ${height}`,
        background: frame.background,
      }}
    >
      {frame.slots.map((slot, i) => {
        const photo = photos[slot.id];
        const box = {
          left: pct(slot.x, width),
          top: pct(slot.y, height),
          width: pct(slot.w, width),
          height: pct(slot.h, height),
        } as const;

        if (!photo) {
          return (
            <div
              key={slot.id}
              className="bg-photo-a/45 absolute"
              style={box}
              aria-hidden
            />
          );
        }

        const label = `Ulangi foto ${i + 1}`;

        if (!onRetake) {
          return (
            // eslint-disable-next-line @next/next/no-img-element -- object URL dari Blob, bukan aset statis; next/image tidak berlaku
            <img
              key={slot.id}
              src={photo.objectUrl}
              alt={`Foto slot ${i + 1}`}
              className="absolute object-cover"
              style={{ ...box, filter: filterCss }}
            />
          );
        }

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onRetake(slot.id)}
            title={label}
            aria-label={label}
            className="absolute cursor-pointer"
            style={box}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL dari Blob */}
            <img
              src={photo.objectUrl}
              alt=""
              className="size-full object-cover"
              style={{ filter: filterCss }}
            />
            {/* Badge ↻ tampil di SEMUA foto dan SELALU terlihat, bukan saat
                hover — HP tidak punya hover (handoff Revisi 3). */}
            <span
              aria-hidden
              className="bg-brand-pink border-ink shadow-btn text-ink absolute -top-[6%] -right-[3%] flex size-6 items-center justify-center rounded-[7px] border-2 text-[12px] font-bold"
            >
              ↻
            </span>
          </button>
        );
      })}

      {/* Overlay digambar paling atas — urutan yang sama dipakai compositeStrip. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- overlay frame, ukurannya dari manifest */}
      <img
        src={overlayUrl}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
    </div>
  );
}
