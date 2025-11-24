import z from "zod";

// Market schemas
export const MarketSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateMarketSchema = z.object({
  name: z.string().min(1, "Nome do mercado é obrigatório"),
});

export const UpdateMarketSchema = z.object({
  name: z.string().min(1, "Nome do mercado é obrigatório"),
});

// List schemas
export const ListSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateListSchema = z.object({
  name: z.string().min(1, "Nome da lista é obrigatório"),
  market_ids: z.array(z.number()).optional(),
});

export const UpdateListSchema = z.object({
  name: z.string().min(1, "Nome da lista é obrigatório").optional(),
  market_ids: z.array(z.number()).optional(),
});

export const ShareListSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Item schemas
export const ItemSchema = z.object({
  id: z.number(),
  list_id: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  is_purchased: z.number(),
  price: z.number().nullable(),
  quantity: z.number().nullable(),
  market_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateItemSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório").optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  is_purchased: z.boolean().optional(),
  price: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  market_id: z.number().optional(),
});

export const MarkItemPurchasedSchema = z.object({
  price: z.number().positive("Preço deve ser maior que zero"),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  market_id: z.number().optional(),
});

// User Profile schemas
export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  display_name: z.string().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateUserProfileSchema = z.object({
  display_name: z.string().min(1, "Nome é obrigatório").optional(),
  photo_url: z.string().url("URL inválida").optional(),
});

// Type exports
export type Market = z.infer<typeof MarketSchema>;
export type CreateMarket = z.infer<typeof CreateMarketSchema>;
export type UpdateMarket = z.infer<typeof UpdateMarketSchema>;

export type List = z.infer<typeof ListSchema>;
export type CreateList = z.infer<typeof CreateListSchema>;
export type UpdateList = z.infer<typeof UpdateListSchema>;
export type ShareList = z.infer<typeof ShareListSchema>;

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
export type UpdateItem = z.infer<typeof UpdateItemSchema>;
export type MarkItemPurchased = z.infer<typeof MarkItemPurchasedSchema>;

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;

// Extended types for API responses
export type ListWithMarkets = List & {
  markets: Market[];
  is_shared?: boolean;
  shared_users?: Array<{ email: string; display_name: string | null }>;
};

export type ListWithItems = List & {
  markets: Market[];
  items: Item[];
  is_shared?: boolean;
  shared_users?: Array<{ email: string; display_name: string | null }>;
};
