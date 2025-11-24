import type { DayAnalytics, MarketAnalytics, AnalyticsSummary } from "@/shared/analytics-types";

const API_BASE = "";

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro na requisição" }));
    throw new Error(error.error || `Erro: ${response.status}`);
  }
  
  return response.json();
}

export const analyticsApi = {
  getSummary: () => fetchApi<AnalyticsSummary>("/api/analytics/summary"),
  getByDay: () => fetchApi<DayAnalytics[]>("/api/analytics/by-day"),
  getByMarket: () => fetchApi<MarketAnalytics[]>("/api/analytics/by-market"),
};
