/** Governed definitions. Golden values come from these functions, not from SQL. */

export type Plan = "starter" | "team" | "business";
export type SubStatus = "active" | "trialing" | "cancelled";

export function mrrCents(plan: Plan, seats: number, status: SubStatus): number {
  if (status !== "active") return 0;
  const base = plan === "starter" ? 4000 : plan === "team" ? 9000 : 20000;
  const perSeat = plan === "starter" ? 800 : plan === "team" ? 1500 : 2500;
  return base + perSeat * seats;
}

export function responseTargetMinutes(priority: string): number {
  switch (priority) {
    case "urgent":
      return 60;
    case "high":
      return 120;
    case "normal":
      return 480;
    default:
      return 1440;
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1]! + sorted[mid]!) / 2;
  return sorted[mid]!;
}
