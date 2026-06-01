"use client";

import { useState } from "react";
import type { Clip } from "@/lib/types";
import { SideBySidePlayer } from "@/components/SideBySidePlayer";
import { downloadBlob, exportComparisonVideo } from "@/lib/export-video";
import { getVideoUrl } from "@/lib/storage";

interface ProgressExportProps {
  journeyName: string;
  clipA: Clip;
  clipB: Clip;
}

export function ProgressExport({
  journeyName,
  clipA,
  clipB,
}: ProgressExportProps) {
  const [template, setTemplate] = useState<"side-by-side" | "before-after">(
    "before-after",
  );
  const [overlayText, setOverlayText] = useState(
    "I didn't realize I improved this much",
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const [urlA, urlB] = await Promise.all([
        getVideoUrl(clipA.videoId),
        getVideoUrl(clipB.videoId),
      ]);
      if (!urlA || !urlB) throw new Error("Could not load clips for export.");

      const blob = await exportComparisonVideo(urlA, urlB, {
        journeyName,
        dayFrom: clipA.dayNumber,
        dayTo: clipB.dayNumber,
        overlayText,
        template,
      });

      downloadBlob(blob, `${journeyName.replace(/\s+/g, "-").toLowerCase()}-progress.webm`);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Export failed. Try again in Chrome.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <SideBySidePlayer clipA={clipA} clipB={clipB} />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="font-display text-xl font-bold">Export progress video</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Create a vertical 9:16 reel with journey name and day labels.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <p className="mb-3 text-sm font-medium">Template</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["before-after", "Before / After"],
                ["side-by-side", "Side by Side"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTemplate(value)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    template === value
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "border border-[var(--border)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Overlay text</span>
            <input
              value={overlayText}
              onChange={(event) => setOverlayText(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60"
        >
          {exporting ? "Exporting..." : "Save to device"}
        </button>
      </section>
    </div>
  );
}
