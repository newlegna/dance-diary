"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLIP_DURATIONS, SKILL_FOCUSES } from "@/lib/constants";
import type { SkillFocus } from "@/lib/types";

interface VideoRecorderProps {
  onSave: (blob: Blob, meta: { note: string; skillFocus?: SkillFocus; durationSeconds: number }) => Promise<void>;
}

type RecorderState = "idle" | "countdown" | "recording" | "preview" | "saving";

export function VideoRecorder({ onSave }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [duration, setDuration] = useState<(typeof CLIP_DURATIONS)[number]>(15);
  const [state, setState] = useState<RecorderState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [skillFocus, setSkillFocus] = useState<SkillFocus>("groove");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "upload">("camera");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera access is required to record practice clips.");
    }
  }, [stopStream]);

  useEffect(() => {
    if (mode === "camera") startCamera();
    return stopStream;
  }, [mode, startCamera, stopStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopStream();
    };
  }, [previewUrl, stopStream]);

  const beginRecording = () => {
    if (!streamRef.current) return;

    setState("countdown");
    setCountdown(3);

    let count = 3;
    const countdownTimer = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        window.clearInterval(countdownTimer);
        startRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setPreviewUrl(url);
      setState("preview");
      stopStream();
    };

    recorder.start(250);
    setState("recording");
    setRemaining(duration);

    timerRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          mediaRecorderRef.current?.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleUpload = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setPreviewUrl(url);
    setState("preview");
    stopStream();
  };

  const retake = async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setState("idle");
    if (mode === "camera") await startCamera();
  };

  const saveClip = async () => {
    if (!recordedBlob) return;
    setState("saving");
    await onSave(recordedBlob, { note, skillFocus, durationSeconds: duration });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["camera", "upload"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setState("idle");
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setRecordedBlob(null);
              setPreviewUrl(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === option
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {option === "camera" ? "Record" : "Upload"}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-black">
        {(state === "preview" || state === "saving") && previewUrl ? (
          <video
            ref={previewRef}
            src={previewUrl}
            className="aspect-[9/16] max-h-[70vh] w-full object-cover"
            controls
            playsInline
          />
        ) : mode === "camera" ? (
          <>
            <video
              ref={videoRef}
              className="aspect-[9/16] max-h-[70vh] w-full object-cover mirror"
              muted
              playsInline
            />
            {state === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="font-display text-8xl font-bold text-[var(--accent)]">
                  {countdown}
                </span>
              </div>
            )}
            {state === "recording" && (
              <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                REC · {remaining}s
              </div>
            )}
          </>
        ) : (
          <label className="flex aspect-[9/16] max-h-[70vh] cursor-pointer flex-col items-center justify-center gap-3 bg-[var(--bg-elevated)]">
            <span className="text-4xl">📁</span>
            <span className="text-sm font-medium">Choose a clip from your device</span>
            <span className="text-xs text-[var(--text-muted)]">10–20 seconds recommended</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {mode === "camera" && state !== "preview" && (
        <div>
          <p className="mb-3 text-sm font-medium">Clip length</p>
          <div className="flex gap-2">
            {CLIP_DURATIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDuration(value)}
                className={`rounded-full px-4 py-2 text-sm ${
                  duration === value
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "border border-[var(--border)]"
                }`}
              >
                {value}s
              </button>
            ))}
          </div>
        </div>
      )}

      {(state === "preview" || state === "saving") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Skill focus</span>
            <select
              value={skillFocus}
              onChange={(event) => setSkillFocus(event.target.value as SkillFocus)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
            >
              {SKILL_FOCUSES.map((focus) => (
                <option key={focus.value} value={focus.value}>
                  {focus.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Notes</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Felt stiff today, better timing on the bounce..."
              className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {state === "idle" && mode === "camera" && (
          <button
            type="button"
            onClick={beginRecording}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)]"
          >
            Start recording
          </button>
        )}
        {(state === "preview" || state === "saving") && (
          <>
            <button
              type="button"
              onClick={saveClip}
              disabled={state === "saving"}
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60"
            >
              {state === "saving" ? "Saving..." : "Save clip"}
            </button>
            <button
              type="button"
              onClick={retake}
              disabled={state === "saving"}
              className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium disabled:opacity-60"
            >
              Retake
            </button>
          </>
        )}
      </div>
    </div>
  );
}
