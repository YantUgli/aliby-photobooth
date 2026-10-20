/** Hitung mundur 3→2→1 (handoff §2: Ø108 di layar capture, kuning,
 *  angka Titan One, shadow-pola). «include» dari "Foto per-slot" — selalu
 *  terjadi tiap jepret (diagram sistem §1). */
export function CountdownBadge({ value }: { value: number }) {
  return (
    <div
      className="bg-accent-yellow shadow-pola flex size-[108px] items-center justify-center rounded-full"
      role="timer"
      aria-live="assertive"
      aria-label={`${value} detik lagi`}
    >
      <span
        className="font-display text-booth leading-none"
        style={{ fontSize: 60 }}
      >
        {value}
      </span>
    </div>
  );
}
