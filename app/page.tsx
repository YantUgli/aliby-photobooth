import Link from "next/link";
import { stickerClasses } from "@/components/ui/StickerButton";

/* Landing Phase 0 — bukti token.
   Tujuan halaman ini: memastikan warna, font, skala tipografi, spacing,
   radius, bayangan, dan rotasi dari app/globals.css benar-benar terpasang dan
   terpetakan ke utility Tailwind v4. Hero-nya memakai copy asli dari
   "Aliby Scrapbook.dc.html"; dekorasi scrapbook (sticky, washi, pin, benang,
   doodle) SENGAJA belum ada — itu Phase 3. */

const colorTokens = [
  { role: "board", token: "--color-board", note: "gabus hijau utama" },
  { role: "board-speckle-d", token: "--color-board-speckle-d", note: "titik gelap tekstur" },
  { role: "board-speckle-l", token: "--color-board-speckle-l", note: "titik terang tekstur" },
  { role: "booth", token: "--color-booth", note: "bilik gelap (Capture)" },
  { role: "brand-pink", token: "--color-brand-pink", note: "judul & CTA utama" },
  { role: "brand-pink-ink", token: "--color-brand-pink-ink", note: "stroke pink bubble" },
  { role: "accent-yellow", token: "--color-accent-yellow", note: "sticky, tape, CTA sekunder" },
  { role: "accent-red", token: "--color-accent-red", note: "pin utama, alert" },
  { role: "accent-blue", token: "--color-accent-blue", note: "washi, doodle" },
  { role: "accent-orange", token: "--color-accent-orange", note: "washi, doodle" },
  { role: "pin-silver", token: "--color-pin-silver", note: "pin non-terpilih" },
  { role: "paper", token: "--color-paper", note: "polaroid / kertas strip" },
  { role: "kraft", token: "--color-kraft", note: "map/tag kraft" },
  { role: "kraft-ink", token: "--color-kraft-ink", note: "teks di atas kraft" },
  { role: "ink", token: "--color-ink", note: "garis, border, teks" },
  { role: "cream", token: "--color-cream", note: "teks di papan gelap" },
  { role: "teal-ink", token: "--color-teal-ink", note: "teks tangan, link" },
  { role: "photo-a", token: "--color-photo-a", note: "placeholder foto" },
  { role: "photo-b", token: "--color-photo-b", note: "placeholder foto" },
];

const typeScale = [
  { cls: "text-display-xl font-display", label: "display-xl · 52px", sample: "Aliby" },
  { cls: "text-display-l font-display", label: "display-l · 34px", sample: "Aliby" },
  { cls: "text-display-m font-display", label: "display-m · 27px", sample: "Aliby" },
  { cls: "text-display-s font-display", label: "display-s · 20px", sample: "Aliby" },
  { cls: "text-marker-l font-marker", label: "marker-l · 24px", sample: "gaya dulu" },
  { cls: "text-marker-m font-marker", label: "marker-m · 15px", sample: "gaya dulu" },
  { cls: "text-marker-s font-marker", label: "marker-s · 11px", sample: "gaya dulu" },
  { cls: "text-body font-sans", label: "body · 14px", sample: "Foto 2 dari 4" },
  { cls: "text-caption font-sans", label: "caption · 11px", sample: "link aktif 7 hari" },
];

const radii = [
  { cls: "rounded-phone", label: "phone · 32px" },
  { cls: "rounded-card", label: "card · 12px" },
  { cls: "rounded-btn", label: "btn · 14px" },
  { cls: "rounded-chip", label: "chip · 7px" },
  { cls: "rounded-photo", label: "photo · 3px" },
];

const shadows = [
  { cls: "shadow-pola", label: "pola" },
  { cls: "shadow-sticky", label: "sticky" },
  { cls: "shadow-tape", label: "tape" },
  { cls: "shadow-pin", label: "pin" },
  { cls: "shadow-kraft", label: "kraft" },
  { cls: "shadow-btn", label: "btn" },
  { cls: "shadow-btn-ghost", label: "btn-ghost" },
];

const rotations = [
  { token: "--rot-photo", label: "photo · -5°…+3°" },
  { token: "--rot-tape", label: "tape · ±4°…±9°" },
  { token: "--rot-sticky", label: "sticky · ±6°…±8°" },
  { token: "--rot-doodle", label: "doodle · ±10°…±20°" },
  { token: "--rot-btn", label: "btn · maks ±3°" },
];

