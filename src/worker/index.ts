import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import type { MochaUser } from "@getmocha/users-service/shared";
import {
  CreateMarketSchema,
  UpdateMarketSchema,
  CreateListSchema,
  UpdateListSchema,
  ShareListSchema,
  CreateItemSchema,
  UpdateItemSchema,
  MarkItemPurchasedSchema,
  UpdateUserProfileSchema,
  type Market,
  type List,
  type ListWithMarkets,
  type ListWithItems,
  type Item,
  type UserProfile,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// User Profile endpoints
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  
  let profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first<UserProfile>();
  
  if (!profile) {
    // Create profile if it doesn't exist
    await c.env.DB.prepare(
      "INSERT INTO user_profiles (user_id, display_name, photo_url) VALUES (?, ?, ?)"
    ).bind(user.id, user.google_user_data.name, user.google_user_data.picture).run();
    
    profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first<UserProfile>();
  }
  
  return c.json(profile);
});

app.put("/api/profile", authMiddleware, zValidator("json", UpdateUserProfileSchema), async (c) => {
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.display_name !== undefined) {
    updates.push("display_name = ?");
    values.push(data.display_name);
  }
  if (data.photo_url !== undefined) {
    updates.push("photo_url = ?");
    values.push(data.photo_url);
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(user.id);
    
    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`
    ).bind(...values).run();
  }
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first<UserProfile>();
  
  return c.json(profile);
});

// Helper function to check list access
async function canAccessList(db: D1Database, listId: number, userId: string, userEmail: string): Promise<boolean> {
  const list = await db.prepare(
    "SELECT user_id FROM lists WHERE id = ?"
  ).bind(listId).first<{ user_id: string | null }>();
  
  if (!list) return false;
  if (list.user_id === userId) return true;
  
  // Check if list is shared with user - check both by user ID and email
  const share = await db.prepare(
    "SELECT id FROM list_shares WHERE list_id = ? AND (user_id = ? OR user_id = ?)"
  ).bind(listId, userId, userEmail).first();
  
  return !!share;
}

// Markets endpoints (protected)
app.get("/api/markets", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  const markets = await c.env.DB.prepare(
    "SELECT * FROM markets WHERE user_id = ? ORDER BY name"
  ).bind(user.id).all<Market>();
  return c.json(markets.results);
});

app.post("/api/markets", authMiddleware, zValidator("json", CreateMarketSchema), async (c) => {
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  const result = await c.env.DB.prepare(
    "INSERT INTO markets (name, user_id) VALUES (?, ?)"
  ).bind(data.name, user.id).run();
  
  const market = await c.env.DB.prepare(
    "SELECT * FROM markets WHERE id = ?"
  ).bind(result.meta.last_row_id).first<Market>();
  
  return c.json(market, 201);
});

app.put("/api/markets/:id", authMiddleware, zValidator("json", UpdateMarketSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  await c.env.DB.prepare(
    "UPDATE markets SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
  ).bind(data.name, id, user.id).run();
  
  const market = await c.env.DB.prepare(
    "SELECT * FROM markets WHERE id = ?"
  ).bind(id).first<Market>();
  
  return c.json(market);
});

app.delete("/api/markets/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  await c.env.DB.prepare("DELETE FROM list_markets WHERE market_id = ?").bind(id).run();
  await c.env.DB.prepare("UPDATE items SET market_id = NULL WHERE market_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM markets WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  
  return c.json({ success: true });
});

// Lists endpoints (protected)
app.get("/api/lists", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  
  // Get lists owned by user
  const ownedLists = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all<List>();
  
  // Get lists shared with user - check both by user.id and user.email
  const sharedListIds = await c.env.DB.prepare(
    "SELECT list_id FROM list_shares WHERE user_id = ? OR user_id = ?"
  ).bind(user.id, user.email).all<{ list_id: number }>();
  
  const sharedLists: List[] = [];
  for (const { list_id } of sharedListIds.results) {
    const list = await c.env.DB.prepare(
      "SELECT * FROM lists WHERE id = ?"
    ).bind(list_id).first<List>();
    if (list) sharedLists.push(list);
  }
  
  const allLists = [...ownedLists.results, ...sharedLists];
  
  const listsWithMarkets: ListWithMarkets[] = await Promise.all(
    allLists.map(async (list) => {
      const markets = await c.env.DB.prepare(`
        SELECT m.* FROM markets m
        JOIN list_markets lm ON m.id = lm.market_id
        WHERE lm.list_id = ?
      `).bind(list.id).all<Market>();
      
      const isShared = list.user_id !== user.id;
      
      return { ...list, markets: markets.results, is_shared: isShared };
    })
  );
  
  return c.json(listsWithMarkets);
});

app.get("/api/lists/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  if (!(await canAccessList(c.env.DB, parseInt(id), user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  const list = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE id = ?"
  ).bind(id).first<List>();
  
  if (!list) {
    return c.json({ error: "Lista não encontrada" }, 404);
  }
  
  const markets = await c.env.DB.prepare(`
    SELECT m.* FROM markets m
    JOIN list_markets lm ON m.id = lm.market_id
    WHERE lm.list_id = ?
  `).bind(id).all<Market>();
  
  const items = await c.env.DB.prepare(
    "SELECT * FROM items WHERE list_id = ? ORDER BY created_at"
  ).bind(id).all<Item>();
  
  const isShared = list.user_id !== user.id;
  
  // Get shared users if owner
  let sharedUsers: Array<{ email: string; display_name: string | null }> = [];
  if (list.user_id === user.id) {
    const shares = await c.env.DB.prepare(`
      SELECT ls.user_id 
      FROM list_shares ls
      WHERE ls.list_id = ?
    `).bind(id).all<{ user_id: string }>();
    
    // Fetch display names from user_profiles for each shared user
    sharedUsers = await Promise.all(
      shares.results.map(async (s) => {
        const profile = await c.env.DB.prepare(
          "SELECT display_name FROM user_profiles WHERE user_id = ?"
        ).bind(s.user_id).first<{ display_name: string | null }>();
        
        return {
          email: s.user_id,
          display_name: profile?.display_name || null
        };
      })
    );
  }
  
  const listWithItems: ListWithItems = {
    ...list,
    markets: markets.results,
    items: items.results,
    is_shared: isShared,
    shared_users: sharedUsers,
  };
  
  return c.json(listWithItems);
});

app.post("/api/lists", authMiddleware, zValidator("json", CreateListSchema), async (c) => {
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  const result = await c.env.DB.prepare(
    "INSERT INTO lists (name, user_id) VALUES (?, ?)"
  ).bind(data.name, user.id).run();
  
  const listId = result.meta.last_row_id;
  
  if (data.market_ids && data.market_ids.length > 0) {
    for (const marketId of data.market_ids) {
      await c.env.DB.prepare(
        "INSERT INTO list_markets (list_id, market_id) VALUES (?, ?)"
      ).bind(listId, marketId).run();
    }
  }
  
  const list = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE id = ?"
  ).bind(listId).first<List>();
  
  const markets = await c.env.DB.prepare(`
    SELECT m.* FROM markets m
    JOIN list_markets lm ON m.id = lm.market_id
    WHERE lm.list_id = ?
  `).bind(listId).all<Market>();
  
  return c.json({ ...list, markets: markets.results }, 201);
});

app.put("/api/lists/:id", authMiddleware, zValidator("json", UpdateListSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  if (!(await canAccessList(c.env.DB, parseInt(id), user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  if (data.name) {
    await c.env.DB.prepare(
      "UPDATE lists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(data.name, id).run();
  }
  
  if (data.market_ids) {
    await c.env.DB.prepare("DELETE FROM list_markets WHERE list_id = ?").bind(id).run();
    
    for (const marketId of data.market_ids) {
      await c.env.DB.prepare(
        "INSERT INTO list_markets (list_id, market_id) VALUES (?, ?)"
      ).bind(id, marketId).run();
    }
  }
  
  const list = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE id = ?"
  ).bind(id).first<List>();
  
  const markets = await c.env.DB.prepare(`
    SELECT m.* FROM markets m
    JOIN list_markets lm ON m.id = lm.market_id
    WHERE lm.list_id = ?
  `).bind(id).all<Market>();
  
  return c.json({ ...list, markets: markets.results });
});

app.delete("/api/lists/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  const list = await c.env.DB.prepare(
    "SELECT user_id FROM lists WHERE id = ?"
  ).bind(id).first<{ user_id: string | null }>();
  
  if (!list || list.user_id !== user.id) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  await c.env.DB.prepare("DELETE FROM items WHERE list_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM list_markets WHERE list_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM list_shares WHERE list_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM lists WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

app.post("/api/lists/:id/duplicate", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  if (!(await canAccessList(c.env.DB, parseInt(id), user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  const originalList = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE id = ?"
  ).bind(id).first<List>();
  
  if (!originalList) {
    return c.json({ error: "Lista não encontrada" }, 404);
  }
  
  const result = await c.env.DB.prepare(
    "INSERT INTO lists (name, user_id) VALUES (?, ?)"
  ).bind(`${originalList.name} (cópia)`, user.id).run();
  
  const newListId = result.meta.last_row_id;
  
  const markets = await c.env.DB.prepare(
    "SELECT market_id FROM list_markets WHERE list_id = ?"
  ).bind(id).all<{ market_id: number }>();
  
  for (const market of markets.results) {
    await c.env.DB.prepare(
      "INSERT INTO list_markets (list_id, market_id) VALUES (?, ?)"
    ).bind(newListId, market.market_id).run();
  }
  
  const items = await c.env.DB.prepare(
    "SELECT name, category, notes FROM items WHERE list_id = ?"
  ).bind(id).all<{ name: string; category: string | null; notes: string | null }>();
  
  for (const item of items.results) {
    await c.env.DB.prepare(
      "INSERT INTO items (list_id, name, category, notes) VALUES (?, ?, ?, ?)"
    ).bind(newListId, item.name, item.category, item.notes).run();
  }
  
  return c.json({ id: newListId }, 201);
});

app.post("/api/lists/:id/share", authMiddleware, zValidator("json", ShareListSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  const list = await c.env.DB.prepare(
    "SELECT user_id FROM lists WHERE id = ?"
  ).bind(id).first<{ user_id: string | null }>();
  
  if (!list || list.user_id !== user.id) {
    return c.json({ error: "Apenas o dono da lista pode compartilhá-la" }, 403);
  }
  
  // Store the email - when users log in with this email, they'll have access
  const shareUserId = data.email;
  
  // Check if already shared
  const existing = await c.env.DB.prepare(
    "SELECT id FROM list_shares WHERE list_id = ? AND user_id = ?"
  ).bind(id, shareUserId).first();
  
  if (existing) {
    return c.json({ error: "Lista já compartilhada com este usuário" }, 400);
  }
  
  await c.env.DB.prepare(
    "INSERT INTO list_shares (list_id, user_id) VALUES (?, ?)"
  ).bind(id, shareUserId).run();
  
  return c.json({ success: true }, 201);
});

app.delete("/api/lists/:id/share/:userId", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const shareUserId = c.req.param("userId");
  const user = c.get("user") as MochaUser;
  
  const list = await c.env.DB.prepare(
    "SELECT user_id FROM lists WHERE id = ?"
  ).bind(id).first<{ user_id: string | null }>();
  
  if (!list || list.user_id !== user.id) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  await c.env.DB.prepare(
    "DELETE FROM list_shares WHERE list_id = ? AND user_id = ?"
  ).bind(id, shareUserId).run();
  
  return c.json({ success: true });
});

// Items endpoints (protected)
app.post("/api/lists/:listId/items", authMiddleware, zValidator("json", CreateItemSchema), async (c) => {
  const listId = c.req.param("listId");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  if (!(await canAccessList(c.env.DB, parseInt(listId), user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  const result = await c.env.DB.prepare(
    "INSERT INTO items (list_id, name, category, notes) VALUES (?, ?, ?, ?)"
  ).bind(listId, data.name, data.category || null, data.notes || null).run();
  
  const item = await c.env.DB.prepare(
    "SELECT * FROM items WHERE id = ?"
  ).bind(result.meta.last_row_id).first<Item>();
  
  return c.json(item, 201);
});

app.put("/api/items/:id", authMiddleware, zValidator("json", UpdateItemSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  const item = await c.env.DB.prepare(
    "SELECT list_id FROM items WHERE id = ?"
  ).bind(id).first<{ list_id: number }>();
  
  if (!item || !(await canAccessList(c.env.DB, item.list_id, user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    values.push(data.category || null);
  }
  if (data.notes !== undefined) {
    updates.push("notes = ?");
    values.push(data.notes || null);
  }
  if (data.is_purchased !== undefined) {
    updates.push("is_purchased = ?");
    values.push(data.is_purchased ? 1 : 0);
  }
  if (data.price !== undefined) {
    updates.push("price = ?");
    values.push(data.price);
  }
  if (data.quantity !== undefined) {
    updates.push("quantity = ?");
    values.push(data.quantity);
  }
  if (data.market_id !== undefined) {
    updates.push("market_id = ?");
    values.push(data.market_id);
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await c.env.DB.prepare(
      `UPDATE items SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
  }
  
  const updatedItem = await c.env.DB.prepare(
    "SELECT * FROM items WHERE id = ?"
  ).bind(id).first<Item>();
  
  return c.json(updatedItem);
});

