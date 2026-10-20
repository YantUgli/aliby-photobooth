"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import type { FrameManifest } from "@/lib/frames/types";
import type { FilterConfig } from "@/lib/filters/types";
import { loadFrameCatalog, resolveOverlayUrl } from "@/lib/frames/loadFrame";
import { slotAspectRatio } from "@/lib/frames/parseFrameManifest";
import { DEFAULT_FILTER_ID, findFilter, loadFilterCatalog } from "@/lib/filters/loadFilters";
import {
  captureReducer,
  filledCount,
  initialCaptureState,
  isComplete,
} from "@/lib/capture/captureReducer";
import type { CaptureAction } from "@/lib/capture/captureReducer";
import type { CaptureState } from "@/lib/capture/types";
import { useCamera } from "@/lib/camera/useCamera";
import { CaptureScreen } from "@/components/booth/CaptureScreen";
import { FilterScreen } from "@/components/booth/FilterScreen";
import { FramePicker } from "@/components/booth/FramePicker";
import { ReviewScreen } from "@/components/booth/ReviewScreen";
import { RetakeSheet } from "@/components/booth/RetakeSheet";
import { stickerClasses } from "@/components/ui/StickerButton";

/** Orkestrasi alur booth (PRD §9 Phase 2).
 *
 *  Urutan mengikuti diagram sistem §3: pilih frame → capture per-slot →
 *  tinjau (+ ulangi per-slot) → pilih filter → komposit → unduh.
 *
 *  Katalog frame dan katalog filter dimuat sekali di sini, lalu diturunkan.
 *  Tidak ada satu pun id frame atau id filter yang disebut di komponen layar —
 *  semuanya membaca dari data yang dimuat. */
