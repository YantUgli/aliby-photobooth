"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CameraStatus,
  FacingMode,
  UseCameraOptions,
  UseCameraResult,
} from "./types.ts";

/** Kualitas JPEG hasil jepret per slot. Foto mentah, belum kena filter. */
const SHOT_QUALITY = 0.92;

/** Terjemahkan kegagalan getUserMedia jadi status + pesan yang bisa dibaca user.
 *
 *  Tiga cabang ini beda penanganannya di UI, jadi tidak boleh digabung:
 *  "denied" bisa dipulihkan user, "unsupported" tidak, "error" layak dicoba lagi. */
function classifyError(err: unknown): {
  status: CameraStatus;
  message: string;
} {
  const name =
    typeof err === "object" && err !== null && "name" in err
      ? String((err as { name: unknown }).name)
      : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return {
        status: "denied",
        message:
          "Izin kamera ditolak. Aktifkan lewat ikon gembok di address bar, lalu tekan Coba lagi.",
      };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return {
        status: "unsupported",
        message: "Tidak ada kamera yang cocok di perangkat ini.",
      };
    case "NotReadableError":
    case "TrackStartError":
      return {
        status: "error",
        message:
          "Kamera sedang dipakai aplikasi lain. Tutup dulu, lalu tekan Coba lagi.",
      };
    default:
      return {
        status: "error",
        message: "Kamera gagal dinyalakan. Tekan Coba lagi.",
      };
  }
}

/** Hook kamera: izin, stream, flip, dan ambil satu frame ke Blob.
 *
 *  `start`, `stop`, `flip`, dan `grabFrame` sengaja dibuat stabil (deps kosong)
 *  dan membaca opsi terbaru lewat ref. Alasannya: pemanggil menjalankan
 *  `useEffect(() => { start(); return () => stop(); }, [start, stop])`. Kalau
 *  identitasnya berubah tiap render, effect itu akan mematikan dan menyalakan
 *  kamera terus-menerus. */
export function useCamera({
  aspectRatio,
  initialFacingMode = "user",
}: UseCameraOptions): UseCameraResult {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacingMode);

  // Opsi terbaru, dibaca oleh callback stabil di atas.
  const optsRef = useRef({ aspectRatio, facingMode: initialFacingMode });
  useEffect(() => {
    optsRef.current.aspectRatio = aspectRatio;
  }, [aspectRatio]);

  /* Token permintaan. getUserMedia menunggu user menekan "Allow", yang bisa
     lama. Selama itu komponen bisa unmount atau user menekan flip. Tiap
     permintaan menaikkan token; hasil yang tokennya sudah basi dibuang dan
     stream-nya langsung dimatikan, supaya tidak ada kamera yang menyala tanpa
     ada yang memakai. React StrictMode di dev memanggil effect dua kali, jadi
     jalur ini benar-benar terpakai, bukan teori. */
  const requestIdRef = useRef(0);

  /** Pasang stream ke elemen video, kalau dua-duanya ada dan belum terpasang. */
  const attach = useCallback((el: HTMLVideoElement | null) => {
    const stream = streamRef.current;
    if (!el || !stream || el.srcObject === stream) return;
    el.srcObject = stream;
    void el.play().catch(() => {
      // Autoplay bisa ditolak; <video> sudah muted + playsInline.
    });
  }, []);

  /* Callback ref. Dipanggil React tiap kali elemen <video> dipasang atau
     diganti, jadi stream selalu menempel ke elemen yang sedang hidup. */
  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
      attach(el);
    },
    [attach],
  );

  /** Matikan SEMUA track. Mengosongkan srcObject saja tidak cukup — lampu
   *  kamera tetap menyala kalau track-nya tidak di-stop. */
  const teardown = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
    const video = videoElRef.current;
    if (video) video.srcObject = null;
  }, []);

  const startWith = useCallback(
    async (mode: FacingMode) => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setStatus("unsupported");
        setErrorMessage(
          typeof window !== "undefined" && window.isSecureContext === false
            ? "Kamera butuh koneksi aman. Buka lewat https:// atau localhost."
            : "Browser ini tidak mendukung akses kamera.",
        );
        return;
      }

      const id = ++requestIdRef.current;

      // Stream lama dimatikan DULU. Di sebagian HP, permintaan kedua gagal
      // dengan NotReadableError selama kamera masih dipegang stream pertama.
      teardown();
      setStatus("requesting");
      setErrorMessage(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: mode,
            // "ideal", bukan "exact": kalau dipaksa, kamera yang tidak punya
            // rasio itu akan menolak total. Rasio nyata bisa beda — itu sebabnya
            // grabFrame melakukan crop tengah, bukan stretch.
            aspectRatio: { ideal: optsRef.current.aspectRatio },
            width: { ideal: 1280 },
          },
        });

        if (id !== requestIdRef.current) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        streamRef.current = stream;
        // Elemen video mungkin belum ter-mount; kalau begitu, callback ref yang
        // akan memasangnya nanti.
        attach(videoElRef.current);

        if (id !== requestIdRef.current) return;
        setStatus("ready");
      } catch (err) {
        if (id !== requestIdRef.current) return;
        const { status: s, message } = classifyError(err);
        setStatus(s);
        setErrorMessage(message);
      }
    },
    [attach, teardown],
  );

  const start = useCallback(() => {
    void startWith(optsRef.current.facingMode);
  }, [startWith]);

  const stop = useCallback(() => {
    // Naikkan token supaya permintaan yang masih menunggu izin ikut batal.
    requestIdRef.current += 1;
    teardown();
    setStatus("idle");
    setErrorMessage(null);
  }, [teardown]);

  const flip = useCallback(() => {
    const next: FacingMode =
      optsRef.current.facingMode === "user" ? "environment" : "user";
    optsRef.current.facingMode = next;
    setFacingMode(next);
    void startWith(next);
  }, [startWith]);

  const grabFrame = useCallback(
    async ({ width, height }: { width: number; height: number }) => {
      const video = videoElRef.current;
      if (!video || !streamRef.current) {
        throw new Error("Kamera belum siap.");
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw === 0 || vh === 0) {
        throw new Error("Frame kamera belum tersedia. Coba sebentar lagi.");
      }

      /* Crop tengah, bukan stretch. Rasio video nyata sering tidak sama dengan
         rasio slot karena `aspectRatio` di constraint cuma permintaan. Kalau
         di-stretch, wajah jadi gepeng. Di sini kita ambil area TERBESAR dari
         video yang rasionya sudah sama dengan slot, lalu skalakan. */
      const targetRatio = width / height;
      const sourceRatio = vw / vh;
      let sw = vw;
      let sh = vh;
      if (sourceRatio > targetRatio) {
        sw = Math.round(vh * targetRatio); // video terlalu lebar → potong kiri-kanan
      } else {
        sh = Math.round(vw / targetRatio); // video terlalu tinggi → potong atas-bawah
      }
      const sx = Math.round((vw - sw) / 2);
      const sy = Math.round((vh - sh) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D tidak tersedia di browser ini.");

      // Tanpa ctx.filter: foto disimpan MENTAH. Filter di-bake saat komposit
      // (Phase 2), supaya bisa diganti tanpa foto ulang.
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", SHOT_QUALITY),
      );
      if (!blob) throw new Error("Gagal membuat foto dari kamera.");
      return blob;
    },
    [],
  );

  // Jaring pengaman: apa pun yang terjadi di pemanggil, kamera mati saat unmount.
  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      teardown();
    };
  }, [teardown]);

  return {
    videoRef,
    status,
    errorMessage,
    facingMode,
    start,
    stop,
    flip,
    grabFrame,
  };
}
