import type {
  Market,
  CreateMarket,
  UpdateMarket,
  ListWithMarkets,
  ListWithItems,
  CreateList,
  UpdateList,
  Item,
  CreateItem,
  UpdateItem,
  MarkItemPurchased,
} from "@/shared/types";

const API_BASE = "";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro na requisição" }));
    throw new Error(error.error || `Erro: ${response.status}`);
  }

  return response.json();
}

// Markets API
export const marketsApi = {
  getAll: () => fetchApi<Market[]>("/api/markets"),
  create: (data: CreateMarket) =>
    fetchApi<Market>("/api/markets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateMarket) =>
    fetchApi<Market>(`/api/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/markets/${id}`, {
      method: "DELETE",
    }),
};

// Lists API
export const listsApi = {
  getAll: () => fetchApi<ListWithMarkets[]>("/api/lists"),
  getById: (id: number) => fetchApi<ListWithItems>(`/api/lists/${id}`),
  create: (data: CreateList) =>
    fetchApi<ListWithMarkets>("/api/lists", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateList) =>
    fetchApi<ListWithMarkets>(`/api/lists/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/lists/${id}`, {
      method: "DELETE",
    }),
  duplicate: (id: number) =>
    fetchApi<{ id: number }>(`/api/lists/${id}/duplicate`, {
      method: "POST",
    }),
};

// Items API
export const itemsApi = {
  create: (listId: number, data: CreateItem) =>
    fetchApi<Item>(`/api/lists/${listId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateItem) =>
    fetchApi<Item>(`/api/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  markPurchased: (id: number, data: MarkItemPurchased) =>
    fetchApi<Item>(`/api/items/${id}/mark-purchased`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  unmarkPurchased: (id: number) =>
    fetchApi<Item>(`/api/items/${id}/unmark-purchased`, {
      method: "POST",
    }),
  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/items/${id}`, {
      method: "DELETE",
    }),
};
