import { describe, expect, it } from "vitest";
import {
  aggregateStretchDurations,
  emptyStretchDurations,
  formatStretchDuration,
  getStretchWeekRange,
  totalStretchSeconds,
} from "@/lib/stretching";

describe("stretching utilities", () => {
  it("finds Monday-to-Sunday ranges, including for Sundays", () => {
    expect(getStretchWeekRange("2026-07-22")).toEqual({
      start: "2026-07-20",
      end: "2026-07-26",
    });
    expect(getStretchWeekRange("2026-07-26")).toEqual({
      start: "2026-07-20",
      end: "2026-07-26",
    });
  });

  it("aggregates known stretches and ignores unknown IDs", () => {
    const totals = aggregateStretchDurations([
      { date: "2026-07-22", stretchId: "couch-stretch", durationSeconds: 45 },
      { date: "2026-07-22", stretchId: "couch-stretch", durationSeconds: 15 },
      { date: "2026-07-22", stretchId: "unknown", durationSeconds: 999 },
    ]);
    expect(totals["couch-stretch"]).toBe(60);
    expect(totalStretchSeconds(totals)).toBe(60);
  });

  it("creates complete zero-filled duration maps", () => {
    expect(Object.keys(emptyStretchDurations())).toHaveLength(5);
  });

  it("formats stopwatch durations", () => {
    expect(formatStretchDuration(9)).toBe("9s");
    expect(formatStretchDuration(65)).toBe("1m 05s");
    expect(formatStretchDuration(3720)).toBe("1h 2m");
  });
});
