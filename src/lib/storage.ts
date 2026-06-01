import type { Clip, Journey } from "./types";

const DB_NAME = "dance-diary";
const DB_VERSION = 1;

type StoreName = "journeys" | "clips" | "videos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("journeys")) {
        db.createObjectStore("journeys", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("clips")) {
        const clipStore = db.createObjectStore("clips", { keyPath: "id" });
        clipStore.createIndex("journeyId", "journeyId", { unique: false });
      }
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = fn(store);

        tx.oncomplete = () => {
          if (request instanceof IDBRequest) {
            resolve(request.result);
          } else {
            resolve();
          }
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function getAll<T>(storeName: StoreName): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const request = tx.objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getJourneys(): Promise<Journey[]> {
  const journeys = await getAll<Journey>("journeys");
  return journeys.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getJourney(id: string): Promise<Journey | undefined> {
  return openDb().then(
    (db) =>
      new Promise<Journey | undefined>((resolve, reject) => {
        const tx = db.transaction("journeys", "readonly");
        const request = tx.objectStore("journeys").get(id);
        request.onsuccess = () => resolve(request.result as Journey | undefined);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function saveJourney(journey: Journey): Promise<void> {
  await runTransaction("journeys", "readwrite", (store) => store.put(journey));
}

export async function deleteJourney(id: string): Promise<void> {
  const clips = await getClipsForJourney(id);
  await Promise.all(clips.map((clip) => deleteClip(clip.id)));
  await runTransaction("journeys", "readwrite", (store) => store.delete(id));
}

export async function getClipsForJourney(journeyId: string): Promise<Clip[]> {
  const db = await openDb();
  return new Promise<Clip[]>((resolve, reject) => {
    const tx = db.transaction("clips", "readonly");
    const index = tx.objectStore("clips").index("journeyId");
    const request = index.getAll(journeyId);
    request.onsuccess = () => {
      const clips = (request.result as Clip[]).sort(
        (a, b) => a.dayNumber - b.dayNumber,
      );
      resolve(clips);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getClip(id: string): Promise<Clip | undefined> {
  return openDb().then(
    (db) =>
      new Promise<Clip | undefined>((resolve, reject) => {
        const tx = db.transaction("clips", "readonly");
        const request = tx.objectStore("clips").get(id);
        request.onsuccess = () => resolve(request.result as Clip | undefined);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function saveClip(clip: Clip, videoBlob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["clips", "videos"], "readwrite");
    tx.objectStore("clips").put(clip);
    tx.objectStore("videos").put({ id: clip.videoId, blob: videoBlob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteClip(id: string): Promise<void> {
  const clip = await getClip(id);
  if (!clip) return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["clips", "videos"], "readwrite");
    tx.objectStore("clips").delete(id);
    tx.objectStore("videos").delete(clip.videoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getVideoBlob(videoId: string): Promise<Blob | undefined> {
  return openDb().then(
    (db) =>
      new Promise<Blob | undefined>((resolve, reject) => {
        const tx = db.transaction("videos", "readonly");
        const request = tx.objectStore("videos").get(videoId);
        request.onsuccess = () => {
          const record = request.result as { id: string; blob: Blob } | undefined;
          resolve(record?.blob);
        };
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getVideoUrl(videoId: string): Promise<string | null> {
  const blob = await getVideoBlob(videoId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function createId(): string {
  return crypto.randomUUID();
}

export async function getNextDayNumber(journeyId: string): Promise<number> {
  const clips = await getClipsForJourney(journeyId);
  if (clips.length === 0) return 1;
  return Math.max(...clips.map((clip) => clip.dayNumber)) + 1;
}
