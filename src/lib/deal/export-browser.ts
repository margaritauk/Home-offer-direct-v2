/**
 * Browser-only helpers for the deal export/import feature (#163).
 *
 * These touch document/Blob/FileReader and so are NOT unit-tested — the pure
 * collect/restore/serialize logic they wrap lives in `./export` and is tested
 * there. Everything here is device-local: no network, no upload.
 */

import {
  collectDeal,
  dealToJson,
  parseDealJson,
  restoreDeal,
} from "./export";

/** Trigger an anchor download for a Blob in the browser (mirrors budget-export). */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Default download filename, stamped with the date for easy sorting. */
function defaultFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `homeoffer-deal-${date}.json`;
}

/** Collect the current deal and download it as a pretty-printed .json file. */
export function downloadDeal(filename: string = defaultFilename()): void {
  const json = dealToJson(collectDeal());
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  triggerDownload(blob, filename);
}

/** Read a File's text via FileReader (browser-only). */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

/**
 * Read a deal file, parse it, and restore it into local storage. Returns the
 * same result shape as `restoreDeal` so the caller can show success/error.
 */
export async function importDealFile(
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let text: string;
  try {
    text = await readFileText(file);
  } catch {
    return { ok: false, error: "Could not read that file." };
  }
  const bundle = parseDealJson(text);
  if (!bundle) {
    return { ok: false, error: "That file isn't a HomeOffer deal export." };
  }
  return restoreDeal(bundle);
}
