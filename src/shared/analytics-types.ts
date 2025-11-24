import z from "zod";

export const DayAnalyticsSchema = z.object({
  day_of_week: z.number(),
  day_name: z.string(),
  purchase_count: z.number(),
  total_spent: z.number(),
  avg_spent: z.number(),
});

export const MarketAnalyticsSchema = z.object({
  id: z.number(),
  name: z.string(),
  items_purchased: z.number(),
  total_spent: z.number(),
  avg_item_cost: z.number(),
  lists_count: z.number(),
});

export const AnalyticsSummarySchema = z.object({
  total_spent: z.number(),
  total_items: z.number(),
  total_lists: z.number(),
  avg_list_cost: z.number(),
  most_purchased_day: z.string().nullable(),
  best_market: z.string().nullable(),
});

export type DayAnalytics = z.infer<typeof DayAnalyticsSchema>;
export type MarketAnalytics = z.infer<typeof MarketAnalyticsSchema>;
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
