"use client";

import { useEffect, useRef, useState } from "react";
import type { Clip } from "@/lib/types";
import { PLAYBACK_SPEEDS } from "@/lib/constants";
import { getVideoUrl } from "@/lib/storage";

interface SideBySidePlayerProps {
  clipA: Clip;
  clipB: Clip;
}

export function SideBySidePlayer({ clipA, clipB }: SideBySidePlayerProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [urlA, setUrlA] = useState<string | null>(null);
  const [urlB, setUrlB] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getVideoUrl(clipA.videoId), getVideoUrl(clipB.videoId)]).then(
      ([a, b]) => {
        if (!active) return;
        setUrlA(a);
        setUrlB(b);
      },
    );
    return () => {
      active = false;
    };
  }, [clipA.videoId, clipB.videoId]);

  useEffect(() => {
    const videos = [videoARef.current, videoBRef.current].filter(Boolean) as HTMLVideoElement[];
    videos.forEach((video) => {
      video.playbackRate = speed;
      video.muted = muted;
    });
  }, [speed, muted, urlA, urlB]);

  const syncPlay = async () => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    videoA.currentTime = 0;
    videoB.currentTime = 0;
    await Promise.all([videoA.play(), videoB.play()]);
    setPlaying(true);
  };

  const pauseBoth = () => {
    videoARef.current?.pause();
    videoBRef.current?.pause();
    setPlaying(false);
  };

  const replayBoth = async () => {
    await syncPlay();
  };

  if (!urlA || !urlB) {
    return (
      <div className="rounded-3xl border border-[var(--border)] p-10 text-center text-sm text-[var(--text-muted)]">
        Loading comparison...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[{
          ref: videoARef,
          url: urlA,
          clip: clipA,
          label: "Clip A",
        }, {
          ref: videoBRef,
          url: urlB,
          clip: clipB,
          label: "Clip B",
        }].map(({ ref, url, clip, label }) => (
          <div key={clip.id} className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-black">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-[var(--accent)]">Day {clip.dayNumber}</span>
            </div>
            <video
              ref={ref}
              src={url}
              className="aspect-[9/16] w-full object-cover"
              playsInline
              loop
              onEnded={() => setPlaying(false)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playing ? pauseBoth : syncPlay}
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)]"
        >
          {playing ? "Pause both" : "Play both"}
        </button>
        <button
          type="button"
          onClick={replayBoth}
          className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium"
        >
          Replay
        </button>
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <div className="flex gap-2">
          {PLAYBACK_SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              className={`rounded-full px-4 py-2 text-sm ${
                speed === value
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border border-[var(--border)]"
              }`}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
