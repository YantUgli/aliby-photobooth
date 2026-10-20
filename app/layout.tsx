import type { Metadata } from "next";
import { Archivo, Permanent_Marker, Titan_One } from "next/font/google";
import "./globals.css";

/* Nama variabel CSS di sini SENGAJA berbeda dari token peran di globals.css
   (--font-display / --font-marker / --font-sans). next/font menimpa variabel
   yang ia pegang dengan satu nama family saja, jadi kalau dipasang langsung ke
   --font-display, fallback stack "Arial Black" ikut hilang. Lihat docs/aliby-konvensi.md §Desain. */

const titan = Titan_One({
  weight: "400", // single-weight, bukan variable font
  subsets: ["latin"],
  display: "swap",
  variable: "--font-titan",
});

const permanentMarker = Permanent_Marker({
  weight: "400", // single-weight, bukan variable font
  subsets: ["latin"],
  display: "swap",
  variable: "--font-permanent-marker",
});

const archivo = Archivo({
  // variable font: satu file mencakup 500 & 700 yang dipakai desain
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Aliby — photo booth",
  description: "Biar nggak cuma di ingatan. Momennya lewat, stripnya nggak.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${titan.variable} ${permanentMarker.variable} ${archivo.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
