import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPushActive, isRemindersDisabled } from "./reminders-flag";

describe("reminders flag — kill switch + push gate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isRemindersDisabled", () => {
    it("is false by default (unset)", () => {
      expect(isRemindersDisabled()).toBe(false);
    });

    it.each(["1", "true", "yes", "on", "TRUE", "On"])(
      "is true for truthy value %s",
      (v) => {
        vi.stubEnv("REMINDERS_DISABLED", v);
        expect(isRemindersDisabled()).toBe(true);
      },
    );

    it("is false for a non-truthy value", () => {
      vi.stubEnv("REMINDERS_DISABLED", "0");
      expect(isRemindersDisabled()).toBe(false);
    });
  });

  describe("isPushActive (default-off, three-part gate)", () => {
    it("is false by default with no keys (the CI default)", () => {
      expect(isPushActive()).toBe(false);
    });

    it("is true only with PUSH_ENABLED + both VAPID keys + kill switch off", () => {
      vi.stubEnv("PUSH_ENABLED", "true");
      vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
      vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
      expect(isPushActive()).toBe(true);
    });

    it("is false when PUSH_ENABLED is unset even with keys", () => {
      vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
      vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
      expect(isPushActive()).toBe(false);
    });

    it("is false when a VAPID key is missing", () => {
      vi.stubEnv("PUSH_ENABLED", "true");
      vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
      expect(isPushActive()).toBe(false);
    });

    it("kill switch overrides an otherwise-active push config", () => {
      vi.stubEnv("PUSH_ENABLED", "true");
      vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
      vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
      vi.stubEnv("REMINDERS_DISABLED", "1");
      expect(isPushActive()).toBe(false);
    });
  });
});
