import { type User, type InsertUser, type TtsRequest, type InsertTtsRequest, users } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<User>;
  createTtsRequest(request: InsertTtsRequest): Promise<TtsRequest>;
  getTtsRequest(id: string): Promise<TtsRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.googleId,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeInfo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createTtsRequest(insertRequest: InsertTtsRequest): Promise<TtsRequest> {
    const id = randomUUID();
    const request: TtsRequest = { 
      ...insertRequest, 
      id,
      speed: insertRequest.speed ?? 1.0,
      pitch: insertRequest.pitch ?? 0,
      tone: insertRequest.tone ?? "neutral"
    };
    // For now, use in-memory storage for TTS requests since they're temporary
    return request;
  }

  async getTtsRequest(id: string): Promise<TtsRequest | undefined> {
    // For now, return undefined since TTS requests are temporary
    return undefined;
  }
}

export const storage = new DatabaseStorage();