app.post("/api/items/:id/mark-purchased", authMiddleware, zValidator("json", MarkItemPurchasedSchema), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  const data = c.req.valid("json");
  
  const item = await c.env.DB.prepare(
    "SELECT list_id FROM items WHERE id = ?"
  ).bind(id).first<{ list_id: number }>();
  
  if (!item || !(await canAccessList(c.env.DB, item.list_id, user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  await c.env.DB.prepare(`
    UPDATE items 
    SET is_purchased = 1, price = ?, quantity = ?, market_id = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(data.price, data.quantity, data.market_id || null, id).run();
  
  const updatedItem = await c.env.DB.prepare(
    "SELECT * FROM items WHERE id = ?"
  ).bind(id).first<Item>();
  
  return c.json(updatedItem);
});

app.post("/api/items/:id/unmark-purchased", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  const item = await c.env.DB.prepare(
    "SELECT list_id FROM items WHERE id = ?"
  ).bind(id).first<{ list_id: number }>();
  
  if (!item || !(await canAccessList(c.env.DB, item.list_id, user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  await c.env.DB.prepare(`
    UPDATE items 
    SET is_purchased = 0, price = NULL, quantity = NULL, market_id = NULL, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(id).run();
  
  const updatedItem = await c.env.DB.prepare(
    "SELECT * FROM items WHERE id = ?"
  ).bind(id).first<Item>();
  
  return c.json(updatedItem);
});

app.delete("/api/items/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as MochaUser;
  
  const item = await c.env.DB.prepare(
    "SELECT list_id FROM items WHERE id = ?"
  ).bind(id).first<{ list_id: number }>();
  
  if (!item || !(await canAccessList(c.env.DB, item.list_id, user.id, user.email))) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  await c.env.DB.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Analytics endpoints (protected)
app.get("/api/analytics/summary", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(i.price * i.quantity), 0) as total_spent,
      COUNT(*) as total_items,
      COUNT(DISTINCT i.list_id) as total_lists
    FROM items i
    JOIN lists l ON i.list_id = l.id
    WHERE i.is_purchased = 1 AND (l.user_id = ? OR EXISTS (
      SELECT 1 FROM list_shares ls WHERE ls.list_id = l.id AND ls.user_id = ?
    ))
  `).bind(user.id, user.id).first<{ total_spent: number; total_items: number; total_lists: number }>();
  
  const avgListCost = stats && stats.total_lists > 0 
    ? stats.total_spent / stats.total_lists 
    : 0;
  
  const dayStats = await c.env.DB.prepare(`
    SELECT 
      CASE CAST(strftime('%w', i.updated_at) AS INTEGER)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
      END as day_name,
      COUNT(*) as purchase_count
    FROM items i
    JOIN lists l ON i.list_id = l.id
    WHERE i.is_purchased = 1 AND (l.user_id = ? OR EXISTS (
      SELECT 1 FROM list_shares ls WHERE ls.list_id = l.id AND ls.user_id = ?
    ))
    GROUP BY strftime('%w', i.updated_at)
    ORDER BY purchase_count DESC
    LIMIT 1
  `).bind(user.id, user.id).first<{ day_name: string; purchase_count: number }>();
  
  const marketStats = await c.env.DB.prepare(`
    SELECT 
      m.name,
      AVG(i.price * i.quantity) as avg_cost
    FROM markets m
    JOIN items i ON m.id = i.market_id
    JOIN lists l ON i.list_id = l.id
    WHERE i.is_purchased = 1 AND (l.user_id = ? OR EXISTS (
      SELECT 1 FROM list_shares ls WHERE ls.list_id = l.id AND ls.user_id = ?
    ))
    GROUP BY m.id, m.name
    ORDER BY avg_cost ASC
    LIMIT 1
  `).bind(user.id, user.id).first<{ name: string; avg_cost: number }>();
  
  return c.json({
    total_spent: stats?.total_spent || 0,
    total_items: stats?.total_items || 0,
    total_lists: stats?.total_lists || 0,
    avg_list_cost: avgListCost,
    most_purchased_day: dayStats?.day_name || null,
    best_market: marketStats?.name || null,
  });
});

app.get("/api/analytics/by-day", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  
  const dayData = await c.env.DB.prepare(`
    SELECT 
      CAST(strftime('%w', i.updated_at) AS INTEGER) as day_of_week,
      CASE CAST(strftime('%w', i.updated_at) AS INTEGER)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
      END as day_name,
      COUNT(*) as purchase_count,
      COALESCE(SUM(i.price * i.quantity), 0) as total_spent,
      COALESCE(AVG(i.price * i.quantity), 0) as avg_spent
    FROM items i
    JOIN lists l ON i.list_id = l.id
    WHERE i.is_purchased = 1 AND (l.user_id = ? OR EXISTS (
      SELECT 1 FROM list_shares ls WHERE ls.list_id = l.id AND ls.user_id = ?
    ))
    GROUP BY day_of_week
    ORDER BY day_of_week
  `).bind(user.id, user.id).all<{
    day_of_week: number;
    day_name: string;
    purchase_count: number;
    total_spent: number;
    avg_spent: number;
  }>();
  
  return c.json(dayData.results);
});

app.get("/api/analytics/by-market", authMiddleware, async (c) => {
  const user = c.get("user") as MochaUser;
  
  const marketData = await c.env.DB.prepare(`
    SELECT 
      m.id,
      m.name,
      COUNT(DISTINCT i.id) as items_purchased,
      COALESCE(SUM(i.price * i.quantity), 0) as total_spent,
      COALESCE(AVG(i.price * i.quantity), 0) as avg_item_cost,
      COUNT(DISTINCT i.list_id) as lists_count
    FROM markets m
    LEFT JOIN items i ON m.id = i.market_id AND i.is_purchased = 1
    LEFT JOIN lists l ON i.list_id = l.id
    WHERE i.id IS NULL OR (l.user_id = ? OR EXISTS (
      SELECT 1 FROM list_shares ls WHERE ls.list_id = l.id AND ls.user_id = ?
    ))
    GROUP BY m.id, m.name
    ORDER BY total_spent DESC
  `).bind(user.id, user.id).all<{
    id: number;
    name: string;
    items_purchased: number;
    total_spent: number;
    avg_item_cost: number;
    lists_count: number;
  }>();
  
  return c.json(marketData.results);
});

export default app;