/* Class Tailwind harus literal — `w-${n}` tidak terdeteksi saat build. */
const spacings = [
  { label: "space-1 · 4px", cls: "w-1" },
  { label: "space-2 · 8px", cls: "w-2" },
  { label: "space-3 · 12px", cls: "w-3" },
  { label: "space-4 · 16px", cls: "w-4" },
  { label: "space-5 · 20px", cls: "w-5" },
  { label: "space-6 · 24px", cls: "w-6" },
  { label: "space-8 · 32px", cls: "w-8" },
  { label: "space-10 · 40px", cls: "w-10" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-display text-display-s text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="board min-h-dvh px-[var(--pad-screen)] py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {/* ---------- Wordmark ---------- */}
        <header className="flex items-baseline gap-2">
          <span
            className="disp text-display-l text-brand-pink"
            style={{ ["--disp-stroke" as string]: "0px" }}
          >
            aliby
          </span>
          <span className="font-marker text-marker-m text-accent-yellow rotate-[-6deg]">
            ✦ photobooth
          </span>
        </header>

        {/* ---------- Hero (copy asli dari Aliby Scrapbook) ---------- */}
        <section className="max-w-xl">
          <h1
            className="disp text-display-m leading-tight text-cream sm:text-display-xl"
            style={{ ["--disp-stroke" as string]: "1.6px" }}
          >
            Biar nggak cuma di ingatan.
          </h1>
          <p className="font-marker text-marker-m text-accent-yellow mt-2 sm:text-marker-l">
            Momennya lewat, stripnya nggak.
          </p>
          <p className="font-marker text-marker-s text-accent-blue mt-3 rotate-[-1deg]">
            aliby = bukti kamu ada di momen itu ↴
          </p>

          <div className="mt-6 flex items-center gap-4">
            {/* Label stiker: border ink + hard-shadow + rotasi ≤±3° (handoff §2).
                <a>, bukan <button> di dalam <a> — ini navigasi, bukan aksi. */}
            <Link
              href="/booth"
              className={stickerClasses("primary")}
              style={{ transform: "rotate(-1deg)" }}
            >
              Mulai! ✦
            </Link>
            <span className="font-marker text-marker-m text-cream">
              gratis · tanpa akun
            </span>
          </div>
        </section>

        {/* ---------- Bukti token ---------- */}
        <div className="bg-paper text-ink rounded-card shadow-pola p-6">
          <h2 className="font-display text-display-m text-ink">Bukti token</h2>
          <p className="font-sans text-body text-kraft-ink mt-1">
            Semua di bawah dirender lewat utility Tailwind yang dihasilkan{" "}
            <code className="font-mono">@theme</code> di{" "}
            <code className="font-mono">app/globals.css</code>. Kalau ada yang tampil
            sebagai default browser, berarti token itu belum terpasang.
          </p>

          <Section title="Warna (nama peran)">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {colorTokens.map((c) => (
                <li key={c.token} className="flex items-center gap-3">
                  <span
                    className="border-ink rounded-chip size-10 shrink-0 border-2"
                    style={{ background: `var(${c.token})` }}
                  />
                  <span className="min-w-0">
                    <span className="font-sans text-body block font-bold">{c.role}</span>
                    <span className="font-sans text-caption text-kraft-ink block">
                      {c.note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Skala tipografi">
            <ul className="flex flex-col gap-3">
              {typeScale.map((t) => (
                <li key={t.label} className="flex flex-wrap items-baseline gap-x-4">
                  <span className="font-sans text-caption text-kraft-ink w-40 shrink-0">
                    {t.label}
                  </span>
                  <span className={`${t.cls} text-ink`}>{t.sample}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Radius">
            <ul className="flex flex-wrap gap-4">
              {radii.map((r) => (
                <li key={r.label} className="text-center">
                  <span
                    className={`${r.cls} border-ink bg-photo-b block size-20 border-2`}
                  />
                  <span className="font-sans text-caption text-kraft-ink mt-1 block">
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Bayangan">
            <ul className="flex flex-wrap gap-5">
              {shadows.map((s) => (
                <li key={s.label} className="text-center">
                  <span
                    className={`${s.cls} rounded-card bg-paper border-photo-a block size-20 border`}
                  />
                  <span className="font-sans text-caption text-kraft-ink mt-2 block">
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Rentang rotasi">
            <ul className="flex flex-wrap gap-5">
              {rotations.map((r) => (
                <li key={r.token} className="text-center">
                  <span
                    className="border-ink rounded-photo bg-accent-yellow block size-16 border-2"
                    style={{ transform: `rotate(var(${r.token}))` }}
                  />
                  <span className="font-sans text-caption text-kraft-ink mt-2 block">
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Spacing (skala 4px)">
            <ul className="flex flex-col gap-1">
              {spacings.map((s) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span className="font-sans text-caption text-kraft-ink w-28 shrink-0">
                    {s.label}
                  </span>
                  <span className={`bg-accent-red rounded-photo h-3 ${s.cls}`} />
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Utility .board">
            <div className="board rounded-card flex h-24 items-center justify-center">
              <span className="font-marker text-marker-m text-cream">
                tekstur papan CSS-only · 0 aset
              </span>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
