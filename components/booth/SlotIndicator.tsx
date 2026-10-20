import type { FrameSlot } from "@/lib/frames/types";

/** Dot per slot (handoff §2): selesai = isi pink, aktif = ring kuning,
 *  kosong = ring cream 35%. Di layar Capture ini tidak boleh tertutup
 *  dekorasi apa pun (docs/aliby-konvensi.md §Desain). */
export function SlotIndicator({
  slots,
  filledSlotIds,
  activeSlotId,
}: {
  slots: readonly FrameSlot[];
  filledSlotIds: ReadonlySet<number>;
  activeSlotId: number | null;
}) {
  return (
    <ul className="flex gap-[9px]" aria-label="Kemajuan slot foto">
      {slots.map((slot) => {
        const filled = filledSlotIds.has(slot.id);
        const active = slot.id === activeSlotId;
        return (
          <li
            key={slot.id}
            aria-label={`Slot ${slot.id}: ${
              filled ? "terisi" : active ? "sedang diambil" : "kosong"
            }`}
            className={[
              "size-[13px] rounded-full",
              filled
                ? "bg-brand-pink"
                : active
                  ? "border-2 border-accent-yellow"
                  : "border-2 border-cream/35",
            ].join(" ")}
          />
        );
      })}
    </ul>
  );
}
