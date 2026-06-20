import { describe, expect, it } from "vitest";
import {
  checkPhotoBudget,
  dataUrlByteLength,
  fitDimensions,
  MAX_EDGE,
  MAX_PHOTOS_PER_HOME,
} from "./tour-photos";
import type { TourPhoto } from "./tour-scorecard";

const photo = (dataUrl: string): TourPhoto => ({ id: dataUrl, dataUrl });

describe("fitDimensions", () => {
  it("downscales the longest edge to MAX_EDGE, preserving aspect ratio", () => {
    const r = fitDimensions(4000, 3000);
    expect(Math.max(r.width, r.height)).toBe(MAX_EDGE);
    // 4:3 ratio preserved.
    expect(r.width / r.height).toBeCloseTo(4 / 3, 2);
  });

  it("never upscales a small image", () => {
    expect(fitDimensions(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it("handles a portrait image (height is the longest edge)", () => {
    const r = fitDimensions(1500, 3000);
    expect(r.height).toBe(MAX_EDGE);
    expect(r.width).toBe(640);
  });

  it("returns 0×0 for garbage dimensions", () => {
    expect(fitDimensions(0, 100)).toEqual({ width: 0, height: 0 });
    expect(fitDimensions(NaN, NaN)).toEqual({ width: 0, height: 0 });
  });
});

describe("dataUrlByteLength", () => {
  it("approximates the decoded byte length of a base64 data URL", () => {
    // "AAAA" base64 → 3 bytes.
    expect(dataUrlByteLength("data:image/jpeg;base64,AAAA")).toBe(3);
  });

  it("accounts for padding", () => {
    expect(dataUrlByteLength("data:image/jpeg;base64,AA==")).toBe(1);
  });
});

describe("checkPhotoBudget", () => {
  it("allows a photo within the count + size budget", () => {
    expect(checkPhotoBudget([], 1000).ok).toBe(true);
  });

  it("rejects once the per-home count cap is hit", () => {
    const existing = Array.from({ length: MAX_PHOTOS_PER_HOME }, (_, i) =>
      photo(`data:image/jpeg;base64,AAAA${i}`),
    );
    const res = checkPhotoBudget(existing, 100);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(new RegExp(String(MAX_PHOTOS_PER_HOME)));
  });

  it("rejects a photo that would blow the total-bytes budget", () => {
    // A single huge existing photo: ~1.4MB base64 string.
    const big = "x".repeat(1_400_000);
    const res = checkPhotoBudget([photo(`data:image/jpeg;base64,${big}`)], 500_000);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/room|device/i);
  });
});
