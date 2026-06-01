export interface ExportOptions {
  journeyName: string;
  dayFrom: number;
  dayTo: number;
  overlayText?: string;
  template: "side-by-side" | "before-after";
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.playsInline = true;
    video.muted = true;
    video.preload = "auto";
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  videoA: HTMLVideoElement,
  videoB: HTMLVideoElement,
  options: ExportOptions,
  width: number,
  height: number,
) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, width, height);

  const padding = 24;
  const headerHeight = 160;
  const videoAreaTop = headerHeight;
  const videoAreaHeight = height - headerHeight - 80;

  if (options.template === "side-by-side") {
    const halfWidth = (width - padding * 3) / 2;
    drawVideoCover(ctx, videoA, padding, videoAreaTop, halfWidth, videoAreaHeight);
    drawVideoCover(
      ctx,
      videoB,
      padding * 2 + halfWidth,
      videoAreaTop,
      halfWidth,
      videoAreaHeight,
    );
  } else {
    const halfHeight = (videoAreaHeight - padding) / 2;
    drawVideoCover(ctx, videoA, padding, videoAreaTop, width - padding * 2, halfHeight);
    drawVideoCover(
      ctx,
      videoB,
      padding,
      videoAreaTop + halfHeight + padding,
      width - padding * 2,
      halfHeight,
    );
  }

  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(options.journeyName, width / 2, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px sans-serif";
  ctx.fillText(
    `Day ${options.dayFrom} vs Day ${options.dayTo}`,
    width / 2,
    108,
  );

  if (options.overlayText) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "24px sans-serif";
    wrapText(ctx, options.overlayText, width / 2, height - 48, width - 80, 32);
  }
}

function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const videoRatio = video.videoWidth / video.videoHeight;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = 0;
  let offsetY = 0;

  if (videoRatio > boxRatio) {
    drawH = h;
    drawW = h * videoRatio;
    offsetX = (w - drawW) / 2;
  } else {
    drawW = w;
    drawH = w / videoRatio;
    offsetY = (h - drawH) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.clip();
  ctx.drawImage(video, x + offsetX, y + offsetY, drawW, drawH);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

export async function exportComparisonVideo(
  videoUrlA: string,
  videoUrlB: string,
  options: ExportOptions,
): Promise<Blob> {
  const [videoA, videoB] = await Promise.all([
    loadVideo(videoUrlA),
    loadVideo(videoUrlB),
  ]);

  const duration = Math.min(videoA.duration, videoB.duration, 20);
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  videoA.currentTime = 0;
  videoB.currentTime = 0;
  await Promise.all([
    videoA.play().catch(() => undefined),
    videoB.play().catch(() => undefined),
  ]);

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const recording = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  recorder.start();
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed >= duration) {
        videoA.pause();
        videoB.pause();
        recorder.stop();
        resolve();
        return;
      }

      drawFrame(ctx, videoA, videoB, options, width, height);
      requestAnimationFrame(tick);
    };
    tick();
  });

  return recording;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
