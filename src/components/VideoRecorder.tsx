"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLIP_DURATIONS, SKILL_FOCUSES } from "@/lib/constants";
import type { SkillFocus } from "@/lib/types";

type SaveMeta = {
  note: string;
  skillFocus?: SkillFocus;
  durationSeconds: number;
};

interface VideoRecorderProps {
  onSave: (blob: Blob, meta: SaveMeta) => Promise<void>;
}

type RecorderState = "idle" | "countdown" | "recording" | "preview" | "saving";

type CaptureVideoElement = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function supportedMimeType() {
  return MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
}

function loadVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error("Could not read the video duration."));
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("Could not trim this clip."));
    video.currentTime = time;
  });
}

async function trimVideoBlob(
  blob: Blob,
  startSeconds: number,
  durationSeconds: number,
): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(blob);
  const video = document.createElement("video") as CaptureVideoElement;
  let drawing = false;
  let animationFrame = 0;

  try {
    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load this clip for trimming."));
    });
    await seekVideo(video, startSeconds);

    let stream = video.captureStream?.() ?? video.mozCaptureStream?.();

    if (!stream || stream.getVideoTracks().length === 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas trimming is not supported.");

      stream = canvas.captureStream(30);
      drawing = true;
      const draw = () => {
        if (!drawing) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animationFrame = requestAnimationFrame(draw);
      };
      draw();
    }

    const mimeType = supportedMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = () => reject(new Error("Could not save the trimmed clip."));
    });

    recorder.start(250);
    await video.play();
    await new Promise((resolve) => window.setTimeout(resolve, durationSeconds * 1000));
    video.pause();
    drawing = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    recorder.stop();

    return recording;
  } finally {
    drawing = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    URL.revokeObjectURL(sourceUrl);
  }
}

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
  const [uploadedDuration, setUploadedDuration] = useState<number | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimLength, setTrimLength] = useState<(typeof CLIP_DURATIONS)[number]>(15);

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
    if (mode === "upload" && previewRef.current && previewUrl) {
      previewRef.current.currentTime = trimStart;
    }
  }, [mode, previewUrl, trimStart]);

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
    const mimeType = supportedMimeType();
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

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);

    try {
      const fileDuration = await loadVideoDuration(url);
      if (!Number.isFinite(fileDuration) || fileDuration < 10) {
        URL.revokeObjectURL(url);
        setError("Upload a clip that is at least 10 seconds long.");
        return;
      }

      const defaultTrimLength = fileDuration >= 15 ? 15 : 10;
      setDuration(defaultTrimLength);
      setTrimLength(defaultTrimLength);
      setTrimStart(0);
      setUploadedDuration(fileDuration);
      setRecordedBlob(file);
      setPreviewUrl(url);
      setState("preview");
      stopStream();
    } catch (uploadError) {
      URL.revokeObjectURL(url);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not load this video.",
      );
    }
  };

  const retake = async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setUploadedDuration(null);
    setTrimStart(0);
    setState("idle");
    if (mode === "camera") await startCamera();
  };

  const saveClip = async () => {
    if (!recordedBlob) return;
    setState("saving");
    setError(null);

    try {
      const shouldTrimUpload =
        mode === "upload" &&
        uploadedDuration !== null &&
        (trimStart > 0.1 || uploadedDuration - trimLength > 0.1);
      const blobToSave = shouldTrimUpload
        ? await trimVideoBlob(recordedBlob, trimStart, trimLength)
        : recordedBlob;
      const durationSeconds = mode === "upload" ? trimLength : duration;
      await onSave(blobToSave, { note, skillFocus, durationSeconds });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this clip.",
      );
      setState("preview");
    }
  };

  const uploadTrimOptions = uploadedDuration
    ? CLIP_DURATIONS.filter((value) => value <= Math.floor(uploadedDuration))
    : [];
  const maxTrimStart = uploadedDuration
    ? Math.max(0, uploadedDuration - trimLength)
    : 0;

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
              setUploadedDuration(null);
              setTrimStart(0);
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
                REC - {remaining}s
              </div>
            )}
          </>
        ) : (
          <label className="flex aspect-[9/16] max-h-[70vh] cursor-pointer flex-col items-center justify-center gap-3 bg-[var(--bg-elevated)]">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Upload clip
            </span>
            <span className="text-sm font-medium">Choose a clip from your device</span>
            <span className="text-xs text-[var(--text-muted)]">
              Trim it to a 10-20 second practice take before saving
            </span>
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

      {mode === "upload" && uploadedDuration !== null && (state === "preview" || state === "saving") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="text-sm font-medium">Trim uploaded clip</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Original length: {uploadedDuration.toFixed(1)}s. Save a focused 10-20 second segment.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Saved length
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadTrimOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setTrimLength(value);
                      setTrimStart((current) =>
                        Math.min(current, Math.max(0, (uploadedDuration ?? value) - value)),
                      );
                    }}
                    className={`rounded-full px-4 py-2 text-sm ${
                      trimLength === value
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border border-[var(--border)]"
                    }`}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Start at {trimStart.toFixed(1)}s
              </span>
              <input
                type="range"
                min="0"
                max={maxTrimStart}
                step="0.1"
                value={trimStart}
                onChange={(event) => setTrimStart(Number(event.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </label>
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
