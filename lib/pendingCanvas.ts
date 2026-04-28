"use client";

/**
 * Browser-side hand-off for the landing-page demo render.
 *
 * Flow:
 *   1. Visitor renders a canvas on the marketing site (one free demo).
 *   2. We stash the MP4 blob + the source image + settings in IndexedDB
 *      keyed by `pending`.
 *   3. They sign up.
 *   4. On `/app` load, we read the pending entry, drop it into the
 *      center preview state, and clear it.
 *
 * IndexedDB is the right home for this: blobs are ~1–4MB (too big for
 * localStorage), need to survive navigation, and don't need to round-trip
 * to a server before signup.
 */

const DB_NAME = "canvas-buddy";
const STORE = "pending-canvas";
const KEY = "pending";

export interface PendingCanvas {
  videoBlob: Blob;
  sourceBlob: Blob;
  sourceName: string;
  sourceType: string;
  effect: string;
  filter: string;
  duration: number;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingCanvas(p: PendingCanvas): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(p, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadPendingCanvas(): Promise<PendingCanvas | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDB();
    const result = await new Promise<PendingCanvas | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as PendingCanvas) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export async function clearPendingCanvas(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
