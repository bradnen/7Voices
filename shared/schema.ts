import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ttsRequests = pgTable("tts_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  voice: text("voice").notNull(),
  speed: real("speed").default(1.0),
  pitch: real("pitch").default(0),
  tone: text("tone").default("neutral"),
});

export const insertTtsRequestSchema = createInsertSchema(ttsRequests).pick({
  text: true,
  voice: true,
  speed: true,
  pitch: true,
  tone: true,
}).extend({
  text: z.string().min(1, "Text is required").max(5000, "Text must be 5000 characters or less"),
  voice: z.string().min(1, "Voice is required"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
  tone: z.string().default("neutral"),
});

export type InsertTtsRequest = z.infer<typeof insertTtsRequestSchema>;
export type TtsRequest = typeof ttsRequests.$inferSelect;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  email: varchar("email").unique().notNull(),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  subscriptionPlan: varchar("subscription_plan").default("free"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
