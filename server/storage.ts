import { type User, type InsertUser, type TtsRequest, type InsertTtsRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createTtsRequest(request: InsertTtsRequest): Promise<TtsRequest>;
  getTtsRequest(id: string): Promise<TtsRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private ttsRequests: Map<string, TtsRequest>;

  constructor() {
    this.users = new Map();
    this.ttsRequests = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
    this.ttsRequests.set(id, request);
    return request;
  }

  async getTtsRequest(id: string): Promise<TtsRequest | undefined> {
    return this.ttsRequests.get(id);
  }
}

export const storage = new MemStorage();
