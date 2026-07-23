export const STRETCHES = [
  { id: "couch-stretch", name: "Couch Stretch" },
  {
    id: "90-90-glute-stretch",
    name: "90/90 Glute Stretch with Slow Transitions",
  },
  {
    id: "back-rolling-t-spine",
    name: "Back Rolling / T-Spine Stretching",
  },
  { id: "worlds-greatest-stretch", name: "World’s Greatest Stretch" },
  { id: "reverse-plank", name: "Reverse Plank" },
] as const;

export type StretchId = (typeof STRETCHES)[number]["id"];

export type StretchDurationMap = Record<StretchId, number>;

export interface StretchTimeRecord {
  date: string;
  stretchId: string;
  durationSeconds: number;
}

export function emptyStretchDurations(): StretchDurationMap {
  return Object.fromEntries(STRETCHES.map((stretch) => [stretch.id, 0])) as StretchDurationMap;
}

export function isStretchId(value: string): value is StretchId {
  return STRETCHES.some((stretch) => stretch.id === value);
}

function parseDateUtc(dateString: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) throw new Error("Invalid date format");
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatDateUtc(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(dateString: string, days: number): string {
  const date = parseDateUtc(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateUtc(date);
}

export function getStretchWeekRange(dateString: string): {
  start: string;
  end: string;
} {
  const date = parseDateUtc(dateString);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  const start = formatDateUtc(date);
  return { start, end: addDays(start, 6) };
}

export function aggregateStretchDurations(
  records: StretchTimeRecord[],
  date?: string
): StretchDurationMap {
  const totals = emptyStretchDurations();
  for (const record of records) {
    if (date && record.date !== date) continue;
    if (!isStretchId(record.stretchId)) continue;
    totals[record.stretchId] += Math.max(0, record.durationSeconds);
  }
  return totals;
}

export function totalStretchSeconds(totals: StretchDurationMap): number {
  return STRETCHES.reduce((sum, stretch) => sum + totals[stretch.id], 0);
}

export function formatStretchDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
  return `${remainder}s`;
}