export default function BoothPage() {
  const [frames, setFrames] = useState<readonly FrameManifest[] | null>(null);
  const [filters, setFilters] = useState<readonly FilterConfig[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Frame yang sedang dipakai. null = masih di layar pilih frame. */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Frame yang disorot saat layar pilih dibuka lagi — supaya "ganti frame"
   *  tidak melupakan pilihan sebelumnya. */
  const [seedId, setSeedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadFrameCatalog(), loadFilterCatalog()])
      .then(([frameList, filterList]) => {
        if (!alive) return;
        setFrames(frameList);
        setFilters(filterList);
      })
      .catch((e: unknown) => {
        if (alive) {
          setLoadError(e instanceof Error ? e.message : "Gagal memuat katalog.");
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) {
    return (
      <main className="board flex min-h-dvh flex-col items-center justify-center gap-4 px-[var(--pad-screen)]">
        <p className="font-sans text-body text-cream max-w-xs text-center">
          {loadError}
        </p>
        <Link
          href="/"
          className={stickerClasses("primary")}
          style={{ transform: "rotate(-1deg)" }}
        >
          Kembali
        </Link>
      </main>
    );
  }

  if (!frames || !filters) {
    return (
      <main className="board flex min-h-dvh items-center justify-center">
        <span className="font-marker text-marker-m text-cream/70">
          menyiapkan booth…
        </span>
      </main>
    );
  }

  const active = activeId ? (frames.find((f) => f.id === activeId) ?? null) : null;

  if (!active) {
    return (
      <FramePicker
        frames={frames}
        initialId={seedId}
        onConfirm={(id) => {
          setSeedId(id);
          setActiveId(id);
        }}
      />
    );
  }

  /* `key` sengaja dipasang: mengganti frame berarti jumlah dan ukuran slot
     berubah, jadi seluruh sesi capture memang harus mulai dari nol. Remount
     juga memicu cleanup object URL foto lama. */
  return (
    <Booth
      key={active.id}
      frame={active}
      filters={filters}
      onChangeFrame={() => setActiveId(null)}
    />
  );
}

function Booth({
  frame,
  filters,
  onChangeFrame,
}: {
  frame: FrameManifest;
  filters: readonly FilterConfig[];
  onChangeFrame: () => void;
}) {
  const overlayUrl = useMemo(() => resolveOverlayUrl(frame), [frame]);

  const slots = frame.slots;
  const reducer = useCallback(
    (s: CaptureState, a: CaptureAction) => captureReducer(s, a, slots),
    [slots],
  );
  const [state, dispatch] = useReducer(reducer, initialCaptureState);

  /* Umur object URL diurus di sini, bukan di reducer — reducer harus murni dan
     bisa dipanggil ulang oleh React. Tiap kali daftar foto berubah, URL yang
     hilang dari state adalah URL yang sudah tidak terjangkau siapa pun, jadi
     aman di-revoke. Tanpa ini, memori naik tiap kali user mengulang foto. */
  const liveUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set(
      Object.values(state.photos).map((p) => p.objectUrl),
    );
    for (const url of liveUrls.current) {
      if (!current.has(url)) URL.revokeObjectURL(url);
    }
    liveUrls.current = current;
  }, [state.photos]);

  // Bersih-bersih terakhir saat keluar dari booth.
  useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const activeSlot =
    state.activeSlotId === null
      ? null
      : (frame.slots.find((s) => s.id === state.activeSlotId) ?? null);

  // Rasio viewport = rasio slot aktif. Slot pertama dipakai sebagai default
  // saat belum ada slot aktif, supaya kamera bisa start lebih dulu.
  const aspectRatio = slotAspectRatio(activeSlot ?? frame.slots[0]);
  const camera = useCamera({ aspectRatio, initialFacingMode: "user" });

  /* Kamera hidup HANYA selama menjepret. Di layar tinjau dan filter tidak ada
     yang memakai feed-nya, dan lampu kamera yang tetap menyala di layar yang
     jelas-jelas bukan kamera bikin orang curiga — wajar. */
  const capturing = state.phase === "capturing";
  const { start, stop } = camera;
  useEffect(() => {
    if (!capturing) {
      stop();
      return;
    }
    start();
    return () => stop();
  }, [capturing, start, stop]);

  useEffect(() => {
    dispatch({ type: "start" });
  }, []);

  const filledSlotIds = useMemo(
    () => new Set(Object.keys(state.photos).map(Number)),
    [state.photos],
  );

  const activeSlotId = state.activeSlotId;
  const handlePhoto = useCallback(
    (blob: Blob) => {
      if (activeSlotId === null) return;
      dispatch({
        type: "photoTaken",
        photo: {
          slotId: activeSlotId,
          blob,
          objectUrl: URL.createObjectURL(blob),
          takenAt: Date.now(),
        },
      });
    },
    [activeSlotId],
  );

  const pendingSlotNumber =
    state.pendingRetakeSlotId === null
      ? 0
      : frame.slots.findIndex((s) => s.id === state.pendingRetakeSlotId) + 1;

  const selectedFilter = findFilter(filters, state.filterId ?? DEFAULT_FILTER_ID);
  const complete = isComplete(state.photos, frame.slots);

  return (
    <>
      {state.phase === "idle" ? (
        <main className="board flex min-h-dvh items-center justify-center">
          <span className="font-marker text-marker-m text-cream/70">
            menyiapkan kamera…
          </span>
        </main>
      ) : state.phase === "filter" ? (
        <FilterScreen
          frame={frame}
          overlayUrl={overlayUrl}
          photos={state.photos}
          filters={filters}
          selected={selectedFilter}
          onSelect={(filterId) => dispatch({ type: "selectFilter", filterId })}
          onBack={() => dispatch({ type: "backToReview" })}
        />
      ) : state.phase === "review" || activeSlot === null ? (
        <ReviewScreen
          frame={frame}
          overlayUrl={overlayUrl}
          photos={state.photos}
          complete={complete}
          onRetake={(slotId) => dispatch({ type: "askRetake", slotId })}
          onNext={() => dispatch({ type: "goToFilter" })}
          onBack={onChangeFrame}
        />
      ) : (
        <CaptureScreen
          slot={activeSlot}
          slotNumber={frame.slots.findIndex((s) => s.id === activeSlot.id) + 1}
          slots={frame.slots}
          filledSlotIds={filledSlotIds}
          isRetake={filledSlotIds.has(activeSlot.id)}
          camera={camera}
          onPhoto={handlePhoto}
          onBack={onChangeFrame}
        />
      )}

      {state.pendingRetakeSlotId !== null && (
        <RetakeSheet
          slotNumber={pendingSlotNumber}
          otherCount={Math.max(0, filledCount(state.photos, frame.slots) - 1)}
          onCancel={() => dispatch({ type: "cancelRetake" })}
          onConfirm={() => dispatch({ type: "confirmRetake" })}
        />
      )}
    </>
  );
}
