/**
 * Katalog plan & harga — fake/hardcode (keputusan owner), BUKAN tabel DB.
 * Cermin dari montez-fe/app/utils/plans.ts; jaga sinkron manual sampai ada
 * katalog plan sungguhan. Ini yang dipercaya server saat checkout — body
 * request cuma mengirim `planId`/`periodId`, backend yang menghitung `amount`
 * dari sini, bukan dari nilai yang dikirim client (lihat spec).
 */
export const PLAN_IDS = ["standard", "premium", "gold", "enterprise"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PERIOD_IDS = ["1m", "3m", "6m", "12m"] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

export const PERIOD_MONTHS: Record<PeriodId, number> = { "1m": 1, "3m": 3, "6m": 6, "12m": 12 };

/** IDR. */
export const PLAN_PRICING: Record<PlanId, Record<PeriodId, number>> = {
  standard: { "1m": 19_000, "3m": 49_000, "6m": 89_000, "12m": 159_000 },
  premium: { "1m": 29_000, "3m": 79_000, "6m": 139_000, "12m": 249_000 },
  gold: { "1m": 49_000, "3m": 129_000, "6m": 229_000, "12m": 399_000 },
  enterprise: { "1m": 99_000, "3m": 269_000, "6m": 469_000, "12m": 799_000 },
};

export const PLAN_NAMES: Record<PlanId, string> = {
  standard: "Standard",
  premium: "Premium",
  gold: "Gold",
  enterprise: "Enterprise",
};
