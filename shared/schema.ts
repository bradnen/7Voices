import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
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

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
