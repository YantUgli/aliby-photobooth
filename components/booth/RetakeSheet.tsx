"use client";

import { useEffect, useRef } from "react";
import { StickerButton } from "@/components/ui/StickerButton";

/** Konfirmasi "Ulangi foto N?" — bottom sheet kertas (handoff Revisi 3).
 *
 *  Kenapa ada konfirmasi padahal mengulang itu murah: foto lama ditimpa dan
 *  tidak bisa dikembalikan. Teksnya menyebut jumlah foto lain yang aman supaya
 *  user tahu ia tidak kehilangan sesi. */
export function RetakeSheet({
  slotNumber,
  otherCount,
  onCancel,
  onConfirm,
}: {
  slotNumber: number;
  otherCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[rgba(15,45,39,0.55)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="retake-title"
        className="bg-paper relative mx-2.5 rounded-t-[20px] px-[18px] pt-6 pb-5"
        style={{ transform: "rotate(-0.5deg)", boxShadow: "0 -10px 28px rgba(0,0,0,.45)" }}
      >
        <h2
          id="retake-title"
          className="disp text-brand-pink mb-1.5 text-[23px]"
          style={{ ["--disp-stroke" as string]: "0px", ["--disp-shadow" as string]: "1.5px 1.5px 0 var(--color-ink)" }}
        >
          Ulangi foto {slotNumber}?
        </h2>
        <p className="font-sans text-kraft-ink mb-4 text-[12px] leading-[1.45]">
          Foto lama ditimpa.{" "}
          {otherCount > 0
            ? `${otherCount} foto lain tetap aman.`
            : "Belum ada foto lain."}
        </p>
        <div className="flex gap-2.5">
          <StickerButton
            variant="ghost"
            tilt={0}
            onClick={onCancel}
            className="flex-1"
          >
            Batal
          </StickerButton>
          <StickerButton
            ref={confirmRef}
            tilt={0}
            onClick={onConfirm}
            className="h-[46px]! flex-[1.2] text-[15px]!"
          >
            Ulangi ✦
          </StickerButton>
        </div>
      </div>
    </div>
  );
}
