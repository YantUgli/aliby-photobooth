import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

/** Label stiker — tombol utama Aliby (handoff §2).
 *
 *  Tiga hal yang bikin ia terbaca sebagai tombol walau miring, dan tidak boleh
 *  dilonggarkan: border ink tebal, hard-offset shadow, dan rotasi ≤±3°.
 *  Hit-area dijaga ≥44px lewat tinggi varian. */
export type StickerVariant = "primary" | "secondary" | "ghost";
type Variant = StickerVariant;

const base =
  "inline-flex items-center justify-center gap-2 border-ink font-display " +
  "cursor-pointer select-none rounded-btn border-[2.5px] " +
  "transition-transform active:translate-x-px active:translate-y-0.5 " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-yellow";

const variants: Record<Variant, string> = {
  // CTA utama: pink, teks ink.
  primary: "bg-brand-pink text-ink shadow-btn h-[52px] px-7 text-display-s",
  // CTA kedua: kuning (Unduh / Lanjut).
  secondary: "bg-accent-yellow text-ink shadow-btn h-[50px] px-6 text-display-s",
  // Ghost: transparan, dipakai untuk "Batal".
  ghost:
    "bg-transparent text-ink shadow-btn-ghost h-[46px] px-5 text-[15px] font-display",
};

/** Kelas stiker tanpa elemen <button>.
 *
 *  Ada karena beberapa kontrol harus berupa <a> (navigasi antar halaman), dan
 *  <button> di dalam <a> bukan HTML yang sah — pembaca layar mengumumkannya
 *  dua kali dan Enter/Space berperilaku beda. Rotasi tidak ikut di sini karena
 *  ia inline style; pemanggil memasangnya sendiri. */
export function stickerClasses(
  variant: Variant = "primary",
  extra = "",
): string {
  return `${base} ${variants[variant]} ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** React 19 menerima ref sebagai prop biasa di function component. */
  ref?: Ref<HTMLButtonElement>;
  variant?: Variant;
  /** Rotasi dalam derajat. Dibatasi ±3° demi keterbacaan (handoff §2). */
  tilt?: number;
  children: ReactNode;
};

export function StickerButton({
  variant = "primary",
  tilt = -1,
  className = "",
  style,
  children,
  ...rest
}: Props) {
  const safeTilt = Math.max(-3, Math.min(3, tilt));
  return (
    <button
      {...rest}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ transform: `rotate(${safeTilt}deg)`, ...style }}
    >
      {children}
    </button>
  );
}
